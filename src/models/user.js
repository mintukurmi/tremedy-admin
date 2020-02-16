const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  
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
    date: { 
        type: Date, 
        default: Date.now 
    },
    avatar: {
        type: String,
        requiured: false
    },
    blocked: {
        type: Boolean,
        default: false
    }
})


userSchema.statics.findByCredentials = async (email, password) => {

    
}


const User = mongoose.model('User', userSchema);

module.exports = User;