const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const hbs = require('hbs');
const flash = require('connect-flash');
const session = require('express-session');
const paginate = require('handlebars-paginate'); // var paginateHelper = require('express-handlebars-paginate');
const cookieParser = require('cookie-parser')

const cloudinary = require('cloudinary')

require('./db/mongoose');


// express init
const app = express(); 
app.use(cookieParser());

// bodyParser config
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())


// express session init
app.use(session({
    secret: 'thisisasecret',
    resave: true,
    saveUninitialized: true
  }))

//connect flash init
app.use(flash());

// Global variables

app.use( function(req, res, next){
    
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    
    next();
})  


// define paths for express config
const publicDirPath = path.join(__dirname, '../public');
const viewsPath = path.join(__dirname, '../templates/views');
const partialsPath = path.join(__dirname, '../templates/partials');


//setting view engine and changing views dir
app.set('view engine', 'hbs');
app.set('views', viewsPath);
hbs.registerPartials(partialsPath);
// hbs.handlebars.registerHelper('paginateHelper', paginateHelper.createPagination);
hbs.registerHelper('paginate', paginate);


// hbs helpers functions for select
hbs.registerHelper('select', function( value, options ){
    return options.fn(this)
    .replace( new RegExp(' value=\"' + value + '\"'), '$& selected="selected"')
    .replace( new RegExp('>' + value + '</option>'), ' selected="selected"$&');
  });

  // helper function for comparing
 hbs.registerHelper('ifCond', function(v1, v2, options) {
    if(v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  });

// serving public assets
app.use(express.static(publicDirPath));

app.use('/posts', express.static(publicDirPath));
app.use('/posts/view', express.static(publicDirPath));
app.use('/posts/edit', express.static(publicDirPath));
app.use('/posts/unanswered', express.static(publicDirPath));
app.use('/posts/search', express.static(publicDirPath));

app.use('/users', express.static(publicDirPath));
app.use('/users/view', express.static(publicDirPath));
app.use('/users/search', express.static(publicDirPath));

app.use('/passwordReset/', express.static(publicDirPath));

app.use('/category', express.static(publicDirPath));


// Routes Variables
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const postsRouter = require('./routes/posts');
const categoryRouter = require('./routes/category');
const systemlogsRouter = require('./routes/systemlog');


// variables
const port = process.env.PORT || 3000;


// Routers configs
app.use('/', indexRouter);
app.use('/', systemlogsRouter);
app.use('/users', usersRouter);
app.use('/posts', postsRouter);
app.use('/category', categoryRouter)


app.listen(port, () => {
    console.log('Server running on port ' + port)
})
