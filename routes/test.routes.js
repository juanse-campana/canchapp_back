var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(request, response) {
  response.status(200).json ({
    status:true,
    message:"todo esta ok"
  })
});

module.exports = router;
