const express = require('express');
const Admin = require('../models/admin');
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

router.get('/', (req, res) => {
    res.render('index')
})


// forgot/Reset Password
router.get('/forgotPassword', async (req, res) => {
    res.render('forgotPassword', {success_msg: req.flash('success'), error_msg: req.flash('error')})
})

// forgot/Reset Password
router.post('/forgotPassword', async (req, res) => {
    
    try{

        const admin = await Admin.findOne({email: req.body.email});

        if(!admin){
            throw new Error('Not a valid Email')
        }
        
        const resetPasswordToken = await admin.generateResetPassToken();
        const link = "http://"+ req.headers.host + "/passwordReset/" + resetPasswordToken;

        // sending email to user
        sgMail.send({
            to: admin.email,
            from: process.env.FROM_EMAIL,
            subject: 'Reset Your Password|T Remedy',
            html: `<strong>
                        <p>Hello, ${admin.name}</p>
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

        const decoded = await jwt.verify(req.params.token, process.env.JWT_SECRET);
        const admin = await Admin.findOne({ _id: decoded._id, resetPasswordToken: req.params.token })

        if (!admin) {
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
        
        // checking if both passwords matches
        if (req.body.password != req.body.confirmPassword){
            
            req.flash('error','Passwords doesn\'t match')
            return res.redirect('/passwordReset/' + req.params.token)
        }

        const decoded = jwt.verify(resetPasswordToken, process.env.JWT_SECRET);
        const admin = await Admin.findOne({_id: decoded._id, resetPasswordToken})

        if (!admin) {
            throw new Error('Link Invalid/Expired. Please Retry')
        }

        admin.password = await bcrypt.hash(req.body.password, 8);
        admin.resetPasswordToken = undefined

        await admin.save()

        res.render('resetPassword', { success: true})

    }
    catch (error) {
        res.render('resetPassword', { success: false})
    }
})

// sending mails
router.get('/sendMail', auth, async (req, res) => {

    const email = req.query.mailto
    const name = req.query.name
    try{

        // const user
    
        res.render('sendMail', {email, name, user: req.user , success_msg:  req.flash('success'), error_msg: req.flash('error')})
    
    }
    catch(error) {

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

        res.render('trash', { results , pagination: req.results.pagination, user: req.user })

    }
    catch(error){

    }
})


module.exports = router