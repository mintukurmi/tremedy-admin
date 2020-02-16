const express = require('express');
// const User = require('../models/user');
const Admin = require('../models/admin');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs')
const auth = require('../middleware/auth');
const router = new express.Router();


router.get('/', (req, res) => {
    res.render('index')
})

// login routes 
router.get('/login', async (req, res) => {

    const token = req.cookies['token']

    res.render('login')
})

router.post('/login', async (req, res) => {

    try{

        const admin = await Admin.findByCredentials(req.body.email, req.body.password);

        if(!admin){
            throw new Error('Unable to login')
        }

        const token = await admin.generateAuthToken()
        
        res.cookie('token', token, {
            expires: new Date(Date.now() + 365 * 24 * 3600000), // cookie will be removed after 8 hours
            httpOnly: true
        }).redirect('./dashboard')
       
        

    } catch(error){

        res.status(500).send({error: error.message})
    }

} )

router.get('/dashboard', auth, (req, res) => {
    res.render('dashboard')
})

router.get('/forgotPassword', (req, res) => {
    res.render('forgotPassword')
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

module.exports = router