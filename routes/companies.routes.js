var express = require("express");
var router = express.Router();

const companiesController = require("../controllers/companies.controller");
const verifyToken = require("../middlewares/verifyToken");
const isOwner = require("../middlewares/isOwner");

/* GET lista de companies (pública) */
router.get("/list", async function (request, response) {
  try {
    const result = await companiesController.getList();
    response.status(200).json({
    data: result,
    status: true,
    message: "Companias listadas exitosamente",
    });
  } catch (error) {
    console.error("Error al listar las companias: ", error)
    response.status(500).json({
      status: true,
      message: "Ocurrio un error al listar las companias"
    })
  }
  
});

/* POST crear company - protegido, solo dueños pueden crear */
router.post("/create", verifyToken, isOwner, async function (request, response) {
  try {
    // El user_id lo tomamos del token, no del body
    const data = {
      ...request.body,
      company_user_id: request.user.user_id,
    };
    const result = await companiesController.postCreate(data);
    response.status(201).json({
      status: true,
      message: "Compania creada exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error creando compania:", error);
    response.status(500).json({
      status: false,
      message: "Error al crear compania",
      error: error.message,
    });
  }
});

/* PATCH update company - también protegido */
router.patch("/update", verifyToken, isOwner, async function (request, response) {
  try {
    const result = await companiesController.patchUpdate(request.body);
    response.status(200).json({
      status: true,
      message: "Compania actualizada exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error actualizando compania:", error);
    response.status(500).json({
      status: false,
      message: "Error al actualizar compania",
      error: error.message,
    });
  }
});

module.exports = router;
