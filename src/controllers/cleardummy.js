const { default: mongoose } = require("mongoose")
const { Rider, User } = require("../models/users.model")
const Password = require("../models/password.model")
const { randomBytes } = require("crypto")


const emails = [
    "cruiserider9@gmail.com",
    "cruiserider16@gmail.com",
    "cruiserider15@gmail.com",
    "cruiserider14@gmail.com",
    "cruiserider13@gmail.com",
    "cruiserider17@gmail.com"
]
async function clear() {
    await mongoose.connect('mongodb+srv://cruise_dev:Gai7zOKVv9dGkrgv@boayant.haz1j1c.mongodb.net/cruise_dev?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })

    for (let i = 0; i < emails.length; i++) {
        const email = emails[i]
        const user = await User.findOneAndUpdate({ email }, { email: email + randomBytes(4) })

        console.log(user)
    }

    await addRiders()
}

async function addRiders() {
    const data = {
        personal_details: {
            firstname: "cruise",
            lastname: "rider",
            password: "testpassword",
            phone: "+243325123423165",
            address: "No 3, Ibeju Lekki, Lagos State, Nigeria",
            city: "Lagos City",
            state: "Lagos State",
            driver_license: "SDNF23R309342S023",
            taxi_license: "SKDFJ3304UER23R",
            referral: "BSDLK2233S"
        },
    
        vehicle_details: {
            name: "Benz",
            manufacturer: "Volvo",
            model: "C300",
            year: "2020",
            color: "green",
            plate_number: "BE7-SE23E-123"
        }
    }

    for (let i = 0; i < emails.length; i++) {
        const email = emails[i]
        const user = await User.create({ ...data.personal_details, email, role: "rider" })
        const rider = await Rider.create({ user: user._id, ...data.personal_details, email, role: "rider" })
        user.rider = rider._id
        await user.save()
        await Password.create({ user: user._id, password: data.personal_details.password })

        console.log(rider)
    }
}

clear()


