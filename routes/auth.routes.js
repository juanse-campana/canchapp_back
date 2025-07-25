const express = require("express");
const router = express.Router();
const { loginUser } = require("../controllers/auth.controller");

router.post("/login", async function (req, res) {
  console.log("Solicitud de login recibida:", req.body.user_email);

  try {
    // Llama a la función del controlador para manejar la lógica de login
    await loginUser(req, res);
  } catch (error) {
    console.error('Error no capturado en la ruta /auth/login:', error);
    // Asegurarse de no intentar enviar una respuesta si las cabeceras ya fueron enviadas
    if (!res.headersSent) {
      res.status(500).json({
        status: false,
        message: 'Error al iniciar sesion'
      });
    }
  }
});

module.exports = router;
