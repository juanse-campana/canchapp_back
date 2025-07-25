var express = require("express");
var router = express.Router();

const usersController = require("../controllers/users.controller");

/* POST METHOD USERS USER. */
router.get("/list", async function (request, response) {
  try {
    const result = await usersController.getList();
    response.status(200).json({
      data: result,
      status: true,
      message: "Usuarios listados exitosamente",
    });
  } catch (error) {
    console.error("Error al listar los usuarios: ", error)
    response.statur(500).json({
      status: false,
      message: "Ocurrio un error al listar los usuarios"
    })
  }
  
});


router.post("/create", async function (req, res) {
  console.log(req.body);

  try {
    const result = await usersController.postCreate(req, res); 
    response.status(200).json({
      data: result,
      status: true,
      message: "Usuario creado exitosamente",
    });
  } catch (error) {
    console.error('Error no capturado en la ruta /users/create:', error);
    if (!res.headersSent) { 
      res.status(500).json({
        status: false,
        message: 'Ocurrio un error al crear el usuario'
      });
    }
  }
});


router.patch("/update", function (request, response) {
  try {
    const result = usersController.patchUpdate(request.body);
    response.status(200).json({
      status: true,
      message: "Usuario actualizado exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error al actualizar usuario: ", error)
    response.status(500).json({
      status: true,
      message: "Ocurrio un error al actualizar usuario"
    })
  }
  
});

module.exports = router;