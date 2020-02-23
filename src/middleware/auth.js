const Admin = require('../models/admin');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

//dotenv config
dotenv.config()


const auth = async (req, res, next) => {

    
    try{

       const token = req.cookies['token'];
       
       const decoded = jwt.verify(token, process.env.JWT_SECRET)

       const admin = await Admin.findOne({ _id: decoded._id , 'tokens.token': token })

       if(!admin){
           throw new Error()
       }
        
       req.token = token;
       req.admin = admin;
       
        next()
    }
    catch(error){
        
        res.redirect('/login')
    }
    
}


module.exports = auth