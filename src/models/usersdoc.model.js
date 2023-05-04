const { default: mongoose } = require('mongoose');
const schema = mongoose.Schema;


const profileuploadSchema = new schema(
    {
        enduser: { type: schema.Types.ObjectId, ref: 'EndUser'},
        rider: { type: schema.Types.ObjectId, ref: 'Rider'},
        image: { type: String, required: true }, 
    },
    { timestamps: true }
);

const riderdocSchema = new schema(
    {
        rider: { type: schema.Types.ObjectId, ref: 'Rider', required: true },
        docurl: { type: String, required: true },
        docname: { type: String, required: true },
    },
    { timestamps: true }
);

const vehicleimagesSchema = new schema(
    {
        rider: { type: schema.Types.ObjectId, ref: 'Rider', required: true },
        vehicle: { type: schema.Types.ObjectId, ref: 'Vehicle', required: true },
        imagearray: { type: Array, required: true },
    },
    { timestamps: true }
);

const vehicledocsSchema = new schema(
    {
        rider: { type: schema.Types.ObjectId, ref: 'Rider', required: true },
        vehicle: { type: schema.Types.ObjectId, ref: 'Vehicle', required: true },
        docArray: { type: Array, required: true },
    },
    { timestamps: true }    
);

// virtuals
// uploadStatusSchema.virtual('user', {
//     ref: 'User',
//     localField: 'user',
//     foreignField: '_id',
//     justOne: true,
// });

// check image type before saving
// profileuploadSchema.pre('save', function (next) {
//     if (!this.image || this.image.startsWith('data:image')) {
//         next();
//     } else {
//         next(new Error('Invalid image type'));
//     }
// });

// check doc type before saving
// userdocSchema.pre('save', function (next) {
//     if (!this.docurl || this.docurl.startsWith('data:application')) {
//         next();
//     } else {
//         next(new Error('Invalid document type'));
//     }
// });

// check array doc type before saving
// vehicleimagesSchema.pre('save', function (next) {
//     if (!this.imagearray || this.imagearray.startsWith('data:image')) {
//         next();
//     } else {
//         next(new Error('Invalid image type'));
//     }
// });


const ProfileUpload = mongoose.model('ProfileUpload', profileuploadSchema);
const RiderDoc = mongoose.model('UserDoc', riderdocSchema);
const VehicleImages = mongoose.model('VehicleImages', vehicleimagesSchema);
const VehicleDocs = mongoose.model('VehicleDocs', vehicledocsSchema);

module.exports = {  
    ProfileUpload,
    RiderDoc,
    VehicleImages,
    VehicleDocs
};
