const { Transaction, Invoice } = require('../models/transaction.model');
const { Wallet } = require('../models/payment_info.model.js')
const config = require('../config');
const { NotFoundError, UnauthorizedError, UnauthenticatedError, BadRequestError } = require('../utils/errors');
const {
    verifyTransactionStatus,
    creditWallet,
    effectSuccessfullTransaction,
} = require('../services/payment/transaction.service');

const getUsersTransactions = async (req, res, next) => {
    const transactions = await Transaction.find({ user: req.user.id }).populate(
        'invoice receipt'
    );

    res.status(200).json({
        status: 'success',
        data: transactions,
    });
};

/**
 * Get wallet transactions
 *
 * @param {string} id - The ID of the wallet
 *
 * @returns {array} data - The wallet transactions
 *
 * @throws {NotFoundError} - If the wallet is not found
 * @throws {UnauthorizedError} - If the wallet does not belong to the user
 * */
const getWalletTransactions = async (req, res, next) => {
    let wallet = await Wallet.findOne({ user: req.user._id })
        .populate({
            path: 'transactions',
            populate: {
                path: 'invoice'
            }
        })

    // Check if wallet exists
    if (!wallet) return next(new NotFoundError('Wallet not found'));

    // Check if the wallet belongs to the user
    if (wallet.user.toString() !== req.user.id)
        return next(new UnauthorizedError('Unauthorized'));

    const transactions = await wallet.transactions

    res.status(200).json({
        success: true,
        data: transactions,
    });
};

/**
 * Get wallet transaction data
 * 
 * @param {string} id - The ID of the transaction
 * 
 * @returns {object} data - The transaction object
 */
const getTransactionData = async (req, res, next) => {
    const { id } = req.params;

    const transaction = await Transaction.findById(id).populate('invoice receipt');

    // Check if transaction exists
    if (!transaction)
        return next(new NotFoundError('Transaction not found'));

    // Check if the transaction belongs to the user
    if (transaction.user.toString() !== req.user.id)
        return next(new UnauthorizedError('Unauthorized'));

    res.status(200).json({
        success: true,
        data: transaction,
    });
};

/**
 * Confirm topup
 *
 * @param {string} reference - The reference of the transaction
 *
 * @returns {object} data - The transaction object
 * @returns {string} data.amount - The amount to be topped up
 * @returns {string} data.payment_method - The payment method to be used
 * @returns {string} data.type - The type of transaction
 * @returns {string} data.user_id - The ID of the user
 * @returns {string} data.status - The status of the transaction
 *
 * @throws {BadRequestError} - If the request body is invalid
 * @throws {BadRequestError} - If the Validations fail
 * @throws {UnauthorizedError} - If the user is not an end user
 * @throws {InternalServerError} - If there is an error while verifying the transaction
 * @throws {InternalServerError} - If there is an error while updating the wallet
 * @throws {InternalServerError} - If there is an error while updating the transaction
 * */
const confirmTopup = async (req, res, next) => {
    // Get transaction reference from request body
    const { reference } = req.body;

    // Verify transaction
    const result = await verifyTransactionStatus(reference)

    /*  
    If transaction is not successful, the result will be an error
    If successful, the result will be a transaction object 
    */
    // If error occured while verifying transaction, return error
    if (result instanceof Error) {
        const possible_error_msgs = [
            'Transaction not found',
            'Transaction not successful',
            'Transaction amount mismatch',
        ];
        if (possible_error_msgs.includes(result.message))
            return next(new BadRequestError(result.message));

        return next(result);
    }

    let transaction = result;

    /* 
        If the transaction is successful
        and the transaction has not reflected the users wallet,
        proceed to update wallet balance and transaction status 
    */
    if (!transaction.reflected) {
        await transaction.updateOne({ status: 'success' })
        transaction = await creditWallet(transaction._id)
    }

    res.status(200).json({
        success: true,
        data: transaction,
    });
};

/**
 * 
 */
const handleFlutterWaveTransactionWebhook = async (req, res, next) => {
    // For payments under this category, the payment method used is bank transfer
    if (req.body.event != 'charge.completed') {
        return next(new BadRequestError('Unsuccessful transaction'));
    }

    // Verify if request is coming from FLUTTERWAVE
    const verification_hash = req.headers['verif-hash']
    if (verification_hash != config.FLUTTERWAVE_VERIFY_HASH) {
        return next(new UnauthenticatedError('Please provide valid authorization'))
    }

    // Check if matching transaction record exists in DB
    const txn_data = req.body.data
    const { tx_ref, amount } = txn_data
    let transaction = await Transaction.findOne(
        {
            reference: tx_ref, amount
        }
    ).populate('ride')  // if any ride is tied to transaction

    if (transaction.reflected) return res.status(200);

    await effectSuccessfullTransaction(transaction._id)

    // Update transaction status
    await transaction.update({ status: 'success' })

    await Transaction.findByIdAndUpdate(transaction._id, { reflected: true }, { new: true })

    return res.status(200).send({
        success: true,
        data: {
            message: 'Success'
        }
    })
}

module.exports = {
    getUsersTransactions,
    getTransactionData,
    getWalletTransactions,
    getTransactionData,
    confirmTopup,
    handleFlutterWaveTransactionWebhook,
};
