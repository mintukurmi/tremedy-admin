const Post = require('../models/post');
const User = require('../models/user');
const Email = require('../models/email');
const Expert = require('../models/expert');
const Admin = require('../models/admin')
const Systemlog = require('../models/systemlog');


// posts pagination middle ware
const paginatePosts = async (req, res, next) => {
    
    const page = parseInt(req.query.page);
    const limit = 10  ;  // no of posts per page

    const totalPosts = await Post.find({ hidden: false, deleted: false }).countDocuments().exec();
    
    let pageCount = Math.ceil(totalPosts / limit); // total no of pages
    
        // reassign pageCount if < 1
        if(pageCount < 1){
            pageCount = 1;
        }

        // determining indexes   
        const startIndex = (page - 1) * limit; 

        const results = {} // initialize object

    try{
        
        results.posts = await Post.find({ hidden: false, deleted: false }).sort({createdAt: -1}).limit(limit).skip(startIndex).exec();
    
        results.pagination = {
            page: page,
            pageCount: pageCount
        }
        req.results = results
        
        next()
    }
    catch(error){
        res.render('error500')
    }
}

// paginate unanswered posts
const paginateUnAnsweredPosts = async (req, res, next) => {
    
    const page = parseInt(req.query.page);
    const limit = 10;  // no of posts per page

    const totalPosts = await Post.find({ hidden: true, deleted: false }).countDocuments().exec();

    let pageCount = Math.ceil(totalPosts / limit); // total no of pages

        // reassign pageCount if < 1
        if(pageCount < 1){
            pageCount = 1;
        }

        // determining indexes   
        const startIndex = (page - 1) * limit; 

        const results = {} // initialize object

    try{
        
        results.posts = await Post.find({ hidden: true, deleted: false }).sort({createdAt: -1}).limit(limit).skip(startIndex);
    
        results.pagination = {
            page: page,
            pageCount: pageCount
        }
        req.results = results
        
        next()
    }
    catch(error){
        res.render('error500')
    }
}

// deleted posts  pagination middle ware
const paginateDeletedPosts = async (req, res, next) => {

    const page = parseInt(req.query.page);
    const limit = 10;  // no of logs per page

    const totalPosts = await Post.find({ deleted: true }).countDocuments().exec();

    let pageCount = Math.round(totalPosts / limit); // total no of pages

    // reassign pageCount if < 1
    if (pageCount < 1) {
        pageCount = 1;
    }

    // determining indexes   
    const startIndex = (page - 1) * limit;

    const results = {} // initialize object

    try {

        results.posts = await Post.find({deleted: true}).sort({ createdAt: -1 }).limit(limit).skip(startIndex).exec();

        results.pagination = {
            page: page,
            pageCount: pageCount
        }
        req.results = results

        next()
    }
    catch (error) {
        res.render('error500')
    }
}

// Users pagination middle ware
const paginateUsers = async (req, res, next) => {
    
    const page = parseInt(req.query.page);
    const limit = 10;  // no of posts per page

    const totalPosts = await User.countDocuments().exec();

    let pageCount = Math.round(totalPosts / limit); // total no of pages

        // reassign pageCount if < 1
        if(pageCount < 1){
            pageCount = 1;
        }

        // determining indexes   
        const startIndex = (page - 1) * limit; 

        const results = {} // initialize object

    try{
        
        results.users = await User.find({blocked: false}).sort({createdAt: -1}).limit(limit).skip(startIndex).exec();

        results.pagination = {
            page: page,
            pageCount: pageCount
        }
        req.results = results
        
        next()
    }
    catch(error){
        res.render('error500')
    }
}

// Email pagination middle ware
const paginateEmail = async (req, res, next) => {
    
    const page = parseInt(req.query.page);
    const limit = 10;  // no of posts per page

    let totalEmails;

    if(req.user.role === 'Admin'){
        totalEmails = await Email.find({}).countDocuments().exec();
    } else{
        totalEmails = await Email.find({ "sentBy._id": req.user._id.toString()}).countDocuments().exec();
    }
       let pageCount = Math.round(totalEmails / limit); // total no of pages

        // reassign pageCount if < 1
        if(pageCount < 1){
            pageCount = 1;
        }

        // determining indexes   
        const startIndex = (page - 1) * limit; 

        const results = {} // initialize object

    try{
        
        if(req.user.role === "Admin") {
            results.emails = await Email.find({}).sort({createdAt: -1, _id: -1}).limit(limit).skip(startIndex).exec();
        }
        else{
            results.emails = await Email.find({"sentBy._id": req.user._id.toString()}).sort({createdAt: -1}).limit(limit).skip(startIndex).exec();
        
        }
        
        results.pagination = {
            page: page,
            pageCount: pageCount
        }
        
        req.results = results
        
        next()
    }
    catch(error){
        res.render('error500')
    }
}

// systemlogs  pagination middle ware
const paginateSystemlog = async (req, res, next) => {

    const page = parseInt(req.query.page);
    const limit = 9;  // no of logs per page

    let totalLogs;
    
    if(req.user.role === 'Expert'){
        totalLogs = await Systemlog.find({  "executedBy._id": req.user._id.toString() }).countDocuments().exec();
    } else {
        totalLogs = await Systemlog.countDocuments().exec();
    
    }

    let pageCount = Math.round(totalLogs / limit); // total no of pages

    // reassign pageCount if < 1
    if (pageCount < 1) {
        pageCount = 1;
    }

    // determining indexes   
    const startIndex = (page - 1) * limit;

    const results = {} // initialize object

    try {

        if(req.user.role === 'Expert'){
            
            results.logs = await Systemlog.find({  "executedBy._id": req.user._id.toString() }).sort({ createdAt: -1 }).limit(limit).skip(startIndex)
                .exec();

        } else{

            results.logs = await Systemlog.find({}).sort({ createdAt: -1 }).limit(limit).skip(startIndex).exec();
        }

        results.pagination = {
            page: page,
            pageCount: pageCount
        }
        req.results = results

        next()
    }
    catch (error) {
        res.render('./errors/error500')
    }
}


module.exports = { paginatePosts, paginateUsers, paginateUnAnsweredPosts, paginateSystemlog, paginateDeletedPosts, paginateEmail };