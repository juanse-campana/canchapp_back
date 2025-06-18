var express = require("express");
var router = express.Router();

const fieldsController = require("../controllers/fields.controller");

router.get("/list", async function (request, response) {
  const result = await fieldsController.getList();
  response.status(200).json({
    data: result,
    status: true,
    message: "TODO ESTA OK ",
  });
});


router.post("/create", function (request, response) {
  console.log(request.body);
  const result = fieldsController.postCreate(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});



router.patch("/update", function (request, response) {
  const result = fieldsController.patchUpdate(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});

router.delete("/delete", function (request, response) {
  const result = fieldsController.deleteDelete(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});

module.exports = router;