export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated() || req.session.username) {
    return next();
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function ensureAuthenticatedSocket(socket, next) {
  if (
    socket.request.session &&
    socket.request.session.passport &&
    socket.request.session.passport.user
  ) {
    return next();
  } else if (socket.request.session && socket.request.session.username) {
    return next();
  } else {
    return next(new Error("Unauthorized"));
  }
}
