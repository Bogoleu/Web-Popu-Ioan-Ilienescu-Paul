const sendJson = require("../../core/sendJson");
const { checkAuth, checkRole, DEFAULT_ROLES } = require("../../utils/checkAuth");
const {
  createUser,
  findUserProfile,
  updateSelfProfile,
  updateUserProfile,
} = require("./users.service");

const createNewUser = async (req, res) => {
  const { username, password, email, neighborhood, city } = req.body;
  try {
    if (!username || !password || !email || !neighborhood || !city) {
      sendJson(res, 400, { message: "All the fields are required: username, password, email, neighborhood, city" });
      return;
    }

    const user = await createUser(username, password, email, neighborhood, city);
    if (!user) {
      sendJson(res, 401, { message: "Failed to create user..." });
      return;
    }
    sendJson(res, 200, { message: "User create successfully", user });
    
  } catch (error) {
    sendJson(res, 500, { message: "Internal server error", error: error.message });
    return;
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await checkAuth(req.config, req.headers);
    const profile = await findUserProfile(user.id, user.username);
    sendJson(res, 200, { message: "User profile retrieved successfully", profile });
  } catch (error) {
    sendJson(res, 500, { message: "Internal server error", error: error.message });
    return;
  }
}

const getUserProfileById = async (req, res) => {
  try {
    const user = await checkAuth(req.config, req.headers);
    const isRoleValid = checkRole(user, DEFAULT_ROLES.ADMINISTRATOR);
    if (isRoleValid !== null) {
      sendJson(res, isRoleValid.status, isRoleValid.error);
      return;
    }

    const userId = req.params.id

    const profile = await findUserProfile(userId);
    sendJson(res, 200, { message: "User profile retrieved successfully", profile });
  } catch (error) {
    sendJson(res, 500, { message: "Internal server error", error: error.message });
    return;
  }
}

const putSelfUserProfile = async (req, res) => {
  try {
    const { email, neighborhood, city } = req.body;
    const user = await checkAuth(req.config, req.headers);
    const profile = await updateSelfProfile(user.id, user.username, email, neighborhood, city);
    if (profile === null) {
      sendJson(res, 200, { message: "User profile hasn't been updated." });
      return;
    }

    sendJson(res, 200, { message: "User profile has been updated successfully", profile });
  } catch (error) {
    sendJson(res, 500, { message: "Internal server error", error: error.message });
    return;
  }
}

const putAdminUserProfile = async (req, res) => {
  try {
    const user = await checkAuth(req.config, req.headers);
    const isRoleValid = checkRole(user, DEFAULT_ROLES.ADMINISTRATOR);
    if (isRoleValid !== null) {
      sendJson(res, isRoleValid.status, isRoleValid.error);
      return;
    }
    
    const userId = req.params.id
    const { username, email, role, neighborhood, city } = req.body

    const profile = await updateUserProfile(userId, username, email, role, neighborhood, city);
    sendJson(res, 200, { message: "User profile has been updated successfully", profile });
  } catch (error) {
    sendJson(res, 500, { message: "Internal server error", error: error.message });
    return;
  }
}

module.exports = {
  createNewUser,
  getUserProfile,
  getUserProfileById,
  putSelfUserProfile,
  putAdminUserProfile,
};