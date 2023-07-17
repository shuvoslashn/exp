const jwt = require('jsonwebtoken');

//** Middleware to authenticate JWT access tokens */
module.exports = function (req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ message: `Unauthorized` });
        return;
    } else {
        jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
            if (err) {
                res.status(401).json({ message: `Unauthorized` });
            } else {
                req.user = user;
                next();
            }
        });
    }
};
