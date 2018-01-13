// routes/authentication.js

const express = require('express');
const router = express.Router();
const controller = require('../controllers/authenticationController');
const authMiddleware = require('../middlewares/authentication');

// POST route for registration
router.post('/signup', authMiddleware.getApiToken, controller.signup);

// POST route to authenticate (obtain token)
router.post('/authenticate', controller.authenticate);

// POST route to authenticate mfa token
router.post('/authenticate/mfa', controller.mfaAuthenticate);

// DELETE /api/deleteAccount
router.delete('/deleteAccount/:id', authMiddleware.getApiToken, controller.deleteUser);

// GET /api/users/{id}
router.get('/users', authMiddleware.getApiToken, controller.getUsers);

// // GET /api/users/{id}
router.get('/users/:id', authMiddleware.getApiToken, controller.getUser);

module.exports = router;