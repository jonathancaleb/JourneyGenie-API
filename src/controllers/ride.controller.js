// Utils
const {
    calcCordDistance,
    getCost,
    sendRideRequestToRiders,
    getRideRouteInKm,
    vehicle_rating,
    getClosestRiders,
} = require('../services/ride.service');
const { clients } = require('../ws/clients');
const { BadRequestError, UnauthorizedError, NotFoundError, APIServerError } = require('../utils/errors');
const config = require('../config');

// Models
const { DepartureOrDestination, RiderLocation } = require('../models/location.model');
const { Rider } = require('../models/users.model');
const { Ride, RideRequest, RideReview } = require('../models/ride.model');
const { stringify } = require('../utils/json');
const Vehicle = require('../models/vehicle.model');
const { initiateTransaction, debitWallet } = require('../services/payment/transaction.service');
const { randomUUID } = require('crypto');

// TODO: Improve code documentation by adding more explanations to errors 

/**
 * Initiate Ride Request
 *
 * @param {Object} departure
 * @param {Object} destination
 * @param {String} departure.address
 * @param {String} destination.address
 * @param {Array} departure.coordinates
 * @param {Array} destination.coordinates
 *
 * @returns {Object} rideRequest
 * @returns {Object} rideRequest.departure
 * @returns {Object} rideRequest.destination
 * @returns {Object} rideRequest.ride_route
 * @returns {Object} rideRequest.user
 * @returns {Object} rideRequest.ride
 * @returns {Number} rideRequest.urban_cost
 * @returns {Number} rideRequest.standard_cost
 * @returns {Number} rideRequest.elite_cost
 *
 * @throws {BadRequestError} Invalid ride info
 * @throws {BadRequestError} Invalid ride route
 * 
 * // TODO: filter fields in response for initate ride request
 */
const initRideRequest = async (req, res, next) => {
    // console.log(req.body)

    //  Get the ride info
    const { departure, destination } = req.body;

    if (
        !departure ||
        !destination ||
        !departure.coordinates ||
        !destination.coordinates ||
        !departure.address ||
        !destination.address
    ) {
        return next(new BadRequestError('Invalid ride info'));
    }

    // Create departure and destination locations
    const departure_location = await DepartureOrDestination.create({
        address: departure.address,
        type: 'departure',
        location: {
            type: 'Point',
            coordinates: departure.coordinates,
        },
    }),
        destination_location = await DepartureOrDestination.create({
            address: destination.address,
            type: 'destination',
            location: {
                type: 'Point',
                coordinates: destination.coordinates,
            },
        });

    /* Calculate distance between departure and destination 
       Distance should be for route, not straight line - Use google maps API */
    // const distance_in_km = getRideRouteInKm(departure_location, destination_location);
    const distance_in_km = 20;

    // Calculate cost of ride - based on cost per km and distance in km
    const ride_cost = config.COST_PER_KM * distance_in_km; // Distance in km from googleMap * multiplier

    // Effect cost multiplier for available packages, (elite, urban, standard)config.ELITE_MULTIPLIER, config.STANDARD_MULTIPLIER config.URBAN_MULTIPLIER
    const cost = {
        urban: ride_cost * 300,
        standard: ride_cost * 240,
        elite: ride_cost * 360,
    };

    console.log(ride_cost);
    console.log(cost);
    // Create ride request
    const ride_request = await RideRequest.create({
        departure: departure_location._id,
        destination: destination_location._id,
        user: req.user.id,
        urban_cost: cost.urban,
        standard_cost: cost.standard,
        elite_cost: cost.elite,
        distance: distance_in_km,
    });

    const ride_request_populated = await ride_request.populate('departure destination user');
    console.log(ride_request_populated);
    return res.status(200).json({
        success: true,
        data: ride_request_populated,
    });
};

/**
 * Complete Ride Request
 *
 * @param {String} ride_class
 * @param {String} payment_method
 * @param {String} ride_request_id
 *
 * @returns {Object} rideRequest
 * @returns {Object} rideRequest.departure
 * @returns {Object} rideRequest.destination
 * @returns {Object} rideRequest.ride_route
 * @returns {Object} rideRequest.user
 * @returns {Object} rideRequest.ride
 * @returns {Object} rideRequest.rider
 * @returns {Number} rideRequest.urban_cost
 * @returns {Number} rideRequest.standard_cost
 * @returns {Number} rideRequest.elite_cost
 *
 * // TODO: Include ride tracking link to response
 */
