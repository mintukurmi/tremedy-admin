const mongoose = require('mongoose');
const { currentDate, currentTime } = require('../utils/utils.dateTime');

const emailSchema = new mongoose.Schema({

    mail: {
        name : String,
        recipientEmail : String,
        subject : String,
        message : String
    },

    sentBy: {
        name : String,
        email : String,
        _id : String,
        role : String
    },

    metadata: {
        date: String,
        time: String
    }
})



emailSchema.pre('save', async function(next) {
    
    const email = this; 

    email.metadata.date = currentDate();
    email.metadata.time = currentTime();

    next()
  });

  const Email = mongoose.model('Email', emailSchema);

  module.exports = Email;