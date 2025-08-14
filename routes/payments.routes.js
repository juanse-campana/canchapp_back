// routes/payments.routes.js - GESTIÓN DE PAGOS PARA ADMIN
const express = require('express');
const router = express.Router();
const sequelize = require('../database/connect');
const { verifyToken, requireAdmin } = require('../middlewares/auth');

// 🔒 APLICAR AUTENTICACIÓN A TODAS LAS RUTAS
router.use(verifyToken);     // Verificar que esté logueado
router.use(requireAdmin);    // Solo administradores

// GET /payments/pending - Comprobantes pendientes de aprobación
router.get('/pending', async (req, res) => {
  try {
    const { company_id, limit = 20, offset = 0 } = req.query;
    
    console.log('🔍 Obteniendo comprobantes pendientes...');

    let query = `
      SELECT c.calendar_id, c.calendar_date, c.calendar_init_time, c.calendar_end_time,
             c.calendar_payment_receipt, c.calendar_payment_receipt_date, c.calendar_payment_amount,
             c.calendar_state, c.calendar_payment_status,
             f.field_name, f.field_type, f.field_hour_price,
             comp.company_name, comp.company_id,
             u.user_name, u.user_email, u.user_phone
      FROM Calendars c
      JOIN Fields f ON c.field_id = f.field_id
      JOIN Companies comp ON f.company_id = comp.company_id
      JOIN Users u ON c.user_id = u.user_id
      WHERE c.calendar_payment_status = 'pendiente'
      AND c.calendar_payment_receipt IS NOT NULL
    `;

    const replacements = {};

    if (company_id) {
      query += ' AND comp.company_id = :company_id';
      replacements.company_id = company_id;
    }

    query += ` 
      ORDER BY c.calendar_payment_receipt_date DESC
      LIMIT :limit OFFSET :offset
    `;

    replacements.limit = parseInt(limit);
    replacements.offset = parseInt(offset);

    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Contar total para paginación
    let countQuery = `
      SELECT COUNT(*) as total
      FROM Calendars c
      JOIN Fields f ON c.field_id = f.field_id
      JOIN Companies comp ON f.company_id = comp.company_id
      WHERE c.calendar_payment_status = 'pendiente'
      AND c.calendar_payment_receipt IS NOT NULL
    `;

    if (company_id) {
      countQuery += ' AND comp.company_id = :company_id';
    }

    const countResult = await sequelize.query(countQuery, {
      replacements: company_id ? { company_id } : {},
      type: sequelize.QueryTypes.SELECT
    });

    const total = countResult[0].total;

    console.log(`✅ Comprobantes pendientes encontrados: ${results.length}`);

    res.json({
      success: true,
      data: results,
      meta: {
        total: total,
        pending: results.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: (parseInt(offset) + parseInt(limit)) < total
      },
      message: 'Comprobantes pendientes obtenidos correctamente'
    });

  } catch (error) {
    console.error('❌ Error obteniendo comprobantes pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /payments/:calendarId/approve - Aprobar pago
router.put('/:calendarId/approve', async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { approved_by, payment_amount, notes } = req.body;

    console.log(`✅ Aprobando pago para reserva ${calendarId}...`);

    // Verificar que la reserva existe y tiene comprobante
    const checkQuery = `
      SELECT calendar_id, calendar_payment_receipt, calendar_payment_status, calendar_state
      FROM Calendars 
      WHERE calendar_id = :calendarId
      AND calendar_payment_receipt IS NOT NULL
    `;

    const reservation = await sequelize.query(checkQuery, {
      replacements: { calendarId },
      type: sequelize.QueryTypes.SELECT
    });

    if (reservation.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada o sin comprobante de pago'
      });
    }

    if (reservation[0].calendar_payment_status === 'aprobado') {
      return res.status(400).json({
        success: false,
        message: 'El pago ya fue aprobado anteriormente'
      });
    }

    // Aprobar el pago
    const updateQuery = `
      UPDATE Calendars 
      SET calendar_payment_status = 'aprobado',
          calendar_state = 'Confirmada',
          calendar_approved_by = :approved_by,
          calendar_approved_date = NOW(),
          calendar_payment_amount = :payment_amount,
          calendar_rejection_reason = :notes
      WHERE calendar_id = :calendarId
    `;

    await sequelize.query(updateQuery, {
      replacements: { 
        calendarId, 
        approved_by,
        payment_amount: payment_amount || null,
        notes: notes || null
      }
    });

    console.log(`✅ Pago aprobado para reserva ${calendarId}`);

    res.json({
      success: true,
      message: 'Pago aprobado exitosamente',
      data: {
        calendar_id: calendarId,
        payment_status: 'aprobado',
        reservation_status: 'Confirmada',
        approved_by: approved_by,
        approved_date: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error aprobando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /payments/:calendarId/reject - Rechazar pago
router.put('/:calendarId/reject', async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { rejected_by, rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'El motivo del rechazo es requerido'
      });
    }

    console.log(`❌ Rechazando pago para reserva ${calendarId}...`);

    // Verificar que la reserva existe
    const checkQuery = `
      SELECT calendar_id, calendar_payment_status
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

    // Rechazar el pago
    const updateQuery = `
      UPDATE Calendars 
      SET calendar_payment_status = 'rechazado',
          calendar_state = 'Pendiente',
          calendar_approved_by = :rejected_by,
          calendar_approved_date = NOW(),
          calendar_rejection_reason = :rejection_reason
      WHERE calendar_id = :calendarId
    `;

    await sequelize.query(updateQuery, {
      replacements: { 
        calendarId, 
        rejected_by,
        rejection_reason
      }
    });

    console.log(`❌ Pago rechazado para reserva ${calendarId}: ${rejection_reason}`);

    res.json({
      success: true,
      message: 'Pago rechazado',
      data: {
        calendar_id: calendarId,
        payment_status: 'rechazado',
        reservation_status: 'Pendiente',
        rejected_by: rejected_by,
        rejection_reason: rejection_reason,
        rejected_date: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error rechazando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /payments/history - Historial de pagos
router.get('/history', async (req, res) => {
  try {
    const { 
      company_id, 
      status, 
      start_date, 
      end_date, 
      limit = 50, 
      offset = 0 
    } = req.query;

    console.log('📊 Obteniendo historial de pagos...');

    let query = `
      SELECT c.calendar_id, c.calendar_date, c.calendar_init_time, c.calendar_end_time,
             c.calendar_payment_receipt, c.calendar_payment_receipt_date, 
             c.calendar_payment_amount, c.calendar_payment_status,
             c.calendar_approved_date, c.calendar_rejection_reason,
             f.field_name, f.field_hour_price,
             comp.company_name, comp.company_id,
             u.user_name, u.user_email,
             admin.user_name as approved_by_name
      FROM Calendars c
      JOIN Fields f ON c.field_id = f.field_id
      JOIN Companies comp ON f.company_id = comp.company_id
      JOIN Users u ON c.user_id = u.user_id
      LEFT JOIN Users admin ON c.calendar_approved_by = admin.user_id
      WHERE c.calendar_payment_receipt IS NOT NULL
    `;

    const replacements = {};

    if (company_id) {
      query += ' AND comp.company_id = :company_id';
      replacements.company_id = company_id;
    }

    if (status) {
      query += ' AND c.calendar_payment_status = :status';
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

    query += ` 
      ORDER BY c.calendar_approved_date DESC, c.calendar_payment_receipt_date DESC
      LIMIT :limit OFFSET :offset
    `;

    replacements.limit = parseInt(limit);
    replacements.offset = parseInt(offset);

    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Estadísticas del período
    let statsQuery = `
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN calendar_payment_status = 'aprobado' THEN 1 END) as approved_count,
        COUNT(CASE WHEN calendar_payment_status = 'rechazado' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN calendar_payment_status = 'pendiente' THEN 1 END) as pending_count,
        SUM(CASE WHEN calendar_payment_status = 'aprobado' THEN calendar_payment_amount END) as total_approved_amount
      FROM Calendars c
      JOIN Fields f ON c.field_id = f.field_id
      JOIN Companies comp ON f.company_id = comp.company_id
      WHERE c.calendar_payment_receipt IS NOT NULL
    `;

    if (company_id) {
      statsQuery += ' AND comp.company_id = :company_id';
    }
    if (start_date) {
      statsQuery += ' AND c.calendar_date >= :start_date';
    }
    if (end_date) {
      statsQuery += ' AND c.calendar_date <= :end_date';
    }

    const statsResult = await sequelize.query(statsQuery, {
      replacements: Object.fromEntries(
        Object.entries(replacements).filter(([key]) => 
          ['company_id', 'start_date', 'end_date'].includes(key)
        )
      ),
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`📊 Historial obtenido: ${results.length} registros`);

    res.json({
      success: true,
      data: results,
      stats: statsResult[0],
      meta: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total_returned: results.length
      },
      message: 'Historial de pagos obtenido correctamente'
    });

  } catch (error) {
    console.error('❌ Error obteniendo historial de pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /payments/dashboard - Dashboard estadísticas para admin
router.get('/dashboard', async (req, res) => {
  try {
    const { company_id } = req.query;
    
    console.log('📊 Generando dashboard de pagos...');

    // Estadísticas generales
    let baseWhere = '';
    let replacements = {};
    
    if (company_id) {
      baseWhere = 'AND comp.company_id = :company_id';
      replacements.company_id = company_id;
    }

    // Resumen de pagos
    const summaryQuery = `
      SELECT 
        COUNT(CASE WHEN c.calendar_payment_status = 'pendiente' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN c.calendar_payment_status = 'aprobado' THEN 1 END) as approved_payments,
        COUNT(CASE WHEN c.calendar_payment_status = 'rechazado' THEN 1 END) as rejected_payments,
        SUM(CASE WHEN c.calendar_payment_status = 'aprobado' THEN COALESCE(c.calendar_payment_amount, f.field_hour_price) END) as total_revenue,
        COUNT(CASE WHEN c.calendar_payment_receipt_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as receipts_last_24h
      FROM Calendars c
      JOIN Fields f ON c.field_id = f.field_id
      JOIN Companies comp ON f.company_id = comp.company_id
      WHERE c.calendar_payment_receipt IS NOT NULL
      ${baseWhere}
    `;

    const summary = await sequelize.query(summaryQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Ingresos por mes (últimos 6 meses)
    const revenueQuery = `
      SELECT 
        DATE_FORMAT(c.calendar_date, '%Y-%m') as month,
        COUNT(*) as bookings_count,
        SUM(CASE WHEN c.calendar_payment_status = 'aprobado' THEN COALESCE(c.calendar_payment_amount, f.field_hour_price) END) as monthly_revenue
      FROM Calendars c
      JOIN Fields f ON c.field_id = f.field_id
      JOIN Companies comp ON f.company_id = comp.company_id
      WHERE c.calendar_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      AND c.calendar_payment_receipt IS NOT NULL
      ${baseWhere}
      GROUP BY DATE_FORMAT(c.calendar_date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6
    `;

    const monthlyRevenue = await sequelize.query(revenueQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Pagos recientes (últimos 10)
    const recentQuery = `
      SELECT c.calendar_id, c.calendar_payment_receipt_date, c.calendar_payment_status,
             u.user_name, f.field_name, comp.company_name
      FROM Calendars c
      JOIN Fields f ON c.field_id = f.field_id
      JOIN Companies comp ON f.company_id = comp.company_id
      JOIN Users u ON c.user_id = u.user_id
      WHERE c.calendar_payment_receipt IS NOT NULL
      ${baseWhere}
      ORDER BY c.calendar_payment_receipt_date DESC
      LIMIT 10
    `;

    const recentPayments = await sequelize.query(recentQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    console.log('✅ Dashboard generado correctamente');

    res.json({
      success: true,
      data: {
        summary: summary[0],
        monthly_revenue: monthlyRevenue,
        recent_payments: recentPayments
      },
      message: 'Dashboard de pagos generado correctamente'
    });

  } catch (error) {
    console.error('❌ Error generando dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;