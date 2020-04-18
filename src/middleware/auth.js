const Admin = require('../models/admin');
const Post = require('../models/post');
const Expert = require('../models/expert'); 
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

//dotenv config
dotenv.config()


const auth = async (req, res, next) => {

    
    try{

       const token = req.cookies['token'];
       
       const decoded = jwt.verify(token, process.env.JWT_SECRET)
       
        if(decoded.role == 'Admin'){
                const admin = await Admin.findOne({ _id: decoded._id , 'tokens.token': token })
            
                if (!admin) {
                    throw new Error()
                }

            req.user = admin;
        }
        else if (decoded.role == 'Expert') {
                const expert = await Expert.findOne({ _id: decoded._id, 'tokens.token': token })

                if (!expert) {
                    throw new Error()
                }
             req.user = expert;
            }
        
        const name = req.user.name.split(" ");
        
        req.user.fname = name[0]
        req.token = token;
        req.role = decoded.role

        req.unAnsweredPosts = await Post.find({ hidden: true, deleted: false, answeredBy: undefined}).countDocuments();
        
        next()
    }
    catch(error){
        req.flash('error', 'Please Login First')
        res.redirect('/')
    }
    
}


module.exports = auth