const {
    getDashboardAnalytics,
    getNeighborhoodComparison
} = require('./dashboard.controller');

const {
    requireAuthenticated,
    requireDecisionMakerOrAdmin
} = require('../../core/middlewares/authMiddleware');

const dashboardRoutes = (srv) => {
    // all authenticated users can access basic dashboard analytics
    srv.registerRoute('GET', '/dashboard/analytics', requireAuthenticated, getDashboardAnalytics);
    
    // decision makers or admin can access neighborhood comparison data
    srv.registerRoute('GET', '/dashboard/comparison', requireDecisionMakerOrAdmin, getNeighborhoodComparison);
};

module.exports = dashboardRoutes; 