const express = require('express');
const Expert = require('../models/expert');
const auth = require('../middleware/auth');
const checkRole = require('../utils/roleChecker');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs')
const sgMail = require('@sendgrid/mail');
const router = new express.Router();

//cotenv init
dotenv.config()

// SendGrid config
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
            expires: new Date(Date.now() + 2 * 3600000), // cookie will be removed after 2 hours
            httpOnly: true
        }).redirect('/expert/dashboard')



    } catch (error) {

        req.flash('error', 'Enter valid Email/Password')
        res.redirect('/expert/login')
    }

})

router.get('/dashboard', [auth, checkRole(['Expert'])],async (req, res) => {

    res.render('./expert/dashboard', { user: req.user} )
})

router.get('/', (req, res) => {
    res.redirect('/expert/dashboard')
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

        res.render('./expert/all-experts', { results, user: req.user, success_msg: req.flash('success'), error_msg: req.flash('error') })

    }
    catch(error){
       res.render('./errors/error500') 
    }

})

// add expert to db 
router.post('/new', [auth, checkRole(['Admin'])], async (req, res) => {

    try{

        const expert = await new Expert(req.body);

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
                <p style="color: red">Note: Please do not share the mail with anybody</p>
                `
        })

        await expert.save()

        req.flash('success', 'New Expert Added')
        res.redirect('/expert/all')

    }
    catch(error){
        console.log(error)
        req.flash('error', 'Some Error Occured')
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
            subject: `Your expert access was revoked- ${process.env.APP_NAME}`,
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
        
    }
})


module.exports = router