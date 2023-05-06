require('dotenv').config();
//console.log(process.env)


const MONGO_URI = "mongodb+srv://sabilacalebjonathan:nethanel@cluster0.mls7anb.mongodb.net/?retryWrites=true&w=majority";
/*const MONGO_URI = MONGO_URI;

// Connect to the MongoDB database
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });*/

const PORT = process.env.PORT || 5555;

/* JWT TOKENS */
const JWT_SECRET = process.env.JWT_ACCESS_SECRET,
    JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET,
    JWT_SECRET_EXP = process.env.JWT_ACCESS_EXP,
    JWT_ACCESS_EXP = process.env.JWT_ACCESS_EXP,
    JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXP = process.env.JWT_REFRESH_EXP,
    JWT_PASSWORDRESET_SECRET = process.env.JWT_PASSWORDRESET_SECRET,
    JWT_PASSWORDRESET_EXP = process.env.JWT_PASSWORDRESET_EXP,
    JWT_EMAILVERIFICATION_SECRET = process.env.JWT_EMAILVERIFICATION_SECRET,
    JWT_EMAILVERIFICATION_EXP = process.env.JWT_EMAILVERIFICATION_EXP;

/* EMAIL and OAUTH2*/
const EMAIL_HOST = process.env.EMAIL_HOST,
    EMAIL_PORT = process.env.EMAIL_PORT,
    EMAIL_HOST_ADDRESS = process.env.EMAIL_HOST_ADDRESS,
    OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET,
    OAUTH_REFRESH_TOKEN = process.env.OAUTH_REFRESH_TOKEN,
    OAUTH_ACCESS_TOKEN = process.env.OAUTH_ACCESS_TOKEN,
    GOOGLE_SIGNIN_CLIENT_ID = process.env.GOOGLE_SIGNIN_CLIENT_ID,
    GOOGLE_SIGNIN_CLIENT_SECRET = process.env.GOOGLE_SIGNIN_CLIENT_SECRET,
    GOOGLE_SIGNIN_REDIRECT_URI = process.env.GOOGLE_SIGNIN_REDIRECT_URI,
    SUPER_ADMIN_EMAIL1 = process.env.SUPER_ADMIN_EMAIL1,
    SUPER_ADMIN_EMAIL2 = process.env.SUPER_ADMIN_EMAIL2;

/* CRYPTO */
const CRYPTO_ALGORITHM = process.env.CRYPTO_ALGORITHM;
const CRYPTO_PASSWORD = process.env.CRYPTO_PASSWORD;
//console.log(process.env.CRYPTO_PASSWORD);
const CRYPTO_IV = process.env.CRYPTO_IV;

/* PAYSTACK */
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;

/* FLUTTERWAVE */
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY,
    FLUTTERWAVE_VERIFY_HASH = process.env.FLUTTERWAVE_VERIFY_HASH;

const URBAN_MULTIPLIER = process.env.URBAN_MULTIPLIER,
    STANDARD_MULTIPLIER = process.env.STANDARD_MULTIPLIER,
    ELITE_MULTIPLIER = process.env.ELITE_MULTIPLIER,
    //COST_PER_KM = process.env.COST_PER_KM,
    COST_PER_KM = 30,
    PERCENTAGE_CUT = process.env.PERCENTAGE_CUT;

const CALL_REQUEST_TIMEOUT = process.env.CALL_REQUEST_TIMEOUT;

module.exports = {
    // DB
    MONGO_URI,
    PORT,

    // JWT
    JWT_SECRET,
    JWT_SECRET_EXP,
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    JWT_ACCESS_EXP,
    JWT_REFRESH_EXP,
    JWT_PASSWORDRESET_SECRET,
    JWT_PASSWORDRESET_EXP,
    JWT_EMAILVERIFICATION_SECRET,
    JWT_EMAILVERIFICATION_EXP,
    
    // SMTP
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_HOST_ADDRESS,

    // OAUTH2
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    OAUTH_REFRESH_TOKEN,
    OAUTH_ACCESS_TOKEN,
    GOOGLE_SIGNIN_CLIENT_ID,
    GOOGLE_SIGNIN_CLIENT_SECRET,
    GOOGLE_SIGNIN_REDIRECT_URI,
    
    // SUPER ADMIN EMAILS
    SUPER_ADMIN_EMAIL1,
    SUPER_ADMIN_EMAIL2,

    // CRYPTO
    CRYPTO_ALGORITHM,
    CRYPTO_PASSWORD,
    CRYPTO_IV,

    // PAYSTACK
    PAYSTACK_SECRET_KEY,
    PAYSTACK_PUBLIC_KEY,

    // FLUTTERWAVE
    FLUTTERWAVE_SECRET_KEY,
    FLUTTERWAVE_VERIFY_HASH,

    // MULTIPLIERS
    URBAN_MULTIPLIER,
    STANDARD_MULTIPLIER,
    ELITE_MULTIPLIER,
    COST_PER_KM,
    PERCENTAGE_CUT,

    // CALL REQUEST TIMEOUT
    CALL_REQUEST_TIMEOUT
};
