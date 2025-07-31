var express = require("express");
var router = express.Router();

const calendarsController = require("../controllers/calendars.controller");
const verifyToken = require("../middlewares/verifyToken");
const isOwner = require("../middlewares/isOwner");

/* GET lista de companies (pública) */
router.get("/list", async function (request, response) {

  try {
    const result = await calendarsController.getDateList(request.body);
    response.status(200).json({
    data: result,
    status: true,
    message: "Calendario listado exitosamente",
    });
  } catch (error) {
    console.error("Error al listar el calendario: ", error)
    response.status(500).json({
      status: false,
      message: "Ocurrio un error al listar los calendarios"
    })
  }
  
});

/* POST crear company - protegido, solo dueños pueden crear */
router.post("/create", async function (request, response) {
  try {
    const result = await calendarsController.postCreateDate(request.body);
    response.status(201).json({
      status: true,
      message: "Calendario creado exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error creando calendario:", error);
    response.status(500).json({
      status: false,
      message: "Error al crear calendario",
      error: error.message,
    });
  }
});

/* PATCH update company - también protegido */
router.patch("/update", verifyToken, isOwner, async function (request, response) {
  try {
    const result = await calendarsController.patchUpdate(request.body);
    response.status(200).json({
      status: true,
      message: "Calendario actualizada exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error actualizando calendario:", error);
    response.status(500).json({
      status: false,
      message: "Error al actualizar calendario",
      error: error.message,
    });
  }
});

module.exports = router;
