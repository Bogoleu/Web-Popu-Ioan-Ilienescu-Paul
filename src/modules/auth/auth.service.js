const checkUserLogin = async (username, password) => {
    if (username === "paul" && password === "paul1234") {
        return { username, role: "user" }; 
    }
    return null;
}

module.exports = {
    checkUserLogin
};