const User = require('../models/users.model');
const TestToken = require('../models/token.model');
const AuthCode = require('../models/authcode.model');
const { sendEmail } = require('../services/email.service');

const { CustomAPIError, BadRequestError } = require('../utils/custom_errors');

const getAuthCodes = async (user_id, code_type = 'password_reset') => {

    // 1. Check if user exists
    const user = await User.findById(user_id);

    if (!user) { throw new NotFoundError('User not found'); }

    // 2. Generate random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Check if code exists
    const authCodes = await AuthCode.findOneAndUpdate({ user: user_id }, { [code_type]: code }, { new: true, upsert: true });

    return authCodes;
};

module.exports = {
    getAuthCodes,
}
