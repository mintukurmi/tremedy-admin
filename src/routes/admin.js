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


// admin root route
router.get('/', (req, res) => {
    res.redirect('/admin/dashboard')
}) 

// login routes 
router.get('/login', async (req, res) => {

    try {
        //checking if admin already  logged in
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
            expires: new Date(Date.now() + 2 * 3600000), // cookie will be removed after 2 hours
            httpOnly: true
        }).redirect('/admin/dashboard')

    } catch (error) {

        req.flash('error', 'Enter valid Email/Password')
        res.redirect('/admin/login')
    }

})

// admin dashboard
router.get('/dashboard', [auth, checkRole(['Admin'])], (req, res) => {
    res.render('./admin/dashboard', { user: req.user })
})


// admin profile
router.get('/profile', [auth, checkRole(['Admin'])], (req, res) => {

    res.render('./admin/admin-profile', { user: req.user })
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

    res.render('./admin/all-admins', { admins, user: req.user, success_msg: req.flash('success'), error_msg: req.flash('error') })

})


// adding admins
router.post('/new', [auth, checkRole(['Admin'])], async (req, res) => {

    try {
        const admin = await new Admin(req.body);

        if (!admin) {
            throw new Error('Some Error Occured')
        }

        admin.password = await bcrypt.hash(admin.password, 8);
        await admin.save()

        // sending email to user
        sgMail.send({
            to: req.body.email,
            from: process.env.FROM_EMAIL,
            subject: `You are added as Admin - ${process.env.APP_NAME}`,
            html: `<strong>
                <p>Hello, ${admin.name}</p>
                You are added as a Admin of ${process.env.APP_NAME}</strong>
                <br>
                <p>You can login with below details: 
                <ul>
                <li>Email: ${admin.email} </li>
                <li>password: ${req.body.password} </li>
                <li>Your Dashboard <a href="http://${req.headers.host}/admin/dashboard">Go to dashboard</a></li>
        
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
            subject: `Your admin access was revoked- ${process.env.APP_NAME}`,
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