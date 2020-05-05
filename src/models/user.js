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
        type: String 
    },
    avatar: {
        type: String,
        requiured: false
    },
    blocked: {
        type: Boolean,
        default: false
    },
    onesignal_player_id: String
}, {
    timestamps: true
})


userSchema.index({ name: 'text', email: 'text' });

const User = mongoose.model('User', userSchema);

module.exports = User;