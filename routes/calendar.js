// routes/calendar.js - VERSIÓN SEQUELIZE
const express = require('express');
const router = express.Router();
const sequelize = require('../database/connect'); // Tu conexión Sequelize



// 🆕 SOLO AGREGAR ESTAS DOS LÍNEAS DESPUÉS DE LOS REQUIRES EXISTENTES
const { uploadConfigs, handleUploadError } = require('../config/uploadConfig');
const { verifyToken, requireOwnership } = require('../middlewares/auth');

// GET /calendars/company/:companyId/today - Reservas de hoy CON COMPROBANTES
router.get('/company/:companyId/today', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { date } = req.query;
        const today = date || new Date().toISOString().split('T')[0];

        const query = `
            SELECT c.*, 
                   f.field_name, 
                   u.user_name, u.user_email,
                   c.calendar_payment_receipt as receipt_url,
                   c.calendar_payment_receipt_date,
                   c.calendar_payment_status,
                   c.calendar_payment_amount,
                   c.calendar_approved_by,
                   c.calendar_approved_date,
                   c.calendar_rejection_reason
            FROM Calendars c
            JOIN Fields f ON c.field_id = f.field_id
            JOIN Users u ON c.user_id = u.user_id
            WHERE f.company_id = :companyId
            AND c.calendar_date = :today
            ORDER BY c.calendar_init_time
        `;

        const results = await sequelize.query(query, {
            replacements: { companyId, today },
            type: sequelize.QueryTypes.SELECT
        });

        // 🔥 PROCESAR RESULTADOS PARA INCLUIR URL COMPLETA DE IMAGEN
        const processedResults = results.map(reservation => {
            return {
                ...reservation,
                receipt_image_url: reservation.receipt_url ? 
                    `${req.protocol}://${req.get('host')}${reservation.receipt_url}` : 
                    null,
                has_receipt: !!reservation.receipt_url
            };
        });
        
        res.json({
            success: true,
            data: processedResults,
            meta: {
                total: processedResults.length,
                date: today,
                with_receipts: processedResults.filter(r => r.has_receipt).length
            },
            message: `Reservas del ${today} obtenidas correctamente`
        });
    } catch (error) {
        console.error('Error obteniendo reservas de hoy:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /calendars/company/:companyId/upcoming - Próximas reservas
router.get('/company/:companyId/upcoming', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { limit = 5 } = req.query;

        const query = `
            SELECT c.*, f.field_name, u.user_name, u.user_email
            FROM Calendars c
            JOIN Fields f ON c.field_id = f.field_id
            JOIN Users u ON c.user_id = u.user_id
            WHERE f.company_id = :companyId
            AND c.calendar_date >= CURDATE()
            AND c.calendar_state IN ('Reservada', 'Confirmada')
            ORDER BY c.calendar_date ASC, c.calendar_init_time ASC
            LIMIT :limit
        `;

        const results = await sequelize.query(query, {
            replacements: { companyId, limit: parseInt(limit) },
            type: sequelize.QueryTypes.SELECT
        });
        
        res.json({
            success: true,
            data: results,
            message: 'Próximas reservas obtenidas correctamente'
        });
    } catch (error) {
        console.error('Error obteniendo próximas reservas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /calendars/company/:companyId - Todas las reservas con filtros
router.get('/company/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { status, start_date, end_date } = req.query;

        let query = `
            SELECT c.*, f.field_name, u.user_name, u.user_email
            FROM Calendars c
            JOIN Fields f ON c.field_id = f.field_id
            JOIN Users u ON c.user_id = u.user_id
            WHERE f.company_id = :companyId
        `;
        
        const replacements = { companyId };

        if (status) {
            query += ' AND c.calendar_state = :status';
            replacements.status = status;
        }

        if (start_date) {
            query += ' AND c.calendar_date >= :start_date';
            replacements.start_date = start_date;
        }

        if (end_date) {
            query += ' AND c.calendar_date <= :end_date';
            replacements.end_date = end_date;
        }

        query += ' ORDER BY c.calendar_date DESC, c.calendar_init_time DESC';

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
        console.error('Error obteniendo reservas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});


// POST /calendars/create - Crear nueva reserva CON IMAGEN OBLIGATORIA
router.post('/create',
  uploadConfigs.receipt.single('receipt_image'), 
  handleUploadError,
  async (req, res) => {
    try {
        console.log('📥 Datos recibidos en /calendars/create:');
        console.log('Body completo:', req.body);
        console.log('Files:', req.file); // 🔥 CAMBIAR req.files a req.file
        console.log('Imagen recibida:', req.file?.filename);

        // 🔥 VALIDAR QUE SIEMPRE VENGA UNA IMAGEN (NUEVO)
        if (!req.file) {
            console.log('❌ Error: No se recibió comprobante de pago');
            return res.status(400).json({
                success: false,
                message: 'El comprobante de pago es obligatorio para realizar una reserva',
                error: 'RECEIPT_REQUIRED'
            });
        }

        const {
            field_id,
            user_id,
            calendar_date,
            calendar_init_time,
            calendar_end_time,
            calendar_state = 'Pendiente',
            cash_closing_id = null,
            calendar_transaccion
        } = req.body;

        console.log('🔍 Parámetros extraídos:');
        console.log('field_id:', field_id);
        console.log('user_id:', user_id);
        console.log('calendar_date:', calendar_date);
        console.log('calendar_init_time:', calendar_init_time);
        console.log('calendar_end_time:', calendar_end_time);
        console.log('calendar_transaccion:', calendar_transaccion);

        // 🔥 GENERAR ID ÚNICO DE TRANSACCIÓN
        const generateTransactionId = () => {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            return `TXN-${field_id}-${user_id}-${timestamp}-${random}`;
        };

        const transactionId = generateTransactionId();
        console.log('🆔 Transaction ID generado:', transactionId);

        // 🔥 PROCESAR LA IMAGEN DEL COMPROBANTE (SIEMPRE EXISTIRÁ)
        const receiptUrl = `/uploads/receipts/${req.file.filename}`;
        console.log('✅ Comprobante recibido:', receiptUrl);

        // Verificar si ya existe una reserva en ese horario
        const checkQuery = `
            SELECT calendar_id FROM Calendars 
            WHERE field_id = :field_id
            AND calendar_date = :calendar_date
            AND ((calendar_init_time <= :init_time1 AND calendar_end_time > :init_time2) 
                OR (calendar_init_time < :end_time1 AND calendar_end_time >= :end_time2)
                OR (calendar_init_time >= :init_time3 AND calendar_init_time < :end_time3))
            AND calendar_state NOT IN ('Cancelada', 'Disponible', 'Rechazada')
        `;

        const existing = await sequelize.query(checkQuery, {
            replacements: {
                field_id,
                calendar_date,
                init_time1: calendar_init_time,
                init_time2: calendar_init_time,
                end_time1: calendar_end_time,
                end_time2: calendar_end_time,
                init_time3: calendar_init_time,
                end_time3: calendar_end_time
            },
            type: sequelize.QueryTypes.SELECT
        });

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una reserva en ese horario'
            });
        }

        // 🔥 INSERTAR SIEMPRE EN ESTADO PENDIENTE (MODIFICADO)
        const insertQuery = `
            INSERT INTO Calendars (
                field_id, user_id, calendar_date, calendar_init_time, 
                calendar_end_time, calendar_state, cash_closing_id, 
                calendar_transaccion, calendar_payment_receipt,
                calendar_payment_receipt_date, calendar_payment_status,
                calendar_payment_amount
            ) VALUES (:field_id, :user_id, :calendar_date, :calendar_init_time, 
                     :calendar_end_time, 'Pendiente', :cash_closing_id, 
                     :transactionId, :calendar_payment_receipt,
                     NOW(), 'pendiente', :calendar_payment_amount)
        `;

        const [results, metadata] = await sequelize.query(insertQuery, {
            replacements: {
                field_id,
                user_id,
                calendar_date,
                calendar_init_time,
                calendar_end_time,
                cash_closing_id,
                transactionId: transactionId, // 🔥 USAR ID ÚNICO EN LUGAR DE MONTO
                calendar_payment_receipt: receiptUrl, // 🔥 GUARDAR URL DE LA IMAGEN
                calendar_payment_amount: calendar_transaccion // 🔥 MONTO DEL PAGO
            }
        });

        console.log('✅ Reserva creada con ID:', metadata.insertId);
        console.log('🆔 Transaction ID:', transactionId);
        console.log('📄 Comprobante guardado:', receiptUrl);

        res.status(201).json({
            success: true,
            data: { 
                calendar_id: metadata.insertId,
                transaction_id: transactionId, // 🔥 DEVOLVER TRANSACTION ID
                receipt_url: receiptUrl, // 🔥 DEVOLVER URL DE LA IMAGEN
                state: 'Pendiente',
                payment_status: 'pendiente',
                payment_amount: calendar_transaccion
            },
            message: 'Reserva creada exitosamente - Pendiente de aprobación por el administrador'
        });
    } catch (error) {
        console.error('Error creando reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// PUT /calendars/update-status - Actualizar estado de reserva
router.put('/update-status', async (req, res) => {
    try {
        const { calendar_id, calendar_state } = req.body;

        const validStates = ['Disponible', 'Reservada', 'Confirmada', 'Cancelada', 'Completada', 'Bloqueada', 'NoDisponible'];
        
        if (!validStates.includes(calendar_state)) {
            return res.status(400).json({
                success: false,
                message: 'Estado no válido'
            });
        }

        const query = `
            UPDATE Calendars 
            SET calendar_state = :calendar_state
            WHERE calendar_id = :calendar_id
        `;

        const [results, metadata] = await sequelize.query(query, {
            replacements: { calendar_state, calendar_id }
        });

        if (metadata.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        res.json({
            success: true,
            message: `Reserva actualizada a ${calendar_state}`
        });
    } catch (error) {
        console.error('Error actualizando estado de reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /calendars/company/:companyId/clients - Clientes únicos
router.get('/company/:companyId/clients', async (req, res) => {
    try {
        const { companyId } = req.params;

        const query = `
            SELECT 
                u.user_id,
                u.user_name,
                u.user_email,
                COUNT(c.calendar_id) as total_bookings,
                MIN(c.calendar_date) as first_booking_date,
                MAX(c.calendar_date) as last_booking_date
            FROM Users u
            JOIN Calendars c ON u.user_id = c.user_id
            JOIN Fields f ON c.field_id = f.field_id
            WHERE f.company_id = :companyId
            AND c.calendar_state IN ('Reservada', 'Confirmada', 'Completada')
            GROUP BY u.user_id, u.user_name, u.user_email
            ORDER BY total_bookings DESC
        `;

        const results = await sequelize.query(query, {
            replacements: { companyId },
            type: sequelize.QueryTypes.SELECT
        });
        
        res.json({
            success: true,
            data: results,
            message: 'Clientes obtenidos correctamente'
        });
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// 🔒 POST /calendars/:calendarId/upload-receipt - Subir comprobante de pago (SOLO AUTENTICACIÓN AGREGADA)
router.post('/:calendarId/upload-receipt', 
  verifyToken,  // 🆕 SOLO ESTA LÍNEA AGREGADA
  uploadConfigs.receipt.single('receipt'), 
  handleUploadError,
  async (req, res) => {
    try {
      const { calendarId } = req.params;
      
      console.log(`📄 Subiendo comprobante para reserva ${calendarId}`);
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se subió ningún comprobante',
          error: 'NO_RECEIPT_UPLOADED'
        });
      }

      // Verificar que la reserva existe y pertenece al usuario
      const checkQuery = `
        SELECT calendar_id, user_id, calendar_state, calendar_payment_status
        FROM Calendars 
        WHERE calendar_id = :calendarId
      `;

      const reservation = await sequelize.query(checkQuery, {
        replacements: { calendarId },
        type: sequelize.QueryTypes.SELECT
      });

      if (reservation.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Reserva no encontrada'
        });
      }

      // 🆕 SOLO ESTA VERIFICACIÓN AGREGADA
      if (req.user.user_role !== 'admin' && reservation[0].user_id !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          message: 'No puedes subir comprobantes para reservas de otros usuarios'
        });
      }

      const receiptUrl = `/uploads/receipts/${req.file.filename}`;
      
      // Actualizar la reserva con el comprobante
      const updateQuery = `
        UPDATE Calendars 
        SET calendar_payment_receipt = :receiptUrl,
            calendar_payment_receipt_date = NOW(),
            calendar_payment_status = 'pendiente',
            calendar_state = 'Por Confirmar'
        WHERE calendar_id = :calendarId
      `;

      await sequelize.query(updateQuery, {
        replacements: { receiptUrl, calendarId }
      });

      console.log(`✅ Comprobante subido para reserva ${calendarId}: ${req.file.filename}`);

      res.json({
        success: true,
        message: 'Comprobante subido exitosamente. Su reserva está pendiente de aprobación.',
        data: {
          calendar_id: calendarId,
          receipt_url: receiptUrl,
          receipt_filename: req.file.filename,
          payment_status: 'pendiente',
          reservation_status: 'Por Confirmar'
        }
      });

    } catch (error) {
      console.error('❌ Error subiendo comprobante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
);

// 🔒 GET /calendars/user/:userId - Reservas de un usuario específico (SOLO AUTENTICACIÓN AGREGADA)
router.get('/user/:userId', 
  verifyToken,  // 🆕 SOLO ESTA LÍNEA AGREGADA
  requireOwnership('userId'), // 🆕 SOLO ESTA LÍNEA AGREGADA
  async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 10, offset = 0 } = req.query;

    let query = `
      SELECT c.*, f.field_name, f.field_type, comp.company_name
      FROM Calendars c
      JOIN Fields f ON c.field_id = f.field_id
      JOIN Companies comp ON f.company_id = comp.company_id
      WHERE c.user_id = :userId
    `;

    const replacements = { userId };

    if (status) {
      query += ' AND c.calendar_state = :status';
      replacements.status = status;
    }

    query += ` 
      ORDER BY c.calendar_date DESC, c.calendar_init_time DESC
      LIMIT :limit OFFSET :offset
    `;

    replacements.limit = parseInt(limit);
    replacements.offset = parseInt(offset);

    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Contar total de reservas para paginación
    let countQuery = `
      SELECT COUNT(*) as total
      FROM Calendars c
      WHERE c.user_id = :userId
    `;

    if (status) {
      countQuery += ' AND c.calendar_state = :status';
    }

    const countResult = await sequelize.query(countQuery, {
      replacements: status ? { userId, status } : { userId },
      type: sequelize.QueryTypes.SELECT
    });

    const total = countResult[0].total;

    res.json({
      success: true,
      data: results,
      meta: {
        total: total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (parseInt(offset) + parseInt(limit)) < total
      },
      message: 'Reservas del usuario obtenidas correctamente'
    });

  } catch (error) {
    console.error('❌ Error obteniendo reservas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// 🔒 GET /calendars/:calendarId - Detalle de una reserva específica (SOLO AUTENTICACIÓN AGREGADA)
router.get('/:calendarId', 
  verifyToken, // 🆕 SOLO ESTA LÍNEA AGREGADA
  async (req, res) => {
  try {
    const { calendarId } = req.params;

    const query = `
      SELECT c.*, 
             f.field_name, f.field_type, f.field_hour_price,
             comp.company_name, comp.company_address,
             u.user_name, u.user_email, u.user_phone
      FROM Calendars c
      JOIN Fields f ON c.field_id = f.field_id
      JOIN Companies comp ON f.company_id = comp.company_id
      JOIN Users u ON c.user_id = u.user_id
      WHERE c.calendar_id = :calendarId
    `;

    const results = await sequelize.query(query, {
      replacements: { calendarId },
      type: sequelize.QueryTypes.SELECT
    });

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    const reservation = results[0];

    // 🆕 SOLO ESTA VERIFICACIÓN AGREGADA
    if (req.user.user_role !== 'admin' && 
        reservation.user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta reserva'
      });
    }

    res.json({
      success: true,
      data: reservation,
      message: 'Detalle de reserva obtenido correctamente'
    });

  } catch (error) {
    console.error('❌ Error obteniendo detalle de reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// 🔒 PUT /calendars/:calendarId/cancel - Cancelar reserva (SOLO AUTENTICACIÓN AGREGADA)
router.put('/:calendarId/cancel', 
  verifyToken, // 🆕 SOLO ESTA LÍNEA AGREGADA
  async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { cancellation_reason } = req.body;

    // Verificar que la reserva se puede cancelar
    const checkQuery = `
      SELECT calendar_id, user_id, calendar_state, calendar_date, calendar_init_time
      FROM Calendars 
      WHERE calendar_id = :calendarId
    `;

    const reservation = await sequelize.query(checkQuery, {
      replacements: { calendarId },
      type: sequelize.QueryTypes.SELECT
    });

    if (reservation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    const reservationData = reservation[0];

    // 🆕 SOLO ESTA VERIFICACIÓN AGREGADA
    if (req.user.user_role !== 'admin' && 
        reservationData.user_id !== req.user.user_id) {
      return res.status(403).json({
        success: false,
        message: 'No puedes cancelar reservas de otros usuarios'
      });
    }

    // Verificar si la reserva ya está cancelada o completada
    if (['Cancelada', 'Completada'].includes(reservationData.calendar_state)) {
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar una reserva ${reservationData.calendar_state.toLowerCase()}`
      });
    }

    // Actualizar el estado a cancelada
    const updateQuery = `
      UPDATE Calendars 
      SET calendar_state = 'Cancelada',
          calendar_rejection_reason = :cancellation_reason
      WHERE calendar_id = :calendarId
    `;

    await sequelize.query(updateQuery, {
      replacements: { 
        calendarId, 
        cancellation_reason: cancellation_reason || 'Cancelada por el usuario'
      }
    });

    console.log(`✅ Reserva ${calendarId} cancelada por usuario ${req.user.user_id}`); // 🆕 SOLO LOG MEJORADO

    res.json({
      success: true,
      message: 'Reserva cancelada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error cancelando reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});
// GET /calendars - Obtener todas las reservas (para admin)
router.get('/', async (req, res) => {
    try {
        const { 
            limit = 1000, 
            offset = 0, 
            status, 
            start_date, 
            end_date 
        } = req.query;

        console.log(`📋 Admin solicitando reservas - limit: ${limit}, status: ${status}`);

        let query = `
            SELECT c.*, 
                   f.field_name, f.field_type, f.field_hour_price,
                   comp.company_name,
                   u.user_name, u.user_email, u.user_phone
            FROM Calendars c
            JOIN Fields f ON c.field_id = f.field_id
            JOIN Companies comp ON f.company_id = comp.company_id
            JOIN Users u ON c.user_id = u.user_id
            WHERE 1=1
        `;
        
        const replacements = {};

        // Filtros opcionales
        if (status) {
            query += ' AND c.calendar_state = :status';
            replacements.status = status;
        }

        if (start_date) {
            query += ' AND c.calendar_date >= :start_date';
            replacements.start_date = start_date;
        }

        if (end_date) {
            query += ' AND c.calendar_date <= :end_date';
            replacements.end_date = end_date;
        }

        query += ' ORDER BY c.calendar_date DESC, c.calendar_init_time DESC';
        query += ' LIMIT :limit OFFSET :offset';
        
        replacements.limit = parseInt(limit);
        replacements.offset = parseInt(offset);

        const results = await sequelize.query(query, {
            replacements,
            type: sequelize.QueryTypes.SELECT
        });

        console.log(`✅ Reservas encontradas para admin: ${results.length}`);
        
        res.json({
            success: true,
            data: results,
            meta: {
                total: results.length,
                limit: parseInt(limit),
                offset: parseInt(offset)
            },
            message: 'Reservas obtenidas correctamente'
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo reservas para admin:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET /calendars/pending - Reservas pendientes de aprobación (específico para admin)
router.get('/pending', async (req, res) => {
    try {
        const { limit = 100 } = req.query;

        console.log('📋 Admin solicitando reservas PENDIENTES');

        const query = `
            SELECT c.*, 
                   f.field_name, f.field_type, f.field_hour_price,
                   comp.company_name, comp.company_address,
                   u.user_name, u.user_email, u.user_phone
            FROM Calendars c
            JOIN Fields f ON c.field_id = f.field_id
            JOIN Companies comp ON f.company_id = comp.company_id
            JOIN Users u ON c.user_id = u.user_id
            WHERE c.calendar_state IN ('Reservada', 'Por Confirmar')
            AND c.calendar_payment_receipt IS NOT NULL
            ORDER BY c.calendar_date ASC, c.calendar_init_time ASC
            LIMIT :limit
        `;

        const results = await sequelize.query(query, {
            replacements: { limit: parseInt(limit) },
            type: sequelize.QueryTypes.SELECT
        });

        console.log(`✅ Reservas PENDIENTES encontradas: ${results.length}`);
        
        res.json({
            success: true,
            data: results,
            message: `${results.length} reservas pendientes de aprobación`
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo reservas pendientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});
// PUT /calendars/:calendarId/approve - Aprobar reserva (ADMIN)
router.put('/:calendarId/approve', async (req, res) => {
    try {
        const { calendarId } = req.params;
        const { adminId } = req.body;

        const updateQuery = `
            UPDATE Calendars 
            SET calendar_state = 'Confirmada',
                calendar_payment_status = 'aprobado'
            WHERE calendar_id = :calendarId
        `;

        await sequelize.query(updateQuery, {
            replacements: { calendarId }
        });

        res.json({
            success: true,
            message: 'Reserva aprobada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error aprobando reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// PUT /calendars/:calendarId/reject - Rechazar reserva (ADMIN)
router.put('/:calendarId/reject', async (req, res) => {
    try {
        const { calendarId } = req.params;
        const { reason } = req.body;

        const updateQuery = `
            UPDATE Calendars 
            SET calendar_state = 'Rechazada',
                calendar_payment_status = 'rechazado',
                calendar_rejection_reason = :reason
            WHERE calendar_id = :calendarId
        `;

        await sequelize.query(updateQuery, {
            replacements: { calendarId, reason }
        });

        res.json({
            success: true,
            message: 'Reserva rechazada'
        });

    } catch (error) {
        console.error('❌ Error rechazando reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});
module.exports = router;