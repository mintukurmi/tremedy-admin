const mongoose = require('mongoose');
const dotenv = require('dotenv');

// dotenv init 
dotenv.config(); 

mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
});



