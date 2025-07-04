var express = require("express");
var router = express.Router();

const usersController = require("../controllers/users.controller");

/* POST METHOD USERS USER. */
router.get("/list", async function (request, response) {
  const result = await usersController.getList();
  response.status(200).json({
    data: result,
    status: true,
    message: "TODO ESTA OK ",
  });
});


router.post("/create", async function (req, res) {
  console.log(req.body);

  try {
    await usersController.postCreate(req, res); 
  } catch (error) {
  
    console.error('Error no capturado en la ruta /users/create:', error);
    if (!res.headersSent) { 
      res.status(500).json({
        status: false,
        message: 'Error interno del servidor.'
      });
    }
  }
});


router.patch("/update", function (request, response) {
  const result = usersController.patchUpdate(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});

module.exports = router;