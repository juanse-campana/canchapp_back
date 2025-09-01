// routes/fields.routes.js - VERSIÓN COMPLETA CON TODAS LAS IMPLEMENTACIONES
const express = require('express');
const router = express.Router();
const sequelize = require('../database/connect'); // Tu conexión Sequelize
const fieldsController = require('../controllers/fields.controller'); // Tu controller existente
const calendarsController = require('../controllers/calendars.controller'); // Controller de calendarios

// 🔄 RUTAS EXISTENTES SIN MODIFICAR
router.get("/list", async function (request, response) {
  try {
    const result = await fieldsController.getList();
    response.status(200).json({
      data: result,
      status: true,
      message: "Canchas listadas exitosamente",
    });
  } catch (error) {
    console.error("Error al listar las canchas: ", error)
    response.status(500).json({
      status: false,
      message: "Ocurrio un error al listar las canchas"
    })
  }
});

router.post("/create", async function (request, response) {
  try {
    console.log(request.body);
    const result = await fieldsController.postCreate(request.body);
    response.status(200).json({
      status: true,
      message: "Cancha creada exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error al crear cancha: ", error)
    response.status(500).json({
      status: false,
      message: "Ocurrio un error al crear la cancha"
    })
  }
});

router.patch("/update", function (request, response) {
  try {
    console.log(request.body)
    const result = fieldsController.patchUpdate(request.body);
    response.status(200).json({
      status: true,
      message: "Cancha actualizada exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error al actualizar cancha: ", error)
    response.status(500).json({
      status: false,
      message: "Ocurrio un error al actualizar"
    })
  }
});

// 🆕 NUEVAS IMPLEMENTACIONES AGREGADAS

// Obtener horarios disponibles (usando sistema de calendarios)
router.get('/:fieldId/available-slots', async (req, res) => {
  try {
    console.log('📍 GET /available-slots - Obteniendo horarios disponibles');
    
    const fieldId = parseInt(req.params.fieldId);
    const date = req.query.date;
    
    if (!fieldId || !date) {
      return res.status(400).json({
        success: false,
        status: false,
        message: 'Field ID y fecha son requeridos',
        data: []
      });
    }
    
    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        status: false,
        message: 'Formato de fecha inválido. Use YYYY-MM-DD',
        data: []
      });
    }
    
    console.log(`🔍 Buscando slots disponibles para cancha ${fieldId} en fecha ${date}`);
    
    // 🔄 USAR EL SISTEMA DE CALENDARIOS EXISTENTE
    const result = await calendarsController.getAvailableSlots({
      field_id: fieldId,
      calendar_date: date
    });
    
    res.status(200).json({
      success: result.success,
      status: result.success,
      message: result.message,
      data: result.data,
      total: result.total || 0
    });
    
  } catch (error) {
    console.error('❌ Error en /available-slots:', error);
    res.status(500).json({
      success: false,
      status: false,
      message: error.message || 'Error obteniendo horarios disponibles',
      data: []
    });
  }
});

// Reservar un horario específico
router.post('/:fieldId/reserve-slot', async (req, res) => {
  try {
    console.log('📍 POST /reserve-slot - Reservando horario');
    console.log('Body recibido:', req.body);
    
    const fieldId = parseInt(req.params.fieldId);
    const {
      calendar_date,
      start_time,
      end_time,
      user_id,
      calendar_transaction
    } = req.body;
    
    if (!fieldId || !calendar_date || !start_time || !end_time || !user_id) {
      return res.status(400).json({
        success: false,
        status: false,
        message: 'Faltan datos requeridos para la reserva',
        data: null
      });
    }
    
    const result = await calendarsController.reserveTimeSlot({
      field_id: fieldId,
      calendar_date,
      start_time,
      end_time,
      user_id,
      calendar_transaction
    });
    
    if (result.success) {
      res.status(201).json({
        success: true,
        status: true,
        message: result.message || 'Horario reservado exitosamente',
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        status: false,
        message: result.message,
        data: null
      });
    }
    
  } catch (error) {
    console.error('❌ Error en /reserve-slot:', error);
    res.status(500).json({
      success: false,
      status: false,
      message: error.message || 'Error reservando horario',
      data: null
    });
  }
});

// Confirmar una reserva (ADMIN)
router.patch('/confirm-reservation/:calendarId', async (req, res) => {
  try {
    console.log('📍 PATCH /confirm-reservation - Confirmando reserva');
    
    const calendarId = parseInt(req.params.calendarId);
    const { confirmed_by } = req.body;
    
    if (!calendarId) {
      return res.status(400).json({
        success: false,
        status: false,
        message: 'ID de calendario requerido',
        data: null
      });
    }
    
    const result = await calendarsController.confirmReservation(calendarId, confirmed_by);
    
    res.status(200).json({
      success: result.success,
      status: result.success,
      message: result.message,
      data: null
    });
    
  } catch (error) {
    console.error('❌ Error en /confirm-reservation:', error);
    res.status(500).json({
      success: false,
      status: false,
      message: error.message || 'Error confirmando reserva',
      data: null
    });
  }
});

