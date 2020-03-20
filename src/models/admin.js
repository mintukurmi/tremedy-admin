const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// dotenv init 
dotenv.config(); 

const adminSchema = new mongoose.Schema({
  
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
        type: String,
        requiured: false,
        default: 'https://res.cloudinary.com/tremedy/image/upload/v1582207349/avatars/man_2_lvablz.png'
    },
    resetPasswordToken: {
        type: String,
        required: false
    },
    role:{
        type: String,
        default: 'Admin'
    }    ,
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
adminSchema.methods.toJSON = function(){

    const admin = this
    const adminObject = admin.toObject()

    delete adminObject.password
    delete adminObject.tokens

    return adminObject
}

// generate auth token function
adminSchema.methods.generateAuthToken = async function(){
    const admin = this
    const token = jwt.sign({ _id: admin._id.toString(), role: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '2h' })

    admin.tokens = admin.tokens.concat({ token })

    await admin.save()

    return token
}

// generate reset password token
adminSchema.methods.generateResetPassToken = async function(){
    const admin = this
    const resetToken = jwt.sign({ _id: admin._id.toString()}, process.env.JWT_SECRET, { expiresIn: '1h' })

    admin.resetPasswordToken = resetToken
    await admin.save()

    return resetToken
}


// custom login function for admin 
adminSchema.statics.findByCredentials = async (email, password) => {

    const admin = await Admin.findOne({ email })

    if(!admin){
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if(!isMatch){
        throw new Error('Unable to login')
    }

    return admin
}


const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;