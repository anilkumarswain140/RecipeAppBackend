const User = require('../models/User')
const generateToken = require('../utils/generateToken')
// @desc Register
// @route POST /api/auth/register
// @access public

const register = async (req, res) => {
    const { username, email, password } = req.body;
    console.log("body",req.body);
    
    try {
        let user = await User.findOne({ $or: [{ username }, { email }] })

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        user = await User.create({
            username,
            email,
            password,
        });

        res.status(201).json({
            user: {
                id: user._id,
                username,
                email
            }
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}


// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);
    
    try {
        // Check for user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { register, login };