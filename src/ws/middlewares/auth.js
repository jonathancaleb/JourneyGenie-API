const jwt = require('jsonwebtoken');
const config = require('../../config');
const { User } = require('../../models/users.model');

async function authenticate(socket) {
    try {
        // Check if socket connection is just to track ride location
        const ride_tracking_id = socket.handshake.query?.ride_tracking_id
        if (ride_tracking_id) {
            socket.user = { id: ride_tracking_id, permission: 'ride_tracking' }
            return socket
        }

        const token = socket.handshake.query?.access_token;
        if (!token) {
            throw new Error('Authentication token not provided')
        }

        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
        const user_doc = await User.findById(decoded.id)
            .populate({
                path: 'rider',
                populate: {
                    path: 'location',
                    model: 'RiderLocation'
                }
            });

        // Show virtuals
        socket.user = user_doc;

        return socket
    } catch (err) {
        console.log(err)
        return err
    }
}

module.exports = authenticate
