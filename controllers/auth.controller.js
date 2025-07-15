const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Users } = require("../models");

const JWT_SECRET = "claveSecretaSuperSegura"; // Usa .env en producción

const loginUser = async (req, res) => {

  console.log(req.body)
  
  try {
    const user_email = req.body.user_email;
    const user_password = req.body.user_hashed_password

    if (!user_email || !user_password) {
      return res.status(400).json({ message: "Email y contraseña obligatorios" });
    }

    const user = await Users.findOne({ where: { user_email } });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const isPasswordValid = await bcrypt.compare(user_password, user.user_hashed_password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Crear token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_email: user.user_email,
        user_role: user.user_role
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "Login exitoso",
      token,
      user: {
        id: user.user_id,
        name: user.user_name,
        role: user.user_role,
        email: user.user_email,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { loginUser };
