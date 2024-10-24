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


dotenv.config();


const app = express();

//connect to database
connectDB();

//Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

//Routes
app.use('/api/auth',authRoutes);
app.use('/api/recipes',recipeRoutes);
app.use('/api/comments',commentRoutes);

app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});
//Error handling
app.use(errorHandler);

//Start server 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>  console.log(`Server is running on port ${PORT}`))

module.exports = app;