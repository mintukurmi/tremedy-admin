const express = require('express');
const Post = require('../models/post');
const User = require('../models/user');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const OneSignal = require('onesignal-node');
const dotenv = require('dotenv')
const fs = require('fs');
const sgMail = require('@sendgrid/mail');
const auth = require('../middleware/auth');
const checkRole = require('../utils/roleChecker');
const Category = require('../models/category');
const Systemlog = require('../models/systemlog');
const { paginatePosts, paginateUnAnsweredPosts } = require('../middleware/paginateData');
const router = new express.Router();


// dotenv init 
dotenv.config(); 

// SendGrid config
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// cloudinary config
require('../configs/cloudinary')

// OneSignal Config
const AppId = process.env.ONESIGNAL_APP_ID;
const APIKey = process.env.ONESIGNAL_API_KEY;

const client = new OneSignal.Client(AppId, APIKey);

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
}).fields([
    { name: 'postThumbnail', maxCount: 1 },
    { name: 'postImg1', maxCount: 1 },
    { name: 'postImg2', maxCount: 1 }
])

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

        res.render('./posts/answeredPosts', { user: req.user, results, totalUnasweredPosts: req.unAnsweredPosts, pagination: req.results.pagination, success_msg:  req.flash('success'), error_msg: req.flash('error')} );
    }
    catch(error){
        res.render('./errors/error500', { user: req.user })
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

        res.render('./posts/unAnsweredPosts', { user: req.user, results, totalUnasweredPosts: req.unAnsweredPosts, pagination: req.results.pagination, success_msg:  req.flash('success'), error_msg: req.flash('error')} );
    }
    catch(error){
        res.render('./errors/error500', { user: req.user })
    }
})

//new post
router.get('/new', [auth, checkRole(['Admin', 'Expert'])], async (req, res) => {
    try{

        const categories = await Category.find({});

        res.render('./posts/newPost', { user: req.user, categories, formControls: true, totalUnasweredPosts: req.unAnsweredPosts, success_msg:  req.flash('success'), error_msg: req.flash('error') });
    }
    catch(error){
        res.render('./errors/error500', { user: req.user });
    }
    
})


// creating a post
router.post('/new', [auth, checkRole(['Admin', 'Expert'])], async (req, res) => {
    
    try{

        postImagesUpload(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                if(err.code === 'LIMIT_FILE_SIZE') {
                    req.flash('error', 'Uploaded file(s) too large');
                    res.status(201).redirect('./new');
                }
                
            } else if (err) {
                // An unknown error occurred when uploading.
                req.flash('error', 'Opps! Some error occured.');
                res.status(201).redirect('./new');
            }

            // Everything went fine.
            let images = [];

            images.push(req.files.postThumbnail[0].path)
            images.push(req.files.postImg1[0].path)
            images.push(req.files.postImg2[0].path)

            // looping through the images array and uploading to cloudinary
            const imagesArray = images.map(async (file) => {
                const result = await cloudinary.uploader.upload(file, { "tags": "post_images", "width": 500, "height": 500 });
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

            post.createdBy = req.user.email
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
                    _id: req.user._id,
                    role: req.user.role
                }
            })

            await log.save();

            req.flash('success', 'Post Created Successfully');
            res.status(201).redirect('./new');
        })

    }
    catch(error){

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

        res.render('./posts/viewPost', { post, user: req.user, totalUnasweredPosts: req.unAnsweredPosts})

    }
    catch(error) {

        if(error.name == 'CastError'){
            return res.status(500).send('Post not found.')
        }
        
        res.render('./errors/error500', { user: req.user })
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


        res.render('./posts/editPost', { user: req.user, post, categories, formControls: true, totalUnasweredPosts: req.unAnsweredPosts, success_msg:  req.flash('success'), error_msg: req.flash('error')})

    }
    catch(error){
        res.render('./errors/error500', { user: req.user })
    }
})