const completeRideRequest = async (req, res, next) => {
    // Get the selected ride class
    const { ride_class, ride_request_id } = req.body,
        payment_method = 'cash';

    // Check if ride request exists
    const ride_request = await RideRequest.findOneAndUpdate(
        { _id: ride_request_id, status: 'pending' },
        { ride_class, payment_method },
    ).populate('departure destination user');
    if (!ride_request) return next(new BadRequestError('Invalid ride request'));

    // Update ride request payment method
    ride_request.payment_method = payment_method;

    // Search for riders within the current users location
    const closest_riders = await getClosestRiders(ride_request.departure.location.coordinates);

    // Filter closest riders based on vehicle rating and online status
    const filtered_riders = closest_riders.filter(
        (rider) => {
            if (
                rider.vehicle.rating >= vehicle_rating[ride_class] &&
                rider.rider.isOnline &&
                rider.rider.isAvailable) {
                return rider
            }
        }
    );

    // Check if matching riders are available
    if (filtered_riders.length == 0) return next(new BadRequestError('No riders are available'));

    // Send ride request to riders
    const rider_response = await sendRideRequestToRiders(filtered_riders, ride_request);
    if (!rider_response) {
        ride_request.status = 'cancelled';
        await ride_request.save();

        return next(new NotFoundError('No riders available'));
    }

    // Update ride request status
    ride_request.status = 'accepted';
    await ride_request.save();

    // Save ride request
    const ride = await (await ride_request.save()).populate({
        path: 'ride',
        populate: {
            path: 'passenger rider vehicle departure destination',
        },
    });

    // Set rider data
    ride.rider = (await ride.rider.populate('user')).user;

    return res.status(200).json({
        success: true,
        data: {
            ride_request: ride.toJSON(),
        }
    });
};

/**
 * Cancel Ride Request
 *
 * @param {String} ride_request_id
 *
 * @returns {Object} rideRequest
 * @returns {Object} rideRequest.departure
 * @returns {Object} rideRequest.destination
 * @returns {Object} rideRequest.ride_route
 * @returns {Object} rideRequest.user
 * @returns {Object} rideRequest.ride
 * @returns {Object} rideRequest.rider
 * @returns {Number} rideRequest.urban_cost
 * @returns {Number} rideRequest.standard_cost
 * @returns {Number} rideRequest.elite_cost
 *
 * @throws {BadRequestError} Invalid ride request
 */
const cancelRideRequest = async (req, res, next) => {
    const { ride_request_id } = req.body;

    // Check if ride request exists
    const ride_request = await RideRequest.findOne({ _id: ride_request_id }).populate('ride');

    if (!ride_request) return next(new BadRequestError('Invalid ride request'));

        // Check if ride request has been accepted
    if (ride_request.status == 'accepted') {
        // If ride has started ride can't be cancelled
        if (ride_request.ride && ride_request.ride.status == 'started') {
            return next(new BadRequestError('Ride has already started'));
        }

        // Get riders client
        const rider = await Rider.findOne({ _id: ride_request.ride.rider }).populate('user'),
            riders_client = clients.get(rider.user.email);

        // Notify rider that ride request has been cancelled
        riders_client.send(stringify({
            event: 'ride:cancelled',
            data: { ride_request },
        }));
    }

    // Update ride request status
    ride_request.status = 'cancelled';

    // Make rider available for new rides
    if (ride_request.ride) {
        const ride = ride_request.ride,
            rider = (await ride.populate('rider')).rider;
        await rider.updateOne({ isAvailable: true });
    }

    // Save ride request
    await ride_request.save();

    return res.status(200).json({
        success: true,
        data: {
            message: 'Ride request cancelled',
        },
    });

};

// TODO: Add ride tracking link
// TODO: Make reviews affect rider rating

/**
 * Arrived
 * 
 * Sends a notification to the user that the rider has arrived
 * 
 * @param {String} ride_request_id
 * 
 * @returns {string} message
 * 
 * @throws {BadRequestError} Invalid ride request
 */
