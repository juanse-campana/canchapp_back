// controllers/uploadController.js
const cloudinary = require('cloudinary').v2;

// Configura Cloudinary (esto también podría ir en un archivo de configuración central si lo prefieres)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Sube un archivo a Cloudinary desde un buffer.
 * @param {Buffer} buffer El buffer del archivo a subir.
 * @returns {Promise<object>} Una promesa que se resuelve con el resultado de Cloudinary.
 */
const uploadStream = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'comprobantes_pago' }, // Organiza en una carpeta
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    stream.end(buffer);
  });
};

const uploadReceipt = async (req, res) => {
  try {
    // El middleware 'upload' ya ha procesado el archivo y lo ha puesto en req.file
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
    }

    // Subimos el buffer del archivo a Cloudinary usando nuestra función prometida
    const result = await uploadStream(req.file.buffer);

    const imageUrl = result.secure_url;
    const publicId = result.public_id; // Útil si quieres borrar la imagen después

    // =======================================================
    // AQUÍ VA TU LÓGICA DE NEGOCIO
    // Guarda `imageUrl` en tu base de datos asociada a una reserva, usuario, etc.
    // Ejemplo:
    // const { bookingId } = req.body;
    // await Booking.findByIdAndUpdate(bookingId, { paymentReceiptUrl: imageUrl });
    // =======================================================

    res.status(200).json({
      message: 'Imagen subida exitosamente',
      url: imageUrl,
      public_id: publicId,
    });

  } catch (error) {
    console.error('Error al subir la imagen:', error);
    res.status(500).json({ message: 'Error interno del servidor al procesar la imagen.' });
  }
};

module.exports = {
  uploadReceipt,
};