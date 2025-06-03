const sendJson = require("../../core/sendJson");
const {
  checkAuth,
  checkRole,
  DEFAULT_ROLES,
} = require("../../utils/checkAuth");
const {
  generateNewReport,
  findReportById,
  findAllUserReports,
  findReportsByNeighborhood,
  updateReport,
} = require("./report.service");

const createNewReport = async (req, res) => {
  const { street, neighborhood, city, category, issue, description } = req.body;
  try {
    const user = await checkAuth(req.config, req.headers);

    if (!street || !neighborhood || !city || !category || !issue) {
      sendJson(res, 400, {
        message:
          "All the fields are required: street, neighborhood, city, category, issue, description",
      });
      return;
    }

    const report = await generateNewReport(
      user,
      street,
      neighborhood,
      city,
      category,
      issue,
      description
    );
    if (!report) {
      sendJson(res, 400, { message: "Failed to create report..." });
      return;
    }
    sendJson(res, 200, { message: "Report created successfully", report });
  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
    return;
  }
};

const getReportById = async (req, res) => {
  const reportId = req.params.id;
  try {
    const user = await checkAuth(req.config, req.headers);

    const report = await findReportById(user, reportId);
    if (!report) {
      sendJson(res, 400, { message: "Failed to get report..." });
      return;
    }
    sendJson(res, 200, { message: "Report retrieved successfully", report });
  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
    return;
  }
};

const getAllUserReports = async (req, res) => {
  try {
    const user = await checkAuth(req.config, req.headers);

    const report = await findAllUserReports(user);
    if (!report) {
      sendJson(res, 400, { message: "Failed to get report..." });
      return;
    }
    sendJson(res, 200, { message: "Report retrieved successfully", report });
  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
    return;
  }
};

const getReportsForUser = async (req, res) => {
  const idOfUser = req.params.id;
  try {
    const user = await checkAuth(req.config, req.headers);
    const isRoleValid = checkRole(user, DEFAULT_ROLES.ADMINISTRATOR);
    if (isRoleValid !== null) {
      sendJson(res, isRoleValid.status, isRoleValid.error);
      return;
    }

    const report = await findAllUserReports({ id: idOfUser });
    if (!report) {
      sendJson(res, 400, { message: "Failed to get report..." });
      return;
    }
    sendJson(res, 200, { message: "Report retrieved successfully", report });
  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
    return;
  }
};

const getReportsByNeighborhood = async (req, res) => {
  const { city, neighborhood } = req.params;
  console.log(city, neighborhood)
  try {
    const user = await checkAuth(req.config, req.headers);
    const isRoleValid = checkRole(user, DEFAULT_ROLES.AUTHORIZED_PERSONNEL);
    if (isRoleValid !== null) {
      sendJson(res, isRoleValid.status, isRoleValid.error);
      return;
    }

    const report = await findReportsByNeighborhood(city, neighborhood);
    if (!report) {
      sendJson(res, 400, { message: "Failed to get report..." });
      return;
    }
    sendJson(res, 200, { message: "Report retrieved successfully", report });
  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
    return;
  }
};

const joinReport = async (req, res) => {
  const reportId = req.params.id

  try {
    const user = await checkAuth(req.config, req.headers);
    const isRoleValid = checkRole(user, DEFAULT_ROLES.AUTHORIZED_PERSONNEL);
    if (isRoleValid !== null) {
      sendJson(res, isRoleValid.status, isRoleValid.error);
      return;
    }

    const report = await updateReport(reportId, user, 'in_progress');
    if (!report) {
      sendJson(res, 400, { message: "Failed to get report..." });
      return;
    }
    sendJson(res, 200, { message: "Report retrieved successfully", report });
  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
    return;
  }
}

const concludeReport = async (req, res) => {
  const reportId = req.params.id
  const { status, details } = req.body;

  try {
    const user = await checkAuth(req.config, req.headers);
    const isRoleValid = checkRole(user, DEFAULT_ROLES.AUTHORIZED_PERSONNEL);
    if (isRoleValid !== null) {
      sendJson(res, isRoleValid.status, isRoleValid.error);
      return;
    }

    if (!status || !['resolved', 'rejected'].includes(status)) {
      throw new Error("Status must be set to either 'resolved' or 'rejected'");
    }

    if (details === undefined || details === null) {
      throw new Error("You must set a summary of these report.")
    }

    const report = await updateReport(reportId, user, status, details);
    if (!report) {
      sendJson(res, 400, { message: "Failed to get report..." });
      return;
    }
    sendJson(res, 200, { message: "Report retrieved successfully", report });
  } catch (error) {
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
    return;
  }
}

module.exports = {
  createNewReport,
  getReportById,
  getAllUserReports,
  getReportsForUser,
  getReportsByNeighborhood,
  joinReport,
  concludeReport,
};
