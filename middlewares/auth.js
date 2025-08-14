// middleware/auth.js - Middleware completo para roles
const verifyToken = require('./verifyToken');

// Middleware para verificar roles específicos
const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    // Si no se especifican roles, permite a cualquier usuario autenticado
    if (!allowedRoles.length) {
      return next();
    }

    // Verificar si el usuario tiene uno de los roles permitidos
    if (!req.user || !req.user.user_role) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: información de usuario no válida'
      });
    }

    if (!allowedRoles.includes(req.user.user_role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado: Se requiere rol ${allowedRoles.join(' o ')}`
      });
    }

    next();
  };
};

// Middleware específico para admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.user_role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: Solo administradores'
    });
  }
  next();
};

// Middleware específico para dueños de empresa
const requireOwner = (req, res, next) => {
  if (!req.user || req.user.user_role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: Solo dueños de empresa'
    });
  }
  next();
};

// Middleware para admin o dueño
const requireAdminOrOwner = (req, res, next) => {
  if (!req.user || !['admin', 'owner'].includes(req.user.user_role)) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado: Solo administradores o dueños'
    });
  }
  next();
};

// Middleware para verificar que el usuario puede acceder a sus propios datos
const requireOwnership = (userIdField = 'userId') => {
  return (req, res, next) => {
    const targetUserId = req.params[userIdField] || req.body.user_id;
    
    // Admin puede acceder a cualquier cosa
    if (req.user.user_role === 'admin') {
      return next();
    }
    
    // Usuario solo puede acceder a sus propios datos
    if (req.user.user_id != targetUserId) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Solo puedes acceder a tus propios datos'
      });
    }
    
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin,
  requireOwner,
  requireAdminOrOwner,
  requireOwnership
};