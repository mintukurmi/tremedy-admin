const express = require('express');
const router = new express.Router();
const OneSignal = require('onesignal-node');
const dotenv = require('dotenv');
const auth = require('../middleware/auth');

//cotenv init
dotenv.config()

// OneSignal Config
const AppId = '9bf0f11a-87ab-46a9-b41d-409f26468703';
const APIKey = 'YzhhMDQ2ZmQtNWI4Ny00OGRjLWI1YjctY2ZmZjM4MmYxMzFh';

const client = new OneSignal.Client(AppId, APIKey);


router.get('/', auth, async (req, res) => {
    
    try{

        const response = await client.viewDevices({ limit: 2, offset: 0 });
        
        res.render('notifications', { user: req.user, totalUsers: response.body.total_count, success_msg: req.flash('success'), error_msg: req.flash('error') })

    }
    catch(e){
        if (e instanceof OneSignal.HTTPError) {
            // When status code of HTTP response is not 2xx, HTTPError is thrown.
            console.log(e.statusCode);
            console.log(e.body);
        }
    }

})


router.post('/newPush', auth, async (req, res) => {
   
    const title = req.body.title;
    const message = req.body.message;
    const audience = req.body.audience;
    let notification;

    try {
        
        if(audience == 'Subscribed Users'){
            notification = {
                contents: {
                    'en': message,
                },
                headings: { 'en': title },
                included_segments: ['Subscribed Users']
            };
        } 

        if(audience == 'Active Users'){
            notification = {
                contents: {
                    'en': message,
                },
                headings: { 'en': title },
                included_segments: ['Active Users']
            };
        }

        const response = await client.createNotification(notification);
        
        // res.send(response)

        req.flash('success', 'Notifications sent to ' + response.body.recipients +' users');
        res.redirect('/notifications');

    }
    catch (e) {
        console.log(e)
        if (e instanceof OneSignal.HTTPError) {
            // When status code of HTTP response is not 2xx, HTTPError is thrown.
            console.log(e.statusCode);
            console.log(e.body);
        }
    }

})


module.exports = router