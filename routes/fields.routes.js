// routes/fields.routes.js - VERSIÓN COMPLETA CON TODAS LAS RUTAS
const express = require('express');
const router = express.Router();
const sequelize = require('../database/connect'); // Tu conexión Sequelize

// CREATE - Crear nueva cancha
router.post('/create', async (req, res) => {
    try {
        const {
            company_id,
            field_name,
            field_type,
            field_size,
            field_max_capacity,
            field_hour_price,
            field_description,
            field_img,
            field_calification
        } = req.body;

        const query = `
            INSERT INTO Fields (
                company_id, field_name, field_type, field_size,
                field_max_capacity, field_hour_price, field_description,
                field_img, field_calification, field_delete
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, false)
        `;

        const [results, metadata] = await sequelize.query(query, {
            replacements: [
                company_id, field_name, field_type, field_size,
                field_max_capacity, field_hour_price, field_description,
                field_img, field_calification
            ]
        });

        res.status(201).json({
            success: true,
            data: { field_id: metadata.insertId },
            message: 'Cancha creada exitosamente'
        });
    } catch (error) {
        console.error('Error creando cancha:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// READ - Obtener todas las canchas
router.get('/list', async (req, res) => {
    try {
        console.log('🔍 Obteniendo todas las canchas...');
        
        const query = `
            SELECT f.*, c.company_name, ct.city_name
            FROM Fields f
            JOIN Companies c ON f.company_id = c.company_id
            JOIN Cities ct ON c.company_city_id = ct.city_id
            WHERE f.field_delete = false
            ORDER BY f.field_name
        `;

        const results = await sequelize.query(query, {
            type: sequelize.QueryTypes.SELECT
        });
        
        console.log(`✅ Canchas encontradas: ${results.length}`);
        
        res.json({
            success: true,
            data: results,
            message: 'Canchas obtenidas correctamente'
        });
    } catch (error) {
        console.error('❌ Error obteniendo canchas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Obtener canchas por empresa
router.get('/company/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        console.log(`🔍 Obteniendo canchas de empresa ${companyId}...`);

        const query = `
            SELECT f.*, 
                   COUNT(c.calendar_id) as total_bookings,
                   COUNT(CASE WHEN c.calendar_state IN ('Reservada', 'Confirmada', 'Completada') THEN 1 END) as active_bookings
            FROM Fields f
            LEFT JOIN Calendars c ON f.field_id = c.field_id AND c.calendar_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            WHERE f.company_id = :companyId
            AND f.field_delete = false
            GROUP BY f.field_id
            ORDER BY f.field_name
        `;

        const results = await sequelize.query(query, {
            replacements: { companyId },
            type: sequelize.QueryTypes.SELECT
        });
        
        console.log(`✅ Canchas de empresa encontradas: ${results.length}`);
        
        res.json({
            success: true,
            data: results,
            message: 'Canchas de la empresa obtenidas correctamente'
        });
    } catch (error) {
        console.error('❌ Error obteniendo canchas por empresa:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Actualizar estado de cancha (activa/mantenimiento)
router.put('/update-status', async (req, res) => {
    try {
        const { field_id, field_state } = req.body;
        console.log(`🔄 Actualizando estado de cancha ${field_id} a ${field_state}`);

        // Como no tienes campo field_state en tu tabla, usaremos field_delete
        // donde field_delete = false significa activa, field_delete = true significa en mantenimiento
        const isInMaintenance = !field_state; // Si field_state es false (mantenimiento), field_delete = true

        const query = `
            UPDATE Fields 
            SET field_delete = :isInMaintenance
            WHERE field_id = :field_id
        `;

        const [results, metadata] = await sequelize.query(query, {
            replacements: { isInMaintenance, field_id }
        });

        if (metadata.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cancha no encontrada'
            });
        }

        const statusText = field_state ? 'activa' : 'en mantenimiento';
        
        console.log(`✅ Cancha ${field_id} puesta como ${statusText}`);
        
        res.json({
            success: true,
            message: `Cancha puesta como ${statusText}`
        });
    } catch (error) {
        console.error('❌ Error actualizando estado de cancha:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// UPDATE - Actualizar cancha existente
router.put('/update', async (req, res) => {
    try {
        const {
            field_id,
            field_name,
            field_type,
            field_size,
            field_max_capacity,
            field_hour_price,
            field_description,
            field_img
        } = req.body;

        console.log(`🔄 Actualizando cancha ${field_id}...`);

        const query = `
            UPDATE Fields SET 
                field_name = :field_name,
                field_type = :field_type,
                field_size = :field_size,
                field_max_capacity = :field_max_capacity,
                field_hour_price = :field_hour_price,
                field_description = :field_description,
                field_img = :field_img
            WHERE field_id = :field_id
        `;

        const [results, metadata] = await sequelize.query(query, {
            replacements: {
                field_name, field_type, field_size, field_max_capacity,
                field_hour_price, field_description, field_img, field_id
            }
        });

        if (metadata.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cancha no encontrada'
            });
        }

        console.log(`✅ Cancha ${field_id} actualizada`);

        res.json({
            success: true,
            message: 'Cancha actualizada correctamente'
        });
    } catch (error) {
        console.error('❌ Error actualizando cancha:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// DELETE - Eliminar cancha (soft delete)
router.delete('/delete', async (req, res) => {
    try {
        const { field_id } = req.body;
        console.log(`🗑️ Eliminando cancha ${field_id}...`);

        const query = `
            UPDATE Fields 
            SET field_delete = true
            WHERE field_id = :field_id
        `;

        const [results, metadata] = await sequelize.query(query, {
            replacements: { field_id }
        });

        if (metadata.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cancha no encontrada'
            });
        }

        console.log(`✅ Cancha ${field_id} eliminada`);

        res.json({
            success: true,
            message: 'Cancha eliminada correctamente'
        });
    } catch (error) {
        console.error('❌ Error eliminando cancha:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Obtener una cancha específica con estadísticas
router.get('/:fieldId', async (req, res) => {
    try {
        const { fieldId } = req.params;
        console.log(`🔍 Obteniendo cancha ${fieldId}...`);

        const query = `
            SELECT f.*, 
                   c.company_name, 
                   ct.city_name,
                   COUNT(cal.calendar_id) as total_bookings,
                   COUNT(CASE WHEN cal.calendar_state = 'Completada' THEN 1 END) as completed_bookings,
                   COUNT(CASE WHEN cal.calendar_date >= CURDATE() AND cal.calendar_state IN ('Reservada', 'Confirmada') THEN 1 END) as upcoming_bookings
            FROM Fields f
            JOIN Companies c ON f.company_id = c.company_id
            JOIN Cities ct ON c.company_city_id = ct.city_id
            LEFT JOIN Calendars cal ON f.field_id = cal.field_id
            WHERE f.field_id = :fieldId
            AND f.field_delete = false
            GROUP BY f.field_id
        `;

        const results = await sequelize.query(query, {
            replacements: { fieldId },
            type: sequelize.QueryTypes.SELECT
        });

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cancha no encontrada'
            });
        }

        console.log(`✅ Cancha ${fieldId} encontrada`);
        
        res.json({
            success: true,
            data: results[0],
            message: 'Cancha obtenida correctamente'
        });
    } catch (error) {
        console.error('❌ Error obteniendo cancha:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// 🆕 NUEVO - Obtener horarios de una cancha específica
router.get('/:fieldId/schedules', async (req, res) => {
    try {
        const { fieldId } = req.params;
        console.log(`🔍 Obteniendo horarios de cancha ${fieldId}...`);

        // Verificar que la cancha existe
        const fieldQuery = `
            SELECT * FROM Fields 
            WHERE field_id = :fieldId 
            AND field_delete = false
        `;

        const fieldResults = await sequelize.query(fieldQuery, {
            replacements: { fieldId },
            type: sequelize.QueryTypes.SELECT
        });

        if (fieldResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cancha no encontrada'
            });
        }

        // Como no tienes tabla de horarios, generamos horarios por defecto
        const schedules = [
            { day_of_week: 0, start_time: '08:00:00', end_time: '20:00:00', is_available: true, day_name: 'Domingo' },
            { day_of_week: 1, start_time: '06:00:00', end_time: '22:00:00', is_available: true, day_name: 'Lunes' },
            { day_of_week: 2, start_time: '06:00:00', end_time: '22:00:00', is_available: true, day_name: 'Martes' },
            { day_of_week: 3, start_time: '06:00:00', end_time: '22:00:00', is_available: true, day_name: 'Miércoles' },
            { day_of_week: 4, start_time: '06:00:00', end_time: '22:00:00', is_available: true, day_name: 'Jueves' },
            { day_of_week: 5, start_time: '06:00:00', end_time: '22:00:00', is_available: true, day_name: 'Viernes' },
            { day_of_week: 6, start_time: '08:00:00', end_time: '20:00:00', is_available: true, day_name: 'Sábado' },
        ];

        res.json({
            success: true,
            data: schedules,
            message: 'Horarios obtenidos correctamente'
        });

    } catch (error) {
        console.error('❌ Error obteniendo horarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// 🆕 NUEVO - Obtener slots disponibles para una fecha específica
router.get('/:fieldId/available-slots', async (req, res) => {
    try {
        const { fieldId } = req.params;
        const { date } = req.query;
        
        console.log(`🔍 Obteniendo slots disponibles para cancha ${fieldId} en fecha ${date}...`);

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Fecha es requerida (formato: YYYY-MM-DD)'
            });
        }

        // Verificar que la cancha existe
        const fieldQuery = `
            SELECT * FROM Fields 
            WHERE field_id = :fieldId 
            AND field_delete = false
        `;

        const fieldResults = await sequelize.query(fieldQuery, {
            replacements: { fieldId },
            type: sequelize.QueryTypes.SELECT
        });

        if (fieldResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cancha no encontrada'
            });
        }

        // 🔧 CORREGIDO: Usar los nombres correctos de columnas
        const reservationsQuery = `
            SELECT calendar_init_time, calendar_end_time, calendar_state
            FROM Calendars 
            WHERE field_id = :fieldId 
            AND calendar_date = :date
            AND calendar_state IN ('Reservada', 'Confirmada', 'Por Confirmar')
        `;

        const reservations = await sequelize.query(reservationsQuery, {
            replacements: { fieldId, date },
            type: sequelize.QueryTypes.SELECT
        });

        console.log(`📅 Reservas encontradas para ${date}: ${reservations.length}`);

        // Generar slots disponibles (cada hora desde 6 AM hasta 10 PM)
        const availableSlots = [];
        const startHour = 6; // 6 AM
        const endHour = 22;   // 10 PM

        for (let hour = startHour; hour < endHour; hour++) {
            const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
            
            // Verificar si este slot está reservado
            const isReserved = reservations.some(reservation => {
                const reservedStart = reservation.calendar_init_time;
                const reservedEnd = reservation.calendar_end_time;
                
                // Verificar solapamiento de horarios
                return (startTime < reservedEnd && endTime > reservedStart);
            });

            // Formatear hora para mostrar
            const displayHour = hour === 12 ? 12 : hour > 12 ? hour - 12 : hour;
            const period = hour >= 12 ? 'PM' : 'AM';
            const nextDisplayHour = hour + 1 === 12 ? 12 : hour + 1 > 12 ? hour + 1 - 12 : hour + 1;
            const nextPeriod = hour + 1 >= 12 ? 'PM' : 'AM';

            availableSlots.push({
                start_time: startTime,
                end_time: endTime,
                is_available: !isReserved,
                formatted_time: `${displayHour}:00 ${period}`,
                display_text: `${displayHour}:00 ${period} - ${nextDisplayHour}:00 ${nextPeriod}`,
                slot_id: `${fieldId}-${date}-${hour}`,
                price: fieldResults[0].field_hour_price
            });
        }

        const totalSlots = availableSlots.length;
        const availableCount = availableSlots.filter(slot => slot.is_available).length;
        const reservedCount = totalSlots - availableCount;

        res.json({
            success: true,
            data: availableSlots,
            meta: {
                date: date,
                field_id: fieldId,
                field_name: fieldResults[0].field_name,
                total_slots: totalSlots,
                available_slots: availableCount,
                reserved_slots: reservedCount,
                price_per_hour: fieldResults[0].field_hour_price,
                reservations_found: reservations.length
            },
            message: 'Slots disponibles obtenidos correctamente'
        });

    } catch (error) {
        console.error('❌ Error obteniendo slots disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// 🆕 ADICIONAL - Obtener reservas de una cancha para una fecha específica
router.get('/:fieldId/reservations', async (req, res) => {
    try {
        const { fieldId } = req.params;
        const { date } = req.query;
        
        console.log(`🔍 Obteniendo reservas para cancha ${fieldId} en fecha ${date}...`);

        let query = `
            SELECT c.*, u.user_name, u.user_email, u.user_phone
            FROM Calendars c
            LEFT JOIN Users u ON c.user_id = u.user_id
            WHERE c.field_id = :fieldId
        `;

        const replacements = { fieldId };

        if (date) {
            query += ` AND c.calendar_date = :date`;
            replacements.date = date;
        }

        query += ` ORDER BY c.calendar_date DESC, c.calendar_init_time ASC`;

        const results = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.SELECT
        });

        res.json({
            success: true,
            data: results,
            message: 'Reservas obtenidas correctamente'
        });

    } catch (error) {
        console.error('❌ Error obteniendo reservas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

module.exports = router;