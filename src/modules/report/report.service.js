const ReportModel = require("../../models/report.model");
const DumpsterModel = require("../../models/dumpsters.model");

const mapReasonToDescription = {
  overflowing: "Dumpster overflowing with trash",
  illegal_materials: "Illegal dumping of hazardous materials",
  bad_odors: "Dumpster emitting foul odors",
  safety_hazards: "Dumpster causing fire or safety hazards",
  vandalized: "Dumpster being vandalized or used for criminal activity",
  other: null,
};

const generateNewReport = async (
  user,
  street,
  neighborhood,
  city,
  category,
  issue,
  description
) => {
  if (!Object.keys(mapReasonToDescription).includes(issue)) {
    throw new Error(
      `Issue must be one of the following values: ${Object.keys(
        mapReasonToDescription
      ).join(", ")}`
    );
  }
  if (issue === "other" && !description) {
    throw new Error(
      "Please be more specific with your issue. Please fill the 'description' field."
    );
  }

  const dumpster = await DumpsterModel.findOne({
    neighborhood: neighborhood.toLowerCase().trim(),
    city: city.toLowerCase().trim(),
    street: { $regex: new RegExp(street.trim(), 'i') },
    dumpsterType: category,
  });

  if (!dumpster) {
    const availableDumpsters = await DumpsterModel.find({
      city: city.toLowerCase().trim(),
      neighborhood: neighborhood.toLowerCase().trim(),
    }).select('street dumpsterType');
    
    const suggestions = availableDumpsters.length > 0 
      ? `Available options in ${neighborhood}, ${city}: ${availableDumpsters.map(d => `${d.street} (${d.dumpsterType})`).join(', ')}`
      : `No dumpsters found in ${neighborhood}, ${city}. Please check the location.`;
    
    throw new Error(
      `Failed to find dumpster at ${street}, ${neighborhood}, ${city} for category ${category}. ${suggestions}`
    );
  }

  const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
  const reportCreatedInLast3Min = await ReportModel.findOne({
    reporterId: user.id,
    dumpsterId: dumpster._id,
    category,
    createdAt: { $gte: threeMinutesAgo },
  });

  if (reportCreatedInLast3Min) {
    throw new Error(
      "You've already reported this issue recently. We will try to solve it as soon as possible."
    );
  }

  if (mapReasonToDescription[issue] !== null) {
    description = mapReasonToDescription[issue];
  }

  const myReport = new ReportModel({
    reporterId: user.id,
    dumpsterId: dumpster._id,
    status: "pending",
    issue,
    description,
    category,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  await myReport.save();

  const myReportObj = myReport.toObject();
  myReportObj.id = myReportObj._id;
  delete myReportObj._id;
  delete myReportObj.__v;
  return myReportObj;
};

const findReportById = async (user, reportId) => {
  const report = await ReportModel.findOne({
    reporterId: user.id,
    _id: reportId,
  }).populate("dumpsterId");

  return report;
};

const findAllUserReports = async (user) => {
  const reports = await ReportModel.find({
    reporterId: user.id,
  })
  .populate("dumpsterId")
  .populate('reporterId', 'username email role')
  .populate('resolvedBy', 'username email role');

  return reports;
};

const getAllReports = async () => {
  const reports = await ReportModel.find({})
    .populate('reporterId', 'username email role')
    .populate('dumpsterId')
    .populate('resolvedBy', 'username email role');
  
  return reports;
};

const findReportsByNeighborhood = async (city, neighborhood) => {
    const allDumpsters = await DumpsterModel.find({
        city: city.toLowerCase().trim(),
        neighborhood: neighborhood.toLowerCase().trim(),
    }, {_id: 1});

    if (allDumpsters.length === 0) {
        return [];
    }

    const dumpsterIds = allDumpsters.map((dumpster) => dumpster._id);

    const reports = await ReportModel.find({
        dumpsterId: { $in: dumpsterIds }
    }, { __v: 0 })
    .populate('reporterId', {_id: 1, username: 1, email: 1, role: 1})
    .populate('dumpsterId', {_id: 1, city: 1, state: 1, street: 1, neighborhood: 1, status: 1})
    .populate('resolvedBy', {_id: 1, username: 1, email: 1, role: 1});
    
    return reports;
};

const updateReport = async (reportId, user, status, details) => {
    const report = await ReportModel.findOne({ _id: reportId });
    if (!report) {
        throw new Error("Failed to find the report. Please try again.");
    }

    const reportUpdate = {};

    if (report.resolvedBy === undefined || report.resolvedBy === null) {
        reportUpdate.resolvedBy = user.id;
    }

    if (report.status !== status) {
        reportUpdate.status = status;
    }

    if (['resolved', 'rejected'].includes(status) && details && details !== null) {
        reportUpdate.resolutionDetails = details;
    }

    if (Object.keys(reportUpdate).length === 0) {
        return null;
    }

    reportUpdate.updatedAt = Date.now();

    const updateResult = await ReportModel.updateOne({ _id: reportId }, {
        $set: reportUpdate,
    });

    if (updateResult.modifiedCount > 0) {
        return reportUpdate;
    }

    return null;
};

module.exports = {
  generateNewReport,
  findReportById,
  findAllUserReports,
  findReportsByNeighborhood,
  updateReport,
  getAllReports,
};
