const {
    createNewUser,
    getUserProfile,
    getUserProfileById,
    putSelfUserProfile,
    putAdminUserProfile,
} = require("./users.controller");

const userRoutes = (srv) => {
    srv.registerRoute("POST", "/user", createNewUser);
    srv.registerRoute("GET", "/user/profile", getUserProfile);
    srv.registerRoute("GET", "/user/profile/id/:id", getUserProfileById);
    srv.registerRoute("PUT", "/user/profile", putSelfUserProfile);
    srv.registerRoute("PUT", "/user/profile/id/:id", putAdminUserProfile);
}

module.exports = userRoutes;