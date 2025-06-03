const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

const UserModel = require("../../models/user.model");

const checkUserLogin = async (config, username, password) => {
    const user = await UserModel.findOne({ username }) 

    if (!user) {
        // generic error message to reduce bruteforce surface
        throw new Error("Username or password don't match. Please try again!");
    }

    const isPasswordGood = await bcrypt.compare(password, user.password);

    if (!isPasswordGood) {
        throw new Error("Username or password don't match. Please try again!");
    }

    const token = jwt.sign({
        id: user._id,
        username: user.username,
        role: user.role
    }, config.auth.secret, {
        expiresIn: '6h',
    });


    return token;
}

const logoutUser = async (token) => {

}

module.exports = {
    checkUserLogin,
    logoutUser,
};