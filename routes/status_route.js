// routes/status.js

var express     = require('express');
var router      = express.Router();

// require controller modules
var statusController=require('../controllers/statusController');

// GET /api/status
router.get('/status', statusController.get_status);

module.exports=router;