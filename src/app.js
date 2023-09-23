// Importing necessary modules
const express = require('express');  // Express.js framework for building web applications
const morgan = require('morgan');  // HTTP request logger middleware
const cors = require('cors');  // Cross-Origin Resource Sharing middleware
const errorHandler = require('./middlewares/error_handler');  // Custom error handling middleware
require('express-async-errors');  // Middleware for handling async errors in Express

const app = express();  // Create an instance of the Express application

// Export the Express app instance for usage elsewhere
exports.app = app;

// Middlewares
// If the environment is 'dev', use morgan for request logging
if (process.env.NODE_ENV == 'dev') {
    app.use(morgan('dev'));
}

// Enable CORS for requests from http://localhost:5000 with credentials
app.use(cors({
    origin: 'http://localhost:5000',
    credentials: true,
}));

app.use(express.json());  // Middleware to parse incoming requests with JSON payloads

// Routes
// Set up various routes for different API endpoints
app.use('/api/v1/auth', require('./routes/auth.route'));
app.use('/api/v1/user', require('./routes/user.route'));
app.use('/api/v1/vehicle', require('./routes/vehicle.route'));
app.use('/api/v1/bankaccount', require('./routes/bankaccount.route'));
app.use('/api/v1/card', require('./routes/card.route'));
app.use('/api/v1/wallet', require('./routes/wallet.route'));
app.use('/api/v1/transaction', require('./routes/transaction.route'));
app.use('/api/v1/ride', require('./routes/ride.route'));
app.use('/api/v1/rider', require('./routes/rider.route'));

// Error handler middleware
app.use(errorHandler);  // Use the custom error handling middleware

// 404 Not Found handler
app.use((req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`,
    });
});

// Export the Express app instance for usage elsewhere
module.exports = app;
