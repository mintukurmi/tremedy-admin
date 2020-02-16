const Post = require('../models/post');
const User = require('../models/user')


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
        
        results.posts = await Post.find({}).limit(limit).skip(startIndex).exec();

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
        
        results.users = await User.find({}).limit(limit).skip(startIndex).exec();

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


module.exports = { paginatePosts, paginateUsers };