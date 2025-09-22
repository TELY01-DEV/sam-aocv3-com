var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var multer  = require('multer');
var session = require('express-session');
require('dotenv').config();

const bodyParser = require("body-parser");
const cors = require("cors");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

var corsOptions = {
  credentials: true,
  origin: ["http://localhost:4000"]
};

// app.use(logger('dev'));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true, limit: '500mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({ storage:multer.memoryStorage(), dest:'./public/uploads/' }).any());
app.use(session({
    secret: 'aliveV2@123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(function(req, res, next){
  if(req.method == 'POST' && req.headers.isencryption){
      req = configure.apiReq(req);
      if(req.headers.api_key == req.session.token){
          next();
      } else {
          res.status(200).send({status: 599, message: 'session expired.'});
      }
  } else if(req.method == 'POST') {
      next();
  } else {
      next();
  }
});

const io = require('./socket')(app);
module.exports.socket = {
    emit: (roomname, data)=> {
        io.sockets.in(String(roomname)).emit('data', JSON.stringify(data));
    }
};

require('./config/db.config');
require('./routes/index.router')(app);
require('./routes/api/requests.router')(app);

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;