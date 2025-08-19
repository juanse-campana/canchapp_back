var express = require("express");
var router = express.Router();

const citiesController = require("../controllers/cities.controller");
const verifyToken = require("../middlewares/verifyToken");
const isOwner = require("../middlewares/isOwner");

router.get("/list", async function (request, response) {
  try {
    const result = await citiesController.getList();
    response.status(200).json({
    data: result,
    status: true,
    message: "Ciudades listadas exitosamente",
    });
  } catch (error) {
    console.error("Error al listar las ciudades: ", error)
    response.status(500).json({
      status: false,
      message: "Error al listar las ciudades"
    })
  }
});


router.post("/create", verifyToken, isOwner, async function (request, response) {
  console.log(request.body);
  try {
    const result = await citiesController.postCreate(request.body);
    response.status(200).json({
      status: true,
      message: "Ciudad registrada exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error al crear la ciudad:", error);
    response.status(500).json({
      status: false,
      message: "Ocurrió un error al crear la ciudad.",
      error: error.message, // Puedes enviar un mensaje de error más específico
    });
  }
});

router.patch("/update", verifyToken, isOwner, async function (request, response) {
  console.log(request.body);
  try {
    const result = await citiesController.patchUpdate(request.body);
    response.status(200).json({
      status: true,
      message: "Ciudad actualizada exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error al actualizar la ciudad:", error);
    response.status(500).json({
      status: false,
      message: "Ocurrió un error al actualizar la ciudad.",
      error: error.message, // Puedes enviar un mensaje de error más específico
    });
  }
});

module.exports = router;