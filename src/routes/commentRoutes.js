const express = require('express');
const { addComment, getComments } = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { createCommentSchema } = require('../validators/commentValidator');

const router = express.Router();

// @route   POST /api/comments
router.post('/', protect, validate(createCommentSchema), addComment);

// @route   GET /api/comments/:recipeId
router.get('/:recipeId', getComments);

module.exports = router;