const rideArrived = async (req, res, next) => {
    const { ride_id } = req.body;

    const ride = await Ride.findOne({ _id: ride_id }).populate('rider passenger ride_request');
    if (!ride) return next(new BadRequestError('Invalid ride request'));

    // Check if ride has started
    if (ride.status == 'started') return next(new BadRequestError('Ride has already started'));

    // Check if ride has been cancelled
    if (ride.status == 'cancelled') return next(new BadRequestError('Ride has been cancelled'));

    // Check if ride has been completed
    if (ride.status == 'completed') return next(new BadRequestError('Ride has been completed'));

    // Check if ride request exists
    const ride_request = await ride.ride_request.populate('user ride');
    if (!ride_request) return next(new BadRequestError('Invalid ride request'));

    // Check if ride request belongs to rider
    if (ride.rider._id != req.user.rider._id) return next(new UnauthorizedError('Unauthorized access'));

    // Check if ride request has been accepted
    if (ride_request.status != 'accepted') return next(new BadRequestError('Ride request has not been accepted'));

    // Update ride status
    ride.status = 'arrived';

    // Save ride
    await ride_request.ride.save();
    await ride.save();

    // Get users client
    const users_client = clients.get(ride_request.user.email);

    // Notify user that rider has arrived
    if (users_client) {
        users_client.emit('rider:arrived',
            {
                data: { ride_request },
            }
        );
    }

    return res.status(200).json({
        success: true,
        data: {
            message: 'Rider has arrived',
        },
    });
};

/**
 * Start Ride
 * 
 * Updates ride status to started
 * 
 * @param {String} ride_request_id
 * 
 * @returns {string} message
 * 
 * @throws {BadRequestError} Invalid ride request
 * @throws {BadRequestError} Ride request has not been accepted
 * @throws {BadRequestError} Ride has already started
 * */
const startRide = async (req, res, next) => {
    const { ride_id } = req.body;

    // Check if ride exists
    const ride = await Ride.findOne({ _id: ride_id }).populate('ride_request rider');
    if (!ride) return next(new BadRequestError('Invalid ride'));

    // Check if ride belongs to rider
    if (ride.rider.user != req.user.id) return next(new UnauthorizedError('Unauthorized access'));

    // Check if ride request has been accepted
    if (ride.ride_request.status != 'accepted') return next(new BadRequestError('Ride request has not been accepted'));

    // Check if ride has started
    if (ride.status == 'started') return next(new BadRequestError('Ride has already started'));

    // Update ride status
    ride.status = 'started';

    // Save ride
    await ride.save();

    // Update riders current ride
    ride.rider.current_ride = ride._id

    // Make rider unavailable until he completes the ride
    ride.rider.isAvailable = false
    await ride.rider.save()

    return res.status(200).json({
        success: true,
        data: {
            message: 'Ride has started',
        },
    });
};

/**
 * Complete Ride
 * 
 * Updates ride status to completed
 * 
 * @param {String} ride_id
 * 
 * @returns {string} message
 * 
 * @throws {BadRequestError} Invalid ride
 * @throws {BadRequestError} Ride has not been started
 * @throws {BadRequestError} Ride has already been completed
 * 
 * //TODO: End ride tracking socket connection
 * */
const completeRide = async (req, res, next) => {
    const { ride_id } = req.body;

    // Check if ride exists
    const ride = await Ride.findOne({ _id: ride_id }).populate('ride_request rider');
    if (!ride) return next(new BadRequestError('Invalid ride'));

    // Check if ride belongs to rider
    if (ride.rider.user != req.user.id) return next(new UnauthorizedError('Unauthorized access'));

    // Check if ride has started
    if (ride.status != 'started') return next(new BadRequestError('Ride has not been started'));

    // Check if ride has been completed
    if (ride.status == 'completed') return next(new BadRequestError('Ride has already been completed'));

    // Update ride status
    ride.status = 'completed';

    /* 
        If payment method is cash,
        rider should  receive cash from passenger and pay to company,
        when payment is confirmed rider will be allowed to take rides
    */
    if (ride.ride_request.payment_method != 'cash') {
        ride.rider.isAvailable = true
        await ride.rider.save()
    }

    // Save ride
    await ride.save();

    return res.status(200).json({
        success: true,
        data: {
            message: 'Ride has been completed',
        },
    });
};

/**
 * Get Users Rides
 * 
 * Get rides booked by user, and rides that rider has accepted
 * 
 * @returns {Array} rides
 * 
 * @throws {BadRequestError} Invalid user
 * @throws {BadRequestError} Invalid rider
 * 
 * */
