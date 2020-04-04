const express = require('express');
const auth = require('../middleware/auth');
const checkRole = require('../utils/roleChecker');
const { paginateSystemlog } = require('../middleware/paginateData');
const router = new express.Router();


router.get('/systemlogs', [auth, checkRole(['Admin','Expert'])], paginateSystemlog, async (req, res) => {

    try{

        if (!req.query.page) {
            return res.redirect('/systemlogs?page=1')
        }

        const logs = req.results.logs
       
        res.render('systemlogs', { user: req.user, logs, pagination: req.results.pagination, totalUnasweredPosts: req.unAnsweredPosts})
    
    }
    catch(error){
       
        res.render('./errors/error500', { user: req.user })
    }

})



module.exports = router