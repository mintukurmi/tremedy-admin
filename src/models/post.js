const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  
    title: {
        type: String,
        required: false,
        trim: true,
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

    },
    causes: {
        type: String,
        required: false,
        trim: true,
        
    },
    symptoms: {
        type: String,
        required: false,
        trim: true
    },
    comments: {
        type: String,
        required: false,
        trim: true
    },
    management: {
        type: String,
        required: false,
        trim: true
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
    createdBy: {
        type: String,
        default: 'Admin'
    }
}, {
    timestamps: true
})


// defining middlewares

postSchema.pre('save', async function(next) {
    
    const post = this; 

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const timestamp = new Date();
    
    let d = timestamp.getDate()
    let m = timestamp.getMonth()
    let y = timestamp.getFullYear()
 
    const date = `${d} ${months[m]}, ${y}`;

    post.date = date;

    next()
  });

  
const Post = mongoose.model('Post', postSchema);

module.exports = Post;