const getUsersRides = async (req, res, next) => {
    // Check users role 
    if (req.user.role == 'enduser') {
        // Get enduser's ride requests  - Includes all rides (pending, accepted, completed)
        const users_rides = await RideRequest.find({ user: req.user.id });

        return res.status(200).json({
            success: true,
            data: {
                rides: users_rides,
            },
        });
    } else if (req.user.role == 'rider') {
        // Get rider's rides    - Includes only accepted rides
        const riders_rides = await Ride.find({ rider: req.user.id });

        return res.status(200).json({
            success: true,
            data: {
                rides: riders_rides,
            },
        });
    } else {
        return next(new BadRequestError('Invalid user'));
    }
};

/**
 * Get Ride Data
 * 
 * @param {String} ride_id
 * 
 * @returns {Object} ride
 * 
 * @throws {BadRequestError} Invalid ride
 * //TODO: Filter ride data to only include necessary data
 */
const getRideData = async (req, res, next) => {
    const { ride_id } = req.body;

    // Check if ride exists
    let ride = await Ride.findOne({ _id: ride_id }).populate('rider passenger vehicle departure destination');
    if (!ride) return next(new BadRequestError('Invalid ride'));
    ride = await ride.populate({
        path: 'ride_request',
        populate: {
            path: 'departure ride destination',
        }
    })

    // Check if ride belongs to rider
    if (ride.rider.user._id != req.user.id) return next(new UnauthorizedError('Unauthorized access'));

    return res.status(200).json({
        success: true,
        data: {
            ride: ride.toJSON(),
        },
    });
};

/**
 * Submit Ride Review
 * 
 * @param {String} ride_id
 * @param {String} review
 * @param {Number} rating
 * 
 * @returns {string} message
 * 
 * @throws {BadRequestError} Invalid ride
 * @throws {BadRequestError} Ride has not been completed
 * @throws {BadRequestError} Ride has already been reviewed
 * //TODO: Make ride review effect rider's rating
 * */
const submitRideReview = async (req, res, next) => {
    const { ride_id, review, rating } = req.body;

    // Check for missing required fields
    if (!ride_id || !review || !rating) return next(new BadRequestError('Missing required fields'));

    // Check if ride exists
    const ride = await Ride.findOne({ _id: ride_id }).populate('ride_request');
    if (!ride) return next(new BadRequestError('Invalid ride'));

    console.log(ride)
    console.log(req.user)

    // Check if user booked ride
    if (ride.passenger != req.user.id) return next(new UnauthorizedError('Unauthorized access'));

    // Check if ride has been completed
    if (ride.status != 'completed') return next(new BadRequestError('Ride has not been completed'));

    // Check if ride has already been reviewed
    if (ride.review) return next(new BadRequestError('Ride has already been reviewed'));

    // Create review
    const new_review = await RideReview.create({
        ride: ride_id,
        user: req.user.id,
        review,
        rating,
    });

    return res.status(200).json({
        success: true,
        data: {
            message: 'Ride has been reviewed',
            review: new_review
        },
    });
};

/**
 * Get Ride Review
 * 
 * @param {String} ride_id
 * 
 * @returns {Array} reviews
 * 
 * @throws {BadRequestError} Invalid ride
 * @throws {BadRequestError} Ride has not been completed
 */
const getRideReview = async (req, res, next) => {
    const { ride_id } = req.body;

    // Check if ride exists
    const ride = await Ride.findOne({ _id: ride_id }).populate({
        path: 'ride_review',
        populate: {
            path: 'user',
            select: 'name'
        }
    });
    if (!ride) return next(new BadRequestError('Invalid ride'));

    // Check if ride belongs to rider
    if (ride.rider != req.user.id) return next(new UnauthorizedError('Unauthorized access'));

    return res.status(200).json({
        success: true,
        data: {
            review: ride.ride_review,
        },
    });
};

/**
 * Get Ride Review Data
 * 
 * @param {String} ride_id
 * 
 * @returns {Array} review data
 * 
 * @throws {BadRequestError} Invalid ride
 * @throws {BadRequestError} Ride has not been completed
 * 
 * // TODO: Set attr based control for rider, allow superuser to access all reviews
 */
const getRideReviewData = async (req, res, next) => {
    const { review_id } = req.body;

    // Check if review exists
    const review = await RideReview.findOne({ _id: review_id }).populate('user ride');

    if (!review) return next(new BadRequestError('Invalid review'));

    // Check if review belongs to rider
    if (req.user.role == 'rider' && review.ride.rider != req.user.id) return next(new UnauthorizedError('Unauthorized access'));

    return res.status(200).json({
        success: true,
        data: {
            review,
        },
    });
};

