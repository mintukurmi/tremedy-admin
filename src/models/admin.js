const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
        requiured: false
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
    const token = jwt.sign({ _id: admin._id.toString() }, 'thisisasecret', { expiresIn: '365 days' })

    admin.tokens = admin.tokens.concat({ token })

    await admin.save()

    return token
}

// custom login function for admin 
adminSchema.statics.findByCredentials = async (email, password) => {

    const admin = await Admin.findOne({ email });

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