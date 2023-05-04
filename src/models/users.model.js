const { default: mongoose } = require('mongoose');
const schema = mongoose.Schema;
const { Wallet } = require('./payment_info.model');
const Vehicle = require('./vehicle.model');

const statusSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        isVerified: { type: Boolean, default: false },
        isActive: { type: Boolean, default: false },
    },
    { timestamps: true },
);

const userSchema = new schema(
    {
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        // enduser: { type: schema.Types.ObjectId, ref: 'EndUser' },    // Virtuals
        // rider: { type: schema.Types.ObjectId, ref: 'Rider' },    // Virtuals
        role: {
            type: String,
            required: true,
            default: 'enduser',
            enum: ['enduser', 'rider', 'admin', 'superadmin'],
        },
    },
    { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

const enduserSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        wallet: { type: schema.Types.ObjectId, ref: 'Wallet', required: true },
        cards: [{ type: schema.Types.ObjectId, ref: 'Card' }],
    },
    { timestamps: true },
);

const riderSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        bank_accounts: [{ type: schema.Types.ObjectId, ref: 'BankAccount' }],
        vehicles: [
            {
                type: schema.Types.ObjectId,
                ref: 'Vehicle',
            },
        ],
        defaultVehicle: { type: schema.Types.ObjectId, ref: 'Vehicle' },
        currentVehicle: { type: schema.Types.ObjectId, ref: 'Vehicle' },
        removed_vehicles: [{ type: schema.Types.ObjectId, ref: 'Vehicle' }],
        driver_license: {
            type: String,
            required: true,
        },
        taxi_license: {
            type: String,
        },
        rider_status: {
            type: String,
            required: true,
            default: 'active',
            enum: ['active', 'inactive', 'suspended'],
        },
        hasVehicle: { type: Boolean, default: false },
        isOnline: { type: Boolean, default: false },
        isAvailable: { type: Boolean },
        current_ride: {type: schema.Types.ObjectId, ref: 'Ride'},
        rider_doc: [{ type: schema.Types.ObjectId, ref: 'RiderDoc' }]
    },
    { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } },
);

const adminSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        state: { type: String, required: true },
    },
    { timestamps: true },
);

const superadminSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true },
);

// Virtuals
userSchema.virtual('password', {
    ref: 'Password',
    localField: '_id',
    foreignField: 'user',
    justOne: true,
});

userSchema.virtual('status', {
    ref: 'Status',
    localField: '_id',
    foreignField: 'user',
    justOne: true,
});

userSchema.virtual('enduser', {
    ref: 'Enduser',
    localField: '_id',
    foreignField: 'user',
    justOne: true,
});

userSchema.virtual('rider', {
    ref: 'Rider',
    localField: '_id',
    foreignField: 'user',
    justOne: true,
});

riderSchema.virtual('location', {
    ref: 'RiderLocation',
    localField: '_id',
    foreignField: 'rider',
    justOne: true,
});

userSchema.pre('validate', async function (next) {
    if (this.isNew) {
        const status = new Status({ user: this._id });
        status.isVerified = this.role == 'enduser' ? true : false;

        if (process.env.NODE_ENV == 'dev') {
            status.isVerified = true;
            status.isActive = true;
        }

        this.status = status._id;

        if (this.role == 'enduser') status.isActive = true;

        await status.save();
    }
});

enduserSchema.pre('validate', async function (next) {
    if (this.isNew) {
        const wallet = new Wallet({ user: this.user._id, enduser: this._id });
        this.wallet = wallet._id;

        await wallet.save();
    }

    console.log(this)

    next();
});

riderSchema.pre('validate', async function (next) {
    // Depopulate user
    this.depopulate('defaultVehicle currentVehicle vehicles removed_vehicles');

    // console.log(this);
    if (this.isNew) {
        const wallet = new Wallet({ user: this.user._id, rider: this._id });
        this.wallet = wallet._id;

        await wallet.save();
    }

    // Check if vehicle belongs to rider
    if (
        (this.isModified('defaultVehicle') && this.defaultVehicle) ||
        (this.isModified('currentVehicle') && this.currentVehicle)
    ) {
        if (
            !this.vehicles.includes(this.defaultVehicle) ||
            !this.vehicles.includes(this.currentVehicle)
        ) {
            throw new Error("Vehicle doesn't belong to rider");
        }
    }

    next();
});

