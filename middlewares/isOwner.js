const isOwner = (req, res, next) => {
  if (req.user && req.user.user_role === "dueno") {
    return next();
  }
  return res.status(403).json({ message: "Acceso denegado. Solo dueños pueden realizar esta acción." });
};

module.exports = isOwner;
