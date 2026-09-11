const jwt = require("jsonwebtoken");

// Single shared place to mint the app's access tokens. Both userController
// (login) and purchaseController (post-payment token refresh) previously had
// their own copies of this function - purchaseController's copy never set an
// expiry, so tokens issued right after a purchase never expired.
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
