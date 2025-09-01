// routes/statistics.js - VERSIÓN CORREGIDA Y COMPLETA
const express = require('express');
const router = express.Router();
const sequelize = require('../database/connect');

// GET /statistics/company/:companyId/dashboard - Dashboard principal CORREGIDO
router.get('/company/:companyId/dashboard', async (req, res) => {
    try {
        const { companyId } = req.params;
        console.log(`📊 Obteniendo estadísticas para empresa ${companyId}`);

        // 1. Canchas reservadas HOY
        const todayQuery = `
            SELECT COUNT(DISTINCT c.field_id) as fields_reserved_today
            FROM Calendars c
            JOIN Fields f ON c.field_id = f.field_id
            WHERE f.company_id = ?
            AND c.calendar_date = CURDATE()
            AND c.calendar_state IN ('Reservada', 'Confirmada', 'Por Confirmar')
        `;

        // 2. Ingresos del DÍA actual (SOLO reservas confirmadas/completadas)
        const incomeQuery = `
            SELECT COALESCE(SUM(f.field_hour_price), 0) as daily_income
            FROM Calendars c
            JOIN Fields f ON c.field_id = f.field_id
            WHERE f.company_id = ?
            AND c.calendar_date = CURDATE()
            AND c.calendar_state IN ('Completada', 'Confirmada')
        `;

        // 3. Canchas activas
        const fieldsQuery = `
            SELECT COUNT(*) as active_fields
            FROM Fields f
            WHERE f.company_id = ?
            AND (f.field_delete = FALSE OR f.field_delete IS NULL)
        `;

        // 4. CAMBIADO: Total de clientes únicos (en lugar de nuevos)
        const totalClientsQuery = `
            SELECT COUNT(DISTINCT c.user_id) as total_clients
            FROM Calendars c
            JOIN Fields f ON c.field_id = f.field_id
            WHERE f.company_id = ?
            AND c.calendar_state IN ('Reservada', 'Confirmada', 'Completada', 'Por Confirmar')
            AND c.user_id IS NOT NULL
        `;

        // 5. Reservas totales del mes
        const monthlyReservationsQuery = `
            SELECT 
                COUNT(*) as total_reservations,
                COUNT(CASE WHEN calendar_state = 'Completada' THEN 1 END) as completed_reservations,
                COUNT(CASE WHEN calendar_state = 'Cancelada' THEN 1 END) as cancelled_reservations
            FROM Calendars c
            JOIN Fields f ON c.field_id = f.field_id
            WHERE f.company_id = ?
            AND MONTH(c.calendar_date) = MONTH(CURDATE())
            AND YEAR(c.calendar_date) = YEAR(CURDATE())
        `;

        // Ejecutar todas las consultas
        const [todayResults] = await sequelize.query(todayQuery, {
            replacements: [companyId],
            type: sequelize.QueryTypes.SELECT
        });

        const [incomeResults] = await sequelize.query(incomeQuery, {
            replacements: [companyId],
            type: sequelize.QueryTypes.SELECT
        });

        const [fieldsResults] = await sequelize.query(fieldsQuery, {
            replacements: [companyId],
            type: sequelize.QueryTypes.SELECT
        });

        const [clientsResults] = await sequelize.query(totalClientsQuery, {
            replacements: [companyId],
            type: sequelize.QueryTypes.SELECT
        });

        const [reservationsResults] = await sequelize.query(monthlyReservationsQuery, {
            replacements: [companyId],
            type: sequelize.QueryTypes.SELECT
        });

        // Estructura de respuesta que coincida con el frontend
        const dashboardData = {
            todayBookings: parseInt(todayResults.today_bookings) || 0,
            monthlyIncome: parseFloat(incomeResults.monthly_income) || 0.0,
            activeFields: parseInt(fieldsResults.active_fields) || 0,
            totalClients: parseInt(clientsResults.total_clients) || 0, // CAMBIADO de newClients a totalClients
            totalReservations: parseInt(reservationsResults.total_reservations) || 0,
            completedReservations: parseInt(reservationsResults.completed_reservations) || 0,
            cancelledReservations: parseInt(reservationsResults.cancelled_reservations) || 0
        };

        console.log('📊 Estadísticas calculadas:', dashboardData);

        res.json({
            success: true,
            ...dashboardData, // Enviar los datos directamente en el root para compatibilidad
            message: 'Estadísticas del dashboard obtenidas correctamente'
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas del dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /statistics/company/:companyId/weekly-stats - Estadísticas semanales para gráfico
router.get('/company/:companyId/weekly-stats', async (req, res) => {
    try {
        const { companyId } = req.params;
        console.log(`📈 Obteniendo estadísticas semanales para empresa ${companyId}`);

        const weeklyQuery = `
            SELECT 
                DAYNAME(c.calendar_date) as day_name,
                DAYOFWEEK(c.calendar_date) as day_number,
                COUNT(*) as reservations_count,
                SUM(f.field_hour_price) as daily_income
            FROM Calendars c
            JOIN Fields f ON c.field_id = f.field_id
            WHERE f.company_id = ?
            AND c.calendar_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            AND c.calendar_state IN ('Completada', 'Confirmada', 'Reservada')
            GROUP BY DATE(c.calendar_date), DAYNAME(c.calendar_date), DAYOFWEEK(c.calendar_date)
            ORDER BY c.calendar_date DESC
        `;

        const results = await sequelize.query(weeklyQuery, {
            replacements: [companyId],
            type: sequelize.QueryTypes.SELECT
        });

        // Formatear datos para el gráfico
        const chartData = results.map(row => ({
            day: row.day_name,
            reservations: parseInt(row.reservations_count),
            income: parseFloat(row.daily_income) || 0
        }));

        res.json({
            success: true,
            chartData: chartData,
            total: chartData.length,
            message: 'Estadísticas semanales obtenidas correctamente'
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas semanales:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /statistics/company/:companyId/fields-performance - Rendimiento por cancha
router.get('/company/:companyId/fields-performance', async (req, res) => {
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
        }

        const query = `
            SELECT 
                f.field_id,
                f.field_name,
                f.field_type,
                f.field_hour_price,
                COUNT(c.calendar_id) as total_bookings,
                COUNT(CASE WHEN c.calendar_state = 'Completada' THEN 1 END) as completed_bookings,
                COUNT(CASE WHEN c.calendar_state = 'Cancelada' THEN 1 END) as cancelled_bookings,
                SUM(CASE WHEN c.calendar_state IN ('Completada', 'Confirmada') THEN f.field_hour_price ELSE 0 END) as total_income
            FROM Fields f
            LEFT JOIN Calendars c ON f.field_id = c.field_id ${dateCondition}
            WHERE f.company_id = ?
            AND (f.field_delete = FALSE OR f.field_delete IS NULL)
            GROUP BY f.field_id, f.field_name, f.field_type, f.field_hour_price
            ORDER BY total_bookings DESC
        `;

        const results = await sequelize.query(query, {
            replacements: [companyId],
            type: sequelize.QueryTypes.SELECT
        });

        res.json({
            success: true,
            data: results.map(row => ({
                fieldId: row.field_id,
                fieldName: row.field_name,
                fieldType: row.field_type,
                hourPrice: parseFloat(row.field_hour_price),
                totalBookings: parseInt(row.total_bookings),
                completedBookings: parseInt(row.completed_bookings),
                cancelledBookings: parseInt(row.cancelled_bookings),
                totalIncome: parseFloat(row.total_income) || 0,
                utilizationRate: row.total_bookings > 0 ? 
                    Math.round((row.completed_bookings / row.total_bookings) * 100) : 0
            })),
            period: period,
            message: 'Rendimiento por cancha obtenido correctamente'
        });

    } catch (error) {
        console.error('❌ Error obteniendo rendimiento por cancha:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /statistics/company/:companyId/income - Ingresos por período específico
router.get('/company/:companyId/income', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { period = 'month' } = req.query; // day, week, month, year

        let dateCondition = '';
        let periodLabel = '';

        switch (period) {
            case 'day':
                dateCondition = 'AND c.calendar_date = CURDATE()';
                periodLabel = 'Ingresos de Hoy';
                break;
            case 'week':
                dateCondition = 'AND c.calendar_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                periodLabel = 'Ingresos de la Semana';
                break;
            case 'month':
                dateCondition = 'AND MONTH(c.calendar_date) = MONTH(CURDATE()) AND YEAR(c.calendar_date) = YEAR(CURDATE())';
                periodLabel = 'Ingresos del Mes';
                break;
            case 'year':
                dateCondition = 'AND YEAR(c.calendar_date) = YEAR(CURDATE())';
                periodLabel = 'Ingresos del Año';
                break;
            default:
                dateCondition = 'AND MONTH(c.calendar_date) = MONTH(CURDATE()) AND YEAR(c.calendar_date) = YEAR(CURDATE())';
                periodLabel = 'Ingresos del Mes';
        }

        const incomeQuery = `
            SELECT 
                COALESCE(SUM(f.field_hour_price), 0) as total_income,
                COUNT(*) as confirmed_reservations,
                COUNT(DISTINCT c.user_id) as unique_clients,
                AVG(f.field_hour_price) as avg_price_per_reservation
            FROM Calendars c
            JOIN Fields f ON c.field_id = f.field_id
            WHERE f.company_id = ?
            ${dateCondition}
            AND c.calendar_state IN ('Completada', 'Confirmada')
        `;

        const [results] = await sequelize.query(incomeQuery, {
            replacements: [companyId],
            type: sequelize.QueryTypes.SELECT
        });

        res.json({
            success: true,
            data: {
                totalIncome: parseFloat(results.total_income) || 0,
                confirmedReservations: parseInt(results.confirmed_reservations) || 0,
                uniqueClients: parseInt(results.unique_clients) || 0,
                avgPricePerReservation: parseFloat(results.avg_price_per_reservation) || 0,
                period: period,
                periodLabel: periodLabel
            },
            message: `${periodLabel} obtenidos correctamente`
        });

    } catch (error) {
        console.error('Error obteniendo ingresos por período:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

module.exports = router;