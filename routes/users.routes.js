// routes/users.routes.js - VERSIÓN COMPLETA
var express = require("express");
var router = express.Router();
const usersController = require("../controllers/users.controller");
const { verifyToken, requireAdmin } = require("../middlewares/auth");

// 📋 GET /users/list - Ruta principal para listar usuarios
router.get("/list", async function (request, response) {
  try {
    const result = await usersController.getList();
    response.status(200).json({
      data: result,
      status: true,
      message: "Usuarios listados exitosamente",
    });
  } catch (error) {
    console.error("Error al listar los usuarios: ", error)
    response.status(500).json({
      status: false,
      message: "Ocurrio un error al listar los usuarios"
    })
  }
});

// ➕ POST /users/create - Crear nuevo usuario
router.post("/create", async function (req, res) {
  console.log(req.body);

  try {
    const result = await usersController.postCreate(req, res); 
    if (!res.headersSent) {
      res.status(200).json({
        data: result,
        status: true,
        message: "Usuario creado exitosamente",
      });
    }
  } catch (error) {
    console.error('Error no capturado en la ruta /users/create:', error);
    if (!res.headersSent) { 
      res.status(500).json({
        status: false,
        message: 'Ocurrio un error al crear el usuario'
      });
    }
  }
});

// 🔧 PATCH /users/update - Actualizar usuario
router.patch("/update", function (request, response) {
  try {
    const result = usersController.patchUpdate(request.body);
    response.status(200).json({
      status: true,
      message: "Usuario actualizado exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error al actualizar usuario: ", error)
    response.status(500).json({
      status: false,
      message: "Ocurrio un error al actualizar usuario"
    })
  }
});

// 📋 GET /users - Listar usuarios con filtros (solo admin)
router.get("/", verifyToken, requireAdmin, async function (req, res) {
  try {
    await usersController.getList(req, res);
  } catch (error) {
    console.error('Error en ruta GET /users:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
});

// 📊 GET /users/stats - Estadísticas de usuarios (solo admin)
router.get("/stats", verifyToken, requireAdmin, async function (req, res) {
  try {
    await usersController.getStats(req, res);
  } catch (error) {
    console.error('Error en ruta GET /users/stats:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
});

// 👤 GET /users/:userId - Obtener usuario específico (solo admin)
router.get("/:userId", verifyToken, requireAdmin, async function (req, res) {
  try {
    await usersController.getById(req, res);
  } catch (error) {
    console.error('Error en ruta GET /users/:userId:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
});

// ➕ POST /users - Crear nuevo usuario (solo admin)
router.post("/", verifyToken, requireAdmin, async function (req, res) {
  try {
    console.log('📝 POST /users - Crear usuario');
    await usersController.postCreate(req, res);
  } catch (error) {
    console.error('Error en ruta POST /users:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
});

// ✏️ PUT /users/:userId - Actualizar usuario (solo admin)
router.put("/:userId", verifyToken, requireAdmin, async function (req, res) {
  try {
    console.log(`📝 PUT /users/${req.params.userId} - Actualizar usuario`);
    await usersController.putUpdate(req, res);
  } catch (error) {
    console.error('Error en ruta PUT /users/:userId:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
});

// 🗑️ DELETE /users/:userId - Eliminar usuario (solo admin)
router.delete("/:userId", verifyToken, requireAdmin, async function (req, res) {
  try {
    console.log(`🗑️ DELETE /users/${req.params.userId} - Eliminar usuario`);
    await usersController.deleteUser(req, res);
  } catch (error) {
    console.error('Error en ruta DELETE /users/:userId:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
});

module.exports = router;