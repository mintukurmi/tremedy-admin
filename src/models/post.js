const mongoose = require('mongoose');
const { currentDate } = require('../utils/utils.dateTime');

const postSchema = new mongoose.Schema({
  
    title: {
        type: String,
        required: false,
        trim: true,
        default:'Not Available'
    },
    category: {
        type: String,
        required: false,
        trim: true,
      
    },
    description: {
        type: String,
        required: false,
        trim: true,
        default: 'Not Available'

    },
    causes: {
        type: String,
        required: false,
        trim: true,
        default: 'Not Available'
        
    },
    symptoms: {
        type: String,
        required: false,
        trim: true,
        default: 'Not Available'
    },
    comments: {
        type: String,
        required: false,
        trim: true,
        default: 'Not Available'
    },
    management: {
        type: String,
        required: false,
        trim: true,
        default: 'Not Available'
    },
    date: { 
        type: String
    },
    postThumbnail: {
       public_id: String,
       image: String
    },
    postImg1: {
        public_id: String,
        image: String
     },
    postImg2: {
        public_id: {
            type: String
        },
        image: {
            type: String
        }
     },
    hidden: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: String,
        default: 'Admin'
    },
    answeredBy:{
        name: String,
        email: String,
        id: String
    }
}, {
    timestamps: true
})


// defining middlewares

postSchema.pre('save', async function(next) {
    
    const post = this; 

    post.date = currentDate();

    next()
  });


postSchema.index({title: 'text', description: 'text'});
  

const Post = mongoose.model('Post', postSchema);

module.exports = Post;