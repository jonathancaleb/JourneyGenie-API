const mongoose = require('mongoose')
const schema = mongoose.Schema
const { Rider } = require('./users.model')
//const { Ride, RideRequest } = require("./common");
//const { getActualCost } = require('../services/ride.service')

// TODO: Add checks to enforce dynamic schema field required rules
const rideReviewSchema = new schema({
    ride: { type: schema.Types.ObjectId, ref: 'Ride', required: true },
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String },
})

const rideRequestSchema = new schema({
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    departure: { type: schema.Types.ObjectId, ref: 'DepartureOrDestination', required: true },
    destination: { type: schema.Types.ObjectId, ref: 'DepartureOrDestination', required: true },
    payment_method: { type: String, enum: ['cash', 'card', 'wallet', 'bank_transfer'] },
    status: { type: String, enum: ['pending', 'accepted', 'cancelled'], default: 'pending' },
    urban_cost: { type: Number },
    standard_cost: { type: Number },
    elite_cost: { type: Number },
    ride_class: { type: String, enum: ['urban', 'standard', 'elite'] },
    distance: { type: Number },  // in kilometers
    ride: { type: schema.Types.ObjectId, ref: 'Ride' },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } })

/**
 * //TODO: Implement getEstimatedRideTime() method
 */
const rideSchema = new schema({
    rider: { type: schema.Types.ObjectId, ref: 'Rider', required: true },
    passenger: {
        type: schema.Types.ObjectId,
        ref: 'User', // not EndUser so other user-roles can book ride
        required: true,
    },
    vehicle: { type: schema.Types.ObjectId, ref: 'Vehicle', required: true },
    departure: { type: schema.Types.ObjectId, ref: 'DepartureOrDestination', required: true },
    destination: { type: schema.Types.ObjectId, ref: 'DepartureOrDestination', required: true },
    start_time: { type: Date },
    end_time: { type: Date },
    estimated_ride_time: { type: Number },
    paid: { type: schema.Types.Boolean, default: false },
    cost: {
        type: schema.Types.Number,
        requird: true,
        default: process.env.NODE_ENV == 'dev' ? 2000 : undefined
    },
    amount_to_remit: {
        type: schema.Types.Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'started', 'completed', 'cancelled', 'arrived'],
        default: 'pending',
    },
    tracking_link: { type: String },
    createdAt: { type: Date, default: Date.now },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } })

rideSchema.virtual('ride_request', {
    ref: 'RideRequest',
    localField: '_id',
    foreignField: 'ride',
    justOne: true,
})

rideSchema.virtual('ride_review', {
    ref: 'RideReview',
    localField: '_id',
    foreignField: 'ride',
    justOne: true,
})

rideSchema.virtual('transactions', {
    ref: 'Transaction',
    localField: '_id',
    foreignField: 'ride',
})

rideSchema.pre('validate', async function () {
    if (!this.isNew) next()

    this.amount_to_remit = getActualCost(this.cost)     // Round cost to nearest 100
})

/**
 * 
 * @param {string} rider_id 
 * @returns {Promise<Ride>}
 * 
 * @todo 
 */
// TODO: set ride status to 'accepted' after ride is created
rideRequestSchema.methods.createNewRide = async function (rider_id) {
    const rider = await Rider.findById(rider_id)
    if (!rider) throw new Error('Rider not found')

    console.log('creating ride')
    // Create new ride
    const ride = await Ride.create({
        rider: rider._id,
        passenger: this.user,
        vehicle: rider.currentVehicle,
        departure: this.departure,
        destination: this.destination,
    })

    // Update ride request to include ride
    this.ride = ride._id

    // Populate ride
    ride.populate({
        path: 'passenger',
        select: 'firstname lastname',
        populate: {
            path: 'enduser',
            select: 'phone -user'
        }
    }).catch(err => console.log(err))
    ride.populate('vehicle')

    // Update ride request status
    // this.status = 'accepted'
    await this.save()
    // console.log(ride)

    return ride
        .populate({
            path: 'rider',
            select: 'phone address city state _id',
            populate: {
                path: 'user',
                select: 'firstname lastname'
            },
        })
}

const RideReview = mongoose.model('RideReview', rideReviewSchema)
const Ride = mongoose.model('Ride', rideSchema)
const RideRequest = mongoose.model('RideRequest', rideRequestSchema)

module.exports = { Ride, RideRequest, RideReview }
