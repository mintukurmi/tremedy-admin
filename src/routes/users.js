const express = require('express');
const User = require('../models/user');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const auth = require('../middleware/auth');
const { paginateUsers } = require('../middleware/paginateData');
const router = new express.Router();


router.get('/', auth, (req, res) => {
    res.redirect('./all?page=1');
})


router.get('/all' , auth, paginateUsers, async (req, res) => {

    try{

        const users = await req.results.users

        if(!users){
            return res.send('No Users Found.')
        }
       
        res.render('./users/allUsers', { results: req.results,  pagination: req.results.pagination } )

    }
    catch(error){
        console.log(error)
    }
 })

 router.get('/view/:id', auth, async (req, res) => {
     const _id = req.params.id;
     try{

        const user = await User.findById(_id);

        if(!user){
            return res.send('No User Found');
        }

        res.render('./users/userProfile', user);

     }
     catch(error){
         console.log(error)
     }
     
 })

module.exports = router