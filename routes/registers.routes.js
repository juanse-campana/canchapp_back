var express = require("express");
var router = express.Router();

const registersController = require("../controllers/registers.controller");

/* POST METHOD USERS USER. */
router.post("/list", async function (request, response) {
  const result = await registersController.postList();
  response.status(200).json({
    data: result,
    status: true,
    message: "TODO ESTA OK ",
  });
});


router.post("/create", function (request, response) {
  console.log(request.body);
  const result = registersController.postCreate(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});



router.post("/update", function (request, response) {
  const result = registersController.postUpdate(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});

router.post("/delete", function (request, response) {
  const result = registersController.postDelete(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});

router.post("/lastestRegisters", async function (request, response) {
  const result = await registersController.getLastestRegisters();
  response.status(200).json({
    data: result,
    status: true,
    message: "TODO ESTA OK ",
  });
});

router.post("/RegistersByDateRange", async function (request, response) {
  const result = await registersController.getRegistersByDateRange(request.body);
  response.status(200).json({
    data: result,
    status: true,
    message: "TODO ESTA OK ",
  });
});

module.exports = router;