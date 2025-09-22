const { socket } = require("../server");
var fs = require("fs");
const https = require("https");
const db = require("../config/db.config");
const configure = require("../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Ambulances = db.ambulances;
const AmbulanceTrackings = db.ambulance_trackings;
const AmbulanceCrashes = db.ambulance_crashes;
const AmbulanceImageHistories = db.ambulance_image_histories;
const AmbulanceImages = db.ambulance_images;

exports.postAmbulanceCrashNotify = (req, res) => {
  console.log("req", req.files);
  Ambulances.findOne({
    ambulance_box_code: String(req.body.ambulance_id),
  }).then((ambulance_data) => {
    if (ambulance_data) {
      req.body.tracking_speed = Number(req.body.tracking_speed * 3.6);

      AmbulanceImages.find({ ambulance_id: ObjectId(ambulance_data._id) })
        .sort({ createdAt: -1 })
        .limit(1)
        .then((ambulance_image_data) => {
          var now = Date.now();
          var current_datetime = new Date(now);
          var current_state = "GREEN";

          if (req.body.tracking_speed > 80 && req.body.tracking_speed < 120)
            current_state = "ORANGE";
          else if (req.body.tracking_speed > 120) current_state = "RED";

          var ambulance_crashes = new AmbulanceCrashes({
            ambulance_id: ObjectId(ambulance_data._id),
            location: {
              lat: Number(req.body.tracking_latitude),
              lon: Number(req.body.tracking_longitude),
            },
            speed: Number(req.body.tracking_speed).toFixed(2),
            heading: String(req.body.tracking_heading),
            count_datetime: current_datetime,
            state: String(current_state),
            location_detail: {
              address: "",
              image: "",
            },
          });
          // console.log("https://maps.googleapis.com/maps/api/staticmap?center="+String(req.body.tracking_latitude)+","+String(req.body.tracking_longitude)+"&zoom=13&size=800x450&maptype=roadmap&markers=color:red%7C"+String(req.body.tracking_latitude)+",%20"+String(req.body.tracking_longitude)+"&key=AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls");

          ambulance_crashes["ambulance_image_histories_id"] =
            ambulance_image_data.ambulance_image_histories_id;

          new Promise((resolve, reject) => {
            https
              .request({
                uri:
                  "https://maps.googleapis.com/maps/api/staticmap?center=" +
                  String(req.body.tracking_latitude) +
                  "," +
                  String(req.body.tracking_longitude) +
                  "&zoom=16&size=800x450&maptype=roadmap&markers=color:red%7C" +
                  String(req.body.tracking_latitude) +
                  ",%20" +
                  String(req.body.tracking_longitude) +
                  "&key=" +
                  String(process.env.GOOGLE_MAP_KEY),
              })
              .pipe(file) //file
              .on("finish", () => {
                //   console.log(`The file is finished downloading.`);
                resolve();
              })
              .on("error", (error) => {
                reject(error);
              });
          }).catch((error) => {
            console.log(`Something happened: ${error}`);
          });

          ambulance_crashes
            .save(ambulance_crashes)
            .then((e) => {
              var socket_data = {
                ambulance_crashes_id: e._id,
                type: "CRASH_NOTIFY",
              };
              socket.emit(
                "CRASH_NOTIFY_" + String(ambulance_data._id),
                socket_data
              ); // FOR USER PANEL CRASH NOTIFY...
			  req.body.type = "CRASH"
			  socket.emit("crash", req.body);
              let google_address;
              const options = {
                hostname: "maps.googleapis.com",
                port: 443,
                path:
                  "/maps/api/geocode/json?latlng=" +
                  String(req.body.tracking_latitude) +
                  "," +
                  String(req.body.tracking_longitude) +
                  "&key=" +
                  String(process.env.GOOGLE_MAP_KEY),
                method: "GET",
              };
              google_address = https.request(options, (res) => {
                var body = "";

                res.on("data", function (chunk) {
                  body += chunk;
                });

                res.on("end", function () {
                  var address_response = JSON.parse(body);
                  let latlng_address = {
                    location_detail: {
                      address: address_response.results[0].formatted_address,
                      image:
                        "https://maps.googleapis.com/maps/api/staticmap?center=" +
                        String(req.body.tracking_latitude) +
                        "," +
                        String(req.body.tracking_longitude) +
                        "&zoom=13&size=800x450&maptype=roadmap&markers=color:red%7C" +
                        String(req.body.tracking_latitude) +
                        ",%20" +
                        String(req.body.tracking_longitude) +
                        "&key=" +
                        String(process.env.GOOGLE_MAP_KEY),
                    },
                  };
                  AmbulanceCrashes.findOneAndUpdate(
                    { _id: e._id },
                    { $set: latlng_address }
                  )
                    .then((data) => console.log(data))
                    .catch((err) => {
                      console.log(err);
                    });
                });
                return body;
              });
              google_address.on("error", (e) => {
                console.error(e);
              });
              google_address.end();
            })
            .catch((err) => console.log(err));
        });
      res.status(200).send();
    } else {
      res.status(201).send({
        message: "Ambulance not found.",
      });
    }
  });
};
