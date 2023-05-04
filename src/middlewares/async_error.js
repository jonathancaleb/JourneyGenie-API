// Description: This middleware is used to catch the error thrown by the async function

module.exports = function (options) {
    return function (req, res, next) {
        // listen for local error
        process.on('uncaughtException', (err) => {
            next(err);
        });
    
        next()
    }
};


