var express = require("express");
var router = express.Router();

const schedulesController = require("../controllers/schedules.controller");
const verifyToken = require("../middlewares/verifyToken");
const isOwner = require("../middlewares/isOwner");

/* GET lista de companies (pública) */
router.get("/list", async function (request, response) {
  console.log("hola")
  try {
    const result = await schedulesController.getList();
    response.status(200).json({
      data: result,
      status: true,
      message: "Horarios listados exitosamente",
    });
  } catch (error) {
    console.error("Error al listar los horarios: ", error)
    response.status(500).json({
      status: false,
      message: "Ocurrio un error al listar los horarios"
    })
  }
  
});

/* POST crear company - protegido, solo dueños pueden crear */
router.post("/create", verifyToken, isOwner, async function (request, response) {
  try {
    const data = {...request.body};
    
    const result = await schedulesController.postCreate(data);
    response.status(201).json({
      status: true,
      message: "Horario creado exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error creando horario:", error);
    response.status(500).json({
      status: false,
      message: "Error al crear Horario",
      error: error.message,
    });
  }
});

/* PATCH update company - también protegido */
router.patch("/update", verifyToken, isOwner, async function (request, response) {
  try {
    const result = await schedulesController.patchUpdate(request.body);
    response.status(200).json({
      status: true,
      message: "Horario actualizado exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error actualizando horario:", error);
    response.status(500).json({
      status: false,
      message: "Error al actualizar horario",
      error: error.message,
    });
  }
});

module.exports = router;
