const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser
} = require('../controllers/users.controller');

// GET /users - Obtener todos los usuarios
router.get('/', getAllUsers);

// POST /users - Crear un nuevo usuario
router.post('/', createUser);

// GET /users/:id - Obtener un usuario por su ID
router.get('/:id', getUserById);

// PATCH /users/:id - Actualizar un usuario por su ID
router.patch('/:id', updateUser);

// DELETE /users/:id - Eliminar un usuario por su ID
router.delete('/:id', deleteUser);

module.exports = router;
