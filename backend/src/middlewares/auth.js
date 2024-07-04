export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated() || req.session.username) {
    return next();
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
