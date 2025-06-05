var express = require("express");
var router = express.Router();

const usersController = require("../controllers/users.controller");

/* POST METHOD USERS USER. */
router.post("/list", async function (request, response) {
  const result = await usersController.postList();
  response.status(200).json({
    data: result,
    status: true,
    message: "TODO ESTA OK ",
  });
});


router.post("/create", function (request, response) {
  console.log(request.body);
  const result = usersController.postCreate(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});



router.post("/update", function (request, response) {
  const result = usersController.postUpdate(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});

router.post("/delete", function (request, response) {
  const result = usersController.postDelete(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});

router.post('/login', async function(request, response) {
  const result = await usersController.getLogin(
    request.body
  );
  response.status(200).json ({
    status:!result ? false:true,
    message:!result ? "Credenciales incorrectas":"Login Correcto",
    info: result,
  });
});

router.post("/list-open-registers", async function (request, response) {
  const result = await usersController.getOpenRegisters();
  response.status(200).json({
    data: result,
    status: true,
    message: "TODO ESTA OK ",
  });
});

module.exports = router;