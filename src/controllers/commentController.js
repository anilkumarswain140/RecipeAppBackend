const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Recipe = require('../models/Recipe');

/**
 * @swagger
 * /api/v1/comments:
 *   post:
 *     summary: Add a comment to a recipe
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []  # Require authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipeId:
 *                 type: string
 *                 description: The ID of the recipe to comment on
 *               content:
 *                 type: string
 *                 description: The content of the comment
 *             required:
 *               - recipeId
 *               - content
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
const addComment = async (req, res) => {
  const { recipeId, content } = req.body;

  // Check for valid ObjectId format
  if (!mongoose.Types.ObjectId.isValid(recipeId)) {
    return res.status(400).json({ message: 'Invalid recipe ID format' });
  }

  try {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const comment = await Comment.create({
      recipe: recipeId,
      author: req.user._id,
      content,
    });

    recipe.comments.push(comment._id);
    await recipe.save();

    res.status(201).json(comment);
  } catch (error) {
    if (error.name === 'ValidationError') {
      res.status(400).json({ message: 'Validation error', details: error.errors });
    } else {
      console.error('Database error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

/**
 * @swagger
 * /api/v1/comments/{recipeId}:
 *   get:
 *     summary: Get comments for a recipe
 *     tags: [Comments]
 *     parameters:
 *       - name: recipeId
 *         in: path
 *         required: true
 *         description: The ID of the recipe to get comments for
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of comments for the specified recipe
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
const getComments = async (req, res) => {
  const { recipeId } = req.params;

  // Check for valid ObjectId format
  if (!mongoose.Types.ObjectId.isValid(recipeId)) {
    return res.status(400).json({ message: 'Invalid recipe ID format' });
  }

  try {
    const comments = await Comment.find({ recipe: recipeId })
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addComment, getComments };
