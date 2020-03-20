const express = require('express');
const Post = require('../models/post');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv')
const fs = require('fs');
const auth = require('../middleware/auth');
const checkRole = require('../utils/roleChecker');
const Category = require('../models/category');
const Systemlog = require('../models/systemlog');
const { paginatePosts, paginateUnAnsweredPosts } = require('../middleware/paginateData');
const router = new express.Router();


// dotenv init 
dotenv.config(); 

// cloudinary config
require('../configs/cloudinary')


// multer config for Post Images Upload import from configs dir

const storage = multer.diskStorage({ // notice you are calling the multer.diskStorage() method here, not multer()
    destination: function(req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    },
    fileFilter(req, file, cb){
        if(!file.originalname.toLowerCase().match(/\.(jpeg|jpg|png)$/)) {
    
            return cb(new Error('Please upload a JPEG/JPG or PNG file.'))
        }
    
        cb(undefined, true)
    }  
});


// multer config for image upload
const postImagesUpload = multer({
    storage: storage,
    limits: {
        fileSize: 1000000
    }
})

// displaying all posts
router.get('/', (req, res) => {
    res.redirect('./answered?page=1');
})

// displaying all posts
router.get('/answered', [auth, checkRole(['Admin','Expert'])], paginatePosts, async (req, res) => {

    // checking if page is query passed
    if(!req.query.page){
       return res.redirect('./answered?page=1')
    }

    try{

        const posts = req.results.posts
        const totalPosts = posts.length;

        if(!posts){
            res.send('No posts found');
        }
        
        const results = {
            posts: req.results.posts,
            totalPosts
        }

    res.render('./posts/answeredPosts', { user: req.user, results ,  pagination: req.results.pagination, success_msg:  req.flash('success'), error_msg: req.flash('error')} );
    }
    catch(error){
        console.log(error)
    }
})


// sending all unanswered posts
router.get('/unanswered', [auth, checkRole(['Admin', 'Expert'])], paginateUnAnsweredPosts, async (req, res) => {

    // checking if page is query passed
    if(!req.query.page){
       return res.redirect('/posts/unanswered?page=1')
    }

    try{

        const posts = req.results.posts
        const totalPosts = posts.length;

        if(!posts){
            res.send('No posts found');
        }
        
        const results = {
            posts: req.results.posts,
            totalPosts
        }

    res.render('./posts/unAnsweredPosts', { user: req.user, results, pagination: req.results.pagination, success_msg:  req.flash('success'), error_msg: req.flash('error')} );
    }
    catch(error){
        console.log(error)
    }
})

//new post
router.get('/new', [auth, checkRole(['Admin', 'Expert'])], async (req, res) => {
    try{

        const categories = await Category.find({});

        res.render('./posts/newPost', { user: req.user, categories , success_msg:  req.flash('success'), error_msg: req.flash('error') });
    }
    catch(error){
        res.render('./errors/error500');
    }
    
})


// creating a post
router.post('/new', [auth, checkRole(['Admin', 'Expert'])], postImagesUpload.fields([
                { name: 'postThumbnail', maxCount: 1 },
                { name: 'postImg1', maxCount: 1 },
                { name: 'postImg2', maxCount: 1 }
            ]) ,
    async (req, res) => {
    
    try{

        let images = [];

        images.push(req.files.postThumbnail[0].path)
        images.push(req.files.postImg1[0].path)
        images.push(req.files.postImg2[0].path)
         
        // looping through the images array and uploading to cloudinary
         const imagesArray = images.map( async (file)=>{
             const result = await cloudinary.uploader.upload(file, { "tags": "post_images", "width": 500, "height": 500});
             fs.unlinkSync(file);
             return { image: result.secure_url, public_id: result.public_id };
         })
 
         // Resolving all promises
         const postImages = await Promise.all(imagesArray);
       
         // creating the post
         const post = new Post(req.body);
         post.postThumbnail = postImages[0];
         post.postImg1 = postImages[1];
         post.postImg2 = postImages[2];

         await post.save();

         //logging
         const log = new Systemlog({
            type: 'post',
            action: 'created',
            executedOn: {
                name: post.title,
                _id: post._id
            },
            executedBy: {
                name: req.user.name,
                _id: req.user._id
            }
         })

         await log.save();

         req.flash('success', 'Post Created Successfully');
         res.status(201).redirect('./new');

    }
    catch(error){

        console.log(error)

        req.flash('error', 'Error Occured. Please try again');

        res.status(500).redirect('./new');
    }
})

// display a post

router.get('/view/:id', [auth, checkRole(['Admin', 'Expert'])], async (req, res) => {
   
   const _id = req.params.id;

    try{

        const post = await Post.findById(_id);

        if(!post){
            return res.send('No post Found')
        }

        res.render('./posts/viewPost', { post, user: req.user })

    }
    catch(error) {
        console.log(error)
        if(error.name == 'CastError'){
            res.status(500).send('Post not found.')
        }
    
    }
})

// edit post
router.get('/edit/:id', [auth, checkRole(['Admin', 'Expert'])], async (req, res) => {

    const _id = req.params.id;

    try{

        const post = await Post.findById(_id);
        const categories = await Category.find({});

        if(!post || !categories){
            throw new Error('No Post Found')
        }


        res.render('./posts/editPost', { user: req.user, post, categories , success_msg:  req.flash('success'), error_msg: req.flash('error')})

    }
    catch(error){
        res.send(error)
    }
})

