// middlewares/upload.js
const multer = require('multer');

// Usamos 'memoryStorage' para que el archivo se guarde en un buffer en la RAM.
// Esto es más eficiente que guardarlo temporalmente en el disco del servidor.
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  // Opcional: puedes añadir un filtro de archivos para aceptar solo imágenes
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen.'), false);
    }
  },
});

module.exports = upload;