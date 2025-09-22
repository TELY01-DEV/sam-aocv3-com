const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;

if (process.env.ENVIRONMENT == "LIVE") {
  db.url = process.env.MONGODB_LIVE_URL;
//   db.url =
//      "mongodb://" +
//      encodeURIComponent(process.env.LIVE_DB_USER) +
//      ":" +
//      encodeURIComponent(process.env.LIVE_DB_USER_PSW) +
//      "@" +
//      encodeURIComponent(process.env.LIVE_DB_HOST) +
//      ":" +
//      encodeURIComponent(process.env.LIVE_DB_HOST_PORT) +
//      "/" +
//      encodeURIComponent(process.env.LIVE_DB) +
//      "?authSource=" +
//      encodeURIComponent(process.env.LIVE_AUTH_DB) +
//      "&ext.ssh.server=" +
//      encodeURIComponent(
//       process.env.LIVE_SSH_HOST + ":" + process.env.LIVE_SSH_PORT
//      ) +
//      "&ext.ssh.username=" +
//      encodeURIComponent(process.env.LIVE_SSH_USER) +
//      "&ext.ssh.password=" +
//      encodeURIComponent(process.env.LIVE_SSH_PSW);
} else {
  db.url = process.env.MONGODB_TEST_URL;
  // "mongodb://" +
  // encodeURIComponent(process.env.LOCAL_DB_USER) +
  // ":" +
  // encodeURIComponent(process.env.LOCAL_DB_USER_PSW) +
  // "@" +
  // encodeURIComponent(process.env.LOCAL_DB_HOST) +
  // ":" +
  // encodeURIComponent(process.env.LOCAL_DB_HOST_PORT) +
  // "/" +
  // encodeURIComponent(process.env.LOCAL_DB) +
  // "?authSource=" +
  // encodeURIComponent(process.env.LOCAL_AUTH_DB);
}

db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    poolSize: 30,
  })
  .then(() => {
    console.log("Connected to the database! " + process.env.ENVIRONMENT);
  })
  .catch((err) => {
    console.log("Cannot connect to the database! ", err);
    process.exit();
  });

db.versions = require("../models/versions.model")(mongoose);

db.designations = require("../models/designations.model")(mongoose);
db.aoc_users = require("../models/aoc_users.model")(mongoose);
db.alive_users = require("../models/alive_users.model")(mongoose);
db.doctors = require("../models/doctors.model")(mongoose);
db.drivers = require("../models/drivers.model")(mongoose);
db.nurses = require("../models/nurses.model")(mongoose);
db.aoc_er_staffs = require("../models/aoc_er_staffs.model")(mongoose);
db.aoc_ems_staffs = require("../models/aoc_ems_staffs.model")(mongoose);
db.emt_staffs = require("../models/emt_staffs.model")(mongoose);
db.user_presence_logs = require("../models/user_presence_logs.model")(mongoose);
db.superadmins = require("../models/superadmins.model")(mongoose);
db.medical_equipments = require("../models/medical_equipments.model")(mongoose);
db.glass_macs = require("../models/glass_macs.model")(mongoose);
db.patient_monitors = require("../models/patient_monitors.model")(mongoose);
db.patient_situations = require("../models/patient_situations.model")(mongoose);

db.provinces = require("../models/provinces.model")(mongoose);
db.districts = require("../models/districts.model")(mongoose);
db.subdistricts = require("../models/subdistricts.model")(mongoose);

db.hospitals = require("../models/hospitals.model")(mongoose);
db.aoc_zones = require("../models/aoc_zones.model")(mongoose);

db.device_types = require("../models/device_types.model")(mongoose);
db.devices = require("../models/devices.model")(mongoose);
db.ip_server_devices = require("../models/ip_server_devices.model")(mongoose);
db.fast_tracts = require("../models/fast_track.model")(mongoose);
db.volunteers = require("../models/volunteer.model")(mongoose);
db.first_responders = require("../models/first_responders.model")(mongoose);
db.paramedics = require("../models/paramedic.model")(mongoose);

db.communication_device_types =
  require("../models/communication_device_types.model")(mongoose);
db.communication_devices = require("../models/communication_devices.model")(
  mongoose
);
db.stream_servers = require("../models/stream_servers.model")(mongoose);
db.ambulance_communication_devices =
  require("../models/ambulance_communication_devices.model")(mongoose);

db.ambulance_equipments = require("../models/ambulance_equipments.model")(
  mongoose
);
db.ambulance_types = require("../models/ambulance_types.model")(mongoose);
db.ambulance_equipment_catalogies =
  require("../models/ambulance_equipment_catalogies.model")(mongoose);
db.ambulance_service_maintenances =
  require("../models/ambulance_service_maintenances.model")(mongoose);

db.obd_servers = require("../models/obd_servers.model")(mongoose);
db.snapshot_servers = require("../models/snapshot_servers.model")(mongoose);
db.ip_server_communications =
  require("../models/ip_server_communications.model")(mongoose);
db.archive_servers = require("../models/archive_servers.model")(mongoose);

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
db.patients = require("../models/patients.model")(mongoose);
db.patient_requests = require("../models/patient_requests.model")(mongoose);
db.aoc_requests = require("../models/aoc_requests.model")(mongoose);

db.track_apps = require("../models/track_apps.model")(mongoose);

db.notification_alive_users =
  require("../models/notification_alive_users.model")(mongoose);
db.notification_aoc_users = require("../models/notification_aoc_users.model")(
  mongoose
);
db.notification_doctors = require("../models/notification_doctors.model")(
  mongoose
);
db.notification_drivers = require("../models/notification_drivers.model")(
  mongoose
);
db.notification_nurses = require("../models/notification_nurses.model")(
  mongoose
);
db.notification_paramedics = require("../models/notification_paramedics.model")(
  mongoose
);
db.user_notification_settings =
  require("../models/user_notification_settings.model")(mongoose);
// db.forms_prehos_rec_form = require("../models/forms_prehos_rec_form.model")(mongoose);

module.exports = db;
