// routes/bank_accounts.routes.js
var express = require("express");
var router = express.Router();

const bankAccountsController = require("../controllers/bank_accounts.controller");

/* RUTAS EXISTENTES - SIN MODIFICAR */
router.get("/list", async function (request, response) {
  const result = await bankAccountsController.getList();
  response.status(200).json({
    data: result,
    status: true,
    message: "TODO ESTA OK ",
  });
});

router.post("/create", function (request, response) {
  console.log(request.body);
  const result = bankAccountsController.postCreate(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});

router.patch("/update", function (request, response) {
  const result = bankAccountsController.patchUpdate(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});

/* 🆕 NUEVAS RUTAS AGREGADAS PARA CUENTAS DEL ADMIN */

// 🆕 RUTA PARA OBTENER CUENTAS DEL ADMIN PARA PAGOS
router.get('/admin-payment-accounts', async function (request, response) {
  try {
    console.log('📍 GET /admin-payment-accounts - Obteniendo cuentas del admin');
    
    const accounts = await bankAccountsController.getAdminPaymentAccounts();
    
    response.status(200).json({
      success: true,
      status: true,
      message: 'Cuentas del admin obtenidas exitosamente',
      data: {
        data: accounts,
        total: accounts.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error en /admin-payment-accounts:', error);
    response.status(500).json({
      success: false,
      status: false,
      message: error.message || 'Error obteniendo cuentas del admin',
      data: null
    });
  }
});

// 🆕 RUTA PARA CREAR CUENTA DEL ADMIN
router.post('/admin-account', async function (request, response) {
  try {
    console.log('📍 POST /admin-account - Creando cuenta del admin');
    console.log('Body recibido:', request.body);
    
    const newAccount = await bankAccountsController.postCreateAdminAccount(request.body);
    
    response.status(201).json({
      success: true,
      status: true,
      message: 'Cuenta del admin creada exitosamente',
      data: newAccount,
      info: newAccount
    });
    
  } catch (error) {
    console.error('❌ Error en /admin-account:', error);
    response.status(500).json({
      success: false,
      status: false,
      message: error.message || 'Error creando cuenta del admin',
      data: null
    });
  }
});

// 🆕 RUTA PARA ELIMINAR CUENTA
router.delete('/delete/:id', async function (request, response) {
  try {
    console.log('📍 DELETE /delete/:id - Eliminando cuenta bancaria');
    
    const accountId = parseInt(request.params.id);
    const result = await bankAccountsController.deleteAccount(accountId);
    
    response.status(200).json({
      success: true,
      status: true,
      message: 'Cuenta eliminada exitosamente',
      data: result,
      info: result
    });
    
  } catch (error) {
    console.error('❌ Error en /delete/:id:', error);
    response.status(500).json({
      success: false,
      status: false,
      message: error.message || 'Error eliminando cuenta',
      data: null
    });
  }
});

// 🆕 RUTA PARA CAMBIAR ESTADO DE CUENTA
router.patch('/toggle-status/:id', async function (request, response) {
  try {
    console.log('📍 PATCH /toggle-status/:id - Cambiando estado de cuenta');
    
    const accountId = parseInt(request.params.id);
    const { is_active } = request.body;
    
    const updatedAccount = await bankAccountsController.toggleStatus(accountId, is_active);
    
    response.status(200).json({
      success: true,
      status: true,
      message: 'Estado de cuenta actualizado exitosamente',
      data: updatedAccount,
      info: updatedAccount
    });
    
  } catch (error) {
    console.error('❌ Error en /toggle-status/:id:', error);
    response.status(500).json({
      success: false,
      status: false,
      message: error.message || 'Error cambiando estado de cuenta',
      data: null
    });
  }
});

// 🆕 RUTA PARA OBTENER ESTADÍSTICAS
router.get('/stats', async function (request, response) {
  try {
    console.log('📍 GET /stats - Obteniendo estadísticas de cuentas');
    
    const stats = await bankAccountsController.getAccountStats();
    
    response.status(200).json({
      success: true,
      status: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: stats,
      info: stats
    });
    
  } catch (error) {
    console.error('❌ Error en /stats:', error);
    response.status(500).json({
      success: false,
      status: false,
      message: error.message || 'Error obteniendo estadísticas',
      data: null
    });
  }
});

module.exports = router;