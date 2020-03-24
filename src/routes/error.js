const express = require('express');
const router = new express.Router();


// error 404
router.get('*', (req, res) => {
    res.render('./errors/error404');
})


module.exports = router