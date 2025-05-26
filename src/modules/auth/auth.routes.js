const {
    authLoginUser
} = require("./auth.controller");

const authRoutes = (srv) => {
    srv.registerRoute("POST", "/auth/login", authLoginUser);
}

module.exports = authRoutes;