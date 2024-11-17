function checkRole(role) {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            return next();
        }
        return res.status(403).send('Permission denied');
    };
}

module.exports = checkRole;
