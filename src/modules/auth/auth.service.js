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

    // return both token and user data
    const userData = {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        neighborhood: user.neighborhood,
        city: user.city
    };

    return { token, user: userData };
}

const logoutUser = async (token) => {
    // For now, we just log the logout
    // In a production environment, you might want to:
    // 1. Add token to a blacklist in Redis/Database
    // 2. Set token expiration immediately
    // 3. Log the logout event for security auditing
    
    console.log('User logged out successfully');
    
    // Future implementation could include:
    // await TokenBlacklist.create({ token, createdAt: new Date() });
    
    return { success: true };
}

module.exports = {
    checkUserLogin,
    logoutUser,
};