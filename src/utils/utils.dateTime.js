// this is utility that provides the current date and time

const moment = require('moment');

const currentDate = function() {
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const timestamp = new Date();

    let d = timestamp.getDate()
    let m = timestamp.getMonth()
    let y = timestamp.getFullYear()

    const date = `${d} ${months[m]}, ${y}`;

    return date
}

const currentTime = function(){
    
    const today = moment()
    const time = today.format('LT')

    return time
}

module.exports = { currentDate, currentTime }