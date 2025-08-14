// routes/statistics.js - VERSIÓN SEQUELIZE
const express = require('express');
const router = express.Router();
const sequelize = require('../database/connect'); // Tu conexión Sequelize

// GET /statistics/company/:companyId/dashboard - Dashboard principal
router.get('/company/:companyId/dashboard', async (req, res) => {
    try {
        const { companyId } = req.params;

        // Reservas de hoy
        const todayQuery = `
            SELECT COUNT(*) as today_bookings
            FROM Calendars c
            JOIN Fields f ON c.field_id = f.field_id
            WHERE f.company_id = :companyId
            AND c.calendar_date = CURDATE()
            AND c.calendar_state IN ('Reservada', 'Confirmada')
        `;

        // Ingresos del mes actual (usando Cash_closings)
        const incomeQuery = `
            SELECT COALESCE(SUM(cc.cash_closing_total), 0) as monthly_income
            FROM Cash_closings cc
            WHERE MONTH(cc.cash_closing_date) = MONTH(CURDATE())
            AND YEAR(cc.cash_closing_date) = YEAR(CURDATE())
            AND cc.cash_closing_state = 'Pagado'
        `;

        // Canchas activas
        const fieldsQuery = `
            SELECT COUNT(*) as active_fields
            FROM Fields f
            WHERE f.company_id = :companyId
            AND f.field_delete = FALSE
        `;

        // Clientes nuevos (último mes)
        const newClientsQuery = `
            SELECT COUNT(DISTINCT c.user_id) as new_clients
            FROM Calendars c
            JOIN Fields f ON c.field_id = f.field_id
            WHERE f.company_id = :companyId
            AND c.calendar_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            AND c.calendar_state IN ('Reservada', 'Confirmada', 'Completada')
        `;

        // Total de reservas
        const totalReservationsQuery = `
            SELECT 
                COUNT(*) as total_reservations,
                COUNT(CASE WHEN calendar_state = 'Completada' THEN 1 END) as completed_reservations,
                COUNT(CASE WHEN calendar_state = 'Cancelada' THEN 1 END) as cancelled_reservations
            FROM Calendars c
            JOIN Fields f ON c.field_id = f.field_id
            WHERE f.company_id = :companyId
            AND c.calendar_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        `;

        // 🔥 EJECUTAR CON SEQUELIZE
        const [todayResults] = await sequelize.query(todayQuery, {
            replacements: { companyId },
            type: sequelize.QueryTypes.SELECT
        });

        const [incomeResults] = await sequelize.query(incomeQuery, {
            type: sequelize.QueryTypes.SELECT
        });

        const [fieldsResults] = await sequelize.query(fieldsQuery, {
            replacements: { companyId },
            type: sequelize.QueryTypes.SELECT
        });

        const [newClientsResults] = await sequelize.query(newClientsQuery, {
            replacements: { companyId },
            type: sequelize.QueryTypes.SELECT
        });

        const [totalReservationsResults] = await sequelize.query(totalReservationsQuery, {
            replacements: { companyId },
            type: sequelize.QueryTypes.SELECT
        });

        const dashboardData = {
            today_bookings: todayResults.today_bookings || 0,
            monthly_income: parseFloat(incomeResults.monthly_income) || 0.0,
            active_fields: fieldsResults.active_fields || 0,
            new_clients: newClientsResults.new_clients || 0,
            total_reservations: totalReservationsResults.total_reservations || 0,
            completed_reservations: totalReservationsResults.completed_reservations || 0,
            cancelled_reservations: totalReservationsResults.cancelled_reservations || 0
        };

        res.json({
            success: true,
            data: dashboardData,
            message: 'Estadísticas del dashboard obtenidas correctamente'
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas del dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /cash-closings/company/:companyId/monthly-income - Ingresos mensuales
router.get('/cash-closings/company/:companyId/monthly-income', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { year, month } = req.query;
        
        const currentYear = year || new Date().getFullYear();
        const currentMonth = month || (new Date().getMonth() + 1);

        const query = `
            SELECT 
                SUM(cc.cash_closing_total) as total_income,
                COUNT(cc.cash_closing_id) as total_closings,
                AVG(cc.cash_closing_total) as avg_closing
            FROM Cash_closings cc
            WHERE YEAR(cc.cash_closing_date) = :currentYear
            AND MONTH(cc.cash_closing_date) = :currentMonth
            AND cc.cash_closing_state IN ('Cerrado', 'Pagado')
        `;

        const [results] = await sequelize.query(query, {
            replacements: { currentYear, currentMonth },
            type: sequelize.QueryTypes.SELECT
        });
        
        res.json({
            success: true,
            data: {
                total_income: parseFloat(results.total_income) || 0.0,
                total_closings: results.total_closings || 0,
                avg_closing: parseFloat(results.avg_closing) || 0.0,
                year: currentYear,
                month: currentMonth
            },
            message: 'Ingresos mensuales obtenidos correctamente'
        });

    } catch (error) {
        console.error('Error obteniendo ingresos mensuales:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /cash-closings/company/:companyId/monthly-comparison - Comparativa mensual
router.get('/cash-closings/company/:companyId/monthly-comparison', async (req, res) => {
    try {
        const { companyId } = req.params;

        // Mes actual
        const currentMonthQuery = `
            SELECT COALESCE(SUM(cc.cash_closing_total), 0) as current_month_income
            FROM Cash_closings cc
            WHERE YEAR(cc.cash_closing_date) = YEAR(CURDATE())
            AND MONTH(cc.cash_closing_date) = MONTH(CURDATE())
            AND cc.cash_closing_state IN ('Cerrado', 'Pagado')
        `;

        // Mes anterior
        const previousMonthQuery = `
            SELECT COALESCE(SUM(cc.cash_closing_total), 0) as previous_month_income
            FROM Cash_closings cc
            WHERE YEAR(cc.cash_closing_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
            AND MONTH(cc.cash_closing_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
            AND cc.cash_closing_state IN ('Cerrado', 'Pagado')
        `;

        const [currentIncome] = await sequelize.query(currentMonthQuery, {
            type: sequelize.QueryTypes.SELECT
        });
        
        const [previousIncome] = await sequelize.query(previousMonthQuery, {
            type: sequelize.QueryTypes.SELECT
        });

        const currentMonthValue = parseFloat(currentIncome.current_month_income);
        const previousMonthValue = parseFloat(previousIncome.previous_month_income);

        let growthPercentage = 0;
        if (previousMonthValue > 0) {
            growthPercentage = ((currentMonthValue - previousMonthValue) / previousMonthValue) * 100;
        }

        res.json({
            success: true,
            data: {
                current_month: currentMonthValue,
                previous_month: previousMonthValue,
                growth_percentage: Math.round(growthPercentage * 100) / 100
            },
            message: 'Comparativa mensual obtenida correctamente'
        });

    } catch (error) {
        console.error('Error obteniendo comparativa mensual:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /fieldss/company/:companyId/performance - Rendimiento por cancha
router.get('/fields/company/:companyId/performance', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { period = 'month' } = req.query;

        let dateCondition = '';
        switch (period) {
            case 'week':
                dateCondition = 'AND c.calendar_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                break;
            case 'month':
                dateCondition = 'AND c.calendar_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
                break;
            case 'year':
                dateCondition = 'AND c.calendar_date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)';
                break;
            default:
                dateCondition = 'AND c.calendar_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        }

        const query = `
            SELECT 
                f.field_id,
                f.field_name,
                f.field_type,
                f.field_hour_price,
                COUNT(c.calendar_id) as total_bookings,
                COUNT(CASE WHEN c.calendar_state = 'Completada' THEN 1 END) as completed_bookings,
                COUNT(CASE WHEN c.calendar_state = 'Cancelada' THEN 1 END) as cancelled_bookings
            FROM Fields f
            LEFT JOIN Calendars c ON f.field_id = c.field_id ${dateCondition}
            WHERE f.company_id = :companyId
            AND f.field_delete = FALSE
            GROUP BY f.field_id, f.field_name, f.field_type, f.field_hour_price
            ORDER BY total_bookings DESC
        `;

        const results = await sequelize.query(query, {
            replacements: { companyId },
            type: sequelize.QueryTypes.SELECT
        });
        
        res.json({
            success: true,
            data: results,
            period: period,
            message: 'Rendimiento por cancha obtenido correctamente'
        });

    } catch (error) {
        console.error('Error obteniendo rendimiento por cancha:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

module.exports = router;