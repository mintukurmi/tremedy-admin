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
        type: String,
        trim: true
    },
    date: { 
        type: Date, 
        default: Date.now 
    },
    avatar: {
     avatar_url: {
         type: String,
        required: false,
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
        default: 'Admin'
    },
    hidden: {
        type: Boolean,
        default: false
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
    const token = jwt.sign({ _id: admin._id.toString(), role: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '6h' })

    admin.tokens = admin.tokens.concat({ token })

    await admin.save()

    return token
}

// generate reset password token
adminSchema.methods.generateResetPassToken = async function(){
    const admin = this
    const resetToken = jwt.sign({ _id: admin._id.toString(), role: 'admin'}, process.env.JWT_SECRET, { expiresIn: '20m' })

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