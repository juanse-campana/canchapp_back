// controllers/users.controller.js - VERSIÓN COMPLETA
const { where, Op } = require("sequelize");
const modelUsers = require("../models/users.models");
const bcrypt = require('bcryptjs');

// 📋 Obtener lista de usuarios con filtros
const getList = async (req, res) => {
    try {
        const { 
            limit = 100, 
            offset = 0, 
            role, 
            search, 
            status 
        } = req.query;

        // Construir condiciones de búsqueda
        let whereConditions = {};

        // Filtro por rol
        if (role && role !== 'all') {
            whereConditions.user_role = role;
        }

        // Filtro por estado (activo/inactivo)
        if (status !== undefined) {
            whereConditions.user_delete = status === 'inactive';
        }

        // Búsqueda por texto
        if (search) {
            whereConditions[Op.or] = [
                { user_name: { [Op.like]: `%${search}%` } },
                { user_email: { [Op.like]: `%${search}%` } },
                { user_phone: { [Op.like]: `%${search}%` } }
            ];
        }

        // Ejecutar consulta
        const users = await modelUsers.findAll({
            where: whereConditions,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['user_register_date', 'DESC']],
            attributes: { exclude: ['user_hashed_password'] } // No enviar contraseñas
        });

        // Contar total para paginación
        const total = await modelUsers.count({ where: whereConditions });

        console.log(`✅ Usuarios obtenidos: ${users.length} de ${total}`);

        res.status(200).json({
            success: true,
            data: users,
            meta: {
                total: total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                has_more: (parseInt(offset) + parseInt(limit)) < total
            },
            message: 'Usuarios obtenidos correctamente'
        });

    } catch (error) {
        console.error('❌ Error obteniendo usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// 👤 Obtener usuario por ID
const getById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await modelUsers.findOne({
            where: { user_id: userId },
            attributes: { exclude: ['user_hashed_password'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        console.log(`✅ Usuario obtenido: ${user.user_name}`);

        res.status(200).json({
            success: true,
            data: user,
            message: 'Usuario obtenido correctamente'
        });

    } catch (error) {
        console.error('❌ Error obteniendo usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// ➕ Crear nuevo usuario (mejorado)
const postCreate = async (req, res) => {
    try {
        console.log('📝 Creando usuario:', req.body);

        const {
            user_name,
            user_last_name,
            user_email,
            user_phone,
            user_hashed_password,
            user_role = 'jugador',
            user_profile_photo = null
        } = req.body;

        // Validaciones
        if (!user_name || !user_email || !user_hashed_password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y contraseña son requeridos'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user_email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email inválido'
            });
        }

        // Validar contraseña
        const passwordError = validatePassword(user_hashed_password);
        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError
            });
        }

        // Verificar si el email ya existe
        const existingUser = await modelUsers.findOne({
            where: { user_email: user_email }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Hash de la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(user_hashed_password, saltRounds);

        // Crear usuario
        const userData = {
            user_name,
            user_last_name: user_last_name || '',
            user_email,
            user_phone: user_phone || '',
            user_hashed_password: hashedPassword,
            user_role,
            user_profile_photo,
            user_delete: false
        };

        const newUser = await modelUsers.create(userData);

        console.log(`✅ Usuario creado: ${newUser.user_name} (ID: ${newUser.user_id})`);

        // Respuesta sin contraseña
        const { user_hashed_password: _, ...userResponse } = newUser.toJSON();

        res.status(201).json({
            success: true,
            data: userResponse,
            message: 'Usuario creado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error creando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// ✏️ Actualizar usuario
const putUpdate = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        console.log(`📝 Actualizando usuario ${userId}:`, updateData);

        // Verificar que el usuario existe
        const existingUser = await modelUsers.findOne({
            where: { user_id: userId }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Si se quiere actualizar email, verificar que no exista otro usuario con ese email
        if (updateData.user_email && updateData.user_email !== existingUser.user_email) {
            const emailExists = await modelUsers.findOne({
                where: { 
                    user_email: updateData.user_email,
                    user_id: { [Op.ne]: userId }
                }
            });

            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está en uso por otro usuario'
                });
            }
        }

        // Si se proporciona nueva contraseña, hashearla
        if (updateData.user_hashed_password && updateData.user_hashed_password.trim()) {
            const passwordError = validatePassword(updateData.user_hashed_password);
            if (passwordError) {
                return res.status(400).json({
                    success: false,
                    message: passwordError
                });
            }

            const saltRounds = 10;
            updateData.user_hashed_password = await bcrypt.hash(updateData.user_hashed_password, saltRounds);
        } else {
            // Si no se proporciona contraseña, no actualizarla
            delete updateData.user_hashed_password;
        }

        // Mapear user_state a user_delete si viene
        if (updateData.user_state !== undefined) {
            updateData.user_delete = !updateData.user_state;
            delete updateData.user_state;
        }

        // Actualizar usuario
        await modelUsers.update(updateData, {
            where: { user_id: userId }
        });

        // Obtener usuario actualizado (sin contraseña)
        const updatedUser = await modelUsers.findOne({
            where: { user_id: userId },
            attributes: { exclude: ['user_hashed_password'] }
        });

        console.log(`✅ Usuario actualizado: ${updatedUser.user_name}`);

        res.status(200).json({
            success: true,
            data: updatedUser,
            message: 'Usuario actualizado correctamente'
        });

    } catch (error) {
        console.error('❌ Error actualizando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// 🗑️ Eliminar usuario (soft delete)
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        console.log(`🗑️ Eliminando usuario ${userId}`);

        // Verificar que el usuario existe
        const existingUser = await modelUsers.findOne({
            where: { user_id: userId }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Soft delete
        await modelUsers.update(
            { user_delete: true },
            { where: { user_id: userId } }
        );

        console.log(`✅ Usuario eliminado: ${existingUser.user_name}`);

        res.status(200).json({
            success: true,
            message: 'Usuario eliminado correctamente'
        });

    } catch (error) {
        console.error('❌ Error eliminando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// 📊 Obtener estadísticas de usuarios
const getStats = async (req, res) => {
    try {
        const stats = await Promise.all([
            modelUsers.count({ where: { user_role: 'jugador', user_delete: false } }),
            modelUsers.count({ where: { user_role: 'dueno', user_delete: false } }),
            modelUsers.count({ where: { user_role: 'admin', user_delete: false } }),
            modelUsers.count({ where: { user_delete: false } }),
            modelUsers.count({ where: { user_delete: true } })
        ]);

        const [players, owners, admins, active, deleted] = stats;

        res.status(200).json({
            success: true,
            data: {
                players,
                owners,
                admins,
                active,
                deleted,
                total: active + deleted
            },
            message: 'Estadísticas obtenidas correctamente'
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

// 🔍 Funciones auxiliares existentes (mantenidas)
const findUserByUsername = async (username) => {
    try {
        const result = await modelUsers.findOne({
            where: { user_name: username }
        });
        return result;
    } catch (error) {
        console.error('Error al buscar usuario por nombre:', error);
        throw error;
    }
};

const findUserById = async (userId) => {
    try {
        const result = await modelUsers.findByPk(userId);
        return result;
    } catch (error) {
        console.error('Error al buscar usuario por ID:', error);
        throw error;
    }
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

// 🔧 Método legacy (mantenido para compatibilidad)
const patchUpdate = async (data) => {
    const result = await modelUsers.update(data, { where: { user_id: data.user_id } });
    return result;
};

module.exports = {
    getList,
    getById,
    postCreate,
    putUpdate,
    deleteUser,
    getStats,
    patchUpdate, // Legacy
    validatePassword,
    findUserByUsername,
    findUserById
};