var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var configure = require("./config/configure");

var logger = require("morgan");
var multer = require("multer");
var session = require("express-session");
require("dotenv").config();

const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./config/db.config");

// redis session setup

//commented temp
const redis = require("redis");
const { sendPushNotification } = require("./config/fcm-push");

let redis_options = {
  host: "127.0.0.1",
  port: "6379",
  password: "aocv2@123!",
};

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
var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

var corsOptions = {
  credentials: true,
  origin: [
    "http://43.229.151.152:3001",
    "http://43.229.151.152:3002",
    "http://localhost:4200",
    "https://360.aocv2.com:3002",
    "https://admin.aocv2.com:3001",
    "http://360.aocv2.com:3002",
    "http://admin.aocv2.com:3001",
    "https://360.aocv2.com",
    "https://admin.aocv2.com",
    "http://360.aocv2.com",
    "http://admin.aocv2.com",
  ],
};

//app.use(logger("dev"));
app.use(
  logger('dev', {
    skip: (req, res) => res.statusCode < 400, // Skip logs for non-error responses
  })
);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true, limit: "500mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  multer({ storage: multer.memoryStorage(), dest: "./public/uploads/" }).any()
);
app.use(
  session({
    secret: "aocv2@123",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.post("/send-push-notification", sendPushNotification);


// for api_token authentication
// for windows sudo service redis-server restart
app.use(function (req, res, next) {
  if (req.headers.hasOwnProperty("api_token")) {
    if (
      new RegExp("login", "i").test(req.originalUrl) &&
      new RegExp("register", "i").test(req.originalUrl)
    )
      next();
    else {
      if (
        req.headers.hasOwnProperty("app_type") &&
        req.headers.hasOwnProperty("id")
      ) {
        redisClient.hget(String(req.headers.id), "api_token", (err, reply) => {
          if (err) throw err;
          else if (
            reply &&
            reply.length &&
            JSON.parse(reply)[req.headers.app_type] == req.headers.api_token
          )
            next();
          else
            res.send(
              configure.apiResp(
                false,
                599,
                {},
                "session expired. / login with another device."
              )
            );
        });
      } else {
        res.send(configure.apiResp(false, 502, {}, "app_type OR id missing."));
      }
    }
  } else {
    next();
  }
});

// for data encryption
app.use(function (req, res, next) {
  if (req.path != "/api/master/updateZoneDetail") {
    if (
      req.headers.isencryption &&
      String(req.headers.isencryption) == "true"
    ) {
      configure.apiReq(req).then((body) => {
        req.body = body;
        next();
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

const io = require("./socket")(app);
module.exports.socket = {
  emit: (roomname, data) => {
    io.sockets.in(String(roomname)).emit("data", JSON.stringify(data));
  },
};

configure = require("./config/configure");

// setTimeout(() => {
require("./redis");
// }, 5000);

require("./config/db.config");
require("./routes/index.router")(app);
require("./routes/web/social/ambulances.router")(app);

require("./routes/web/admin/web_authentication.router")(app);

require("./routes/web/admin/web_app_versions.router")(app);
require("./routes/web/admin/web_area_management.router")(app);
require("./routes/web/admin/web_hospitals.router")(app);
require("./routes/notifications/notifications.router")(app);

require("./routes/web/admin/web_aoc_users.router")(app);
require("./routes/web/admin/web_doctors.router")(app);
require("./routes/web/admin/web_drivers.router")(app);
require("./routes/web/admin/web_nurses.router")(app);
require("./routes/web/admin/web_aoc_er_staffs.router")(app);
require("./routes/web/admin/web_aoc_ems_staffs.router")(app);
require("./routes/web/admin/web_emt_staffs.router")(app);
require("./routes/web/admin/web_track_app.router")(app);

// require('./routes/web_first_responders.router')(app);
// require('./routes/web_volunteers.router')(app);

// require('./routes/web/admin/web_area_management.router')(app);
require("./routes/web/admin/web_medical_equipments.router")(app);
require("./routes/web/admin/web_glass_macs.router")(app);
require("./routes/web/admin/web_patient_monitors.router")(app);
require("./routes/web/admin/web_patient_situations.router")(app);
require("./routes/web/admin/web_medical_devices.router")(app);
require("./routes/web/admin/web_communication_devices.router")(app);
require("./routes/web/admin/web_ambulance_management.router")(app);
require("./routes/web/admin/web_ambulances.router")(app);
require("./routes/web/admin/web_user_device_types.router")(app);
require("./routes/web/admin/web_user_devices.router")(app);
require("./routes/web/admin/web_volunteers.router")(app);
require("./routes/web/admin/web_paramedic.router")(app);
require("./routes/web/admin/web_first_responders.router")(app);
require("./routes/web/admin/web_user_notification.router")(app);
require("./routes/web/admin/dashboard.router")(app);
require("./routes/web/user/web_user_ambulances.router")(app);
require("./routes/web/user/web_authentication.router")(app);
require("./routes/web/user/web_user_requests.router")(app);
require("./routes/web/user/users.router")(app);
require("./routes/web/user/web_user_aoc_requests.router")(app);
require("./routes/web/user/ambulance_speed_reports.router")(app);
require("./routes/web/user/ambulance_crash_reports.router")(app);
require("./routes/web/user/patient_monitor_reports.router")(app);

require("./routes/api/index.router")(app);
require("./routes/api/ambulances.router")(app);
require("./routes/api/hospitals.router")(app);
require("./routes/api/requests.router")(app);
require("./routes/api/users_authentication.router")(app);

require("./routes/tv_app/version_check.router")(app);
require("./routes/tv_app/users_authentication.router")(app);
require("./routes/tv_app/ambulance.router")(app);

require("./routes/patient_monitor/patient_monitors.router")(app);
require("./routes/glass_mac_api/glass_macs.router")(app);

require("./routes/alive/aoc_requests.router")(app);

module.exports = app;
