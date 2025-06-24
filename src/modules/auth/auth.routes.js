const {
    authLoginUser, authRegisterUser, authLogoutUser
} = require("./auth.controller");

const authRoutes = (srv) => {
    srv.registerRoute("POST", "/auth/login", authLoginUser);
    srv.registerRoute("POST", "/auth/register", authRegisterUser);
    srv.registerRoute("POST", "/auth/logout", authLogoutUser);
}

module.exports = authRoutes;