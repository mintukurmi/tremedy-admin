const express = require('express');
const Category = require('../models/category');
const auth = require('../middleware/auth');
const router = new express.Router();


router.get('/', auth,async (req, res) => {

    try {

        const categories = await Category.find({});

        res.render('./posts/categories', { admin: req.admin, categories, success_msg: req.flash('success'), error_msg: req.flash('error') })

    }
    catch(error){

        res.render('./errors/error500')
    }

})

router.post('/', auth, async (req, res) => {

    try {

        const category = new Category(req.body);

        await category.save()

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

router.post('/delete/' ,async (req, res) => {

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