const express = require('express');
const Admin = require('../models/admin');
const User = require('../models/user');
const Post = require('../models/post');
const Email = require('../models/email');
const Expert = require('../models/expert');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const checkRole = require('../utils/roleChecker');
const { paginateDeletedPosts, paginateEmail } = require('../middleware/paginateData')
const sgMail = require('@sendgrid/mail');
const router = new express.Router();

//cotenv init
dotenv.config()

// SendGrid config
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.get('/', (req, res) => {
    res.render('index')
})


router.get('/stats', auth, async (req, res) => {
   
    try{

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        const userStats = {
            data: [],
            labels: []
        }

        const postStats = {
            data: [],
            labels: []
        }

        for (i = 6; i >= 0; i--) {

            const now = moment().subtract(i, 'days').toDate()

            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            start.setHours(0, 0, 0, 0);

            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end.setHours(23, 59, 59, 999);

            const user = await User.find({ createdAt: { $gte: start, $lte: end } }).countDocuments().exec();

            userStats.data.push(user)
            userStats.labels.push(`${months[now.getMonth()]} ${now.getDate()}`)
        }

        // ans post count
        let post = await Post.find({hidden: false,deleted: false}).countDocuments().exec();
        postStats.data.push(post)
        postStats.labels.push('Answered')
        
        // Unans post count
        post = await Post.find({ hidden: true, deleted: false }).countDocuments().exec();
        postStats.data.push(post)
        postStats.labels.push('Unanswered')
       
        //del posts count
        post = await Post.find({ deleted: true }).countDocuments().exec();
        postStats.data.push(post)
        postStats.labels.push('Deleted')

    
        res.json({ userStats, postStats })

    }   
    catch(error){
        res.json({ 'error': error.message })
    }
})

//expert route

router.get('/stats/postStats', auth, async (req, res) => {
   
    try{

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        const postStats = {
            data: [],
            labels: []
        }

        for (i = 6; i >= 0; i--) {

            const now = moment().subtract(i, 'days').toDate()

            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            start.setHours(0, 0, 0, 0);

            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end.setHours(23, 59, 59, 999);

            const post = await Post.find({ createdAt: { $gte: start, $lte: end } }).countDocuments().exec();

            postStats.data.push(post)
            postStats.labels.push(`${months[now.getMonth()]} ${now.getDate()}`)
        }

        // // ans post count
        // let post = await Post.find({hidden: false,deleted: false}).countDocuments().exec();
        // postStats.data.push(post)
        // postStats.labels.push('Answered')
        
        // // Unans post count
        // post = await Post.find({ hidden: true, deleted: false }).countDocuments().exec();
        // postStats.data.push(post)
        // postStats.labels.push('Unanswered')
       
        // //del posts count
        // post = await Post.find({ deleted: true }).countDocuments().exec();
        // postStats.data.push(post)
        // postStats.labels.push('Deleted')

    
        res.json({ postStats })

    }   
    catch(error){
        res.json({ 'error': error.message })
    }
})

// forgot/Reset Password
router.get('/forgotPassword', async (req, res) => {
    res.render('forgotPassword', {success_msg: req.flash('success'), error_msg: req.flash('error')})
})

// forgot/Reset Password
router.post('/forgotPassword', async (req, res) => {
    
    const role = req.body.role;

    try{
        
        let user = {}

        if(role && role === 'admin'){
             
            user = await Admin.findOne({email: req.body.email});
        }
        else if(role && role === 'expert'){
            user = await Expert.findOne({ email: req.body.email });
        }

        
        if(!user){
            throw new Error('Not a valid Email')
        }
        
        const resetPasswordToken = await user.generateResetPassToken();
        const link = "http://"+ req.headers.host + "/passwordReset/" + resetPasswordToken;

        // sending email to user
        sgMail.send({
            to: user.email,
            from: process.env.FROM_EMAIL,
            subject: 'Reset Your Password|T Remedy',
            html: `<strong>
                        <p>Hello, ${user.name}</p>
                        <p>Do you want to reset your password?</p>
                    </strong>
                    <p>Please click on the following <a href="${link}">link</a> to reset your password.<p>
                    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                    <p>
                    Reset Password: ${link} </li>
                    </p>
                    <p style="color: #FF3547"> Remember the link will expire in 20 min</p>
                    <p style="color: #FF3547"> IMPORTANT: Please don't share this email with anybody</p>
            
                  `
        })

        req.flash('success', 'Please Check Your Email')
        res.redirect('/forgotPassword')
    }   
    catch(error){
        req.flash('error', 'Some Error Occured')
        res.redirect('/forgotPassword')
    }
})

