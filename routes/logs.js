/**
 * logs.js
 * 
 * Route to retrieve logs data.
 */
const express = require('express');
const router  = express.Router();
const auth = require('../middlewares/authentication');
const logsController = require('../controllers/logsController');

// Add Authentication authentication
router.use('/logs', auth.handleToken, auth.getApiToken);


// GET /api/logs/auth
router.get('/logs/auth', logsController.authLogs);

// GET /api/logs/http/requests
router.get('/logs/http/requests', logsController.getHttpRequests);


module.exports = router;