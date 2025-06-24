const sendJson = require("../../core/sendJson");
const { Report } = require("../../models/index");
const {
  generateNewReport,
  findReportById,
  findAllUserReports,
  findReportsByNeighborhood,
  updateReport,
  getAllReports,
} = require("./report.service");

const createNewReport = async (req, res) => {
  const { street, neighborhood, city, category, issue, issueType, description } = req.body;
  const finalIssue = issue || issueType;
  
  try {
    const user = req.user; // from auth middleware

    if (!street || !neighborhood || !city || !category || !finalIssue) {
      return sendJson(res, 400, {
        message: "All fields are required: street, neighborhood, city, category, issue/issueType",
      });
    }

    const report = await generateNewReport(
      user,
      street,
      neighborhood,
      city,
      category,
      finalIssue,
      description
    );
    
    if (!report) {
      return sendJson(res, 400, { message: "Failed to create report" });
    }
    
    sendJson(res, 200, { message: "Report created successfully", report });
  } catch (error) {
    console.error("Create report error:", error);
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getReportById = async (req, res) => {
  const reportId = req.params.id;
  try {
    const report = await Report.findById(reportId)
      .populate('reporterId', 'username email role')
      .populate('dumpsterId')
      .populate('resolvedBy', 'username email role');
      
    if (!report) {
      return sendJson(res, 404, { message: "Report not found" });
    }
    
    // add location info from dumpster
    const enrichedReport = {
      ...report.toObject(),
      street: report.dumpsterId?.street || 'N/A',
      neighborhood: report.dumpsterId?.neighborhood || 'N/A', 
      city: report.dumpsterId?.city || 'N/A'
    };
    
    sendJson(res, 200, enrichedReport);
  } catch (error) {
    console.error("Get report by ID error:", error);
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getAllUserReports = async (req, res) => {
  try {
    const user = req.user; // from auth middleware
    const reports = await findAllUserReports(user);
    
    if (!reports) {
      return sendJson(res, 400, { message: "Failed to get reports" });
    }
    
    // enrich with location data
    const enrichedReports = reports.map(report => ({
      ...report.toObject(),
      street: report.dumpsterId?.street || 'N/A',
      neighborhood: report.dumpsterId?.neighborhood || 'N/A',
      city: report.dumpsterId?.city || 'N/A'
    }));
    
    sendJson(res, 200, { message: "Reports retrieved successfully", report: enrichedReports });
  } catch (error) {
    console.error("Get all user reports error:", error);
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getReportsForUser = async (req, res) => {
  const idOfUser = req.params.id;
  try {
    const reports = await findAllUserReports({ id: idOfUser });
    
    if (!reports) {
      return sendJson(res, 400, { message: "Failed to get reports" });
    }
    
    const enrichedReports = reports.map(report => ({
      ...report.toObject(),
      street: report.dumpsterId?.street || 'N/A',
      neighborhood: report.dumpsterId?.neighborhood || 'N/A',
      city: report.dumpsterId?.city || 'N/A'
    }));
    
    sendJson(res, 200, { message: "Reports retrieved successfully", report: enrichedReports });
  } catch (error) {
    console.error("Get reports for user error:", error);
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getReportsByNeighborhood = async (req, res) => {
  const { city, neighborhood } = req.params;
  try {
    const user = req.user; // from auth middleware
    const reports = await findReportsByNeighborhood(city, neighborhood);
    
    if (!reports || reports.length === 0) {
      // return empty array with success status instead of error
      return sendJson(res, 200, { 
        message: "No reports found for this location", 
        report: [] 
      });
    }
    
    // filter reports based on user role for privacy
    let filteredReports;
    if (user.role === 'decision_maker' || user.role === 'admin') {
      // decision makers and admins can see all reports
      filteredReports = reports;
    } else if (user.role === 'authorized_personnel') {
      // personnel can see all reports too for their work
      filteredReports = reports;
    } else {
      // citizens can only see their own reports in the area
      filteredReports = reports.filter(report => 
        report.reporterId && report.reporterId._id && 
        report.reporterId._id.toString() === user.id
      );
    }
    
    const enrichedReports = filteredReports.map(report => ({
      ...report.toObject(),
      street: report.dumpsterId?.street || 'N/A',
      neighborhood: report.dumpsterId?.neighborhood || 'N/A',
      city: report.dumpsterId?.city || 'N/A'
    }));
    
    sendJson(res, 200, { 
      message: "Reports retrieved successfully", 
      report: enrichedReports 
    });
  } catch (error) {
    console.error("Get reports by neighborhood error:", error);
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getAllReportsForAdmin = async (req, res) => {
  try {
    const reports = await getAllReports();
    
    if (!reports) {
      return sendJson(res, 400, { message: "Failed to get reports" });
    }
    
    const enrichedReports = reports.map(report => ({
      ...report.toObject(),
      street: report.dumpsterId?.street || 'N/A',
      neighborhood: report.dumpsterId?.neighborhood || 'N/A',
      city: report.dumpsterId?.city || 'N/A'
    }));
    
    sendJson(res, 200, { message: "Reports retrieved successfully", report: enrichedReports });
  } catch (error) {
    console.error("Get all reports error:", error);
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
  }
};

const joinReport = async (req, res) => {
  const reportId = req.params.id;

  try {
    const user = req.user; // from auth middleware
    const report = await updateReport(reportId, user, 'in_progress');
    
    if (!report) {
      return sendJson(res, 400, { message: "Failed to join report" });
    }
    
    sendJson(res, 200, { message: "Successfully joined report", report });
  } catch (error) {
    console.error("Join report error:", error);
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
  }
};

const concludeReport = async (req, res) => {
  const reportId = req.params.id;
  const { status, details, resolutionDetails } = req.body;
  const finalDetails = details || resolutionDetails;

  try {
    const user = req.user; // from auth middleware

    if (!status || !['resolved', 'rejected'].includes(status)) {
      return sendJson(res, 400, { 
        message: "Status must be either 'resolved' or 'rejected'" 
      });
    }

    if (!finalDetails) {
      return sendJson(res, 400, { 
        message: "Resolution details are required" 
      });
    }

    const report = await updateReport(reportId, user, status, finalDetails);
    
    if (!report) {
      return sendJson(res, 400, { message: "Failed to update report" });
    }
    
    sendJson(res, 200, { message: "Report updated successfully", report });
  } catch (error) {
    console.error("Conclude report error:", error);
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
  }
};

// download functionality
const downloadReports = async (req, res) => {
  const format = req.query?.format;
  const type = req.query?.type || 'general';
  const neighborhood = req.query?.neighborhood;
  const city = req.query?.city;
  
  if (!format) {
    return sendJson(res, 400, { message: "Format parameter is required. Use: csv, html, or pdf" });
  }
  
  try {
    const user = req.user;
    
    // determine which reports to include based on user role
    let reports;
    if (user.role === 'decision_maker' || user.role === 'admin') {
      if (neighborhood && city) {
        reports = await findReportsByNeighborhood(city, neighborhood);
      } else {
        reports = await getAllReports();
      }
    } else if (user.role === 'authorized_personnel') {
      if (neighborhood && city) {
        reports = await findReportsByNeighborhood(city, neighborhood);
      } else {
        reports = await getAllReports();
      }
    } else {
      // citizens get their own reports, optionally filtered by location
      if (neighborhood && city) {
        const allReports = await findReportsByNeighborhood(city, neighborhood);
        reports = allReports.filter(report => 
          report.reporterId && report.reporterId._id && 
          report.reporterId._id.toString() === user.id
        );
      } else {
        reports = await findAllUserReports(user);
      }
    }
    
    if (!reports || reports.length === 0) {
      return sendJson(res, 404, { message: "No reports found" });
    }
    
    // enrich with location data
    const enrichedReports = reports.map(report => ({
      id: report._id,
      street: report.dumpsterId?.street || 'N/A',
      neighborhood: report.dumpsterId?.neighborhood || 'N/A',
      city: report.dumpsterId?.city || 'N/A',
      category: report.category,
      issue: report.issue,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      reporterEmail: report.reporterId?.email || 'N/A',
      resolvedByEmail: report.resolvedBy?.email || 'N/A',
      resolutionDetails: report.resolutionDetails || 'N/A'
    }));
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `reports-${timestamp}`;
    
    if (format === 'csv') {
      try {
        const { parse } = require('json2csv');
        const csv = parse(enrichedReports);
        
        res.writeHead(200, {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        });
        res.end(csv);
      } catch (csvError) {
        console.error("CSV generation error:", csvError);
        return sendJson(res, 500, { message: "Failed to generate CSV" });
      }
      
    } else if (format === 'html') {
      try {
        const html = generateHtmlReport(enrichedReports, type);
        
        res.writeHead(200, {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${filename}.html"`
        });
        res.end(html);
      } catch (htmlError) {
        console.error("HTML generation error:", htmlError);
        return sendJson(res, 500, { message: "Failed to generate HTML" });
      }
      
    } else if (format === 'pdf') {
      try {
        const puppeteer = require('puppeteer');
        const html = generateHtmlReport(enrichedReports, type);
        
        const browser = await puppeteer.launch({ 
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html);
        const pdf = await page.pdf({ format: 'A4' });
        await browser.close();
        
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`
        });
        res.end(pdf);
      } catch (pdfError) {
        console.error("PDF generation error:", pdfError);
        return sendJson(res, 500, { message: "Failed to generate PDF" });
      }
      
    } else {
      return sendJson(res, 400, { message: "Invalid format. Use csv, html, or pdf" });
    }
    
  } catch (error) {
    console.error("Download reports error:", error);
    sendJson(res, 500, {
      message: "Internal server error",
      error: error.message,
    });
  }
};

function generateHtmlReport(reports, type) {
  const rows = reports.map(report => `
    <tr>
      <td>${report.id}</td>
      <td>${report.street}</td>
      <td>${report.neighborhood}</td>
      <td>${report.city}</td>
      <td>${report.category}</td>
      <td>${report.issue}</td>
      <td>${report.status}</td>
      <td>${new Date(report.createdAt).toLocaleDateString()}</td>
      <td>${report.reporterEmail}</td>
      <td>${report.resolutionDetails}</td>
    </tr>
  `).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${type.charAt(0).toUpperCase() + type.slice(1)} Reports</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        h1 { color: #333; }
      </style>
    </head>
    <body>
      <h1>${type.charAt(0).toUpperCase() + type.slice(1)} Reports - ${new Date().toLocaleDateString()}</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Street</th>
            <th>Neighborhood</th>
            <th>City</th>
            <th>Category</th>
            <th>Issue</th>
            <th>Status</th>
            <th>Created</th>
            <th>Reporter</th>
            <th>Resolution</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

module.exports = {
  createNewReport,
  getReportById,
  getAllUserReports,
  getReportsForUser,
  getReportsByNeighborhood,
  getAllReportsForAdmin,
  joinReport,
  concludeReport,
  downloadReports,
};
