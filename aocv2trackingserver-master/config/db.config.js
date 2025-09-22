const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;

if (process.env.ENVIRONMENT == "LIVE") {
 
  db.url = process.env.MONGODB_LIVE_URL
//   db.url = "mongodb://"+encodeURIComponent(process.env.LIVE_DB_USER)+":"+encodeURIComponent(process.env.LIVE_DB_USER_PSW)+"@"+encodeURIComponent(process.env.LIVE_DB_HOST)+":"+encodeURIComponent(process.env.LIVE_DB_HOST_PORT)+"/"+encodeURIComponent(process.env.LIVE_DB)+"?authSource="+encodeURIComponent(process.env.LIVE_AUTH_DB)+"&ext.ssh.server="+encodeURIComponent(process.env.LIVE_SSH_HOST+':'+process.env.LIVE_SSH_PORT)+"&ext.ssh.username="+encodeURIComponent(process.env.LIVE_SSH_USER)+"&ext.ssh.password="+encodeURIComponent(process.env.LIVE_SSH_PSW);
} else {
  //db.url = "mongodb://"+encodeURIComponent(process.env.LIVE_DB_USER)+":"+encodeURIComponent(process.env.LIVE_DB_USER_PSW)+"@"+encodeURIComponent(process.env.LIVE_DB_HOST)+":"+encodeURIComponent(process.env.LIVE_DB_HOST_PORT)+"/"+encodeURIComponent(process.env.LIVE_DB)+"?authSource="+encodeURIComponent(process.env.LIVE_AUTH_DB)+"&ext.ssh.server="+encodeURIComponent(process.env.LIVE_SSH_HOST+':'+process.env.LIVE_SSH_PORT)+"&ext.ssh.username="+encodeURIComponent(process.env.LIVE_SSH_USER)+"&ext.ssh.password="+encodeURIComponent(process.env.LIVE_SSH_PSW);
  db.url =
    "mongodb+srv://vcdeltatech92024:eDZoQJqiS3rtpGbg@cluster0.h2xpx.mongodb.net/";
}

db.mongoose
  .connect(db.url, {
    useCreateIndex: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    socketTimeoutMS: 25000,
    keepAlive: true,
    //reconnectTries: 3,
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

db.ambulances = require("../models/ambulances.model")(mongoose);
db.ambulance_trackings = require("../models/ambulance_trackings.model")(
  mongoose
);
db.ambulance_tracking_histories =
  require("../models/ambulance_tracking_histories.model")(mongoose);
db.ambulance_images = require("../models/ambulance_images.model")(mongoose);
db.ambulance_image_histories =
  require("../models/ambulance_image_histories.model")(mongoose);
db.ambulance_crashes = require("../models/ambulance_crashes.model")(mongoose);

module.exports = db;
