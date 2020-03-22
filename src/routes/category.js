const express = require('express');
const Category = require('../models/category');
const Systemlog = require('../models/systemlog');
const auth = require('../middleware/auth');
const checkRole = require('../utils/roleChecker');
const router = new express.Router();

// getting all categories
router.get('/', [auth, checkRole(['Admin','Expert'])], async (req, res) => {

    try {

        const categories = await Category.find({});

        res.render('./posts/categories', { user: req.user, categories, success_msg: req.flash('success'), error_msg: req.flash('error') })

    }
    catch(error){

        res.render('./errors/error500')
    }

})

// creating category
router.post('/', [auth, checkRole(['Admin','Expert'])], async (req, res) => {

    try {

        const category = new Category(req.body);

        await category.save()

        //logging
        const log = new Systemlog({
            type: 'category',
            action: 'added',
            executedOn: {
                name: category.name,
                _id: category._id
            },
            executedBy: {
                name: req.user.name,
                _id: req.user._id
            }
        })

        req.flash('success', 'Category Added Successfully')

        res.redirect('./')

    }
    catch(error){
        

        if(error.code === 11000){
            req.flash('error', 'Category Already Exists')
        }
        else{
            req.flash('error', 'Error Occured. Please Try Again')
        }

        res.redirect('./')
    }

})


// delete category

router.post('/delete/' , [auth, checkRole(['Admin','Expert'])], async (req, res) => {

    const _id =  req.body.id;

    try{

        const category = await Category.findByIdAndRemove(_id);

        if(!category){
            throw new Error('No Category Found');
        }

        req.flash('success', 'Category Deleted Successfully')

        res.redirect('/category')
    }
    catch(error){

        req.flash('error', 'Error Occured. Please Try Again')
        res.redirect('/category')
    }

})



module.exports = router