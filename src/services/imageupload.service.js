const { BadRequestError, UnauthenticatedError, UnauthorizedError } = require('../utils/errors');
const uploadtocloudinary = require('../middlewares/cloudinary').uploadtocloudinary;
// check for file upload

const uploadvehicleimages = async (req, res, next) => {
    if (!req.files.images || !req.files.images.length) {
        return next(new BadRequestError('Vehicle images are required'));
    }
    if (!req.files.banner || !req.files.banner.length) {
        return next(new BadRequestError('Vehicle banner image is required'));
    }
    let bufferarray = [];
    const data = {
        folder: 'vehicleimages',
        id: req.body.plate_number,
    };
    for (let i = 0; i < req.files.images.length; i++) {
        let localfilepath = req.files.images[i].path;
        let originalname = req.files.images[i].originalname;
        let uploadresult = await uploadtocloudinary(localfilepath, originalname, data);
        if (uploadresult.message === 'error') {
            return next(new BadRequestError(uploadresult.message));
        }
        if (uploadresult.message === 'success') {
            bufferarray.push(uploadresult.url);
        }
    }
    let bannerurl;
    let banner = req.files.banner[0];
    let bannerfilepath = banner.path;
    let banneroriginalname = banner.originalname;
    let banneruploadresult = await uploadtocloudinary(bannerfilepath, banneroriginalname, data);
    if (banneruploadresult.message === 'error') {
        return next(new BadRequestError(banneruploadresult.message));
    }
    if (banneruploadresult.message === 'success') {
        bannerurl = banneruploadresult.url;
    }
    if (bufferarray.length === 0) {
        return next(new BadRequestError('Error uploading images to cloudinary'));
    }
    return {
        banner: bannerurl,
        images: bufferarray,
    };
};


module.exports = {
    uploadvehicleimages
}
