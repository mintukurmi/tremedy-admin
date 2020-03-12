const express = require('express');
const Admin = require('../models/admin');
const Post = require('../models/post');
const multer = require('multer');
const bcrypt = require('bcryptjs')
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv')
const fs = require('fs')
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
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

// login routes 
router.get('/login', async (req, res) => {

    try{
        //checking if admin already  logged in
        const token = req.cookies['token'];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findOne({ _id: decoded._id, 'tokens.token': token });

        if(!admin){
            throw new Error()
        }

        res.render('login', { isSignedIn: true, error_msg: req.flash('error') })

    }
    catch(error){
        res.render('login', { error_msg: req.flash('error') })
    }
})

router.post('/login', async (req, res) => {

    try{

        const admin = await Admin.findByCredentials(req.body.email, req.body.password);

        if(!admin){
            throw new Error('Unable to login')
        }

        // Removing all tokens from db before logging in
        if(admin.tokens){
            admin.tokens = []

           await admin.save();
        }

        const token = await admin.generateAuthToken()
        
        res.cookie('token', token, {
            expires: new Date(Date.now() +  2 * 3600000), // cookie will be removed after 2 hours
            httpOnly: true
        }).redirect('./dashboard')
       
        

    } catch(error){

        req.flash('error', 'Enter valid Email/Password')
        res.redirect('/login')
    }

} )

router.get('/dashboard', auth, (req, res) => {
    res.render('dashboard', {admin: req.admin})
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
                    <p style="color: #FF3547"> Remember the link will expire in 1 hour</p>
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
        res.render('resetPassword', { isTokenValid: false})
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

// admin profile
router.get('/adminProfile', auth, (req, res) => {

    res.render('admin-profile', {admin: req.admin})
})


// sending admins 

router.get('/admins', auth, async (req, res) => {

    const admins = await (await Admin.find({})).filter( (admin) => {
            
        if(admin.email != req.admin.email ){
            return admin
        }
    });
    
    if(!admins) {
        throw new Error('No Admins found')
    }

    res.render('all-admins' , {admins, admin: req.admin, success_msg:  req.flash('success'), error_msg: req.flash('error')})

})

// adding admins
router.post('/admins', auth, async (req, res) => {

    try{
    const admin = await new Admin(req.body);
    
    if(!admin) {
        throw new Error('Some Error Occured')
    }

    admin.password = await bcrypt.hash(admin.password, 8);

    // sending email to user
    sgMail.send({
        to: req.body.email,
        from: process.env.FROM_EMAIL,
        subject: 'You are added as Admin| T Remedy',
        html: `<strong>
                <p>Hello, ${admin.name}</p>
                T Remedy added you as a Admin.</strong>
                <p>You can login with below details: 
                <ul>
                <li>Email: ${admin.email} </li>
                <li>password: ${req.body.password} </li>
                <li>Login: <a href="http://${req.headers.host}/login">Login Here</a></li>
        
                </p>`
      })

      await admin.save()

    req.flash('success', 'New Admin Added')
        
    res.redirect('/admins')

}
catch(error){

    // checking if email already exists
    if(error.code === 11000){
        req.flash('error', 'Email Already Exists')
    }
    else{

    req.flash('error', 'Error Occured. Please Try Again')
      }

    res.redirect('/admins')
}

})

// deleting admins

router.post('/admins/delete', auth, async (req, res) => {

    const _id = req.body.id;

    try{

        const admin = await Admin.findByIdAndDelete(_id);

        if(!admin){
            throw new Error('Some Error Occured')
        }

        req.flash('success', 'Admin Deleted Successfully.')

        res.redirect('/admins')

    } 
    catch(error){

        req.flash('error', 'Some Error Occured')
        res.redirect('/admins')
    }
})


//logout route

router.get('/logout', auth, async (req, res) => {

    try{

        req.admin.tokens = req.admin.tokens.filter( (token) => {
            return token.token !== req.token
        })

        await req.admin.save()

        res.redirect('/login');
    }
    catch(error){

    }
})

// logout of all devices

router.get('/logoutAll', auth, async (req, res) => {

    try{

        req.admin.tokens = [];

        await req.admin.save();

        res.redirect('/login');

    }
    catch(error){

    }
})


// sending mails
router.get('/sendMail', auth, async (req, res) => {

    const email = req.query.mailto
    const name = req.query.name
    try{

        // const user
    
        res.render('sendMail', {email, name, admin: req.admin , success_msg:  req.flash('success'), error_msg: req.flash('error')})
    
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

        res.render('trash', { results , pagination: req.results.pagination, admin: req.admin })

    }
    catch(error){

    }
})


module.exports = router