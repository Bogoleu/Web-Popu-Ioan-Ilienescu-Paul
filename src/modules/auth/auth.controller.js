const sendJson = require("../../core/sendJson");
const { checkAuth } = require("../../utils/checkAuth");
const {
    checkUserLogin
} = require("./auth.service");

const authLoginUser = async (req, res) => {
  const { username, password } = req.body;
  const config = req.config;

  try {
    if (!username || !password) {
      sendJson(res, 400, { message: "Username and password are required" });
      return;
    }

    const token = await checkUserLogin(config, username, password);
    if (!token) {
      sendJson(res, 401, { message: "Invalid username or password" });
      return;
    }
    sendJson(res, 200, { message: "Login successful", token });
    
  } catch (error) {
    sendJson(res, 500, { message: "Internal server error", error: error.message });
    return;
  }
};

module.exports = {
    authLoginUser,
};