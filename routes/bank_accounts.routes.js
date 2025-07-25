var express = require("express");
var router = express.Router();

const bankAccountsController = require("../controllers/bank_accounts.controller");
const verifyToken = require("../middlewares/verifyToken");
const isOwner = require("../middlewares/isOwner");

router.get("/list", async function (request, response) {
  try {
    const result = await bankAccountsController.getList();
    response.status(200).json({
    data: result,
    status: true,
    message: "Cuentas bancarias actualizadas exitosamente",
    });
  } catch (error) {
    console.error("Error al listar las cuentas bancarias: ", error)
    response.status(500).json({
      status: false,
      message: "Error al listar las cuentas bancarias"
    })
  }
});


router.post("/create", verifyToken, isOwner, async function (request, response) {
  console.log(request.body);
  try {
    const result = await bankAccountsController.postCreate(request.body);
    response.status(200).json({
      status: true,
      message: "Cuenta bancaria registrada exitosamente",
      info: result,
    });
  } catch (error) {
    console.error("Error al crear la cuenta bancaria:", error);
    response.status(500).json({
      status: false,
      message: "Ocurrió un error al crear la cuenta bancaria.",
      error: error.message, // Puedes enviar un mensaje de error más específico
    });
  }
});



router.patch("/update", verifyToken, isOwner, async function (request, response) {
  try {
    const result = await bankAccountsController.patchUpdate(request.body);
  response.status(200).json({
    status: true,
    message: "Cuenta bancaria actualizada exitosamente",
    info: result,
  });
  } catch (error) {
    console.error("Error al actualizar la cuenta bancaria:", error);
    response.status(500).json({
      status: false,
      message: "Ocurrió un error al actualizar la cuenta bancaria.",
      error: error.message, // Puedes enviar un mensaje de error más específico
    });
  }
  
});

module.exports = router;