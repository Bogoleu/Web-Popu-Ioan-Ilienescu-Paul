const {
    createNewReport,
    getReportById,
    getAllUserReports,
    getReportsForUser,
    getReportsByNeighborhood,
    joinReport,
    concludeReport,
} = require('./report.controller');

const reportRoutes = (srv) => {
    srv.registerRoute('GET', '/report/join/id/:id', joinReport);
    srv.registerRoute('GET', '/report/by/city/:city/neighborhood/:neighborhood', getReportsByNeighborhood); //ap
    srv.registerRoute('GET', '/report/by/user/:id', getReportsForUser); //admin
    srv.registerRoute('GET', '/report/id/:id', getReportById);
    srv.registerRoute('GET', '/report', getAllUserReports);
    srv.registerRoute('POST', '/report', createNewReport);
    srv.registerRoute('PUT', '/report/id/:id', concludeReport);
}

module.exports = reportRoutes;
