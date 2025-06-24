const jwt = require('jsonwebtoken')

const DEFAULT_ROLES = {
    CITIZEN: 'citizen',
    AUTHORIZED_PERSONNEL: 'authorized_personnel',
    DECISION_MAKER: 'decision_maker',
    ADMINISTRATOR: 'admin',
}

const checkAuth =  async (config, headers) => {
    if (!headers.authorization) {
        throw new Error("This endpoint is not a public endpoint. Please login!");
    }
    const [type, token] = headers.authorization.split(' ');
    if (type !==  'Bearer' || !token) {
        throw new Error("This endpoint supports only Bearer authentication.");
    }
    const user = jwt.verify(token, config.auth.secret)
    return user;
};

const checkRole = (user, requiredRole) => {
    if (!Object.values(DEFAULT_ROLES).includes(requiredRole)) {
        return {error: "Invalid role given to the checkRole function!", status: 500}
    }

    if (user.role !== requiredRole && requiredRole === DEFAULT_ROLES.ADMINISTRATOR) {
        return {error: { message: "Not found" }, status: 404}
    } 

    if (user.role !== requiredRole) {
        return { error: { message: "This is above your role. Try another account."}, status: 401}
    }

    return null;
};

module.exports = {
    DEFAULT_ROLES,
    checkRole,
    checkAuth,
};