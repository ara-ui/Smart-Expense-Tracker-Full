const jwt = require("jsonwebtoken");

const generateAccessToken = (id, name, email, isPremiumUser) => {
    return jwt.sign(
        {
            userId: id,
            name: name,
            email: email,
            isPremiumUser: isPremiumUser
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};

module.exports = { generateAccessToken };
