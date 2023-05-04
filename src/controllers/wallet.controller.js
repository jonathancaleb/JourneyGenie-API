const {
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
} = require('../utils/errors');

// Models
const { Enduser, Rider } = require('../models/users.model');
const { BankAccount, Wallet } = require('../models/payment_info.model');
const {
    Invoice,
    Receipt,
    Transaction,
} = require('../models/transaction.model');

// Utils
const {
    initiateTransaction,
    verifyTransactionStatus,
} = require('../services/payment/transaction.service');
const config = require('../config');
const sendEmail = require('../services/email.service');
const {
    WalletTopupInvoiceMessage,
    WalletTopupReceiptMessage,
} = require('../utils/mail_message');

// Wallet Controller
/**
 * Get wallet data
 *
 * @returns {Object} - The Wallet object
 *
 * @throws {NotFoundError} - If the user is not found
 * */
const getWalletData = async (req, res, next) => {
    const user = await Enduser.findOne({ user: req.user.id }).populate({
        path: 'wallet',
        populate: {
            path: 'transactions',
            model: 'Transaction',
        },
    });

    // Check if user exists
    if (!user) return next(new NotFoundError('User not found'));

    res.status(200).json({
        success: true,
        data: user.wallet,
    });
};

/**
 * Get wallet balance
 *
 * @param {string} id - The ID of the user
 *
 * @returns {object} data - The response data
 * @returns {string} data.balance - The wallet balance
 *
 * @throws {NotFoundError} - If the user is not found
 * */
const getWalletBalance = async (req, res, next) => {
    const user = await Enduser.findOne({ user: req.user.id }).populate(
        'wallet'
    );

    console.log(user);
    if (!user) return next(new NotFoundError('User not found'));

    res.status(200).json({
        success: true,
        data: {
            balance: user.wallet.balance,
        },
    });
};

/**
 * Top up wallet
 *
 * @param {string} amount - The amount to be topped up
 * @param {string} payment_method - The payment method to be used
 * @param {string} type - The type of transaction
 * @param {string} user_id - The ID of the user
 *
 * @returns {object} data - The transaction object
 * @returns {string} data.public_key - The paystack public key
 * @returns {string} data.amount - The amount to be topped up
 * @returns {string} data.payment_method - The payment method to be used
 * @returns {string} data.type - The type of transaction
 * @returns {string} data.user_id - The ID of the user
 *
 * @throws {BadRequestError} - If the request body is invalid
 * @throws {BadRequestError} - If the Validations fail
 * @throws {UnauthorizedError} - If the user is not an end user
 * @throws {InternalServerError} - If there is an error while initiating the transaction
 * */
const topUpWallet = async (req, res, next) => {
    const { amount, payment_method } = req.body;
    const type = 'wallet_topup'
    const id = req.user.id;
    const enduser = req.user.enduser

    const data = {
        amount: amount / 100,
        payment_method,
        type,
        user_id: id,
        enduser: enduser._id, // Add enduser ID to transaction object if it is made by an enduser
    };

    // Initiate transaction
    let result = await initiateTransaction(data);

    // If error occured whle initiating transaction, return error
    if (result instanceof Error) return next(result);

    // Convert transaction object to JSON
    result = result.toObject();

    // Add paystack public key to response
    result.public_key = config.PAYSTACK_PUBLIC_KEY;

    // Get invoice
    const invoice_id = result.invoice;
    const invoice = await Invoice.findById(invoice_id).populate('transaction');

    const topup_message = new WalletTopupInvoiceMessage();
    topup_message.setBody(invoice);

    // Send Invoice to users email
    sendEmail({
        email: req.user.email,
        subject: 'Invoice for Wallet Topup',
        html: topup_message.getBody(),
    });

    res.status(200).json({
        success: true,
        data: {
            transaction: result
        },
    });
};

module.exports = {
    getWalletData,
    getWalletBalance,
    topUpWallet,
};
