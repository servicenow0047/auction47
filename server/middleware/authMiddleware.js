const requireAdmin = (req, res, next) => {
  // Check header for 'x-admin-password'
  const providedPassword = req.headers['x-admin-password'];
  const masterPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (!providedPassword || providedPassword !== masterPassword) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin Password' });
  }

  next();
};

module.exports = { requireAdmin };
