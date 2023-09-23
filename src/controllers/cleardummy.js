const { default: mongoose } = require("mongoose")
const { Rider, User } = require("../models/users.model")
const Password = require("../models/password.model")
const { randomBytes } = require("crypto")


const emails = [
    "JourneyGenierider9@gmail.com",
    "JourneyGenierider16@gmail.com",
    "JourneyGenierider15@gmail.com",
    "JourneyGenierider14@gmail.com",
    "JourneyGenierider13@gmail.com",
    "JourneyGenierider17@gmail.com"
]
async function clear() {
    await mongoose.connect('mongodb+srv://sabilacalebjonathan:nethanel@cluster0.mls7anb.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })

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
            firstname: "JourneyGenie",
            lastname: "rider",
            password: "testpassword",
            phone: "+256750681731",
            address: "Kampala",
            city: "Kampala City",
            state: "Kampala State",
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