// password Reset -> setting new password
router.get('/passwordReset/:token', async (req,res) => {

    try{
        let user = {};
        const decoded = await jwt.verify(req.params.token, process.env.JWT_SECRET);

        if(decoded.role === 'admin'){
            user = await Admin.findOne({ _id: decoded._id, resetPasswordToken: req.params.token })
        }
        else if(decoded.role === 'expert'){
            user = await Expert.findOne({ _id: decoded._id, resetPasswordToken: req.params.token })
        }

        if (!user) {
            throw new Error('Link Invalid/Expired. Please Retry')
        }

        res.render('resetPassword', { resetPasswordToken: req.params.token, isTokenValid: true, success_msg: req.flash('success'), error_msg: req.flash('error')})

    }
     catch(error) {
        res.render('resetPassword', { isTokenValid: false })
     }
})
// change the password
router.post('/passwordReset', async (req, res) => {
    
    const resetPasswordToken = req.body.token;

    try {
        
        let user;

        // checking if both passwords matches
        if (req.body.password != req.body.confirmPassword){
            
            req.flash('error','Passwords doesn\'t match')
            return res.redirect('/passwordReset/' + req.params.token)
        }

        const decoded = jwt.verify(resetPasswordToken, process.env.JWT_SECRET);

        if (decoded.role === 'admin') {
            user = await Admin.findOne({ _id: decoded._id, resetPasswordToken })
        }
        else if (decoded.role === 'expert') {
            user = await Expert.findOne({ _id: decoded._id, resetPasswordToken })
        }

        if (!user) {
            throw new Error('Link Invalid/Expired. Please Retry')
        }

        user.password = await bcrypt.hash(req.body.password, 8);
        user.resetPasswordToken = undefined

        await user.save()

        res.render('resetPassword', { success: true})

    }
    catch (error) {
        res.render('resetPassword', { success: false})
    }
})

// sending mails
router.get('/sendMail', auth, paginateEmail, async (req, res) => {

    const email = req.query.mailto
    const name = req.query.name
    try{

        if(!req.query.page){
            res.redirect('/sendMail?page=1')
        }
        
        res.render('sendMail', { results: req.results, pagination: req.results.pagination, email, name, user: req.user, totalUnasweredPosts: req.unAnsweredPosts, success_msg:  req.flash('success'), error_msg: req.flash('error')})
    
    }
    catch(error) {
        console.log(error)
    }
})

// sending mail
router.post('/sendMail', auth, async (req, res) => {

    try{

        const { name, recipientEmail, subject, message } = req.body

        if(!name || !recipientEmail || !subject || !message){
            req.flash('error', 'Please fill all details')
            return res.redirect('/sendMail')
        }

        const msg = {
            to: recipientEmail,
            from: 'tremedy101@gmail.com',
            subject: subject,
            html: `
                    <strong><p>Hello, ${name}</p></strong>
                    <p>${message}</p>
                    
                    `
          }
        
        await sgMail.send(msg)

        // logging email activity
        const email = new Email()

        email.mail.name = name;
        email.mail.recipientEmail = recipientEmail;
        email.mail.subject = subject
        email.mail.message = message

        email.sentBy.name = req.user.name
        email.sentBy.email = req.user.email
        email.sentBy.id = req.user._id
        email.sentBy.role = req.user.role

        email.save()

        req.flash('success', 'Email Sent Successfully.')
        res.redirect('/sendMail')

    }
    catch(error){
        req.flash('error', 'Some Error Occured')
        res.redirect('/sendMail')
    }

})


//trash route

router.get('/trash', auth, paginateDeletedPosts, async (req, res) => {

    try{

        // checking if page is query passed
        if (!req.query.page) {
            return res.redirect('/trash?page=1')
        }

        const posts = req.results.posts;
        const totalPosts = posts.length;

        const results = {
            posts: req.results.posts,
            totalPosts
        }

        res.render('trash', { results, pagination: req.results.pagination, user: req.user, totalUnasweredPosts: req.unAnsweredPosts })

    }
    catch(error){

    }
})


module.exports = router