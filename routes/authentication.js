// routes/authentication.js

const express = require('express');
const router = express.Router();
const controller = require('../controllers/authenticationController');
const authMiddleware = require('../middlewares/authentication');

// POST route for registration
router.post('/signup', authMiddleware.getApiToken, controller.signup);

// POST route to authenticate (obtain token)
router.post('/authenticate', controller.authenticate);

// GET /api/users/{id}
router.get('/users', authMiddleware.getApiToken, controller.getUsers);

// // GET /api/users/{id}
router.get('/users/:id', authMiddleware.getApiToken, controller.getUser);

module.exports = router;