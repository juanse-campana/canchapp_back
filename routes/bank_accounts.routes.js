var express = require("express");
var router = express.Router();

const bankAccountsController = require("../controllers/bank_accounts.controller");

/* POST METHOD USERS USER. */
router.get("/list", async function (request, response) {
  const result = await bankAccountsController.getList();
  response.status(200).json({
    data: result,
    status: true,
    message: "TODO ESTA OK ",
  });
});


router.post("/create", function (request, response) {
  console.log(request.body);
  const result = bankAccountsController.postCreate(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});



router.patch("/update", function (request, response) {
  const result = bankAccountsController.patchUpdate(request.body);
  response.status(200).json({
    status: true,
    info: result,
  });
});

module.exports = router;