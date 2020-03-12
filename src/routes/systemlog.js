const express = require('express');
const Post = require('../models/post');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv')
const fs = require('fs');
const auth = require('../middleware/auth');
const Category = require('../models/category');
const { paginateSystemlog } = require('../middleware/paginateData');
const Systemlog = require('../models/systemlog');
const router = new express.Router();


router.get('/systemlogs', auth, paginateSystemlog, async (req, res) => {

    try{

        if (!req.query.page) {
            return res.redirect('/systemlogs?page=1')
        }

        const logs = req.results.logs

        res.render('systemlogs', { admin: req.admin, logs, pagination: req.results.pagination})
    
    }
    catch(error){

    }

})



module.exports = router