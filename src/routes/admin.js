const express = require('express');
const Admin = require('../models/admin');
const Post = require('../models/post');
const User = require('../models/user');
const Expert = require('../models/expert')
const Systemlog = require('../models/systemlog');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const checkRole = require('../utils/roleChecker');
const { paginateDeletedPosts } = require('../middleware/paginateData')
const sgMail = require('@sendgrid/mail');
const router = new express.Router();

//cotenv init
dotenv.config()

// SendGrid config
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// cloudinary config
require('../configs/cloudinary')

// multer config for Post Images Upload import from configs dir

const storage = multer.diskStorage({ // notice you are calling the multer.diskStorage() method here, not multer()
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.toLowerCase().match(/\.(jpeg|jpg|png)$/)) {

            return cb(new Error('Please upload a JPEG/JPG or PNG file.'))
        }

        cb(undefined, true)
    }
});


// multer config for image upload
const avatar = multer({
    storage: storage,
    limits: {
        fileSize: 1000000
    }
}).single('avatar')


// admin root route
router.get('/', [auth, checkRole(['Admin'])], (req, res) => {
    res.redirect('/admin/dashboard')
}) 


// login routes 
router.get('/login', async (req, res) => {

    try {
        //checking if admin already logged in
        const token = req.cookies['token'];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!admin) {
            throw new Error()
        }

        res.render('./admin/login', { isSignedIn: true, error_msg: req.flash('error') })

    }
    catch (error) {
        res.render('./admin/login', { error_msg: req.flash('error') })
    }
})

//login route
router.post('/login', async (req, res) => {

    try {

        const admin = await Admin.findByCredentials(req.body.email, req.body.password);

        if (!admin) {
            throw new Error('Unable to login')
        }

        // Removing all tokens from db before logging in
        if (admin.tokens) {
            admin.tokens = []

            await admin.save();
        }

        const token = await admin.generateAuthToken()

        res.cookie('token', token, {
            expires: new Date(Date.now() + 6 * 3600000), // cookie will be removed after 2 hours
            httpOnly: true
        }).redirect('/admin/dashboard')

    } catch (error) {

        req.flash('error', 'Enter valid Email/Password')
        res.redirect('/admin/login')
    }

})

// admin dashboard
router.get('/dashboard', [auth, checkRole(['Admin'])], async (req, res) => {

    try{
        let users = {}
        const recentPosts = await Post.find({ hidden: false, deleted: false }).sort({ createdAt: -1 }).limit(5);
        const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(4);
        users.visitors = await User.find({ blocked: false }).countDocuments();
        users.admins = await Admin.find({}).countDocuments();
        users.experts = await Expert.find({}).countDocuments();
        users.banned = await User.find({ blocked: true}).countDocuments();
        const systemlogs = await Systemlog.find().sort({ createdAt: -1 }).limit(7);

        const results = {
            recentPosts,
            recentUsers,
            users,
            systemlogs
        }

        res.render('./admin/dashboard', { results, user: req.user, totalUnasweredPosts: req.unAnsweredPosts, adminStats: true})

    }
    catch(error){
        res.render('./errors/error500', { user: req.user })
    }
})


// admin profile
router.get('/profile', [auth, checkRole(['Admin'])], (req, res) => {

    res.render('./admin/admin-profile', { user: req.user, totalUnasweredPosts: req.unAnsweredPosts,success_msg: req.flash('success'), error_msg: req.flash('error') })
})

