const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 🔧 Crear directorios si no existen
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`📁 Field name: ${file.fieldname}, Route: ${req.route?.path}`);
    
    // Determinar carpeta según el tipo de archivo
    let uploadPath = './uploads/';
    
    // 🔥 PRIORIDAD 1: Por field name (más confiable para /calendars/create)
    if (file.fieldname === 'receipt_image' || file.fieldname === 'receipt') {
      uploadPath += 'receipts/';
    } else if (file.fieldname === 'field_image') {
      uploadPath += 'field-images/';
    } else if (file.fieldname === 'profile_image') {
      uploadPath += 'profiles/';
    }
    // 🔥 PRIORIDAD 2: Por ruta (tu lógica original como fallback)
    else if (req.route && req.route.path && (req.route.path.includes('receipt') || req.route.path.includes('create'))) {
      uploadPath += 'receipts/';
    } else if (req.route && req.route.path && req.route.path.includes('field')) {
      uploadPath += 'field-images/';
    } else if (req.route && req.route.path && req.route.path.includes('profile')) {
      uploadPath += 'profiles/';
    }
    // 🔥 PRIORIDAD 3: Por body type (tu lógica original)
    else if (req.body && req.body.type === 'receipt') {
      uploadPath += 'receipts/';
    } else if (req.body && req.body.type === 'field') {
      uploadPath += 'field-images/';
    } else if (req.body && req.body.type === 'profile') {
      uploadPath += 'profiles/';
    }
    // 🔥 DEFAULT: receipts para /calendars/create
    else {
      uploadPath += 'receipts/';
    }
    
    console.log(`📁 Upload path: ${uploadPath}`);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generar nombre único con timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    
    // Prefijo según tipo
    let prefix = 'file';
    
    // 🔥 PRIORIDAD 1: Por field name
    if (file.fieldname === 'receipt_image' || file.fieldname === 'receipt') {
      prefix = 'receipt';
    } else if (file.fieldname === 'field_image') {
      prefix = 'field';
    } else if (file.fieldname === 'profile_image') {
      prefix = 'profile';
    }
    // 🔥 PRIORIDAD 2: Por ruta (tu lógica original como fallback)
    else if (req.route && req.route.path && (req.route.path.includes('receipt') || req.route.path.includes('create'))) {
      prefix = 'receipt';
    } else if (req.route && req.route.path && req.route.path.includes('field')) {
      prefix = 'field';
    } else if (req.route && req.route.path && req.route.path.includes('profile')) {
      prefix = 'profile';
    }
    // 🔥 PRIORIDAD 3: Por body type (tu lógica original)
    else if (req.body && req.body.type === 'receipt') {
      prefix = 'receipt';
    } else if (req.body && req.body.type === 'field') {
      prefix = 'field';
    } else if (req.body && req.body.type === 'profile') {
      prefix = 'profile';
    }
    
    const filename = `${prefix}-${uniqueSuffix}${extension}`;
    console.log(`📄 Filename: ${filename}`);
    cb(null, filename);
  }
});

// 🔧 Filtro de archivos con validaciones específicas

const fileFilter = (req, file, cb) => {
  console.log(`📄 Procesando archivo: ${file.originalname}`);
  console.log(`📄 Tipo MIME: ${file.mimetype}`);
  console.log(`📄 Field name: ${file.fieldname}`);
  console.log(`📄 Ruta de request: ${req.route?.path}`);
  
  // 🔥 TIPOS PERMITIDOS AMPLIADOS - ACEPTA TODOS LOS FORMATOS DE IMAGEN + PDF
  const allowedTypes = {
    receipt: [
      // Imágenes comunes
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'image/bmp', 'image/tiff', 'image/svg+xml',
      // PDF
      'application/pdf',
      // Fallback para archivos que no detectan MIME correctamente
      'application/octet-stream'
    ],
    field: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'image/bmp', 'image/tiff', 'application/octet-stream'
    ],
    profile: [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'image/bmp', 'image/tiff', 'application/octet-stream'
    ]
  };
  
  // 🔥 MEJORAR DETECCIÓN DE CATEGORÍA
  let category = 'receipt'; // 🔥 DEFAULT A RECEIPT (para /calendars/create)
  
  // Detectar por field name (más confiable)
  if (file.fieldname === 'receipt_image' || file.fieldname === 'receipt') {
    category = 'receipt';
  } else if (file.fieldname === 'field_image') {
    category = 'field';
  } else if (file.fieldname === 'profile_image') {
    category = 'profile';
  } 
  // Detectar por ruta como fallback
  else if (req.route && req.route.path) {
    if (req.route.path.includes('receipt') || req.route.path.includes('create')) {
      category = 'receipt';
    } else if (req.route.path.includes('field')) {
      category = 'field';
    } else if (req.route.path.includes('profile')) {
      category = 'profile';
    }
  }
  // Detectar por body type como último recurso
  else if (req.body.type === 'receipt') {
    category = 'receipt';
  } else if (req.body.type === 'field') {
    category = 'field';
  } else if (req.body.type === 'profile') {
    category = 'profile';
  }
  
  console.log(`📄 Categoría detectada: ${category}`);
  
  // 🔥 VALIDACIÓN ADICIONAL PARA ARCHIVOS CON OCTET-STREAM
  let isValidType = allowedTypes[category].includes(file.mimetype);
  
  // Si es octet-stream, verificar extensión del archivo
  if (file.mimetype === 'application/octet-stream' && file.originalname) {
    const extension = file.originalname.toLowerCase().split('.').pop();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'];
    const pdfExtensions = ['pdf'];
    
    if (category === 'receipt') {
      isValidType = [...imageExtensions, ...pdfExtensions].includes(extension);
    } else {
      isValidType = imageExtensions.includes(extension);
    }
    
    console.log(`📄 Verificación por extensión (.${extension}): ${isValidType}`);
  }
  
  if (isValidType) {
    console.log(`✅ Archivo aceptado como ${category}`);
    cb(null, true);
  } else {
    console.log(`❌ Tipo de archivo no permitido para ${category}: ${file.mimetype}`);
    console.log(`❌ Archivo rechazado: ${file.originalname}`);
    cb(new Error(`Tipo de archivo no permitido para ${category}. Tipos permitidos: ${allowedTypes[category].join(', ')}`), false);
  }
};

// 🔧 Configuraciones específicas por tipo
const uploadConfigs = {
  // Para comprobantes de pago
  receipt: multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
      files: 1
    }
  }),
  
  // Para imágenes de canchas
  field: multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 3 * 1024 * 1024, // 3MB max
      files: 1
    }
  }),
  
  // Para fotos de perfil
  profile: multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB max
      files: 1
    }
  }),
  
  // Upload genérico (tu configuración actual)
  general: multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
      files: 1
    }
  })
};

// 🔧 Middleware de manejo de errores
const handleUploadError = (error, req, res, next) => {
  console.error('❌ Error en upload:', error);
  
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'El archivo es demasiado grande',
          error: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Demasiados archivos',
          error: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Campo de archivo inesperado',
          error: 'UNEXPECTED_FIELD'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'Error en la subida del archivo',
          error: error.code
        });
    }
  }
  
  // Error personalizado (tipo de archivo no permitido)
  if (error.message.includes('Tipo de archivo no permitido')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_FILE_TYPE'
    });
  }
  
  // Error genérico
  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: 'INTERNAL_ERROR'
  });
};

module.exports = {
  uploadConfigs,
  handleUploadError
};