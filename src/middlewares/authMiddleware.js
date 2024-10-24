const jwt = require('jsonwebtoken');
const User = require('../models/User')

const protect = async (req, res, next) => {
    let token;

    //Check for token in header
    console.log(req.headers);
    
    if (req.headers?.authorization && req.headers?.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ mesage: 'Not autherized, no token' });
    }

    try {
        //Verfy token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        //Attach user to request
        req.user = await User.findById(decoded.id).select('-password');
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Not autherized, token failed' });
    }
}

module.exports = { protect }