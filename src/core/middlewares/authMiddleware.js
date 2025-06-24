const jwt = require('jsonwebtoken');
const parseConfig = require('../../utils/config');
const sendJson = require('../sendJson');

// cache config to avoid repeated file reads
let cachedConfig = null;

const getConfig = async () => {
    if (!cachedConfig) {
        cachedConfig = await parseConfig("./config/dev.json");
    }
    return cachedConfig;
};

const DEFAULT_ROLES = {
    CITIZEN: 'citizen',
    AUTHORIZED_PERSONNEL: 'authorized_personnel',
    DECISION_MAKER: 'decision_maker',
    ADMINISTRATOR: 'admin',
};

const checkAuthLocal = async (headers) => {
    if (!headers.authorization) {
        throw new Error("This endpoint is not a public endpoint. Please login!");
    }
    const [type, token] = headers.authorization.split(' ');
    if (type !== 'Bearer' || !token) {
        throw new Error("This endpoint supports only Bearer authentication.");
    }
    
    const config = await getConfig();
    const user = jwt.verify(token, config.auth.secret);
    return user;
};

const checkRoleLocal = (user, requiredRole) => {
    console.log("Role check debug:", {
        userRole: user.role,
        userRoleType: typeof user.role,
        requiredRole: requiredRole,
        requiredRoleType: typeof requiredRole,
        roleMatch: user.role === requiredRole,
        allRoles: DEFAULT_ROLES
    });

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

// middleware to authenticate user and attach user info to request
const authenticate = async (req, res, next) => {
    try {
        const user = await checkAuthLocal(req.headers);
        req.user = user; // attach user info to request object
        next();
    } catch (error) {
        sendJson(res, 401, { message: "Authentication required", error: error.message });
    }
};

// middleware factory to check specific roles
const requireRole = (role) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                sendJson(res, 401, { message: "Authentication required" });
                return;
            }

            const roleCheck = checkRoleLocal(req.user, role);
            if (roleCheck) {
                sendJson(res, roleCheck.status, roleCheck.error);
                return;
            }

            next();
        } catch (error) {
            sendJson(res, 500, { message: "Role verification failed", error: error.message });
        }
    };
};

// middleware to allow multiple roles
const requireAnyRole = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                console.log("RequireAnyRole: No user in request");
                sendJson(res, 401, { message: "Authentication required" });
                return;
            }

            console.log("RequireAnyRole debug:", {
                userRole: req.user.role,
                allowedRoles: roles,
                userId: req.user.id,
                userEmail: req.user.email
            });

            // check if user role matches any of the allowed roles
            const hasValidRole = roles.includes(req.user.role);

            console.log("RequireAnyRole result:", {
                hasValidRole: hasValidRole,
                userRole: req.user.role,
                allowedRoles: roles
            });

            if (!hasValidRole) {
                console.log("RequireAnyRole: Access denied");
                sendJson(res, 403, { 
                    message: "Insufficient privileges", 
                    userRole: req.user.role,
                    requiredRoles: roles 
                });
                return;
            }

            console.log("RequireAnyRole: Access granted");
            next();
        } catch (error) {
            console.error("RequireAnyRole error:", error);
            sendJson(res, 500, { message: "Role verification failed", error: error.message });
        }
    };
};

// convenience middleware for common role combinations
const requireCitizen = requireRole(DEFAULT_ROLES.CITIZEN);
const requirePersonnel = requireRole(DEFAULT_ROLES.AUTHORIZED_PERSONNEL);
const requireDecisionMaker = requireRole(DEFAULT_ROLES.DECISION_MAKER);
const requireAdmin = requireRole(DEFAULT_ROLES.ADMINISTRATOR);

// middleware for personnel or admin (for task management)
const requirePersonnelOrAdmin = requireAnyRole([
    DEFAULT_ROLES.AUTHORIZED_PERSONNEL, 
    DEFAULT_ROLES.ADMINISTRATOR
]);

// middleware for decision maker or admin (for analytics)
const requireDecisionMakerOrAdmin = requireAnyRole([
    DEFAULT_ROLES.DECISION_MAKER, 
    DEFAULT_ROLES.ADMINISTRATOR
]);

// middleware for any authenticated user
const requireAuthenticated = authenticate;

module.exports = {
    authenticate,
    requireRole,
    requireAnyRole,
    requireCitizen,
    requirePersonnel,
    requireDecisionMaker,
    requireAdmin,
    requirePersonnelOrAdmin,
    requireDecisionMakerOrAdmin,
    requireAuthenticated,
    DEFAULT_ROLES
}; 