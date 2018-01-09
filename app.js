const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const config = require('./config'); // get our config file
const logger = require('./logger'); // custom logger to db
const morgan = require('morgan');
const cors = require('cors');
const index = require('./routes/index');
const medicalReceipts = require('./routes/medicalReceipts');
const patients = require('./routes/patients');
const authentication = require('./routes/authentication');
const consolidation = require('./routes/consolidation');
const status = require('./routes/status_route');
const scheduler = require('./services/scheduler');
const app = express();

// Views Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// *** mongo connection *** ///
mongoose.connect(config.mongoURI[app.get('env')], { useMongoClient: true }, error => {
  if (error) {
    console.log('Error connecting to the database. ' + error);
  } else {
    if (app.get('env') != 'test') console.log('Connected to Database: ' + config.mongoURI[app.get('env')]);
  }
});

// *** LOGGING *** //
if (app.get('env') != 'test') app.use(logger);
if (app.get('env') == 'development') app.use(morgan('dev'));

// *** CORS *** //
app.use(cors());
// *** BODY PARSER *** //
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
// *** COOKIE PARSER *** //
app.use(cookieParser());
// *** STATIC PATH *** //
app.use(express.static(path.join(__dirname, 'public')));

// *** REGISTER API ROUTES *** //
app.use('/', index);
// FIXME: uncomment
app.use('/api/', status);
app.use('/api/', medicalReceipts);
app.use('/api/', patients);
app.use('/api/', authentication);
app.use('/api/', consolidation)

// *** DEFAULT ERROR HANDLING *** //
// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
// // error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = req.method + ' ' + req.url + ' : ' + err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// *** SCHEDULE JOBS *** //
scheduler.schedule();

app.listen(3100, () => console.log('Receipts Management listening on port 3100!'));

// *** EXPORT APP *** //
module.exports = app;