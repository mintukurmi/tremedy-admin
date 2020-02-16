const express = require('express');
const Post = require('../models/post');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv')
const fs = require('fs');
const auth = require('../middleware/auth');
const Category = require('../models/category');
const { paginatePosts } = require('../middleware/paginateData');
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
    res.redirect('./all?page=1');
})

// displaying all posts
router.get('/all', auth, paginatePosts, async (req, res) => {

    try{

        const posts = req.results.posts
        
        if(!posts){
            res.send('No posts found');
        }
        

    res.render('./posts/allPosts', { results: req.results,  pagination: req.results.pagination } );
    }
    catch(error){
        console.log(error)
    }
})


router.get('/new', auth, async (req, res) => {
    try{

        const categories = await Category.find({});

        res.render('./posts/newPost', { categories , success_msg:  req.flash('success'), error_msg: req.flash('error')});
    }
    catch(error){
        res.render('./errors/error500');
    }
    
})


// creating a post
router.post('/new', auth, postImagesUpload.fields([
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
             const result = await cloudinary.uploader.upload(file, { "tags": "post_images", "width": 250, "height": 250, "crop": "fit" });
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
 
         await post.save()

         req.flash('success', 'Post Created Successfully')

         res.status(201).redirect('./new');

    }
    catch(error){

        req.flash('error', 'Error Occured. Please try again');

        res.status(500).redirect('./new');
    }
})

// display a post

router.get('/view/:id', auth, async (req, res) => {
   
   const _id = req.params.id;

    try{

        const post = await Post.findById(_id);

        if(!post){
            return res.send('No post Found')
        }

        res.render('./posts/viewPost', {post})

    }
    catch(error) {
        console.log(error)
        if(error.name == 'CastError'){
            res.status(500).send('Post not found.')
        }
    
    }
})


router.get('/edit/:id', auth, async (req, res) => {

    const _id = req.params.id;


    try{

        const post = await Post.findById(_id);

        if(!post){
            throw new Error('No Post Found')
        }


        res.render('./posts/editPost', post)

    }
    catch(error){
        res.send(error)
    }
})


module.exports = router