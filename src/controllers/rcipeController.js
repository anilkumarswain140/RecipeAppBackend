const Recipe = require('../models/Recipe');
const Rating = require('../models/Rating');
const Comment = require('../models/Comment');
const { default: mongoose } = require('mongoose');

// @desc    Create a new recipe
// @route   POST /api/recipes
// @access  Private
const { convertPreparationTime } = require('../services/recipeService');

const createRecipe = async (req, res) => {
  const { title, ingredients, steps, image, preparationTime } = req.body;
  console.log(req.body);

  try {
    // Convert preparation time
    const convertedPreparationTime = convertPreparationTime(preparationTime);

    const recipe = await Recipe.create({
      title,
      ingredients,
      steps,
      image,
      preparationTime: convertedPreparationTime, // Use converted preparation time
      author: req.user._id,
    });

    res.status(201).json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get recipes with search, filter, and pagination
// @route   GET /api/recipes
// @access  Public
// Updated getRecipes function with search capability
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



// @desc    Get single recipe details
// @route   GET /api/recipes/:id
// @access  Public
const getRecipeById = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ message: "Please pass Recipe id" })
    }
    const recipeId = new mongoose.Types.ObjectId(req.params.id);
    const recipe = await Recipe.findById(recipeId)
      .populate('author', 'username')
      .populate({
        path: 'ratings',
        select: 'value',
      })
      .populate({
        path: 'comments',
        select: 'content author',
        populate: { path: 'author', select: 'username' },
      });

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.status(200).json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Rate a recipe
// @route   POST /api/recipes/:id/rate
// @access  Private
const rateRecipe = async (req, res) => {
  const { value } = req.body;
  const recipeId = req.params.id;
  const userId = req.user._id;

  try {
    let rating = await Rating.findOne({ recipe: recipeId, user: userId });

    if (rating) {
      // Update existing rating
      rating.value = value;
      await rating.save();
    } else {
      // Create new rating
      rating = await Rating.create({ recipe: recipeId, user: userId, value });
      await Recipe.findByIdAndUpdate(recipeId, { $push: { ratings: rating._id } });
    }

    // Update average rating
    const recipe = await Recipe.findById(recipeId).populate('ratings');
    recipe.calculateAverageRating();
    await recipe.save();

    res.status(200).json({ averageRating: recipe.averageRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createRecipe,
  getRecipes,
  getRecipeById,
  rateRecipe,
};
