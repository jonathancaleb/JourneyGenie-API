const {UnauthorizedError} = require('../utils/errors');

function rbacMiddleware(roles = ' ') {
    return (req, res, next) => {
        const allowed_roles = roles.split(' ');
        const user_role = req.user.role;

        // If user role is in allowed roles, grant access
        if (allowed_roles.includes(user_role)) return next();

        return next(
            new UnauthorizedError(
                'You are not authorized to perform this action'
            )
        );
    };
}

module.exports = rbacMiddleware;
