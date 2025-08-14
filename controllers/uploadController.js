const path = require('path');
const fs = require('fs');

class UploadController {
  
  // 🔧 Upload genérico (tu método actual mejorado)
  static uploadImage = (req, res) => {
    try {
      console.log('📤 Procesando upload de imagen...');
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: 'No se subió ningún archivo',
          error: 'NO_FILE_UPLOADED'
        });
      }
      
      const imageUrl = `/uploads/${req.file.filename}`;
      const fileInfo = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: imageUrl,
        path: req.file.path
      };
      
      console.log('✅ Archivo subido exitosamente:', fileInfo.filename);
      
      res.json({ 
        success: true,
        message: 'Archivo subido exitosamente',
        data: {
          imageUrl: imageUrl,
          fileInfo: fileInfo
        }
      });
      
    } catch (error) {
      console.error('❌ Error en uploadImage:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  };

  // 🆕 Upload específico para comprobantes de pago
  static uploadReceipt = (req, res) => {
    try {
      console.log('📄 Procesando comprobante de pago...');
      console.log('📋 Body recibido:', req.body);
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: 'No se subió ningún comprobante',
          error: 'NO_RECEIPT_UPLOADED'
        });
      }

      // Validar que tenga calendar_id si se requiere
      const calendarId = req.body.calendar_id || req.params.calendarId;
      
      const receiptUrl = `/uploads/receipts/${req.file.filename}`;
      const receiptInfo = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: receiptUrl,
        path: req.file.path,
        calendar_id: calendarId,
        uploaded_at: new Date().toISOString()
      };
      
      console.log('✅ Comprobante subido exitosamente:', receiptInfo.filename);
      
      res.json({ 
        success: true,
        message: 'Comprobante de pago subido exitosamente',
        data: {
          receiptUrl: receiptUrl,
          receiptInfo: receiptInfo
        }
      });
      
    } catch (error) {
      console.error('❌ Error en uploadReceipt:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando comprobante',
        error: error.message
      });
    }
  };

  // 🆕 Upload para imágenes de canchas
  static uploadFieldImage = (req, res) => {
    try {
      console.log('🏟️ Procesando imagen de cancha...');
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: 'No se subió ninguna imagen',
          error: 'NO_IMAGE_UPLOADED'
        });
      }

      const imageUrl = `/uploads/field-images/${req.file.filename}`;
      const imageInfo = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: imageUrl,
        path: req.file.path,
        field_id: req.body.field_id || req.params.fieldId,
        uploaded_at: new Date().toISOString()
      };
      
      console.log('✅ Imagen de cancha subida:', imageInfo.filename);
      
      res.json({ 
        success: true,
        message: 'Imagen de cancha subida exitosamente',
        data: {
          imageUrl: imageUrl,
          imageInfo: imageInfo
        }
      });
      
    } catch (error) {
      console.error('❌ Error en uploadFieldImage:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando imagen de cancha',
        error: error.message
      });
    }
  };

  // 🆕 Obtener archivo (para mostrar comprobantes en el admin)
  static getFile = (req, res) => {
    try {
      const { category, filename } = req.params;
      const filePath = path.join(__dirname, '..', 'uploads', category, filename);
      
      console.log(`📁 Solicitando archivo: ${filePath}`);
      
      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado',
          error: 'FILE_NOT_FOUND'
        });
      }
      
      // Verificar categoría válida
      const validCategories = ['receipts', 'field-images', 'profiles'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Categoría de archivo no válida',
          error: 'INVALID_CATEGORY'
        });
      }
      
      console.log(`✅ Enviando archivo: ${filename}`);
      res.sendFile(filePath);
      
    } catch (error) {
      console.error('❌ Error en getFile:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo archivo',
        error: error.message
      });
    }
  };

  // 🆕 Eliminar archivo
  static deleteFile = (req, res) => {
    try {
      const { category, filename } = req.params;
      const filePath = path.join(__dirname, '..', 'uploads', category, filename);
      
      console.log(`🗑️ Eliminando archivo: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado',
          error: 'FILE_NOT_FOUND'
        });
      }
      
      fs.unlinkSync(filePath);
      
      console.log(`✅ Archivo eliminado: ${filename}`);
      
      res.json({
        success: true,
        message: 'Archivo eliminado exitosamente'
      });
      
    } catch (error) {
      console.error('❌ Error en deleteFile:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando archivo',
        error: error.message
      });
    }
  };

  // 🆕 Listar archivos por categoría
  static listFiles = (req, res) => {
    try {
      const { category } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const dirPath = path.join(__dirname, '..', 'uploads', category);
      
      if (!fs.existsSync(dirPath)) {
        return res.json({
          success: true,
          data: [],
          message: 'Directorio vacío'
        });
      }
      
      const files = fs.readdirSync(dirPath).map(filename => {
        const filePath = path.join(dirPath, filename);
        const stats = fs.statSync(filePath);
        
        return {
          filename,
          url: `/uploads/${category}/${filename}`,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      });
      
      // Paginación simple
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedFiles = files.slice(startIndex, endIndex);
      
      res.json({
        success: true,
        data: paginatedFiles,
        meta: {
          total: files.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(files.length / limit)
        }
      });
      
    } catch (error) {
      console.error('❌ Error en listFiles:', error);
      res.status(500).json({
        success: false,
        message: 'Error listando archivos',
        error: error.message
      });
    }
  };
}

module.exports = UploadController;