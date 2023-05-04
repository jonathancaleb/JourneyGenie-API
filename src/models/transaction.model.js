const { BadRequestError } = require('../utils/errors');

const mongoose = require('mongoose'),
    bcrypt = require('bcryptjs'),
    schema = mongoose.Schema,
    UU = require('uuid').v4;

const invoiceSchema = new schema({
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    invoice_id: { type: String, required: true, default: UU },
    amount: { type: Number, required: true },
    type: {
        type: String,
        required: true,
        enum: ['wallet_topup', 'book_ride', 'wallet_withdrawal'],
    },
    transaction: {
        type: schema.Types.ObjectId,
        ref: 'Transaction',
        required: true,
    },
    date: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
});

const receiptSchema = new schema({
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    rider: { type: schema.Types.ObjectId, ref: 'Rider' },
    enduser: { type: schema.Types.ObjectId, ref: 'EndUser' },
    ride: { type: schema.Types.ObjectId, ref: 'Ride' },
    amount: { type: Number, required: true },
    transaction: {
        type: schema.Types.ObjectId,
        ref: 'Transaction',
        required: true,
    },
    type: {
        type: String,
        enum: ['wallet_topup', 'book_ride', 'wallet_withdrawal'],
    },
    reference: { type: String, required: true, default: UU },
    createdAt: { type: Date, default: Date.now },
    date: { type: Date, default: Date.now },
});

const transactionsSchema = new schema(
    {
        amount: { type: Number, required: true },
        type: {
            type: String,
            required: true,
            enum: ['wallet_topup', 'book_ride', 'wallet_withdrawal'],
        },
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        rider: { type: schema.Types.ObjectId, ref: 'Rider' },
        // enduser: { type: schema.Types.ObjectId, ref: 'EndUser' },
        ride: { type: schema.Types.ObjectId, ref: 'Ride' },
        // Receipt is only required if transaction status is success
        receipt: {
            type: schema.Types.ObjectId,
            ref: 'Receipt',
            // required: true,
        },
        ride: { type: schema.Types.ObjectId, ref: 'Ride' },
        invoice: {
            type: schema.Types.ObjectId,
            ref: 'Invoice',
            required: true,
        },
        payment_method: {
            type: String,
            required: true,
            enum: ['ussd', 'card', 'bank_transfer', 'wallet', 'cash'],
        },
        virtual_account: {
            type: schema.Types.ObjectId, ref: 'VirtualAccount',
            // required: true   // Required if payment_mode is is bank transfer
        },
        status: {
            type: String,
            required: true,
            default: 'pending',
            enum: ['pending', 'success', 'failed'],
        },
        reference: { type: String, default: UU, required: true },
        reflected: { type: Boolean, default: false, required: true }, // If transaction has been reflected in user's wallet
        date: { type: Date, default: Date.now, required: true },
        payment_gateway: { type: String, enum: ['flutterwave', 'paystack'], required: true ? true : false }
    },
    { toJSON: { virtuals: true }, toObject: { virtuals: true }, timestamps: true }
);

transactionsSchema.pre('validate', async function (next) {
    if (this.status == 'success') {
        // There should be a receipt if status is success
        if (!this.receipt) {
            return next(new BadRequestError('Please specify receipt id'));
        }
        if (!this.invoice) {
            return next(new BadRequestError('Please specify invoice id'));
        }
    }

    next()
});

transactionsSchema.post('updateOne', async function () { return this })
transactionsSchema.methods.generateReceipt = async function () {
    if (this.status != 'success')
        throw new Error('Transaction is not successful, Can not generate receipt');

    const receipt = new Receipt({
        user: this.user,
        amount: this.amount,
        transaction: this._id,
        type: this.type,
    });

    if (this.type == 'book_ride') {
        receipt.ride = this.ride;
        receipt.rider = this.rider;
    }

    if (this.type == 'wallet_topup' || this.type == 'wallet_withdrawal') {
        receipt.enduser = this.enduser;
    }

    await receipt.save();

    this.receipt = receipt._id;

    await this.save();

    return await receipt.populate('transaction');
};

const Invoice = mongoose.model('Invoice', invoiceSchema);
const Receipt = mongoose.model('Receipt', receiptSchema);
const Transaction = mongoose.model('Transaction', transactionsSchema);

module.exports = { Invoice, Receipt, Transaction };
