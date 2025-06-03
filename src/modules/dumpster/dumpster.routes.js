const {
    getDumpsterById,
    getDumpsterByAddress,
    getDumpsterByNeighborhood,
    createNewDumpster,
    updateDumpster,
    removeDumpster,
} = require('./dumpster.controller');

const dumpsterRoutes = (srv) => {
    srv.registerRoute('GET', '/dumpster/id/:id', getDumpsterById);
    srv.registerRoute('GET', '/dumpster/city/:city/neighborhood/:neighborhood', getDumpsterByNeighborhood);
    srv.registerRoute('POST', '/dumpster/find', getDumpsterByAddress);
    srv.registerRoute('POST', '/dumpster', createNewDumpster);
    srv.registerRoute('PUT', '/dumpster/id/:id', updateDumpster);
    srv.registerRoute('DELETE', '/dumpster/id/:id', removeDumpster);
}

module.exports = dumpsterRoutes;