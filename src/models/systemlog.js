const mongoose = require('mongoose');
const { currentDate, currentTime } = require('../utils/utils.dateTime');

const systemlogSchema = new mongoose.Schema({

    type: String,
    action: String,
    executedOn: {
        name: String,
        _id: String
    },
    executedBy: {
       name: String,
       _id: String
    },
    metadata: {
        date: String,
        time: String
    }

},{
    timestamps: true
})

// adding the current date and time 
systemlogSchema.pre('save', async function (next) {

    const log = this;

    log.metadata.date = currentDate();
    log.metadata.time = currentTime();

    next()
});



const Systemlog = mongoose.model('Systemlog', systemlogSchema);

module.exports = Systemlog;