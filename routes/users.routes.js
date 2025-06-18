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


router.post("/create", function (request, response) {
  console.log(request.body);
  const result = usersController.postCreate(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});



router.patch("/update", function (request, response) {
  const result = usersController.patchUpdate(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});

module.exports = router;