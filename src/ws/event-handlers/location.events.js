const { RiderLocation } = require('../../models/location.model');
const { joinRoom } = require('../utils/rooms');

const saveNewLocation = async function (data, socket) {
    try {
        if (!socket) socket = this;

        const { location } = data
        const [longitude, latitude] = location.coordinates

        // Create new location
        const new_location = await RiderLocation.create({
            rider: socket.user.rider._id,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude],
            },
        });

        return new_location;
    } catch (error) {
        console.log(error)
    }
};

const updateLocation = async function (data, res) {
    try {
        console.log('updateLocation')
        const socket = this
        const curr_location = data.location
        const [longitude, latitude] = curr_location.coordinates

        // Check if location record exists
        const location = await RiderLocation.findOne({ rider: socket.user.rider._id });
        if (!location) {
            // Create new location if no existing location
            const new_location_data = {
                rider_id: socket.user.rider._id,
                location: { coordinates: [longitude, latitude] }
            }
            await saveNewLocation(new_location_data, socket)

            // Broadcast current riders location to listeners
            await broadcastRiderlocation(new_location_data)

            res.send(null, new_location_data)
            return
        }

        // Update existing location
        const new_location_data = await location.updateCoordinates(longitude, latitude)

        // Broadcast current location to listeners
        await broadcastRiderlocation(new_location_data)
        
        res.send(null, new_location_data)
        return
    } catch (error) {
        res.send(error)
        return
    }
}

const joinRideLocationRoom = async function (data, res) {
    try {
        const socket = this
        const ride_id = data.ride_id

        joinRoom(socket, `ride_tracking:${ride_id}`)

        res.send(null, 'Successfully joined room')
    } catch (error) {
        res.send(error)
        return
    }
}

const broadcastRiderlocation = async function (rider_location) {
    try {
        rider_location = await rider_location.populate('rider')

        const ride_id = rider_location.rider.current_ride
        const room_id = `ride_tracking:${ride_id}`

        // Check if broadcast already exists for ride
        const broadcast_exists = io.sockets.adapter.rooms[room_id]
        if (!broadcast_exists) return;

        // Broadcast current rider's location to room
        io.to(room_id).emit('ride:location_update', {
            location: rider_location
        })
    } catch (error) {
        res.send(error)
        return
    }
}

const getLocation = async function (data, res) {
    const socket = this

    const { rider } = socket.user
    const rider_location = rider.location

    if (!rider_location) {
        res.send('Rider location not found', null)
    }

    res.send(null, rider_location)
}

module.exports = (io, socket) => {
    try {
        global.io = io;

        const res = new Map()
        res.send = (error, data) => {
            const response_path = res.path
            const response_data = { error, data }

            if (error) console.log(error);
            socket.emit(response_path, response_data)
        }

        async function socketHandlerMiddleware(data, path) {
            try {
                const socket = this;

                // Get request handler from socket_paths
                const socketRequestHandler = socket_paths[path];

                const req = { user: socket.user, data, path }
                res.path = 'response:' + path;

                // Check if user is authenticated 
                // if authenticated socket.user will be set by auth middleware
                let response = null;
                if (socket.user) {
                    response = await socketRequestHandler.call(socket, req, res);
                    return;
                }
                if (response instanceof Error) { throw response };

                res.send(res.path, { error: 'User is not authenticated' })
            } catch (error) {
                console.log(error)
                res.send(res.path, { error: 'Something went wrong' })
            }
        }

        const socket_paths = {
            "location:update": updateLocation,
            "location:get-location": getLocation,
            "location:save-new": saveNewLocation,
            "location:room:join": joinRideLocationRoom
        };

        const SHM = socketHandlerMiddleware
        socket.on('location:update',
            (data) => SHM.call(socket, data, "location:update"));
        socket.on('location:get-location',
            (data) => SHM.call(socket, data, "location:get-location"));
        socket.on('location:save-new',
            (data) => SHM.call(socket, data, "location:save-new"));
        socket.on('location:room:join',
            (data) => SHM.call(socket, data, "location:room:join"))

    } catch (error) {
        console.log(error)
    }

}
