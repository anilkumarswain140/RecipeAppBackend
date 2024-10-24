const express = require('express');
const { register, login } = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/authValidator');

const router = express.Router();

// @route   POST /api/auth/register
router.post('/register', validate(registerSchema), register);

// @route   POST /api/auth/login
router.post('/login', validate(loginSchema), login);

module.exports = router;
