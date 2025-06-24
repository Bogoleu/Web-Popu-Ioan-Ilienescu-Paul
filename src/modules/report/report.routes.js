const {
    createNewReport,
    getReportById,
    getAllUserReports,
    getReportsForUser,
    getReportsByNeighborhood,
    getAllReportsForAdmin,
    joinReport,
    concludeReport,
    downloadReports,
} = require('./report.controller');

const {
    requireAuthenticated,
    requirePersonnelOrAdmin,
    requireAdmin
} = require('../../core/middlewares/authMiddleware');

const reportRoutes = (srv) => {
    // download reports (all authenticated users can download)
    srv.registerRoute('GET', '/report/download', requireAuthenticated, downloadReports);
    
    // personnel or admin can join/assign themselves to reports
    srv.registerRoute('GET', '/report/join/id/:id', requirePersonnelOrAdmin, joinReport);
    
    // ALL authenticated users can view reports by neighborhood (not just personnel)
    srv.registerRoute('GET', '/report/by/city/:city/neighborhood/:neighborhood', requireAuthenticated, getReportsByNeighborhood);
    
    // admin only - view all reports
    srv.registerRoute('GET', '/report/all', requireAdmin, getAllReportsForAdmin);
    
    // admin only - view reports by specific user id
    srv.registerRoute('GET', '/report/by/user/:id', requireAdmin, getReportsForUser);
    
    // authenticated users can view specific report details
    srv.registerRoute('GET', '/report/id/:id', requireAuthenticated, getReportById);
    
    // authenticated users can view their own reports
    srv.registerRoute('GET', '/report', requireAuthenticated, getAllUserReports);
    
    // authenticated users can create reports
    srv.registerRoute('POST', '/report', requireAuthenticated, createNewReport);
    
    // personnel or admin can conclude/update reports
    srv.registerRoute('PUT', '/report/id/:id', requirePersonnelOrAdmin, concludeReport);
}

module.exports = reportRoutes;
