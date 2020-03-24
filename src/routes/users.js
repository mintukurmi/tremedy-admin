const express = require('express');
const User = require('../models/user');
const Post = require('../models/post');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const auth = require('../middleware/auth');
const checkRole = require('../utils/roleChecker');
const { paginateUsers } = require('../middleware/paginateData');
const router = new express.Router();


router.get('/', [auth, checkRole(['Admin'])], (req, res) => {
    res.redirect('./all?page=1');
})


router.get('/all', [auth, checkRole(['Admin'])], paginateUsers, async (req, res) => {
    
    // checking if query passed
    if(!req.query.page){
        return res.redirect('./all?page=1')
     }

    try{

        const users = await req.results.users

        if(!users){
            return res.send('No Users Found.')
        }
       
        res.render('./users/allUsers', { user: req.user, results: req.results, pagination: req.results.pagination, success_msg:  req.flash('success'), error_msg: req.flash('error') } )

    }
    catch(error){
        res.render('./errors/error500')
    }
 })

router.get('/view/:id', [auth, checkRole(['Admin'])], async (req, res) => {
     const _id = req.params.id;
     try{

        const user = await User.findById(_id);

        if(!user){
            return res.send('No User Found');
        }

        user.totalPosts = await Post.find({createdBy: user.email}).countDocuments();
        user.answeredPosts = await Post.find({createdBy: user.email, hidden: false}).countDocuments();
        user.unAnsweredPosts = await Post.find({createdBy: user.email, hidden: true}).countDocuments();

        const results ={
            user
        }

         res.render('./users/userProfile', { results, user: req.user, success_msg: req.flash('success'), error_msg: req.flash('error') });

     }
     catch (error) {
         res.render('./errors/error500')
     }
     
 })


 // delete User
router.post('/delete/', [auth, checkRole(['Admin'])], async (req, res) => {

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

//viewing block users

router.get('/blockedUsers', auth, async(req, res)=>
{
    try{
        const users = await User.find({blocked: true,})
        const totalUsers = users.length
        
       if(!users)
        {
            return res.render('./users/blockedUsers',{totalUsers})
            
        }
        
        res.render('./users/blockedUsers',{users,totalUsers,admin: req.admin})

    }
        catch(error)
    {}
})

// edit user route

router.post('/edit', [auth, checkRole(['Admin'])], async (req, res) => {

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
router.get('/search', [auth, checkRole(['Admin'])], async (req, res) => {

    let blocked = false;
    const query = req.query.q;
    const type = req.query.type;
   
        if(type && type === 'blocked'){
            blocked = true
        }
  
    try {

        const matchedUsers = await User.find({ $text: { $search: query } , blocked})
       
        const results = {
            users: matchedUsers,
            totalMatches: matchedUsers.length,
            query: query
        }
        res.render('./users/search', { results, user: req.user })
    }
    catch (error) {
        res.render('./errors/error500')
    }
})


module.exports = router