function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of the following roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
}

const requireAdmin = requireRole('ADMIN');
const requireCustomer = requireRole('CUSTOMER');

module.exports = {
  requireRole,
  requireAdmin,
  requireCustomer,
};