/**
 * Get Rider's Reviews
 * 
 * @param {String} rider_id
 * 
 * @returns {Array} reviews
 * 
 * @throws {BadRequestError} Invalid rider
 * @throws {UnauthorizedError} Unauthorized access
 */
const getRidersReviews = async (req, res, next) => {
    const { rider_id } = req.body;

    // Check if rider exists
    const rider = await Rider.findOne({ _id: rider_id });
    if (!rider) return next(new BadRequestError('Invalid rider'));

    // Check if user is superuser
    if (req.user.role != 'superuser' && req.user.rider?.id != rider_id) return next(new UnauthorizedError('Unauthorized access'));

    // Get rider's reviews
    const reviews = await RideReview.find({ rider: rider_id }).populate({
        path: 'user ride',
        select: '-role -email'
    });

    return res.status(200).json({
        success: true,
        data: {
            reviews,
        },
    });
};

const getUsersBookedRides = async (req, res, next) => {
    const passenger_id = req.user.id

    const fields_to_populate = 'ride_request rider departure destination'

    const rides = await Ride.find({ passenger: passenger_id }).populate(fields_to_populate)

    return res.status(200).json({
        success: true,
        data: {
            rides,
        },
    });
}

const getRidersCompletedRides = async (req, res, next) => {
    const rider_id = req.user?.rider.id

    const rider_info = await Rider.findById(rider_id)
    if (!rider_info) return next(new NotFoundError('Rider not found'))

    const fields_to_populate = 'ride_request passenger departure destination'
    const rides = await Ride.find({ rider: rider_id, status: 'completed' }).populate(fields_to_populate)

    return res.status(200).json({
        success: true,
        data: {
            rides,
        },
    });
}

const payForRide = async (req, res, next) => {
    // Get the ride cost
    const { ride_id, balance_payment_method } = req.body
    const payment_method = balance_payment_method;

    const ride = await Ride.findById(ride_id).populate('passenger rider ride_request')
    if (!ride) { return next(new NotFoundError('Ride does not exist')) }

    // TODO: Check if ride is completed

    // Check if user booked this ride
    if (ride.passenger._id.toString() != req.user._id
        && ride.rider != req.user.rider?._id) {    // Rider can also pay for ride
        return next(new UnauthorizedError('This user did not book this ride'))
    }

    // Check if ride has already been paid for
    if (ride.paid) {
        return next(new BadRequestError('Ride has already been paid for'))
    }

    const data = {
        amount: ride.amount_to_remit,
        payment_method,
        type: 'book_ride',
        user_id: req.user._id,
        ride_id: ride._id
    }

    let transaction_record = await initiateTransaction(data)

    let transaction;
    switch (payment_method) {
        case 'card':
            // Handle card payment
            // Wait for webhook to confirm transaction
            break;

        case 'bank_transfer':
            // Handle bank transfer
            // Wait for webhook to confirm transaction
            break;

        // case 'wallet':
        //     // Handle wallet payment
        //     transaction = await debitWallet(transaction_record._id)

        //     // Update ride paid status
        //     await ride.updateOne({ paid: true })

        //     break;

        default:
            return next(new BadRequestError('Please specify payment method'))
    }
    if (transaction instanceof Error) {
        if (transaction.message == 'Insufficient funds') {
            return next(new BadRequestError('Insufficient funds'))
        }

        return next(new APIServerError('An error occured'))
    }

    return res.status(200).send({
        success: true,
        data: {
            transaction: transaction || transaction_record
        }
    })
};

const startTrackingRide = async (req, res, next) => {
    const ride_id = req.params.ride_id

    const ride = await Ride.findById(ride_id)
    if (!ride) { 
        return next(new NotFoundError('Ride not found'))
    }

    switch (ride.status){
        case 'cancelled':
            return next(new BadRequestError('Ride has been cancelled'))

        case 'completed':
            return next(new BadRequestError('Ride has ended'))
    }
    
    // Send html with unique id to connect to location update broadcast
    // Send ride destination
    const unique_tracking_id = randomUUID()
}

module.exports = {
    initRideRequest,
    completeRideRequest,
    cancelRideRequest,
    rideArrived,
    startRide,
    completeRide,
    submitRideReview,
    getUsersRides,
    getRideData,
    getRideReview,
    getRideReviewData,
    getRidersReviews,
    getUsersBookedRides,
    getRidersCompletedRides,
    payForRide,
    startTrackingRide
};
