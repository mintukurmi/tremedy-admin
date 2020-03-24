const Post = require('../models/post');
const User = require('../models/user');
const Systemlog = require('../models/systemlog');


// posts pagination middle ware
const paginatePosts = async (req, res, next) => {
    
    const page = parseInt(req.query.page);
    const limit = 10;  // no of posts per page

    const totalPosts = await Post.countDocuments().exec();

    let pageCount = Math.round(totalPosts / limit); // total no of pages

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

    const totalPosts = await Post.countDocuments().exec();

    let pageCount = Math.round(totalPosts / limit); // total no of pages

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

    const totalPosts = await Post.countDocuments().exec();

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

// systemlogs  pagination middle ware
const paginateSystemlog = async (req, res, next) => {

    const page = parseInt(req.query.page);
    const limit = 9;  // no of logs per page

    const totalLogs = await Systemlog.countDocuments().exec();

    let pageCount = Math.round(totalLogs / limit); // total no of pages

    // reassign pageCount if < 1
    if (pageCount < 1) {
        pageCount = 1;
    }

    // determining indexes   
    const startIndex = (page - 1) * limit;

    const results = {} // initialize object

    try {

        console.log(req.body)
        // var now = new Date();
        // var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // console.log(today)
        // MyModel.find({ created_on: { $gte: startOfToday } }, function (err, docs) { ... });
        results.logs = await Systemlog.find({}).sort({ createdAt: -1 }).limit(limit).skip(startIndex).exec();

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


module.exports = { paginatePosts, paginateUsers, paginateUnAnsweredPosts, paginateSystemlog, paginateDeletedPosts };