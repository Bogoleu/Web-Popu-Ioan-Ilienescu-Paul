const sendJson = require("../../core/sendJson");
const { checkAuth } = require("../../utils/checkAuth");
const {
    checkUserLogin,
    logoutUser
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

    const result = await checkUserLogin(config, username, password);
    if (!result) {
      sendJson(res, 401, { message: "Invalid username or password" });
      return;
    }
    sendJson(res, 200, { 
      message: "Login successful", 
      token: result.token, 
      user: result.user 
    });
    
  } catch (error) {
    sendJson(res, 500, { message: "Internal server error", error: error.message });
    return;
  }
};

const authLogoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      sendJson(res, 400, { message: "No token provided" });
      return;
    }

    // verify token is valid before logout
    const jwt = require("jsonwebtoken");
    const config = req.config;
    
    try {
      jwt.verify(token, config.auth.secret);
    } catch (error) {
      sendJson(res, 401, { message: "Invalid token" });
      return;
    }

    // call logout service (for future token blacklisting)
    await logoutUser(token);
    
    sendJson(res, 200, { message: "Logout successful" });
    
  } catch (error) {
    sendJson(res, 500, { message: "Internal server error", error: error.message });
  }
};

module.exports = {
    authLoginUser,
    authRegisterUser,
    authLogoutUser,
};