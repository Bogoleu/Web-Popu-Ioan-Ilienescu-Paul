const sendJson = require("../../core/sendJson");
const {
    checkUserLogin
} = require("./auth.service");

const authLoginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      sendJson(res, 400, { message: "Username and password are required" });
      return;
    }

    const user = await checkUserLogin(username, password);
    if (!user) {
      sendJson(res, 401, { message: "Invalid username or password" });
      return;
    }
    sendJson(res, 200, { message: "Login successful", user });
    
  } catch (error) {
    sendJson(res, 500, { message: "Internal server error", error: error.message });
    return;
  }
};

module.exports = {
    authLoginUser
};