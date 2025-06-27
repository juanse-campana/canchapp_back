const { where } = require("sequelize");
const modelUsers = require("../models/users.models");
const bcrypt = require('bcryptjs');

const getList = async () => {
    const result = await modelUsers.findAll();
    return result;
  };
  

const postCreate = async (req, res) => {
    const { user_name, user_hashed_password } = req.body;

    if (!user_name || !user_hashed_password) {
        return res.status(400).json({ message: 'Nombre de usuario y contraseña son requeridos.' });
    }

    const passwordError = validatePassword(user_hashed_password);
    if (passwordError) {
        return res.status(400).json({ message: passwordError });
    }

    try {
        // Verificar si el usuario ya existe
        const existingUser = await findUserByUsername(user_name);
        if (existingUser) {
            return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(user_hashed_password, saltRounds);

        
        const userDataToSave = {
            user_name: user_name,
            user_last_name: req.body.user_last_name,
            user_email: req.body.user_email,
            user_hashed_password: hashedPassword,
            user_profile_photo: req.body.user_profile_photo
        };

        // 3. Guardar el Usuario en la Base de Datos
        // Esta variable 'dbResult' contendrá el objeto del usuario creado de tu DB, NO el objeto de respuesta HTTP
        const dbResult = await modelUsers.create(userDataToSave);

        // Envía una respuesta de éxito al cliente usando el objeto 'res' de Express
        return res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            user: {
                id: dbResult.id, 
                user_name: dbResult.user_name
            }
        });

    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        // En caso de error, envía una respuesta de error al cliente usando el objeto 'res' de Express
        return res.status(500).json({ message: 'Error interno del servidor al registrar el usuario.' });
    }
};
  

const patchUpdate = async (data) => {
    const result = await modelUsers.update(data, { where: {user_id: data.user_id} });
    return result;
};

const findUserByUsername = async (username) => {
    try {
        const result = await modelUsers.findOne({
            where: {
                user_name: username
            }
        });
        return result;
    } catch (error) {
        console.error('Error al buscar usuario por nombre:', error);
        throw error;
    }
};

const findUserById = async (data) => {
    const result = await modelUsers.findByPk(data, { where: {user_id: data.body.user_id} });
    return result;
};

const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (password.length < minLength) {
        return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (!hasUpperCase) {
        return 'La contraseña debe contener al menos una letra mayúscula.';
    }
    if (!hasLowerCase) {
        return 'La contraseña debe contener al menos una letra minúscula.';
    }
    if (!hasNumbers) {
        return 'La contraseña debe contener al menos un número.';
    }
    if (!hasSpecialChar) {
        return 'La contraseña debe contener al menos un carácter especial.';
    }
    return null; // La contraseña es válida
};

module.exports = {
    getList,
    postCreate,
    patchUpdate,
    validatePassword,
    findUserByUsername,
    findUserById
}; 