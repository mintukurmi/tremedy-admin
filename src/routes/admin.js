const express = require('express');
const Admin = require('../models/admin');
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')
const { Role } = require('route-access-control');
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



//logout route

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


module.exports = router