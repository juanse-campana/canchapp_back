// routes/admin_bank_accounts.js - Gestión de cuentas bancarias del admin
const express = require('express');
const router = express.Router();
const sequelize = require('../database/connect');
const { verifyToken } = require('../middlewares/auth');

// 🏦 POST /admin/bank-accounts - Admin agrega cuenta para cobros
router.post('/', verifyToken, async (req, res) => {
    try {
        console.log('🏦 Admin agregando nueva cuenta bancaria');
        
        const {
            b_account_bank,
            b_account_number,
            b_account_ci,
            b_account_type,
            b_account_owner,
            is_active = true
        } = req.body;

        // Validar que el usuario sea admin
        if (req.user.user_role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Solo los administradores pueden agregar cuentas de cobro'
            });
        }

        // Validar datos requeridos
        if (!b_account_bank || !b_account_number || !b_account_ci || !b_account_type || !b_account_owner) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Verificar si ya existe una cuenta con el mismo número
        const existingQuery = `
            SELECT b_account_id FROM Bank_accounts 
            WHERE b_account_number = :account_number 
            AND account_type = 'admin_collection'
            AND b_account_delete = FALSE
        `;

        const existing = await sequelize.query(existingQuery, {
            replacements: { account_number: b_account_number },
            type: sequelize.QueryTypes.SELECT
        });

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una cuenta con este número'
            });
        }

        // Insertar nueva cuenta
        const insertQuery = `
            INSERT INTO Bank_accounts (
                company_id, b_account_bank, b_account_number, b_account_ci, 
                b_account_type, b_account_owner, account_type, is_active, 
                created_date, created_by
            ) VALUES (
                NULL, :bank, :number, :ci, :type, :owner, 'admin_collection', 
                :is_active, NOW(), :created_by
            )
        `;

        const [results, metadata] = await sequelize.query(insertQuery, {
            replacements: {
                bank: b_account_bank,
                number: b_account_number,
                ci: b_account_ci,
                type: b_account_type,
                owner: b_account_owner,
                is_active,
                created_by: req.user.user_id
            }
        });

        console.log('✅ Cuenta bancaria creada con ID:', metadata.insertId);

        res.status(201).json({
            success: true,
            data: {
                b_account_id: metadata.insertId,
                message: 'Cuenta bancaria agregada exitosamente'
            },
            message: 'Cuenta bancaria para cobros creada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error creando cuenta bancaria:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// 🏦 GET /admin/bank-accounts - Listar cuentas del admin
router.get('/', verifyToken, async (req, res) => {
    try {
        console.log('🔍 Obteniendo cuentas bancarias del admin');

        // Validar que el usuario sea admin
        if (req.user.user_role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Solo los administradores pueden ver las cuentas de cobro'
            });
        }

        const query = `
            SELECT ba.*, u.user_name as created_by_name
            FROM Bank_accounts ba
            LEFT JOIN Users u ON ba.created_by = u.user_id
            WHERE ba.account_type = 'admin_collection'
            AND ba.b_account_delete = FALSE
            ORDER BY ba.created_date DESC, ba.is_active DESC
        `;

        const results = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });

        console.log(`✅ Cuentas bancarias encontradas: ${results.length}`);

        res.json({
            success: true,
            data: results,
            meta: {
                total: results.length,
                active: results.filter(acc => acc.is_active).length,
                inactive: results.filter(acc => !acc.is_active).length
            },
            message: 'Cuentas bancarias obtenidas correctamente'
        });

    } catch (error) {
        console.error('❌ Error obteniendo cuentas bancarias:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// 🏦 PUT /admin/bank-accounts/:id - Actualizar cuenta del admin
router.put('/:accountId', verifyToken, async (req, res) => {
    try {
        const { accountId } = req.params;
        const {
            b_account_bank,
            b_account_number,
            b_account_ci,
            b_account_type,
            b_account_owner,
            is_active
        } = req.body;

        console.log(`🔄 Actualizando cuenta bancaria ${accountId}`);

        // Validar que el usuario sea admin
        if (req.user.user_role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Solo los administradores pueden actualizar cuentas de cobro'
            });
        }

        // Verificar que la cuenta existe y es del admin
        const checkQuery = `
            SELECT b_account_id FROM Bank_accounts 
            WHERE b_account_id = :accountId 
            AND account_type = 'admin_collection'
            AND b_account_delete = FALSE
        `;

        const existing = await sequelize.query(checkQuery, {
            replacements: { accountId },
            type: sequelize.QueryTypes.SELECT
        });

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        // Verificar duplicados (excluyendo la cuenta actual)
        if (b_account_number) {
            const duplicateQuery = `
                SELECT b_account_id FROM Bank_accounts 
                WHERE b_account_number = :number 
                AND b_account_id != :accountId
                AND account_type = 'admin_collection'
                AND b_account_delete = FALSE
            `;

            const duplicates = await sequelize.query(duplicateQuery, {
                replacements: { number: b_account_number, accountId },
                type: sequelize.QueryTypes.SELECT
            });

            if (duplicates.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otra cuenta con este número'
                });
            }
        }

        // Construir query de actualización dinámicamente
        let updateFields = [];
        let replacements = { accountId };

        if (b_account_bank) {
            updateFields.push('b_account_bank = :bank');
            replacements.bank = b_account_bank;
        }
        if (b_account_number) {
            updateFields.push('b_account_number = :number');
            replacements.number = b_account_number;
        }
        if (b_account_ci) {
            updateFields.push('b_account_ci = :ci');
            replacements.ci = b_account_ci;
        }
        if (b_account_type) {
            updateFields.push('b_account_type = :type');
            replacements.type = b_account_type;
        }
        if (b_account_owner) {
            updateFields.push('b_account_owner = :owner');
            replacements.owner = b_account_owner;
        }
        if (typeof is_active === 'boolean') {
            updateFields.push('is_active = :is_active');
            replacements.is_active = is_active;
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se especificaron campos para actualizar'
            });
        }

        const updateQuery = `
            UPDATE Bank_accounts 
            SET ${updateFields.join(', ')}
            WHERE b_account_id = :accountId
        `;

        const [results, metadata] = await sequelize.query(updateQuery, {
            replacements
        });

        if (metadata.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        console.log(`✅ Cuenta bancaria ${accountId} actualizada`);

        res.json({
            success: true,
            message: 'Cuenta bancaria actualizada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error actualizando cuenta bancaria:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// 🏦 DELETE /admin/bank-accounts/:id - Eliminar cuenta del admin (soft delete)
router.delete('/:accountId', verifyToken, async (req, res) => {
    try {
        const { accountId } = req.params;

        console.log(`🗑️ Eliminando cuenta bancaria ${accountId}`);

        // Validar que el usuario sea admin
        if (req.user.user_role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Solo los administradores pueden eliminar cuentas de cobro'
            });
        }

        // Verificar que la cuenta existe
        const checkQuery = `
            SELECT b_account_id FROM Bank_accounts 
            WHERE b_account_id = :accountId 
            AND account_type = 'admin_collection'
            AND b_account_delete = FALSE
        `;

        const existing = await sequelize.query(checkQuery, {
            replacements: { accountId },
            type: sequelize.QueryTypes.SELECT
        });

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta bancaria no encontrada'
            });
        }

        // Soft delete
        const deleteQuery = `
            UPDATE Bank_accounts 
            SET b_account_delete = TRUE, is_active = FALSE
            WHERE b_account_id = :accountId
        `;

        const [results, metadata] = await sequelize.query(deleteQuery, {
            replacements: { accountId }
        });

        console.log(`✅ Cuenta bancaria ${accountId} eliminada`);

        res.json({
            success: true,
            message: 'Cuenta bancaria eliminada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error eliminando cuenta bancaria:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

module.exports = router;