// admin profile edit
router.post('/profile', [auth, checkRole(['Admin'])], async (req, res) => {

    try{

        avatar(req, res, async function (err) {
            
            if (err instanceof multer.MulterError) {

                // file too large
                if (err.code === 'LIMIT_FILE_SIZE') {
                    req.flash('error', 'File size too large')
                    return res.redirect('/admin/profile')
                }

            } else if (err) {
                // An unknown error occurred when uploading.
                req.flash('error', 'Some Error Occured')
                return res.redirect('/admin/profile')
            }

        // Everything went fine.
       
        const { password} = req.body;

        const admin = await Admin.findOne({ _id: req.user._id})
    
        if(password){
            admin.password = await bcrypt.hash(password, 8);
        }
        
        if (req.file){

            const result = await cloudinary.uploader.upload( req.file.path, { "folder": "avatars","tags": "avatar", "width": 90, "height": 90 });
            fs.unlinkSync(req.file.path);
            
            //removing current avatar
            if (admin.avatar.public_id) {
                await cloudinary.uploader.destroy(admin.avatar.public_id);
            }

            // setting new avatar
            admin.avatar.avatar_url = result.secure_url
            admin.avatar.public_id = result.public_id
    
        }

        admin.save()
        
        req.flash('success', 'Profile Updated Successfully')
        res.redirect('/admin/profile')
    })
}
    catch(error){

        req.flash('error', 'Some Error Occured')
        return res.redirect('/admin/profile')
    }
})


//admin logout route

router.get('/logout', [auth, checkRole(['Admin'])], async (req, res) => {

    try {

        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })

        await req.user.save()

        res.clearCookie('token').redirect('/admin/login');
    }
    catch (error) {
        res.render('./errors/error500', { user: req.user })
    }
})

// get all admins 

router.get('/all', [auth, checkRole(['Admin'])], async (req, res) => {

    const admins = await (await Admin.find({})).filter((admin) => {

        if (admin.email != req.user.email) {
            return admin
        }
    });

    if (!admins) {
        throw new Error('No Admins found')
    }

    res.render('./admin/all-admins', { admins, user: req.user, totalUnasweredPosts: req.unAnsweredPosts, success_msg: req.flash('success'), error_msg: req.flash('error') })

})


// adding admins
router.post('/new', [auth, checkRole(['Admin'])], async (req, res) => {

    try {
        const admin = new Admin(req.body);

        if (!admin) {
            throw new Error('Some Error Occured')
        }

        admin.password = await bcrypt.hash(admin.password, 8);
        await admin.save()

        // sending email to user
        sgMail.send({
            to: req.body.email,
            from: process.env.FROM_EMAIL,
            subject: `You are added as an Admin - ${process.env.APP_NAME}`,
            html: `<strong>
                <p>Hello, ${admin.name}</p>
                You are added as a Admin of ${process.env.APP_NAME}</strong>
                <br>
                <p>You can login with below details: 
                <li>Email: ${admin.email} </li>
                <li>password: ${req.body.password} </li>
                <li>Your Dashboard <a href="http://${req.headers.host}/">Go to dashboard</a></li>
                <br>
                <p style="color: #ff0000;"> Note: Please change password after first login. Option available under My Profile section.</p>
                </p>`
        })

        req.flash('success', 'New Admin Added')

        res.redirect('/admin/all')

    }
    catch (error) {

        // checking if email already exists
        if (error.code === 11000) {
            req.flash('error', 'Email Already Exists')
        }
        else {

            req.flash('error', 'Error Occured. Please Try Again')
        }

        res.redirect('/admin/all')
    }

})


// deleting admins

router.post('/delete', [auth, checkRole(['Admin'])], async (req, res) => {

    const _id = req.body.id;

    try {

        const admin = await Admin.findByIdAndDelete(_id);

        if (!admin) {
            throw new Error('Some Error Occured')
        }

        // sending email to user
        sgMail.send({
            to: admin.email,
            from: process.env.FROM_EMAIL,
            subject: `Your admin access was revoked - ${process.env.APP_NAME}`,
            html: `<strong>
                <p>Hello, ${admin.name}</p>
                Your Admin access for ${process.env.APP_NAME} has been <span style="color: #FF3547;">revoked</span> by <i>${req.user.name}</i></strong>
                <p>Please contact <i>${req.user.name}</i> for further inquiry.</p>
                <br>
                <p><u>Contact info:</u><p>
                <p>${req.user.name}</p>
                <p>${req.user.email}</p>
                `
        })

        req.flash('success', 'Admin Deleted Successfully.')

        res.redirect('/admin/all')

    }
    catch (error) {

        req.flash('error', 'Some Error Occured')
        res.redirect('/admin/all')
    }
})




module.exports = router