// edit post
router.post('/edit', [auth, checkRole(['Admin', 'Expert'])], postImagesUpload.fields([
                        { name: 'postThumbnail', maxCount: 1 },
                        { name: 'postImg1', maxCount: 1 },
                        { name: 'postImg2', maxCount: 1 }
                    ]),
    async (req, res) => {

    // getting post id 
    const _id = req.body.id;

    try{

        const post = await Post.findById(_id);

        // checking for thumbnail
        if(req.files.postThumbnail){

            // uploading file to cloudinary 
            const result = await cloudinary.uploader.upload(req.files.postThumbnail[0].path, { "tags": "post_images", "width": 500, "height": 500});
            // deleting file from disk
            fs.unlinkSync(req.files.postThumbnail[0].path);
            // removing cloudinary file 
            await cloudinary.uploader.destroy(post.postThumbnail.public_id);
            
            post.postThumbnail = { image: result.secure_url, public_id: result.public_id }

        }

        // checking for postImg 1
        if(req.files.postImg1) {

            // uploading file to cloudinary 
            const result1 = await cloudinary.uploader.upload(req.files.postImg1[0].path, { "tags": "post_images", "width": 500, "height": 500});
            // deleting file from disk
            fs.unlinkSync(req.files.postImg1[0].path);
            // removing cloudinary file 
            await cloudinary.uploader.destroy(post.postImg1.public_id);
            
            post.postImg1 = { image: result1.secure_url, public_id: result1.public_id }

        }

        // checking for postImg 2
        if(req.files.postImg2) {

            // uploading file to cloudinary 
            const result2 = await cloudinary.uploader.upload(req.files.postImg2[0].path, { "tags": "post_images", "width": 500, "height": 500});
            // deleting file from disk
            fs.unlinkSync(req.files.postImg2[0].path);
            // removing cloudinary file 
            await cloudinary.uploader.destroy(post.postImg2.public_id);
            
            post.postImg2 = { image: result2.secure_url, public_id: result2.public_id }

        }
 
        post.title = req.body.title
        post.causes = req.body.causes
        post.category = req.body.category
        post.symptoms = req.body.symptoms
        post.description = req.body.description
        post.comments = req.body.comments
        post.management = req.body.management

        // checking if visibility switch is checked
        if(req.body.hidden){
        
            if(req.body.hidden === 'on'){
                post.hidden = false
            }
        }else{
            post.hidden = true
        }
    
        await post.save()

        //logging
        const log = new Systemlog({
            type: 'post',
            action: 'updated',
            executedOn: {
                name: post.title,
                _id: post._id
            },
            executedBy: {
                name: req.user.name,
                _id: req.user._id
            }
        })

        await log.save();
        
        req.flash('success', 'Post Updated successfully')
        res.redirect('/posts/edit/'+_id)

    }
    catch(error){
        // res.send(error)
        console.log(error)
    }
})

// delete post
router.post('/delete/', [auth, checkRole(['Admin', 'Expert'])], async (req, res) => {

    const _id = req.body.id;

    try{

        const post = await Post.findById(_id);

        if(!post){
            throw new Error('No Post Found')
        }

        // deleting post images from cloudinary
        // await cloudinary.uploader.destroy(post.postThumbnail.public_id);
        // await cloudinary.uploader.destroy(post.postImg1.public_id);
        // await cloudinary.uploader.destroy(post.postImg2.public_id);

        post.deleted = true
        await post.save()

        //logging
        const log = new Systemlog({
            type: 'post',
            action: 'deleted',
            executedOn: {
                name: post.title,
                _id: post._id
            },
            executedBy: {
                name: req.user.name,
                _id: req.user._id
            }
        })

        await log.save();

        req.flash('success', 'Post Deleted Successfully')
        res.redirect(req.headers.referer);

    } 
    catch(error) {

        req.flash('error', 'Error Occured. Please Try Again')
        res.redirect(req.headers.referer)
    }
})

// restore post
router.post('/restore/', [auth, checkRole(['Admin', 'Expert'])], async (req, res) => {

    const _id = req.body.id;

    try {

        const post = await Post.findById(_id);

        if (!post) {
            throw new Error('No Post Found')
        }

        post.deleted = false
        await post.save()

        //logging
        const log = new Systemlog({
            type: 'post',
            action: 'restored',
            executedOn: {
                name: post.title,
                _id: post._id
            },
            executedBy: {
                name: req.user.name,
                _id: req.user._id
            }
        })

        await log.save();

        req.flash('success', 'Post Restored Successfully')
        res.redirect(req.headers.referer);

    }
    catch (error) {

        req.flash('error', 'Error Occured. Please Try Again')
        res.redirect(req.headers.referer)
    }
})

// post search
router.get('/search', [auth, checkRole(['Admin', 'Expert'])], async (req, res) => {

    const query = req.query.q; 

    try{
        
        const matchedPosts = await Post.find({ $text: { $search: query } })
        
        const results = {
            posts: matchedPosts,
            totalMatches: matchedPosts.length,
            query: query
        }
        res.render('./posts/search', { results, user: req.user })
    }
    catch(error){
        res.send(error)
    }
})


module.exports = router