const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const passwordSchema = new mongoose.Schema({
    password: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
})

passwordSchema.pre('save', async function (next) {
    const password = this
    const salt = await bcrypt.genSalt(10)
    if (password.isModified('password')) {
        password.password = await bcrypt.hash(password.password, salt)
    }
    next()
})

passwordSchema.changePassword = async (new_password) => {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(new_password, salt)

    this.password = hashedPassword

    await this.save()
}

passwordSchema.validatePassword = async (password) => {
    return await bcrypt.compare(password, user.password)
}

const Password = mongoose.model('Password', passwordSchema)

module.exports = Password
