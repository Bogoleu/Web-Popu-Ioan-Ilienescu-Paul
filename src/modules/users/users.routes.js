const {
    createNewUser,
    getUserProfile,
    getUserProfileById,
    putSelfUserProfile,
    putAdminUserProfile,
} = require("./users.controller");

const {
    requireAuthenticated,
    requireAdmin
} = require('../../core/middlewares/authMiddleware');

const userRoutes = (srv) => {
    // admin only - create new user
    srv.registerRoute("POST", "/user", requireAdmin, createNewUser);
    
    // authenticated users can view their own profile
    srv.registerRoute("GET", "/user/profile", requireAuthenticated, getUserProfile);
    
    // admin only - view any user profile by id
    srv.registerRoute("GET", "/user/profile/id/:id", requireAdmin, getUserProfileById);
    
    // authenticated users can update their own profile
    srv.registerRoute("PUT", "/user/profile", requireAuthenticated, putSelfUserProfile);
    
    // admin only - update any user profile by id
    srv.registerRoute("PUT", "/user/profile/id/:id", requireAdmin, putAdminUserProfile);
}

module.exports = userRoutes;