const mongoose = require('mongoose')
const schema = mongoose.Schema

const authoSchema = new schema({
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true, enum: ['admin', 'rider', 'user'] },
    permissions: [{ type: String, required: true }], // Format: "module:action"
    restrictions: [{ type: String, required: true }], // Format: "module:action"
    createdAt: { type: Date, default: Date.now },
})

const Autho = mongoose.model('Autho', authoSchema)

module.exports = Autho
