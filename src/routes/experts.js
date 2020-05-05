const express = require('express');
const Expert = require('../models/expert');
const Post = require('../models/post');
const User = require('../models/user');
const Systemlog = require('../models/systemlog');
const auth = require('../middleware/auth');
const checkRole = require('../utils/roleChecker');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
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
})

// expert login
router.get('/login', async (req, res) => {
    try {
        //checking if expert already  logged in
        const token = req.cookies['token'];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const expert = await Expert.findOne({ _id: decoded._id, 'tokens.token': token });

        if (!expert) {
            throw new Error()
        }

        res.render('./expert/login', { isSignedIn: true, error_msg: req.flash('error') })

    }
    catch (error) {
        res.render('./expert/login', { error_msg: req.flash('error') })
    }
})

// expert login
router.post('/login', async (req, res) => {

    try {

        const expert = await Expert.findByCredentials(req.body.email, req.body.password);

        if (!expert) {
            throw new Error('Unable to login')
        }

        // Removing all tokens from db before logging in
        if (expert.tokens) {
            expert.tokens = []

            await expert.save();
        }

        const token = await expert.generateAuthToken()

        res.cookie('token', token, {
            expires: new Date(Date.now() + 6 * 3600000), // cookie will be removed after 2 hours
            httpOnly: true
        }).redirect('/expert/dashboard')



    } catch (error) {

        req.flash('error', 'Enter valid Email/Password')
        res.redirect('/expert/login')
    }

})
// expert dashboard
router.get('/dashboard', [auth, checkRole(['Expert'])],async (req, res) => {

    
    try{

        const recentPosts = await Post.find({ hidden: false, deleted: false }).sort({ createdAt: -1 }).limit(5);
        const recentUsers = await User.find({}).limit(5).sort({ createdAt: -1 });
        const systemlogs = await Systemlog.find({ "executedBy._id": req.user._id.toString() } ).sort({ createdAt: -1 }).limit(7);

        const results = {
            recentPosts,
            recentUsers,
            systemlogs
        }

        res.render('./expert/dashboard', {results, user: req.user, totalUnasweredPosts: req.unAnsweredPosts , expertStats: true} )
       
    }
    catch(error){
        res.render('./errors/error500', { user: req.user })
    }

})

router.get('/', [auth, checkRole(['Expert'])], (req, res) => {
    res.redirect('/expert/dashboard')
})

// expert profile
router.get('/profile', [auth, checkRole(['Expert'])], async (req, res) => {

    try{

        res.render('./expert/expert-profile', { user: req.user, formControls: true, totalUnasweredPosts: req.unAnsweredPosts, success_msg: req.flash('success'), error_msg: req.flash('error') })

    }
    catch(error){
        res.render('./errors/error500', { user: req.user })
    }
})

// expert profile update
router.post('/profile', [auth, checkRole(['Expert'])], avatar.single('avatar'), async (req, res) => {

    try {

        const { currentPassWord, password } = req.body;

        const expert = await Expert.findOne({ _id: req.user._id })

        const isMatch = await bcrypt.compare(currentPassWord, expert.password);

        if (!isMatch) {
            req.flash('error', 'Current password didn\'t match')
            return res.redirect('/expert/profile')
        }
        
        if (password) {
            expert.password = await bcrypt.hash(password, 8);
        }
        
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, { "folder": "avatars", "tags": "avatar", "width": 90, "height": 90 });
            fs.unlinkSync(req.file.path);

            //removing current avatar
            if (expert.avatar.public_id) {
                await cloudinary.uploader.destroy(expert.avatar.public_id);
            }

            // setting new avatar
            expert.avatar.avatar_url = result.secure_url
            expert.avatar.public_id = result.public_id

        }

        expert.save()

        req.flash('success', 'Profile Updated Successfully')
        res.redirect('/expert/profile')
    }
    catch (error) {
        req.flash('error', 'Some Error Occured')
        res.redirect('/expert/profile')
    }
})

// get all experts from db
router.get('/all', [auth, checkRole(['Admin'])], async (req, res) => {
    
    try{

        const experts = await Expert.find({}).sort({ createdAt: -1 });

        if(!experts){
            throw new Error('No Experts Found')
        }

        const results = {
            experts,
            totalExperts: experts.length
        }

        res.render('./expert/all-experts', { results, user: req.user, totalUnasweredPosts: req.unAnsweredPosts, success_msg: req.flash('success'), error_msg: req.flash('error') })

    }
    catch(error){
        res.render('./errors/error500', { user: req.user }) 
    }

})

// add expert to db 
router.post('/new', [auth, checkRole(['Admin'])], async (req, res) => {

    try{

        const expert = new Expert(req.body);

        if(!expert){
            throw new Error()
        }

        expert.password = await bcrypt.hash(expert.password, 8);
        
        // sending email to new expert
        sgMail.send({
            to: req.body.email,
            from: process.env.FROM_EMAIL,
            subject: `You are added as Expert - ${process.env.APP_NAME}`,
            html: `<strong>
                <p>Hello, ${expert.name}</p></strong>
                <strong> ${process.env.APP_NAME} admin added you as Expert.</strong>
                <p>Being a T Remedy expert you can create/edit/delete or moderate posts.</p>
                <p>You can login with details provided below: 
                <ul>
                <li>Email: ${expert.email} </li>
                <li>password: ${req.body.password} </li>
                <li>Your Dashboard: <a href="http://${req.headers.host}/expert/dashboard">Login Here</a></li>
                </p>
                <p style="color: #ff0000;"> Note: Please change password after first login. Option available under My Profile section.</p>
                <p style="color: #ff0000;">Note: Please do not share the mail with anybody</p>
                `
        })

        await expert.save()

        req.flash('success', 'New Expert Added')
        res.redirect('/expert/all')

    }
    catch(error){
        
        // checking if email already exists
        if (error.code === 11000) {
            req.flash('error', 'Email Already Exists')
        }
        else {

            req.flash('error', 'Error Occured. Try Again')
        }
        res.redirect('/expert/all')
    }

})

// delete expert from db
router.post('/delete', [auth, checkRole(['Admin'])], async (req, res) => {

    const _id = req.body.id;

    try {

        const expert = await Expert.findByIdAndDelete(_id);

        if (!expert) {
            throw new Error('Some Error Occured')
        }

        // sending email to expert
        sgMail.send({
            to: expert.email,
            from: process.env.FROM_EMAIL,
            subject: `Your expert access was revoked - ${process.env.APP_NAME}`,
            html: `<strong>
                <p>Hello, ${expert.name}</p>
                Your Expert access for ${process.env.APP_NAME} has been <span style="color: #FF3547;">revoked</span> by <i>${req.user.name}</i>(admin)</strong>
                <p>Please contact <i>${req.user.name}</i> for further inquiry.</p>
                <br>
                <p><u>Contact info:</u><p>
                <p>${req.user.name}</p>
                <p>${req.user.email}</p>
                `
        })

        req.flash('success', 'Expert Deleted Successfully.')

        res.redirect('/expert/all')

    }
    catch (error) {

        req.flash('error', 'Some Error Occured')
        res.redirect('/expert/all')
    }
})


// expert logout route

router.get('/logout', [auth, checkRole(['Expert'])], async (req, res) => {

    try {

        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })

        await req.user.save()

        res.clearCookie('token').redirect('/expert/login');
    }
    catch (error) {
        res.render('./errors/error500', { user: req.user })
    }
})


module.exports = router