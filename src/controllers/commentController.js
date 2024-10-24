const Comment = require('../models/Comment');
const Recipe = require('../models/Recipe');

// @desc    Add a comment to a recipe
// @route   POST /api/comments
// @access  Private
const addComment = async (req, res) => {
  const { recipeId, content } = req.body;

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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get comments for a recipe
// @route   GET /api/comments/:recipeId
// @access  Public
const getComments = async (req, res) => {
  const { recipeId } = req.params;

  try {
    const comments = await Comment.find({ recipe: recipeId })
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addComment, getComments };
