const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { Rider } = require('./users.model')


const departurOrDestinationLocationShema = new Schema({
    address: { type: String, required: true },
    type: { type: String, enum: ['departure', 'destination'], required: true },
    location: {
        type: new Schema({
            name: { type: String },
            type: {
                type: String,
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                default: [0, 0],    // [longitude, latitude]
                required: true,
            },
        }),
        required: true,
    },
    createdAt: { type: Date, default: Date.now },
});

const riderLocationSchema = new Schema({
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    rider: { type: Schema.Types.ObjectId, ref: 'Rider' },
    location: {
        type: new Schema({
            name: { type: String },
            type: {
                type: String,
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                default: [0, 0],    // [longitude, latitude]
                required: true,
            },
        }),
        required: true,
    },
    createdAt: { type: Date, default: Date.now },
});

riderLocationSchema.index({ location: '2dsphere' });

riderLocationSchema.pre('validate', async function () {
    if (this.isNew) {
        const rider = await Rider.findById(this.rider);
        if (!rider) { throw new Error('Rider not found') }

        this.vehicle = rider.currentVehicle;
    }
})

riderLocationSchema.methods.updateCoordinates = async function (long, lat) {
    this.location.coordinates = [long, lat];
    await this.save();

    return this
};

const RiderLocation = mongoose.model('RiderLocation', riderLocationSchema);
const DepartureOrDestination = mongoose.model('DepartureOrDestination', departurOrDestinationLocationShema);

module.exports = { RiderLocation, DepartureOrDestination };
