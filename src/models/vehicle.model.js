const mongoose = require('mongoose');
const schema = mongoose.Schema;

const vehicle_statusSchema = new schema({
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    vehicle: { type: schema.Types.ObjectId, ref: 'Vehicle', required: true },
});

const vehicleSchema = new schema({
    name: { type: String, required: true },
    manufacturer: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    color: { type: String, required: true },
    plate_number: { type: String, required: true },
    rider: { type: schema.Types.ObjectId, ref: 'Rider', required: true },
    createdAt: { type: Date, default: Date.now },
    status: {
        type: schema.Types.ObjectId,
        ref: 'VehicleStatus',
        required: true
    },
    rating : { type: Number, default: 1 },
    actve_ride: { type: schema.Types.ObjectId, ref: 'Ride' },
    rating: {type: Number, min: 1, max: 5, default: 4},
    banner: { type: String }, // vehicle banner image-make it required=true in future
    vehicle_images: {
        type: schema.Types.ObjectId,
        ref: 'VehicleImages',
    },
    vehicleDocs: {
        type: schema.Types.ObjectId,
        ref: 'VehicleImages',
    }
});

vehicleSchema.virtual('location', {
    ref: 'Location',
    localField: '_id',
    foreignField: 'vehicle', 
})

const VehicleStatus = mongoose.model('VehicleStatus', vehicle_statusSchema);

vehicleSchema.pre('validate', async function (next) {
    // Create a new vehicle status
    const vehicle_status = await VehicleStatus.create({ vehicle: this._id });

    // Set the vehicle status
    this.status = vehicle_status;

    next();
});

vehicleSchema.methods.updateBookingStatus = function (status) {
    return new Promise((resolve, reject) => {
        try {
            this.booking_status = status;
            this.save().then(() => { resolve(this) });

        } catch (error) {
            reject(error);
        }
    });
};

const Vehicle = mongoose.model('Vehicle', vehicleSchema);


module.exports = Vehicle;