// edit post
router.post('/edit', [auth, checkRole(['Admin', 'Expert'])], async (req, res) => {

 try{  
        postImagesUpload(req, res, async function (err) {

            // getting post id 
            const _id = req.body.id;

            if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading.
                
                if (err.code === 'LIMIT_FILE_SIZE') {
                    req.flash('error', 'Uploaded file(s) too large');
                    res.redirect('/posts/edit/' + _id);
                }
            } else if (err) {
                // An unknown error occurred when uploading.
                req.flash('error', 'Opps! Some error occured');
                res.redirect('/posts/edit/' + _id);
            }

            // Everything went fine.
            const post = await Post.findById(_id);

            // checking for thumbnail
            if (req.files.postThumbnail) {

                // uploading file to cloudinary 
                const result = await cloudinary.uploader.upload(req.files.postThumbnail[0].path, { "tags": "post_images", "width": 500, "height": 500 });
                // deleting file from disk
                fs.unlinkSync(req.files.postThumbnail[0].path);
                // removing cloudinary file 
                await cloudinary.uploader.destroy(post.postThumbnail.public_id);

                post.postThumbnail = { image: result.secure_url, public_id: result.public_id }

            }

            // checking for postImg 1
            if (req.files.postImg1) {

                // uploading file to cloudinary 
                const result1 = await cloudinary.uploader.upload(req.files.postImg1[0].path, { "tags": "post_images", "width": 500, "height": 500 });
                // deleting file from disk
                fs.unlinkSync(req.files.postImg1[0].path);
                // removing cloudinary file 
                await cloudinary.uploader.destroy(post.postImg1.public_id);

                post.postImg1 = { image: result1.secure_url, public_id: result1.public_id }

            }

            // checking for postImg 2
            if (req.files.postImg2) {

                // uploading file to cloudinary 
                const result2 = await cloudinary.uploader.upload(req.files.postImg2[0].path, { "tags": "post_images", "width": 500, "height": 500 });
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
            if (req.body.hidden) {

                if (req.body.hidden === 'on') {
                    post.hidden = false
                }
            } else {
                post.hidden = true
            }

            // setting answeredBy        
            post.answeredBy.name = req.user.name
            post.answeredBy.email = req.user.email
            post.answeredBy.email = req.user.email

            await post.save()

            const user = await User.findOne({ email: post.createdBy });

            // sending notifications to user
            if (req.body.notifyUser) {

                // sending email to user
                sgMail.send({
                    to: user.email,
                    from: process.env.FROM_EMAIL,
                    subject: 'Your post has been Answered - T Remedy',
                    html: `<strong>
                <p>Hello, ${user.name}</p></strong>
                <strong>A T Remedy expert has answered to your query.</strong>
                <p>Please follow the steps, to find the post:</p>
                <ol>
                <li> Open T Remedy App</li>
                <li> Visit profile section</li>
                <li> Your post is on Answered Section under My Posts</li>
                </ol>
                <p>Please post if any other query you have.</p>
                <p> Download App: <a href="${process.env.APP_DOWNLOAD_LINK}"> Get on Playstore</a> </p>
                `
                })

                // sending push notification
                client.createNotification({
                    contents: {
                        'en': `A ${process.env.APP_NAME} expert has answered to your query. Check the post under answered posts section.`,
                    },
                    headings: { 'en': 'Post Answered' },
                    include_player_ids: [user.onesignal_player_id]
                })


            }


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
                    _id: req.user._id,
                    role: req.user.role
                }
            })

            await log.save();

            req.flash('success', 'Post Updated successfully')
            res.redirect('/posts/edit/' + _id)
        })     

    }
    catch(error){
        req.flash('error', 'Some Error Occured')
        res.redirect('/posts/edit/' + _id)
    }
})

// delete post --> This will move the post to the trash bin 
router.post('/delete/', [auth, checkRole(['Admin', 'Expert'])], async (req, res) => {

    const _id = req.body.id;

    try{

        const post = await Post.findById(_id);

        if(!post){
            throw new Error('No Post Found')
        }

        post.deleted = true
        await post.save()

        //logging
        const log = new Systemlog({
            type: 'post',
            action: 'trashed',
            executedOn: {
                name: post.title,
                _id: post._id
            },
            executedBy: {
                name: req.user.name,
                _id: req.user._id,
                role: req.user.role
            }
        })

        await log.save();

        req.flash('success', 'Post moved to trash bin')
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
                _id: req.user._id,
                role: req.user.role
            }
        })

        await log.save();

        req.flash('success', 'Post Restored Successfully')
        res.redirect('/trash');

    }
    catch (error) {

        req.flash('error', 'Error Occured. Please Try Again')
        res.redirect('/trash');
    }
})


// delete post --> This will move the post to the trash bin 
router.post('/delete/permanent', [auth, checkRole(['Admin', 'Expert'])], async (req, res) => {

    const _id = req.body.id;

    try {

        const post = await Post.findByIdAndDelete(_id);

        if (!post) {
            throw new Error('No Post Found')
        }


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
                _id: req.user._id,
                role: req.user.role
            }
        })

        await log.save();

        req.flash('success', 'Post deleted from database')
        res.redirect(req.headers.referer);

    }
    catch (error) {

        req.flash('error', 'Error Occured. Please Try Again')
        res.redirect(req.headers.referer)
    }
})


// post search
router.get('/search', [auth, checkRole(['Admin', 'Expert'])], async (req, res) => {

    try{
        const query = req.query.q;
        const type = req.query.type;
        let hidden;
        
        if (type === 'answered'){
            hidden = false
        }
        else if (type === 'unanswered'){
            hidden = true
        }
        
        const matchedPosts = await Post.find({ $text: { $search: query } , hidden})
        
        const results = {
            posts: matchedPosts,
            totalMatches: matchedPosts.length,
            query: query
        }
        res.render('./posts/search', { results, user: req.user, totalUnasweredPosts: req.unAnsweredPosts })
    }
    catch(error){
        res.render('./errors/error500', { user: req.user })
    }
})


module.exports = router