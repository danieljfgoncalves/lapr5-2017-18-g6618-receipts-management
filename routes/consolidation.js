/**
 * consolidation.js
 * 
 * Route concepts related to consolidation deadlines, etc.
 */
const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middlewares/authentication');
const consolidationController = require('../controllers/consolidationController');


// POST /api/consolidation/threatInfo
router.post('/consolidation/threatInfo', authMiddleware.getApiToken, consolidationController.threatInfo);


module.exports = router;