// Cancelar una reserva
router.patch('/cancel-reservation/:calendarId', async (req, res) => {
  try {
    console.log('📍 PATCH /cancel-reservation - Cancelando reserva');
    
    const calendarId = parseInt(req.params.calendarId);
    const { reason } = req.body;
    
    if (!calendarId) {
      return res.status(400).json({
        success: false,
        status: false,
        message: 'ID de calendario requerido',
        data: null
      });
    }
    
    const result = await calendarsController.cancelReservation(calendarId, reason);
    
    res.status(200).json({
      success: result.success,
      status: result.success,
      message: result.message,
      data: null
    });
    
  } catch (error) {
    console.error('❌ Error en /cancel-reservation:', error);
    res.status(500).json({
      success: false,
      status: false,
      message: error.message || 'Error cancelando reserva',
      data: null
    });
  }
});

// Ver reservas de una cancha en una fecha
router.get('/:fieldId/reservations', async (req, res) => {
  try {
    console.log('📍 GET /reservations - Obteniendo reservas');
    
    const fieldId = parseInt(req.params.fieldId);
    const date = req.query.date;
    
    if (!fieldId || !date) {
      return res.status(400).json({
        success: false,
        status: false,
        message: 'Field ID y fecha son requeridos',
        data: []
      });
    }
    
    const result = await calendarsController.getDateList({
      field_id: fieldId,
      calendar_date: date
    });
    
    // Filtrar solo las reservadas
    const reservations = result.filter(slot => 
      slot.calendar_state === 'Reservada' || slot.calendar_state === 'Por Confirmar'
    );
    
    res.status(200).json({
      success: true,
      status: true,
      message: 'Reservas obtenidas exitosamente',
      data: reservations,
      total: reservations.length
    });
    
  } catch (error) {
    console.error('❌ Error en /reservations:', error);
    res.status(500).json({
      success: false,
      status: false,
      message: error.message || 'Error obteniendo reservas',
      data: []
    });
  }
});

// 🔄 RUTAS ADICIONALES MEJORADAS (manteniendo compatibilidad)

// Obtener canchas por empresa
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log(`🔍 Obteniendo canchas de empresa ${companyId}...`);

    const query = `
      SELECT f.*, 
             COUNT(c.calendar_id) as total_bookings,
             COUNT(CASE WHEN c.calendar_state IN ('Reservada', 'Por Confirmar') THEN 1 END) as active_bookings
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
      status: true,
      data: results,
      message: 'Canchas de la empresa obtenidas correctamente'
    });
  } catch (error) {
    console.error('❌ Error obteniendo canchas por empresa:', error);
    res.status(500).json({
      success: false,
      status: false,
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
             COUNT(cal.calendar_id) as total_bookings,
             COUNT(CASE WHEN cal.calendar_state = 'Reservada' THEN 1 END) as completed_bookings,
             COUNT(CASE WHEN cal.calendar_date >= CURDATE() AND cal.calendar_state IN ('Reservada', 'Por Confirmar') THEN 1 END) as upcoming_bookings
      FROM Fields f
      LEFT JOIN Companies c ON f.company_id = c.company_id
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
        status: false,
        message: 'Cancha no encontrada'
      });
    }

    console.log(`✅ Cancha ${fieldId} encontrada`);
    
    res.json({
      success: true,
      status: true,
      data: results[0],
      message: 'Cancha obtenida correctamente'
    });
  } catch (error) {
    console.error('❌ Error obteniendo cancha:', error);
    res.status(500).json({
      success: false,
      status: false,
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

    // Usar field_delete para manejar estado: false = activa, true = en mantenimiento
    const isInMaintenance = !field_state;

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
        status: false,
        message: 'Cancha no encontrada'
      });
    }

    const statusText = field_state ? 'activa' : 'en mantenimiento';
    
    console.log(`✅ Cancha ${field_id} puesta como ${statusText}`);
    
    res.json({
      success: true,
      status: true,
      message: `Cancha puesta como ${statusText}`
    });
  } catch (error) {
    console.error('❌ Error actualizando estado de cancha:', error);
    res.status(500).json({
      success: false,
      status: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Eliminar cancha (soft delete)
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
        status: false,
        message: 'Cancha no encontrada'
      });
    }

    console.log(`✅ Cancha ${field_id} eliminada`);

    res.json({
      success: true,
      status: true,
      message: 'Cancha eliminada correctamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando cancha:', error);
    res.status(500).json({
      success: false,
      status: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener horarios de una cancha específica
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
        status: false,
        message: 'Cancha no encontrada'
      });
    }

    // Generar horarios por defecto (puedes personalizar según tu sistema)
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
      status: true,
      data: schedules,
      message: 'Horarios obtenidos correctamente'
    });

  } catch (error) {
    console.error('❌ Error obteniendo horarios:', error);
    res.status(500).json({
      success: false,
      status: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});



module.exports = router;