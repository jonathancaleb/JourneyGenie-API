const { default: axios } = require("axios");
const config = require('../../config')

/**
 * Create New Virtual Account data From FlutterWave
 * 
 * @param {string} email
 * @param {string} firstname
 * @param {string} lastname
 * @param {string} tx_ref - Transaction reference
 * @param {number} frequency - Maximum number of payments alloed
 * @param {number} amount  - Expected ammount to be payed
 * @param {boolean} is_permanent - Chooses between temporary or permanent account
 *  
 * @returns {Object} Virtual Account data
 */
async function createFLWVirtualAccount(data) {
    const account_data = {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        tx_ref: data.tx_ref,
        frequency: data.frequency,
        amount: data.amount,
        is_permanent: data.is_permanent,
        user: data.user
    }

    // Send request data to flutterwave to create virtual account
    const axios_config = {
        method: 'post',
        url: 'https://api.flutterwave.com/v3/virtual-account-numbers',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.FLUTTERWAVE_SECRET_KEY}`
        },
        data: account_data
    };

    const response = await axios(axios_config)
    if (response.data.status != 'success') {
        throw new Error('An error occured')
    }

    return response.data.data
}

module.exports = {
    createFLWVirtualAccount
}
