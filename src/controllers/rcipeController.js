const Recipe = require('../models/Recipe');
const Rating = require('../models/Rating');
const Comment = require('../models/Comment');
const { default: mongoose } = require('mongoose');
const { convertPreparationTime } = require('../services/recipeService');
// Swagger annotations

/**
 * @swagger
 * /api/v1/recipes:
 *   post:
 *     summary: Create a new recipe
 *     tags: [Recipes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *               steps:
 *                 type: array
 *                 items:
 *                   type: string
 *               image:
 *                 type: string
 *               preparationTime:
 *                 type: string
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *       500:
 *         description: Server error
 */
const createRecipe = async (req, res) => {
  const { title, ingredients, steps, image, preparationTime } = req.body;

  try {
    const convertedPreparationTime = convertPreparationTime(preparationTime);
    const recipe = await Recipe.create({
      title,
      ingredients,
      steps,
      image,
      preparationTime: convertedPreparationTime,
      author: req.user._id,
    });

    res.status(201).json(recipe);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      // Handle validation errors
      res.status(400).json({ message: 'Validation error', details: error.errors });
    } else if (error instanceof mongoose.Error.CastError) {
      // Handle invalid ObjectId error
      res.status(400).json({ message: 'Invalid data format', details: error.message });
    } else {
      // General server error
      console.error('Database error:', error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
    }
  }
};


/**
 * @swagger
 * /api/v1/recipes:
 *   get:
 *     summary: Get recipes with search, filter, and pagination
 *     tags: [Recipes]
 *     parameters:
 *       - name: ingredients
 *         in: query
 *         required: false
 *         description: Filter by ingredients
 *         schema:
 *           type: string
 *       - name: rating
 *         in: query
 *         required: false
 *         description: Minimum average rating
 *         schema:
 *           type: number
 *       - name: preparationTime
 *         in: query
 *         required: false
 *         description: Maximum preparation time
 *         schema:
 *           type: number
 *       - name: page
 *         in: query
 *         required: false
 *         description: Page number
 *         schema:
 *           type: number
 *           default: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Number of recipes per page
 *         schema:
 *           type: number
 *           default: 10
 *       - name: search
 *         in: query
 *         required: false
 *         description: Search term for recipe title or ingredients
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of recipes
 *       500:
 *         description: Server error
 */
const getRecipes = async (req, res) => {
  const { ingredients, rating, preparationTime, page = 1, limit = 10, search } = req.query;

  // Prepare filters
  let filter = {};

  // Handle search term
  if (search) {
    const searchRegex = new RegExp(search, 'i'); // Create a case-insensitive regex
    filter = {
      $or: [
        { title: searchRegex }, // Search in title
        { ingredients: { $elemMatch: { $regex: searchRegex } } }, // Search in ingredients
      ],
    };
  }

  // Existing filter handling for rating and preparation time
  if (rating) {
    filter.averageRating = { $gte: Number(rating) };
  }

  if (preparationTime) {
    filter.preparationTime = { $lte: Number(preparationTime) };
  }

  // Ensure page is at least 1, convert it to a number, and handle pagination
  const currentPage = Math.max(1, Number(page)); // Make sure currentPage is at least 1 and properly cast to a number
  const skip = (currentPage - 1) * limit; // Calculate the skip based on the current page

  try {
    // Fetch paginated recipes
    const recipes = await Recipe.find(filter)
      .populate('author', 'username')
      .populate({ path: 'ratings', select: 'value' })
      .populate({ path: 'comments', select: 'content author', populate: { path: 'author', select: 'username' } })
      .skip(skip)
      .limit(Number(limit)); // Convert limit to a number

    // Get the total number of recipes for the filters applied
    const totalRecipes = await Recipe.countDocuments(filter);
    const totalPages = Math.ceil(totalRecipes / limit);

    // Return paginated results
    res.status(200).json({ recipes, totalPages, currentPage: currentPage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * @swagger
 * /api/v1/recipes/{id}:
 *   get:
 *     summary: Get a single recipe by ID
 *     tags: [Recipes]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Recipe ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipe details
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
const getRecipeById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }

    const recipe = await Recipe.findById(req.params.id)
      .populate('author', 'username')
      .populate('ratings', 'value')
      .populate({ path: 'comments', select: 'content author', populate: { path: 'author', select: 'username' } });

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.status(200).json(recipe);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};


/**
 * @swagger
 * /api/v1/recipes/{id}/rate:
 *   post:
 *     summary: Rate a recipe
 *     tags: [Recipes]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Recipe ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *                 description: Rating value (1-5)
 *     responses:
 *       200:
 *         description: Average rating updated
 *       400:
 *         description: Invalid rating value
 *       500:
 *         description: Server error
 */
const rateRecipe = async (req, res) => {
  const { value } = req.body;
  const { id: recipeId } = req.params;

  if (value < 1 || value > 5) {
    return res.status(400).json({ message: 'Invalid rating value. Must be between 1 and 5.' });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }

    let rating = await Rating.findOne({ recipe: recipeId, user: req.user._id });

    if (rating) {
      rating.value = value;
      await rating.save();
    } else {
      rating = await Rating.create({ recipe: recipeId, user: req.user._id, value });
      await Recipe.findByIdAndUpdate(recipeId, { $push: { ratings: rating._id } });
    }

    const recipe = await Recipe.findById(recipeId).populate('ratings');
    recipe.calculateAverageRating();
    await recipe.save();

    res.status(200).json({ averageRating: recipe.averageRating });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};


module.exports = {
  createRecipe,
  getRecipes,
  getRecipeById,
  rateRecipe,
};
