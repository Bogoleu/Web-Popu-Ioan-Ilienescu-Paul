const UserModel = require("../../models/user.model");
const bcrypt = require("bcrypt");

const createUser = async (username, password, email, neighborhood, city) => {
    const usernameExists = await UserModel.findOne({ username });
    const emailExists = await UserModel.findOne({ email });
    if (usernameExists !== null || emailExists !== null) {
        throw new Error("Username or email already exists in our database. Be more creative!");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new UserModel({
        username,
        password: hashedPassword,
        email,
        neighborhood: neighborhood.toLowerCase(),
        city: city.toLowerCase(),
        role: "citizen",
        createdAt: Date.now(),
        updatedAt: Date.now()
    })

    await user.save();
    return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        neighborhood,
        city,
        createdAt: user.createdAt,
    };
};


const findUserProfile = async (id, username) => {
    if (id && id !== null) {
        const user = await UserModel.findOne({ _id: id }, { password: 0, _id: 0, __v: 0});
        return {
            id,
            ...user.toObject()
        }
    }

    const user = await UserModel.findOne({ username }, { password: 0, __v: 0});
    const usrObj = user.toObject();

    userObj.id = userObj._id;
    delete userObj._id;

    return userObj;
}

const updateSelfProfile = async (id, username, email, neighborhood, city) => {
    const user = await UserModel.findOne({ username, _id: id }, { password: 0, _id: 0, __v: 0});

    const userModifications = {};

    if (email && email !== null && user.email !== email) {
        const emailExists = await UserModel.findOne({ email }, { password: 0, __v: 0});
        if (emailExists !== null ){
            return null;
        }
        userModifications.email = email;
    }

    if (neighborhood && neighborhood !== null && user.neighborhood !== neighborhood.toLowerCase()) {
        userModifications.neighborhood = neighborhood.toLowerCase();
    }

    if (city && city !== null && user.city !== city.toLowerCase()) {
        userModifications.city = city.toLowerCase();
    }

    if (Object.keys(userModifications).length === 0) {
        return null;
    }

    userModifications.updatedAt = Date.now();

    const newUser = await UserModel.updateOne({
        username, _id: id
    }, {
        $set: userModifications
    });

    if (newUser.modifiedCount > 0) {
        return userModifications;
    }

    return null;
}

const updateUserProfile = async (id, username, email, role, neighborhood, city ) => {
    const userModifications = {};
    const user = await UserModel.findOne({ _id: id }, { password: 0, _id: 0, __v: 0});

    if (email && email !== null && user.email !== email) {
        const emailExists = await UserModel.findOne({ email }, { password: 0, __v: 0});
        if (emailExists !== null ){
            return null;
        }
        userModifications.email = email;
    }

    if (username && username !== null && user.username !== username) {
        const usernameExists = await UserModel.findOne({ username }, { password: 0, __v: 0});
        if (usernameExists !== null ){
            return null;
        }
        userModifications.username = username;
    }

    if (role && ['citizen', 'authorized_personnel', 'decision_maker', 'admin'].includes(role) && user.role !== role) {
        userModifications.role = role;
    }


    if (neighborhood && neighborhood !== null && user.neighborhood !== neighborhood.toLowerCase()) {
        userModifications.neighborhood = neighborhood.toLowerCase();
    }

    if (city && city !== null && user.city !== city.toLowerCase()) {
        userModifications.city = city.toLowerCase();
    }

    if (Object.keys(userModifications).length === 0) {
        return null;
    }

    userModifications.updatedAt = Date.now();

    const newUser = await UserModel.updateOne({
        _id: id
    }, {
        $set: userModifications
    });

    if (newUser.modifiedCount > 0) {
        return userModifications;
    }

    return null;
}


module.exports = {
    createUser,
    findUserProfile,
    updateSelfProfile,
    updateUserProfile,
};