const multer = require("multer");

const imageFilter = (req, file, cb) => {
// check for request validation errors
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("Please upload only images.", false);
  }
};

var storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    // check for request validation errors
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new Error("Please upload an image."));
    }
    cb(null, `${Date.now()}_JourneyGenie_${file.originalname}`);
    },
});

var uploadFile = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 }, 
  fileFilter: imageFilter });

  module.exports = uploadFile;




