/**
 * logs.js
 * 
 * Route to retrieve logs data.
 */
const express = require('express');
const router  = express.Router();
const auth = require('../middlewares/authentication');
const logsController = require('../controllers/logsController');


// GET /api/logs/auth
router.get('/logs/auth', auth.handleToken, auth.getApiToken, logsController.authLogs);


module.exports = router;