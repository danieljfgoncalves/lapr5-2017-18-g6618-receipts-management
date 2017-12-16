// routes/authentication.js

var express     = require('express');
var router      = express.Router();
var controller  = require('../controllers/authenticationController')

// POST route for registration
router.post('/register', controller.postRegistration);

// POST route to authenticate (obtain token)
router.post('/authenticate', controller.postAuthentication);

// GET /api/users/{id}
router.get('/users/:id', controller.getUser);

module.exports = router;