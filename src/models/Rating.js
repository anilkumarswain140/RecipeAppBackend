const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    value: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Please add a rating between 1 and 5'],
    },
  },
  { timestamps: true }
);

// Ensure a user can rate a recipe only once
ratingSchema.index({ recipe: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
