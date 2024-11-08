const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes');
const recipeRoutes = require('./routes/recipeRoutes');
const commentRoutes = require('./routes/commentRoutes');
const errorHandler = require('./middlewares/errorHandler');
const setupSwagger = require('../swagger');
const xssClean = require('xss-clean');
const rateLimit = require('express-rate-limit');

dotenv.config();


const app = express();

//connect to database
connectDB();

// Setup Swagger
setupSwagger(app);

//Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Use xss-clean middleware to sanitize request data
// app.use((xssClean));
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'trusted-cdn.com'"], // Allow scripts only from self and trusted sources
        objectSrc: ["'none'"], // Disallow plugins
        upgradeInsecureRequests: ["'https://'"], // Optionally upgrade http:// to https://
    },
}));

// // Define rate limiting rule
// const authLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 101, // Limit each IP to 5 requests per `windowMs`
//     message: {
//         message: 'Too many attempts from this IP, please try again after 15 minutes.',
//     },
//     standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//     legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });

//Routes
app.use('/api/v1/auth',xssClean(), authRoutes);
app.use('/api/v1/recipes', recipeRoutes);
app.use('/api/v1/comments', commentRoutes);

app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});
//Error handling
app.use(errorHandler);

//Start server 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))

module.exports = app;