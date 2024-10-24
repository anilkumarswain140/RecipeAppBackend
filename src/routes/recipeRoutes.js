const express = require('express');
const {
  createRecipe,
  getRecipes,
  getRecipeById,
  searchRecipes,
  filterRecipes,
  rateRecipe,
} = require('../controllers/rcipeController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const { createRecipeSchema, updateRecipeSchema } = require('../validators/recipeValidator');

const router = express.Router();

// @route   POST /api/recipes
router.post('/', protect, validate(createRecipeSchema), createRecipe);

// @route   GET /api/recipes
router.get('/', protect, getRecipes);

// @route   GET /api/recipes/:id
router.get('/recipe/:id', getRecipeById);

// @route   POST /api/recipes/:id/rate
router.post('/:id/rate', protect, rateRecipe);

module.exports = router;