riderSchema.pre('save', async function (next) {
    console.log(this.toObject({ virtuals: true }))
    if (this.isModified('vehicles')) {
        if (this.vehicles.length > 0) {
            this.hasVehicle = true;
        }
    }

    if (!this.defaultVehicle && this.vehicles.length > 0) {
        this.defaultVehicle = this.vehicles[0];
        this.currentVehicle = this.vehicles[0];
    }

    if (this.vehicles && this.vehicles.length > 0) this.hasVehicle = true;
});

// Methods
riderSchema.methods.addVehicle = async function (vehicle, session = null) {
    // console.log(this)
    // Check if vehicle belongs to rider
    if (typeof vehicle == 'object') vehicle = vehicle._id;
    // console.log(vehicle)

    // Check for existing vehicle
    let existing_vehicle;
    if (session)
        existing_vehicle = await Vehicle.findOne({
            _id: vehicle,
            rider: this._id,
        }).session(session);
    else
        existing_vehicle = await Vehicle.findOne({
            _id: vehicle,
            rider: this._id,
        });

    if (!existing_vehicle) throw new Error("Vehicle doesn't belong to rider");

    // If no default vehicle for rider, set default vehicle
    if (!this.defaultVehicle) {
        this.defaultVehicle = vehicle;
        this.currentVehicle = vehicle;
    }

    this.currentVehicle = vehicle;  // for testing

    // Add vehicle to rider's vehicles
    this.vehicles = this.vehicles.concat([vehicle]);
    this.hasVehicle = true;

    if (session) {
        await this.save({ session });
    } else {
        await this.save();
    }

    return existing_vehicle;
};

riderSchema.methods.goOnline = async function (vehicle_id = null) {
    // console.log(this)
    this.isOnline = true; // set rider to online

    await this.populate({
        path: 'current_ride',
        populate: {
            path: 'ride_request'
        }
    })

    /* 
        If payment method is cash,
        rider should  receive cash from passenger and pay to company,
        when payment is confirmed rider will be allowed to take rides
    */
    const payment_method = this.current_ride?.ride_request?.payment_method
    const is_paid = this.current_ride?.paid
    this.isAvailable = payment_method == 'cash' && !is_paid ? false: true

    const setCurrVehicle = (vehicle_id) => {
        this.depopulate('currentVehicle defaultVehicle');
        this.currentVehicle =
            vehicle_id || this.currentVehicle || this.defaultVehicle;
    };

    // Check if rider owns vehicle
    this.populate('vehicles');
    const vehicle = this.vehicles.find((vehicle) => vehicle._id == vehicle_id);
    if (!vehicle && vehicle_id)
        throw new Error("Vehicle doesn't belong to rider");

    if (!vehicle_id) {
        if (!this.currentVehicle) {
            if (!this.defaultVehicle) {
                if (this.vehicles.length > 0) {
                    setCurrVehicle(this.vehicles[0]._id);
                } else {
                    throw new Error('Rider has no vehicle');
                }
            } else {
                setCurrVehicle(this.defaultVehicle);
            }
        } else {
            setCurrVehicle(this.currentVehicle);
        }
    }

    setCurrVehicle(this.vehicles[-1])   // Only for testing

    const rider = await this.save();
    return rider;
};

riderSchema.methods.goOffline = async function () {
    this.isOnline = false; // set rider to offline

    return await this.save();
};

const Status = mongoose.model('Status', statusSchema);
const User = mongoose.model('User', userSchema);
const Enduser = mongoose.model('Enduser', enduserSchema);
const Rider = mongoose.model('Rider', riderSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Superadmin = mongoose.model('Superadmin', superadminSchema);

module.exports = {
    User,
    Enduser,
    Rider,
    Admin,
    Superadmin,
    Status,
};
