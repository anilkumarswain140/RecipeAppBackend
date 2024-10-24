const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add a title'],
            trim: true,
        },
        ingredients: {
            type: [String],
            required: [true, 'please add ingredients'],
        },
        steps: {
            type: [String],
            required: [true, 'please add steps']
        },
        image: {
            type: String,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        ratings: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Rating',
            },
        ],
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Comment',
            },
        ],
        averageRating: {
            type: Number,
            default: 0,
        },
        preparationTime: {
            type: Number, // in minutes
            required: [true, 'Please add preparation time'],
        },
    },
    { timestamps: true }
)


// Calculate average rating
recipeSchema.methods.calculateAverageRating = function () {
    if (this.ratings.length === 0) {
      this.averageRating = 0;
    } else {
      const sum = this.ratings.reduce((acc, rating) => acc + rating.value, 0);
      this.averageRating = sum / this.ratings.length;
    }
    return this.averageRating;
  };


  module.exports = mongoose.model('Recipe',recipeSchema);