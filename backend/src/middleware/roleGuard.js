/**
 * Role guard middleware.
 * Must be used AFTER auth middleware.
 * Checks if the user's active role matches one of the allowed roles.
 * 
 * @param  {...string} allowedRoles - Roles allowed to access the route
 */
const roleGuard = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!req.user.activeRole) {
      return res.status(403).json({ message: 'No active role selected. Please choose a role first.' });
    }

    const roles = allowedRoles.flat();
    if (!roles.includes(req.user.activeRole)) {
      return res.status(403).json({
        message: `Access denied. This action requires one of: ${roles.join(', ')}. Your active role is: ${req.user.activeRole}.`,
      });
    }

    next();
  };
};

module.exports = { roleGuard };
