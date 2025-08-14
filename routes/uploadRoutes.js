const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/uploadController');
const { uploadConfigs, handleUploadError } = require('../config/uploadConfig');

// 🔧 Tu ruta original (mantenida)
router.post('/upload', 
  uploadConfigs.general.single('image'), 
  handleUploadError, 
  UploadController.uploadImage
);

// 🆕 Rutas específicas para comprobantes de pago
router.post('/upload/receipt', 
  uploadConfigs.receipt.single('receipt'), 
  handleUploadError, 
  UploadController.uploadReceipt
);

// 🆕 Rutas para imágenes de canchas
router.post('/upload/field-image', 
  uploadConfigs.field.single('field_image'), 
  handleUploadError, 
  UploadController.uploadFieldImage
);

// 🆕 Rutas para fotos de perfil
router.post('/upload/profile', 
  uploadConfigs.profile.single('profile_image'), 
  handleUploadError, 
  UploadController.uploadImage // Reutiliza el método genérico
);

// 🆕 Obtener archivos (para mostrar en admin)
router.get('/files/:category/:filename', UploadController.getFile);

// 🆕 Listar archivos por categoría
router.get('/files/:category', UploadController.listFiles);

// 🆕 Eliminar archivo (solo admin)
router.delete('/files/:category/:filename', UploadController.deleteFile);

module.exports = router;