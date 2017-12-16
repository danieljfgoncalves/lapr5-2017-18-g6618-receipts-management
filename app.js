var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var config = require('./config'); // get our config file
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var cors = require('cors');

// import routes
var index = require('./routes/index');
var medicalReceipts = require('./routes/medicalReceipts');
var patients = require('./routes/patients');
var comments = require('./routes/comments');
var authentication = require('./routes/authentication');

var app = express();

// *** mongoose *** ///
var mongoOptions = {
  useMongoClient: true,
};

mongoose.connect(config.mongoURI[app.get('env')], mongoOptions, error => {
  if (error) {
    console.log('Error connecting to the database. ' + error);
  } else {
    if (app.get('env') != 'test') console.log('Connected to Database: ' + config.mongoURI[app.get('env')]);
  }
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
if (app.get('env') != 'test') app.use(logger('dev'));

// CORS
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/api/', medicalReceipts);
app.use('/api/', patients);
app.use('/api/', comments);
app.use('/api/', authentication);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;