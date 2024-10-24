const Joi = require('joi');

const createCommentSchema = Joi.object({
    recipeId: Joi.string().required(),
    content: Joi.string().required(),
});

module.exports = { createCommentSchema };
