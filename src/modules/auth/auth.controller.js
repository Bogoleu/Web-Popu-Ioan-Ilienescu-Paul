const sendJson = require("../../core/sendJson");
const { checkAuth } = require("../../utils/checkAuth");
const {
    checkUserLogin
} = require("./auth.service");
const { createUser } = require("../users/users.service");

const authRegisterUser = async (req, res) => {
  const { username, password, email, neighborhood, city } = req.body;
  const config = req.config;

  try {
    if (!username || !password || !email || !neighborhood || !city) {
      sendJson(res, 400, { message: "All fields are required" });
      return;
    }

    const newUser = await createUser(username, password, email, neighborhood, city);

    const jwt = require("jsonwebtoken");
    const token = jwt.sign({
      id: newUser._id,
      username: newUser.username,
      role: newUser.role,
    }, config.auth.secret, { expiresIn: "6h" });

    sendJson(res, 201, { message: "Registration successful", token });
  } catch (error) {
    sendJson(res, 500, { message: "Internal server error", error: error.message });
  }
};
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
    authRegisterUser,
};