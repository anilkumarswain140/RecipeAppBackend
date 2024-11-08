// tests/recipe.test.js
const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const Recipe = require('../src/models/Recipe');
const jwt = require('jsonwebtoken');

describe('Recipe Endpoints', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Clear users and recipes
    await User.deleteMany({});
    await Recipe.deleteMany({});

    // Create a user and generate a token
    const user = await User.create({
      username: 'recipeuser',
      email: 'recipe@example.com',
      password: 'password123',
    });
    userId = user._id;

    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE,
    });
  });

  afterAll(async () => {
    // Clean up after all tests are done
    await User.deleteMany({});
    await Recipe.deleteMany({});
  });

  describe('POST /api/v1/recipes', () => {
    it('should create a new recipe', async () => {
      const res = await request(app)
        .post('/api/v1/recipes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Spaghetti Bolognese',
          ingredients: ['Spaghetti', 'Tomato Sauce', 'Ground Beef'],
          steps: ['Boil spaghetti', 'Cook beef', 'Mix with sauce'],
          preparationTime: 30,
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('title', 'Spaghetti Bolognese');
      expect(res.body).toHaveProperty('ingredients');
      expect(res.body.ingredients).toContain('Spaghetti');
    });

    it('should not create a recipe without authentication', async () => {
      const res = await request(app).post('/api/v1/recipes').send({
        title: 'Chicken Curry',
        ingredients: ['Chicken', 'Curry Powder', 'Coconut Milk'],
        steps: ['Cook chicken', 'Add curry powder', 'Pour coconut milk'],
        preparationTime: 45,
      });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Not authorized, no token');
    });

    it('should not create a recipe with missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/recipes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Incomplete Recipe',
          ingredients: ['Ingredient 1'],
          // Missing steps and preparationTime
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/v1/recipes', () => {
    beforeAll(async () => {
      // Create multiple recipes
      await Recipe.create([
        {
          title: 'Pancakes',
          ingredients: ['Flour', 'Milk', 'Eggs'],
          steps: ['Mix ingredients', 'Cook on skillet'],
          preparationTime: 20,
          author: userId,
        },
        {
          title: 'Omelette',
          ingredients: ['Eggs', 'Cheese', 'Ham'],
          steps: ['Beat eggs', 'Cook in pan', 'Add fillings'],
          preparationTime: 10,
          author: userId,
        },
      ]);
    });

    it('should fetch all recipes', async () => {
      const res = await request(app).get('/api/v1/recipes');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body[0]).toHaveProperty('title');
    });
  });

  describe('GET /api/v1/recipes/:id', () => {
    let recipeId;

    beforeAll(async () => {
      const recipe = await Recipe.create({
        title: 'Grilled Cheese Sandwich',
        ingredients: ['Bread', 'Cheese', 'Butter'],
        steps: ['Butter bread', 'Add cheese', 'Grill until golden'],
        preparationTime: 15,
        author: userId,
      });
      recipeId = recipe._id;
    });

    it('should fetch a single recipe by ID', async () => {
      const res = await request(app).get(`/api/v1/recipes/${recipeId}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('title', 'Grilled Cheese Sandwich');
      expect(res.body).toHaveProperty('ingredients');
      expect(res.body.ingredients).toContain('Cheese');
    });

    it('should return 404 for non-existent recipe', async () => {
      const nonExistentId = '60c72b2f9b1d8e1a4c8f9b1d'; // Example ObjectId
      const res = await request(app).get(`/api/v1/recipes/${nonExistentId}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'Recipe not found');
    });
  });

  describe('GET /api/v1/recipes/search', () => {
    beforeAll(async () => {
      // Ensure there are recipes to search
      await Recipe.create({
        title: 'Tomato Soup',
        ingredients: ['Tomatoes', 'Onions', 'Garlic'],
        steps: ['Cook tomatoes', 'Blend', 'Simmer with spices'],
        preparationTime: 25,
        author: userId,
      });
    });

    it('should search recipes by ingredients', async () => {
      const res = await request(app).get(
        '/api/v1/recipes/search?ingredients=Tomatoes,Onions'
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty('title', 'Tomato Soup');
    });

    it('should return empty array if no recipes match', async () => {
      const res = await request(app).get(
        '/api/v1/recipes/search?ingredients=Dragonfruit'
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(0);
    });
  });

  describe('GET /api/v1/recipes/filter', () => {
    beforeAll(async () => {
      // Add average ratings and preparation times
      const recipe1 = await Recipe.findOne({ title: 'Pancakes' });
      recipe1.averageRating = 4.5;
      await recipe1.save();

      const recipe2 = await Recipe.findOne({ title: 'Omelette' });
      recipe2.averageRating = 3.0;
      await recipe2.save();
    });

    it('should filter recipes by minimum rating', async () => {
      const res = await request(app).get('/api/v1/recipes/filter?rating=4');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      res.body.forEach((recipe) => {
        expect(recipe.averageRating).toBeGreaterThanOrEqual(4);
      });
    });

    it('should filter recipes by maximum preparation time', async () => {
      const res = await request(app).get('/api/v1/recipes/filter?preparationTime=15');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      res.body.forEach((recipe) => {
        expect(recipe.preparationTime).toBeLessThanOrEqual(15);
      });
    });

    it('should filter recipes by rating and preparation time', async () => {
      const res = await request(app).get(
        '/api/v1/recipes/filter?rating=3&preparationTime=20'
      );
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      res.body.forEach((recipe) => {
        expect(recipe.averageRating).toBeGreaterThanOrEqual(3);
        expect(recipe.preparationTime).toBeLessThanOrEqual(20);
      });
    });
  });

  describe('POST /api/v1/recipes/:id/rate', () => {
    let recipeId;

    beforeAll(async () => {
      const recipe = await Recipe.create({
        title: 'French Toast',
        ingredients: ['Bread', 'Eggs', 'Milk'],
        steps: ['Mix eggs and milk', 'Dip bread', 'Cook on skillet'],
        preparationTime: 15,
        author: userId,
      });
      recipeId = recipe._id;
    });

    it('should allow a user to rate a recipe', async () => {
      const res = await request(app)
        .post(`/api/v1/recipes/${recipeId}/rate`)
        .set('Authorization', `Bearer ${token}`)
        .send({ value: 5 });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('averageRating', 5);
    });

    it('should allow a user to update their rating', async () => {
      // Update rating to 4
      const res = await request(app)
        .post(`/api/v1/recipes/${recipeId}/rate`)
        .set('Authorization', `Bearer ${token}`)
        .send({ value: 4 });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('averageRating', 4);
    });

    it('should not allow rating without authentication', async () => {
      const res = await request(app)
        .post(`/api/v1/recipes/${recipeId}/rate`)
        .send({ value: 3 });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('message', 'Not authorized, no token');
    });

    it('should not allow invalid rating values', async () => {
      const res = await request(app)
        .post(`/api/v1/recipes/${recipeId}/rate`)
        .set('Authorization', `Bearer ${token}`)
        .send({ value: 6 }); // Invalid rating (greater than 5)
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('message');
    });
  });
});
