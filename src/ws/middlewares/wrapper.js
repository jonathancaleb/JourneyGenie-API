function socketAsyncWrapper(fn) {
    return async (...args) => {
        try {
            await fn(...args);
        } catch (error) {
            console.error(error);
        }
    };
}

module.exports = socketAsyncWrapper;
