const {
    authLoginUser, authRegisterUser
} = require("./auth.controller");

const authRoutes = (srv) => {
    srv.registerRoute("POST", "/auth/login", authLoginUser);
    srv.registerRoute("POST","/auth/register", authRegisterUser);
}

module.exports = authRoutes;