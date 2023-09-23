const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const fs = require('fs');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const uploadtocloudinary = (filepath, name, data) => {
    try { 
        const { folder, id } = data;
        const options = {
            use_filename: true,
            folder: `JourneyGenie/${folder}/${id}`,
            public_id: name
        };
        return cloudinary.uploader.upload(filepath, options)
        .then((result) => {
            // assign the result to a variable
            let cloudinaryResult = result;
            // delete the file from the server

            fs.unlinkSync(filepath)

            return { message: 'success', url: cloudinaryResult.secure_url }
        })
    } catch (error) {
        console.log(error);
        fs.unlinkSync(filepath)
        return { message: 'error', error: error }
    }
};

module.exports = {
    uploadtocloudinary
};
