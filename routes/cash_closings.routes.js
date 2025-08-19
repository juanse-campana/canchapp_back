var express = require("express");
var router = express.Router();

const cashClosingsController = require("../controllers/cash_closings.controller");
const verifyToken = require("../middlewares/verifyToken");
const isOwner = require("../middlewares/isOwner");

/* GET lista de companies (pública) */
router.get("/list", async function (request, response) {
  try {
    const result = await cashClosingsController.getList();
    response.status(200).json({
    data: result,
    status: true,
    message: "Cierre de Caja listados exitosamente",
    });
  } catch (error) {
    console.error("Error al listar las Cierres de Caja: ", error)
    response.status(500).json({
      status: true,
      message: "Ocurrio un error al listar los Cierres de Caja"
    })
  }
  
});

/* POST crear company - protegido, solo dueños pueden crear */
router.post("/create", verifyToken, isOwner, async function (request, response) {
  try {
    const result = await cashClosingsController.postCreate(request.body);
    response.status(201).json({
      status: true,
      message: "Cierre de Caja creada exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error creando Cierre de Caja:", error);
    response.status(500).json({
      status: false,
      message: "Error al crear Cierre de Caja",
      error: error.message,
    });
  }
});

/* PATCH update company - también protegido */
router.patch("/update", verifyToken, isOwner, async function (request, response) {
  try {
    const result = await cashClosingsController.patchUpdate(request.body);
    response.status(200).json({
      status: true,
      message: "Cierre de Caja actualizada exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error actualizando Cierre de Caja:", error);
    response.status(500).json({
      status: false,
      message: "Error al actualizar Cierre de Caja",
      error: error.message,
    });
  }
});

module.exports = router;
