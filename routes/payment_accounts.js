// routes/payment_accounts.js - Cuentas para que paguen los jugadores
const express = require('express');
const router = express.Router();
const sequelize = require('../database/connect');

// 💳 GET /payment-accounts - Ver cuentas activas del admin (para jugadores)
router.get('/', async (req, res) => {
    try {
        console.log('💳 Jugador solicitando cuentas de pago');

        const query = `
            SELECT 
                b_account_id,
                b_account_bank,
                b_account_number,
                b_account_type,
                b_account_owner
            FROM Bank_accounts 
            WHERE account_type = 'admin_collection'
            AND is_active = TRUE
            AND b_account_delete = FALSE
            ORDER BY b_account_bank ASC, b_account_type ASC
        `;

        const results = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });

        console.log(`✅ Cuentas activas encontradas: ${results.length}`);

        // Formatear los datos para mostrar mejor en Flutter
        const formattedResults = results.map(account => ({
            id: account.b_account_id,
            bank: account.b_account_bank,
            account_number: account.b_account_number,
            account_type: account.b_account_type,
            account_owner: account.b_account_owner,
            display_name: `${account.b_account_bank} - ${account.b_account_type}`,
            formatted_number: account.b_account_number.toString().replace(/(\d{4})(?=\d)/g, '$1-') // Formatear número
        }));

        res.json({
            success: true,
            data: formattedResults,
            meta: {
                total: formattedResults.length,
                message: 'Realiza tu pago a cualquiera de estas cuentas y sube el comprobante'
            },
            message: 'Cuentas de pago obtenidas correctamente'
        });

    } catch (error) {
        console.error('❌ Error obteniendo cuentas de pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// 💳 GET /payment-accounts/:id - Obtener detalles de una cuenta específica
router.get('/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;

        console.log(`💳 Obteniendo detalles de cuenta ${accountId}`);

        const query = `
            SELECT 
                b_account_id,
                b_account_bank,
                b_account_number,
                b_account_type,
                b_account_owner,
                b_account_ci
            FROM Bank_accounts 
            WHERE b_account_id = :accountId
            AND account_type = 'admin_collection'
            AND is_active = TRUE
            AND b_account_delete = FALSE
        `;

        const results = await sequelize.query(query, {
            replacements: { accountId },
            type: sequelize.QueryTypes.SELECT
        });

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cuenta de pago no encontrada o no está disponible'
            });
        }

        const account = results[0];

        // Formatear para mejor visualización
        const formattedAccount = {
            id: account.b_account_id,
            bank: account.b_account_bank,
            account_number: account.b_account_number,
            account_type: account.b_account_type,
            account_owner: account.b_account_owner,
            account_ci: account.b_account_ci,
            display_name: `${account.b_account_bank} - ${account.b_account_type}`,
            formatted_number: account.b_account_number.toString().replace(/(\d{4})(?=\d)/g, '$1-'),
            payment_instructions: [
                `Banco: ${account.b_account_bank}`,
                `Tipo: ${account.b_account_type}`,
                `Número: ${account.b_account_number}`,
                `Titular: ${account.b_account_owner}`,
                `CI: ${account.b_account_ci}`
            ]
        };

        console.log(`✅ Detalles de cuenta ${accountId} obtenidos`);

        res.json({
            success: true,
            data: formattedAccount,
            message: 'Detalles de cuenta obtenidos correctamente'
        });

    } catch (error) {
        console.error('❌ Error obteniendo detalles de cuenta:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

module.exports = router;