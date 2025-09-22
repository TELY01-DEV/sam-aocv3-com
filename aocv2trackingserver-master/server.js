var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
// var logger = require('morgan');
var multer = require("multer");
var session = require("express-session");
require("dotenv").config();
const bodyParser = require("body-parser");
const cors = require("cors");
var app = express();

// redis session setup
const redis = require("redis");

let redis_options = {
  host: process.env.LOCAL_REDIS_HOST,
  port: process.env.LOCAL_REDIS_PORT,
  password: process.env.LOCAL_REDIS_PASSWORD,
};

console.log(process.env.ENVIRONMENT);
if (process.env.ENVIRONMENT == "LIVE") {
  redis_options = {
    host: process.env.LIVE_REDIS_HOST,
    port: process.env.LIVE_REDIS_PORT,
    password: process.env.LIVE_REDIS_PASSWORD,
  };
}

const redisClient = redis.createClient(redis_options);

redisClient.on("connect", (err) => {
  console.log(
    "Redis Connected." +
      " host : " +
      redis_options.host +
      " port : " +
      redis_options.port
  );
});

redisClient.on("error", (err) => {
  console.log("Redis Error :", err);
});

module.exports = { redisClient };
///////////////////////////////////////////////////////////////////////////////////////////////////

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

var corsOptions = {
  credentials: true,
  origin: [
    "http://localhost:4200",
    "http://localhost:7000",
    "http://panel.aocopt.com",
    "https://panel.aocopt.com",
    "http://admin.aocv2.com:3001",
    "https://admin.aocv2.com:3001",
    "http://360.aocv2.com:3002",
    "https://360.aocv2.com:3002",
    "http://admin.aocv2.com",
    "https://admin.aocv2.com",
    "http://360.aocv2.com",
    "https://360.aocv2.com",
  ],
};

// app.use(logger('dev'));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true, limit: "500mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
//  multer({ storage: multer.memoryStorage(), dest: "./public/uploads/" }).any()
  multer({ storage: multer.memoryStorage(), dest: "./aocv2trackingserver-master/public/uploads/" }).any()
);
app.use(
  session({
    secret: "aocv2Tracking@123",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next();
});

const io = require("./socket")(app);
module.exports.socket = {
  emit: (roomname, data) => {
    io.sockets.in(String(roomname)).emit("data", JSON.stringify(data));
  },
};

require("./config/db.config");
require("./routes/index.router")(app);
require("./routes/tracking.router")(app);
require("./routes/snapshot.router")(app);
require("./routes/crash.router")(app);

module.exports = app;
