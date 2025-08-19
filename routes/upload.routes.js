// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();

// Importamos el controlador y el middleware
const uploadController = require('../controllers/upload.controller');
const uploadMiddleware = require('../middlewares/upload');

// Definimos la ruta POST
// 1. La ruta es '/upload-receipt'
// 2. Usamos el middleware `uploadMiddleware.single('receipt')`. Esto buscará un archivo en el campo 'receipt' del form-data.
// 3. Si el middleware tiene éxito, llama a la función `uploadController.uploadReceipt`.
router.post('/upload-receipt', uploadMiddleware.single('receipt'), uploadController.uploadReceipt);

module.exports = router;