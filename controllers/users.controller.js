const { Users } = require("../models");
const bcrypt = require('bcryptjs');

// --- Funciones auxiliares (no exportadas) ---

// Valida la fortaleza de la contraseña
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (password.length < minLength) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!hasUpperCase) return 'La contraseña debe contener al menos una letra mayúscula.';
    if (!hasLowerCase) return 'La contraseña debe contener al menos una letra minúscula.';
    if (!hasNumbers) return 'La contraseña debe contener al menos un número.';
    if (!hasSpecialChar) return 'La contraseña debe contener al menos un carácter especial.';
    return null; // Contraseña válida
};

// Busca un usuario por su nombre de usuario
const findUserByUsername = (username) => {
    return Users.findOne({ where: { user_name: username } });
};

// --- Controladores (exportados) ---

// Obtener todos los usuarios
const getAllUsers = async (req, res) => {
    try {
        const users = await Users.findAll({
            attributes: { exclude: ['user_hashed_password'] } // No exponer la contraseña
        });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios.' });
    }
};

// Crear un nuevo usuario
const createUser = async (req, res) => {
    const { user_name, user_last_name, user_email, user_hashed_password, user_phone, user_role } = req.body;

    if (!user_name || !user_hashed_password || !user_email) {
        return res.status(400).json({ message: 'El nombre de usuario, la contraseña y el email son requeridos.' });
    }

    const passwordError = validatePassword(user_hashed_password);
    if (passwordError) {
        return res.status(400).json({ message: passwordError });
    }

    try {
        const existingUser = await findUserByUsername(user_name);
        if (existingUser) {
            return res.status(409).json({ message: 'El nombre de usuario ya existe.' });
        }

        const existingEmail = await Users.findOne({ where: { user_email } });
        if (existingEmail) {
            return res.status(409).json({ message: 'El email ya está en uso.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(user_hashed_password, saltRounds);

        const newUser = await Users.create({
            user_name,
            user_last_name,
            user_email,
            user_hashed_password: hashedPassword,
            user_phone,
            user_role
        });

        const userResponse = newUser.toJSON();
        delete userResponse.user_hashed_password;

        res.status(201).json({
            message: 'Usuario creado exitosamente.',
            user: userResponse
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error al crear el usuario.' });
    }
};

// Obtener un usuario por su ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await Users.findByPk(id, {
            attributes: { exclude: ['user_hashed_password'] }
        });

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ message: 'Error al obtener el usuario.' });
    }
};

// Actualizar un usuario
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Users.update(req.body, {
            where: { user_id: id }
        });

        if (updated) {
            const updatedUser = await Users.findByPk(id, {
                attributes: { exclude: ['user_hashed_password'] }
            });
            return res.status(200).json({ message: 'Usuario actualizado.', user: updatedUser });
        }
        return res.status(404).json({ message: 'Usuario no encontrado.' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error al actualizar el usuario.' });
    }
};

// Eliminar un usuario
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Users.destroy({
            where: { user_id: id }
        });

        if (deleted) {
            return res.status(204).send(); // No Content
        }
        return res.status(404).json({ message: 'Usuario no encontrado.' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error al eliminar el usuario.' });
    }
};

module.exports = {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser
};
