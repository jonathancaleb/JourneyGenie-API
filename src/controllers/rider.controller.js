const { Rider } = require("../models/users.model")

const goOnline = async function (req, res, next) {
    const rider = await Rider.findOne({user: req.user.id})
    
    const result = await rider.goOnline()
    if (result instanceof Error) throw result;

    res.status(200).json({
        success: true,
        data: {
            message: 'Rider is now online'
        }
    })
}

const goOffline = async function (req, res, next) {
    const rider = await Rider.findOne({user: req.user.id})
    
    const result = await rider.goOffline()
    if (result instanceof Error) throw result;

    res.status(200).json({
        success: true,
        data: {
            message: 'Rider is now offline'
        }
    })
}

module.exports = {
    goOnline,
    goOffline
}
