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
    
    // checking if query passed
    if(!req.query.page){
        return res.redirect('./all?page=1')
     }

    try{

        const users = await req.results.users

        if(!users){
            return res.send('No Users Found.')
        }
       
        res.render('./users/allUsers', { results: req.results,  pagination: req.results.pagination, success_msg:  req.flash('success'), error_msg: req.flash('error') } )

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


 // delete User
 router.post('/delete/', auth, async (req, res) => {

    const _id = req.body.id;

    try{

        const post = await User.findByIdAndRemove(_id);

        if(!post){
            throw new Error('No Post Found')
        }

        req.flash('success', 'User Deleted Successfully')
        res.redirect('/users/all?page=1');

    } 
    catch(error) {

        req.flash('error', 'Error Occured. Please Try Again')
        res.redirect('/users/all?page=1')
    }
})


module.exports = router