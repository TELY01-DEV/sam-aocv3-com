const db = require("../../config/db.config");
const configure = require("../../config/configure");
var request = require("request");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Patients = db.patients;
const fs = require("fs");

exports.postPatientsDetailUpdate = (req, res) => {
  let profile_image = req.body.patients_detail["profile_image"];
  let image_extention = String(profile_image).split(".");
  let image_name =
    req.body.patients_detail["_id"] +
    "." +
    image_extention[image_extention.length - 1];

  request({
    uri: profile_image,
  })
    .pipe(
      fs.createWriteStream(configure.fsUploadURL("patientImages") + image_name)
    )
    .on("finish", (data) => {
      console.log("request true", data);

      Patients.findOneAndUpdate(
        { _id: ObjectId(req.body.patients_detail["_id"]) },
        { $set: { profile_image: image_name } }
      ).then((patients_data) => {});
    })
    .on("error", (err) => {
      console.log("request false", err);

      console.log(err);
    });
};
