const {
    getDumpsterById,
    getDumpsterByAddress,
    getDumpsterByNeighborhood,
    createNewDumpster,
    updateDumpster,
    removeDumpster,
} = require('./dumpster.controller');

const {
    requireAuthenticated,
    requirePersonnelOrAdmin,
    requireAdmin
} = require('../../core/middlewares/authMiddleware');

const dumpsterRoutes = (srv) => {
    // authenticated users can view dumpsters
    srv.registerRoute('GET', '/dumpster/id/:id', requireAuthenticated, getDumpsterById);
    srv.registerRoute('GET', '/dumpster/city/:city/neighborhood/:neighborhood', requireAuthenticated, getDumpsterByNeighborhood);
    srv.registerRoute('POST', '/dumpster/find', requireAuthenticated, getDumpsterByAddress);
    
    // only personnel or admin can create/modify dumpsters
    srv.registerRoute('POST', '/dumpster', requirePersonnelOrAdmin, createNewDumpster);
    srv.registerRoute('PUT', '/dumpster/id/:id', requirePersonnelOrAdmin, updateDumpster);
    
    // only admin can remove dumpsters
    srv.registerRoute('DELETE', '/dumpster/id/:id', requireAdmin, removeDumpster);
}

module.exports = dumpsterRoutes;