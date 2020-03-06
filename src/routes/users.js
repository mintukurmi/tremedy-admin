const express = require('express');
const User = require('../models/user');
const Post = require('../models/post');
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
       
        res.render('./users/allUsers', { admin: req.admin, results: req.results, pagination: req.results.pagination, success_msg:  req.flash('success'), error_msg: req.flash('error') } )

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

        user.totalPosts = await Post.find({createdBy: user.email}).countDocuments();
        user.answeredPosts = await Post.find({createdBy: user.email, hidden: false}).countDocuments();
        user.unAnsweredPosts = await Post.find({createdBy: user.email, hidden: true}).countDocuments();

        res.render('./users/userProfile', {user, admin: req.admin, success_msg: req.flash('success'), error_msg: req.flash('error') });

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
        res.redirect(req.headers.referer);

    } 
    catch(error) {

        req.flash('error', 'Error Occured. Please Try Again')
        res.redirect(req.headers.referer);
    }
})


// banning user

router.post('/block/', auth, async (req, res)=> {

    const _id = req.body.id;
    const action = req.query.action

    try{    

        if(action === 'block'){
        
            const user = await User.findByIdAndUpdate(_id, { $set: { blocked: true }})

            if(!user){
                throw new Error('No User Found')
            }

            req.flash('success', 'User Blocked Successfully')
            res.redirect('/users/view/' + _id);
        }

        if(action === 'unblock'){

            const user = await User.findByIdAndUpdate(_id, { $set: { blocked: false }})

            if(!user){
                throw new Error('No User Found')
            }

            req.flash('success', 'User Unblocked Successfully')
            res.redirect('/users/view/' + _id);
        }


    }
    catch(error) {
        
        req.flash('error', 'Error Occured. Please Try Again')
        res.redirect('/users/view/' + _id)
    }
})


// edit user route

router.post('/edit', auth, async (req, res) => {

    try{

        const _id = req.body.id;

        const user = await User.findById(_id);

        if(!user){
            throw new Error('User Not Found')
        }       

        user.name = req.body.name;
        user.email = req.body.email;

        await user.save();

        req.flash('success', 'User Updated Successfully')
        res.redirect('/users/view/' + _id);

    } catch(error) {

        req.flash('error', 'Some Error Occured')
        res.redirect('/users/view/' + _id);

    }
})


// users search
router.get('/search', auth, async (req, res) => {

    const query = req.query.q;

    try {

        const matchedUsers = await User.find({ $text: { $search: query } })

        const results = {
            users: matchedUsers,
            totalMatches: matchedUsers.length,
            query: query
        }
        res.render('./users/search', { results, admin: req.admin })
    }
    catch (error) {
        res.send(error)
    }
})


module.exports = router