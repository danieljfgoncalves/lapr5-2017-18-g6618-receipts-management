// routes/comments.js

var express     = require('express');
var router      = express.Router();
var authentications = require('../middlewares/authentication');

// Require controller modules
var comments_controller = require('../controllers/commentController');

// Add Authentication authentication
router.use('/comments', authentications.authenticateToken);

// GET /api/comments
router.get('/comments', comments_controller.get_comments);

// GET /api/comments/{id}
router.get('/comments/:id', comments_controller.get_comment);

// POST /api/comments
router.post('/comments', comments_controller.post_comment);

// PUT /api/comments/{id}
router.put('/comments/:id', comments_controller.put_comment);

// DELETE /api/comments/{id}
router.delete('/comments/:id', comments_controller.delete_comment);

// GET /api/comments/presentation/{id}
router.get('/comments/presentation/:id', comments_controller.get_comments_of_presentation);

module.exports = router;