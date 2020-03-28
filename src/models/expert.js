const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// dotenv init 
dotenv.config();

const expertSchema = new mongoose.Schema({

    name: {
        type: String,
        required: false,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    avatar: {
        avatar_url: {
            type: String,
            default: 'https://res.cloudinary.com/tremedy/image/upload/c_scale,w_90/v1582207349/avatars/man_2_lvablz.png'
        },
        public_id: String
    },
    resetPasswordToken: {
        type: String,
        required: false
    },
    role:{
        type: String,
        default: 'Expert'
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
})


// hiding sensitive info from user
expertSchema.methods.toJSON = function () {

    const expert = this
    const expertObject = expert.toObject()

    delete expertObject.password
    delete expertObject.tokens

    return expertObject
}

// generate auth token function
expertSchema.methods.generateAuthToken = async function () {
    const expert = this
    const token = jwt.sign({ _id: expert._id.toString(), role: 'Expert' }, process.env.JWT_SECRET, { expiresIn: '6h' })

    expert.tokens = expert.tokens.concat({ token })

    await expert.save()

    return token
}

// generate reset password token
expertSchema.methods.generateResetPassToken = async function () {
    const expert = this
    const resetToken = jwt.sign({ _id: expert._id.toString(), role: 'expert'}, process.env.JWT_SECRET, { expiresIn: '15m' })

    expert.resetPasswordToken = resetToken
    await expert.save()

    return resetToken
}


// custom login function for expert
expertSchema.statics.findByCredentials = async (email, password) => {

    const expert = await Expert.findOne({ email })

    if (!expert) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, expert.password);

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return expert
}


const Expert = mongoose.model('Expert', expertSchema);

module.exports = Expert;