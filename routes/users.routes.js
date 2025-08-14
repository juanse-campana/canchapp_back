// routes/users.routes.js - VERSIÓN COMPLETA
var express = require("express");
var router = express.Router();
const usersController = require("../controllers/users.controller");
const { verifyToken, requireAdmin } = require("../middlewares/auth");

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

// 📋 GET /users/list - Ruta legacy (mantenida para compatibilidad)
router.get("/list", async function (request, response) {
    const result = await usersController.getList();
    response.status(200).json({
        data: result,
        status: true,
        message: "TODO ESTA OK",
    });
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

// ➕ POST /users/create - Ruta legacy (mantenida para compatibilidad)
router.post("/create", async function (req, res) {
    console.log('📝 POST /users/create - Legacy route');
    try {
        await usersController.postCreate(req, res);
    } catch (error) {
        console.error('Error no capturado en la ruta /users/create:', error);
        if (!res.headersSent) {
            res.status(500).json({
                status: false,
                message: 'Error interno del servidor.'
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

// 🔧 PATCH /users/update - Ruta legacy (mantenida para compatibilidad)
router.patch("/update", function (request, response) {
    const result = usersController.patchUpdate(request.body);
    response.status(200).json({
        status: true,
        info: result,
    });
});

module.exports = router;