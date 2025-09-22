const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;

if (process.env.ENVIRONMENT == "LIVE") {
  db.url = process.env.MONGODB_LIVE_URL;
  //db.url = ("mongodb://"+encodeURIComponent(process.env.LIVE_DB_USER)+":"+encodeURIComponent(process.env.LIVE_DB_USER_PSW)+"@"+encodeURIComponent(process.env.LIVE_DB_HOST)+":"+encodeURIComponent(process.env.LIVE_DB_HOST_PORT)+"/"+encodeURIComponent(process.env.LIVE_DB)+"?authSource="+encodeURIComponent(process.env.LIVE_AUTH_DB)+"&ext.ssh.server="+encodeURIComponent(process.env.LIVE_SSH_HOST+':'+process.env.LIVE_SSH_PORT)+"&ext.ssh.username="+encodeURIComponent(process.env.LIVE_SSH_USER)+"&ext.ssh.password="+encodeURIComponent(process.env.LIVE_SSH_PSW));
} else {
  //   db.url =
  //     "mongodb://" +
  //     encodeURIComponent(process.env.LOCAL_DB_USER) +
  //     ":" +
  //     encodeURIComponent(process.env.LOCAL_DB_USER_PSW) +
  //     "@" +
  //     encodeURIComponent(process.env.LOCAL_DB_HOST) +
  //     ":" +
  //     encodeURIComponent(process.env.LOCAL_DB_HOST_PORT) +
  //     "/" +
  //     encodeURIComponent(process.env.LOCAL_DB) +
  //     "?authSource=" +
  //     encodeURIComponent(process.env.LOCAL_AUTH_DB);
}

db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });
db.designations = require("../models/designations.model")(mongoose);
db.aoc_zones = require("../models/aoc_zones.model")(mongoose);
db.hospitals = require("../models/hospitals.model")(mongoose);
db.alive_users = require("../models/alive_users.model")(mongoose);
db.patients = require("../models/patients.model")(mongoose);
db.aoc_requests = require("../models/aoc_requests.model")(mongoose);
db.patient_requests = require("../models/patient_requests.model")(mongoose);

module.exports = db;
