const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "claveSecretaSuperSegura"; // usa variable de entorno en producción

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // El token debe venir así: Authorization: Bearer <token>
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado o mal formado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Ahora tienes: req.user.user_id, req.user.user_role, etc.
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
};

module.exports = verifyToken;
