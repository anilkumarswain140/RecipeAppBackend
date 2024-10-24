const Joi = require('joi');

const createRecipeSchema = Joi.object({
    title: Joi.string().required(),
    ingredients: Joi.array().items(Joi.string()).required(),
    steps: Joi.array().items(Joi.string()).required(),
    image: Joi.string().uri().optional(),
    preparationTime: Joi.number().integer().min(1).required(),
});

const updateRecipeSchema = Joi.object({
    title: Joi.string().optional(),
    ingredients: Joi.array().items(Joi.string()).optional(),
    steps: Joi.array().items(Joi.string()).optional(),
    image: Joi.string().uri().optional(),
    preparationTime: Joi.number().integer().min(1).optional(),
});

module.exports = { createRecipeSchema, updateRecipeSchema };
