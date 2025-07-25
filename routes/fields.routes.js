var express = require("express");
var router = express.Router();

const fieldsController = require("../controllers/fields.controller");

router.get("/list", async function (request, response) {
  try {
    const result = await fieldsController.getList();
    response.status(200).json({
    data: result,
    status: true,
    message: "Canchas listadas exitosamente",
  });
  } catch (error) {
    console.error("Error al listar las canchas: ", error)
    response.status(500),json({
      status: false,
      message: "Ocurrio un error al listar las canchas"
    })
  }
  
});


router.post("/create", async function (request, response) {
  try {
    console.log(request.body);
    const result = await fieldsController.postCreate(request.body);
    response.status(200).json({
    status: true,
    message: "Cancha creada exitosamente",
    info: result,
    });
  } catch (error) {
    console.error("Error al crear cancha: ", error)
    response.status(500).json({
      status: false,
      message: "Ocurrio un error al crera la cancha"
    })
  }
});



router.patch("/update", function (request, response) {
  try {
    console.log(request.body)
    const result = fieldsController.patchUpdate(request.body);
    response.status(200).json({
      status: true,
      message: "Cancha actualizada exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error al actualizar cancha: ", error)
    response.status(500).json({
      status: false,
      message: "Ocurrio un error al actualizar"
    })
  }
});

module.exports = router;