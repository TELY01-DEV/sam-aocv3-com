const { Buffer } = require("buffer");
const { socket } = require("../server");
var CryptoJS = require("crypto-js");
const path1 = require("path");
const fs = require("fs");
const db = require("./db.config");
const fcmPush = require("./fcm-push");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const AliveUsers = db.alive_users;
const Drivers = db.drivers;
const Doctors = db.doctors;
const Nurses = db.nurses;
const AocErStaffs = db.aoc_er_staffs;
const AocEmsStaffs = db.aoc_ems_staffs;
const AocUsers = db.aoc_users;
const AocRequests = db.aoc_requests;
const PatientMonitors = db.patient_monitors;
const GlassMacs = db.glass_macs;
const Ambulances = db.ambulances;
const UserNotificationSettings = db.user_notification_settings;
exports.AMB_TRAKCING_TIMEOUT = 60000;
const Designations = db.designations;
const configure = require("./configure");
const notification_lang = require("./push_lang");

exports.random = (length, type = "") => {
  return new Promise((resolve) => {
    var result = "";
    switch (type) {
      case "Number":
        var characters = "0123456789";
        break;

      case "String":
        var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        break;

      default:
        var characters =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    }

    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    resolve(result);
  });
};

exports.msToTime = (s) => {
  // Pad to 2 or 3 digits, default is 2
  function pad(n, z) {
    z = z || 2;
    return ("00" + n).slice(-z);
  }

  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  return pad(hrs) + ":" + pad(mins) + ":" + pad(secs) + "." + pad(ms, 3);
};

exports.apiResp = (success, status, content, message, isencryption = false) => {
  message = typeof message !== String ? JSON.stringify(message) : message;
  if (String(isencryption) == "true") {
    content = CryptoJS.AES.encrypt(
      JSON.stringify(content),
      "aocv2@tely360"
    ).toString();
  }
  var resp = { success, status, content, message };
  return resp;
};

exports.apiReq = (req) => {
  return new Promise((resolve) => {
    try {
      if (req.body.dataStr) {
        let decryptStr = CryptoJS.AES.decrypt(
          req.body.dataStr,
          "aocv2@tely360"
        );
        let data = JSON.parse(decryptStr.toString(CryptoJS.enc.Utf8));
        resolve(data);
      }
    } catch (err) {
      console.log(err);
    }
  });
};

exports.fsUploadURL = (type) => {
  switch (type) {
    case "hospitalImages":
      path = "/uploads/hospitals/images/";
      return path;
      break;

    case "hospitalLogo":
      path = "/uploads/hospitals/logos/";
      return path;
      break;

    case "userProfile":
      path = "/uploads/aoc_users/profile_picture/";
      return path;
      break;

    case "medicalEquipmentImage":
      path = "/uploads/medical_equipments/medical_equipments_images/";
      return path;
      break;

    case "medicalEquipmentIconImage":
      path = "/uploads/medical_equipments/icon_images/";
      return path;
      break;

    case "patientRequestLocationImage":
      path = "./public/uploads/patient_requests/location_images/";
      return path;
      break;

    case "ambulanceProfile":
      path = "/uploads/ambulance/profile_picture/";
      return path;
      break;

    case "patientImages":
      path = "./public/uploads/patients/profile_image/";
      return path;
      break;

    default:
      path = "/uploads/others/";
      return path;
  }
};

exports.fsRemove = (fileName, type) => {
  var path = "";

  switch (type) {
    case "hospitalImages":
      path = "uploads/hospital/images/";
      break;

    case "userProfile":
      path = "uploads/aoc_users/profile_picture/";
      break;

    default:
      path = "uploads/";
      break;
  }

  var uploadPath = path + fileName;

  //fs.unlink(uploadPath, function (err) {
  //  console.log(err);
  //});
};

exports.fsUpload = (target, type, file) => {
  let uploadDir = ""; // Start with an empty uploadDir

  // Switch case to set the appropriate upload directory based on type
  switch (type) {
    case "hospitalImages":
      uploadDir = "./public/uploads/hospitals/images/";
      break;

    case "hospitalLogo":
      uploadDir = "./public/uploads/hospitals/logos/";
      break;

    case "userProfile":
      uploadDir = "./public/uploads/aoc_users/profile_picture/";
      break;

    case "doctorProfile":
      uploadDir = "./public/uploads/doctors/profile_picture/";
      break;

    case "driverProfile":
      uploadDir = "./public/uploads/drivers/profile_picture/";
      break;

    case "nurseProfile":
      uploadDir = "./public/uploads/nurses/profile_picture/";
      break;

    case "ambulanceProfile":
      uploadDir = "./public/uploads/ambulance/profile_picture/";
      break;

    case "paramedicProfile":
      uploadDir = "./public/uploads/paramedics/profile_picture/";
      break;

    case "volunteerProfile":
      uploadDir = "./public/uploads/volunteers/profile_picture/";
      break;

    case "emsstaffProfile":
      uploadDir = "./public/uploads/aoc_ems_staffs/profile_picture/";
      break;

    case "erStaffProfile":
      uploadDir = "./public/uploads/aoc_er_staffs/profile_picture/";
      break;

    case "emtStaffProfile":
      uploadDir = "./public/uploads/emt_staffs/profile_picture/";
      break;

    case "firstResponderProfile":
      uploadDir = "./public/uploads/first_responders/profile_picture/";
      break;

    case "medicalEquipmentImage":
      uploadDir =
        "./public/uploads/medical_equipments/medical_equipments_images/";
      break;

    case "iconImage":
      uploadDir = "./public/uploads/medical_equipments/icon_images/";
      break;

    case "deviceImageProfile":
      uploadDir = "./public/uploads/devices/profile_picture/";
      break;

    case "equipmentProfileImage":
      uploadDir = "./public/uploads/ambulace_equipments/profile_picture/";
      break;

    case "equipmentIconImage":
      uploadDir = "./public/uploads/ambulace_equipments/icon_images/";
      break;

    case "geofencing":
      uploadDir = "./public/uploads/aoc_zones/kml/";
      break;

    case "communicationdevicesImage":
      uploadDir = "./public/uploads/communication_devices/icon_images/";
      break;

    default:
      uploadDir = "./public/uploads/";
      break;
  }

  let extension = path1.extname(file.originalname);

  if (type === "geofencing") {
    extension = ".kml";
  }

  let uploadPath = path1.join(uploadDir, `${target}${extension}`);

  console.log("Upload Directory:", uploadDir); // Log the full path to ensure correctness
  console.log("Upload Path:", uploadPath);

  try {
    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Check if the file already exists
    if (fs.existsSync(uploadPath)) {
      let stat = fs.statSync(uploadPath);
      if (stat.isDirectory()) {
        let newTarget = `${target}-${Date.now()}`;
        let newUploadPath = path1.join(uploadDir, `${newTarget}${extension}`);
        console.log("newUploadPath",newUploadPath)
        fs.writeFileSync(newUploadPath, file.buffer); //"../" + 
        console.log(`File saved at ${newUploadPath}`);
        return `${newTarget}${extension}`;
      }
      fs.unlinkSync(uploadPath); // Delete existing file
    }

    // Write the new file "../" +
    fs.writeFileSync( uploadPath, file.buffer);
    console.log(`File saved at ${uploadPath}`);
  } catch (err) {
    console.error("Error saving file:", err);
  }

  return `${target}${extension}`;
};

exports.fsBase64Upload = (target, type, file) => {
  var path = "";

  switch (type) {
    case "patientProfile":
      path = "./public/uploads/patients/profileImage/";
      break;

    case "userProfile":
      path = "./public/uploads/aoc_users/profileImage/";
      break;

    case "patientImages":
      path = "./public/uploads/patients/patientImages/";
      break;

    case "patientGlucose":
      path = "./public/uploads/patients/patientGlucose/";
      break;

    default:
      path = "./public/uploads/others/";
      break;
  }

  var extension = file.split("/");
  extension = extension[1].split(";");
  var uploadPath = path + target + "." + extension[0];
  var file = file.split(",");

  try {
    if (fs.existsSync(uploadPath)) {
      fs.unlink(uploadPath, function (err) {
        console.log(err);
      });
    }

    var bitmap = new Buffer.from(file[1].replace(/[\r\n]+/gm, ""), "base64");
    fs.writeFileSync(uploadPath, bitmap);
  } catch (err) {
    console.error(err);
  }
  return target + "." + extension[0];
};

exports.statusColor = {
  ONLINE: "699752",
  OFFLINE: "367ec4",
};

exports.notificationSound = {
  ACNS: "ambulance_crash.mp3",
  AMBULANCE_TRACKING_ONLINE: "ambulance_tracking_online.mp3",
  AMBULANCE_TRACKING_OFFLINE: "ambulance_tracking_offline.mp3",
  GLASS_MACS_STATUS_ONLINE: "glasses_online.mp3",
  GLASS_MACS_STATUS_OFFLINE: "glasses_offline.mp3",
  PATIENT_MONITOR_STATUS_ONLINE: "monitor_online.mp3",
  PATIENT_MONITOR_STATUS_OFFLINE: "monitor_offline.mp3",
  AMBULANCE_SPEED_BELOW_80: "green_speed.mp3",
  AMBULANCE_SPEED_ABOVE_80: "yellow_speed.mp3",
  AMBULANCE_SPEED_ABOVE_120: "red_speed.mp3",
  AMBULANCE_ESTIMATE_TIME: " ",
};

exports.severityColor = {
  _1: "FF0000",
  _2: "FFC0CB",
  _3: "FFFF00",
  _4: "00FF00",
  _5: "FFFFFF",
};

exports.speedColor = {
  // 'LTE_80': '267633',
  // 'GT_80_LTE_120': 'FFFF00',
  // 'GT_120': 'FF0303'
  LTE_80: "a7ff83",
  GT_80_LTE_120: "FFFF00",
  GT_120: "FF6B49",
};

exports.trackingAssignColor = {
  TR_0_ASN_1: "3C54A4",
  TR_1_ASN_0: "b0aeae",
  TR_0_ASN_0: "b0aeae",
};

exports.severityColorPanel = {
  _1: "#FF0000",
  _2: "#FFC0CB",
  _3: "#FFFF00",
  _4: "#00FF00",
  _5: "#FFFFFF",
};

exports.speedColorPanel = {
  LTE_80: "#a7ff83",
  GT_80_LTE_120: "#FFFF00",
  GT_120: "#FF6B49",
};

exports.trackingAssignColorPanel = {
  TR_0_ASN_1: "#aadaff",
  TR_1_ASN_0: "#b0aeae",
  TR_0_ASN_0: "#b0aeae",
};

exports.getUserDetail = (user, designation, resp, callback) => {
  Designations.findOne(designation)
    .then((designation_data) => {
      var Users;
      if (designation_data && designation_data["name1"] == "Alive Users") {
        Users = AliveUsers;
      } else {
        Users = AocUsers;
      }
      Users.findOne(user)
        .then((user_data) => {
          callback({ user_data, designation_data });
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};

exports.statusChangePushNotification = (request_id, notificaion_type) => {
  let AocRequestCond = [
    {
      $match: {
        _id: ObjectId(request_id),
      },
    },
    {
      $lookup: {
        from: "ambulances",
        localField: "ambulance_id",
        foreignField: "_id",
        as: "ambulancesDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulancesDetail",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $lookup: {
        from: "aoc_users",
        let: {
          hospital_id: "$ambulancesDetail.hospital_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ["$hospital_id", "$hospital_ids"],
              },
            },
          },
        ],
        as: "aocUsersDetail",
      },
    },
  ];

  AocRequests.aggregate(AocRequestCond).then((data) => {
    var data = data[0];
    var push_data = {
      ambulance_id: data.ambulance_id ? data.ambulance_id : "",
    };
    // var push_body = data.request_type + ', ' + data.ambulancesDetail.ambulance_box_code + ', '+ data.ambulancesDetail.name1
    getUserDetail(
      { _id: ObjectId(data.creater_id) },
      { _id: ObjectId(data.creater_type) },
      {},
      (user) => {
        if (
          user.user_data &&
          user.user_data.device_token &&
          user.designation_data["name1"] == "Alive Users"
        ) {
          var push_title =
            notification_lang[user.user_data.alive_app_language]["PUSH_TITLE"][
              "OPERATION_STATUS_CHANGE"
            ];
          var push_body =
            notification_lang[user.user_data.alive_app_language][
              notificaion_type
            ];

          fcmPush.sendPush(
            user.user_data.device_token,
            "ALIVE_V2",
            push_data,
            push_title,
            push_body
          );
        } else if (
          user.user_data &&
          user.user_data.device_token &&
          user.designation_data["name1"] == "Aoc Users"
        ) {
          if (
            user.user_data &&
            user.user_data.device_token &&
            Object.keys(user.user_data.device_token).length
          ) {
            Object.keys(user.user_data.device_token).forEach((app_type) => {
              var notification_settings = {};
              notification_settings[app_type] = 1;

              var push_title =
                notification_lang[user.user_data.aoc_app_language][
                  "PUSH_TITLE"
                ]["OPERATION_STATUS_CHANGE"];
              var push_body =
                notification_lang[user.user_data.aoc_app_language][
                  notificaion_type
                ];

              AocUsers.find({
                hospital_ids: ObjectId(user.user_data.hospital_id),
                notification_settings,
              }).then((users) => {
                users.filter((element) => {
                  UserNotificationSettings.findOneambulance_id(
                    { user_id: ObjectId(element._id) },
                    notification_settings
                  ).then((settings_data) => {
                    if (
                      settings_data &&
                      settings_data[app_type] &&
                      settings_data[app_type]["operation_status_change"]
                    ) {
                      fcmPush.sendPush(
                        element.device_token[String(app_type)],
                        "AOC_V2",
                        push_data,
                        push_title,
                        push_body
                      );
                    }
                  });
                });
              });
            });
          }
        }
      }
    );
    if (data.driver_ids.length) {
      data.driver_ids.map((element) => {
        Drivers.findOne({ _id: ObjectId(element) }).then((data) => {
          if (data.device_token) {
            var push_title =
              notification_lang[data.aoc_app_language]["PUSH_TITLE"][
                "OPERATION_STATUS_CHANGE"
              ];
            var push_body =
              notification_lang[data.app_language][notificaion_type];
            fcmPush.sendPush(
              data.device_token,
              "AOC_V2",
              push_data,
              push_title,
              push_body
            );
          }
        });
      });
    }
    if (data.doctor_ids.length) {
      data.doctor_ids.map((element) => {
        Doctors.findOne({ _id: ObjectId(element) }).then((data) => {
          if (data.device_token) {
            var push_title =
              notification_lang[data.aoc_app_language]["PUSH_TITLE"][
                "OPERATION_STATUS_CHANGE"
              ];
            var push_body =
              notification_lang[data.app_language][notificaion_type];
            fcmPush.sendPush(
              data.device_token,
              "AOC_V2",
              push_data,
              push_title,
              push_body
            );
          }
        });
      });
    }

    if (data.nurse_ids.length) {
      data.nurse_ids.map((element) => {
        Nurses.findOne({ _id: ObjectId(element) }).then((data) => {
          if (data.device_token) {
            var push_title =
              notification_lang[data.aoc_app_language]["PUSH_TITLE"][
                "OPERATION_STATUS_CHANGE"
              ];
            var push_body =
              notification_lang[data.app_language][notificaion_type];
            fcmPush.sendPush(
              data.device_token,
              "AOC_V2",
              push_data,
              push_title,
              push_body
            );
          }
        });
      });
    }

    if (data.er_ids.length) {
      data.er_ids.map((element) => {
        AocErStaffs.findOne({ _id: ObjectId(element) }).then((data) => {
          if (data.device_token) {
            var push_title =
              notification_lang[data.aoc_app_language]["PUSH_TITLE"][
                "OPERATION_STATUS_CHANGE"
              ];
            var push_body =
              notification_lang[data.app_language][notificaion_type];
            fcmPush.sendPush(
              data.device_token,
              "AOC_V2",
              push_data,
              push_title,
              push_body
            );
          }
        });
      });
    }

    if (data.ems_ids.lenght) {
      data.ems_ids.map((element) => {
        AocEmsStaffs.findOne({ _id: ObjectId(element) }).then((data) => {
          if (data.device_token && data.device_token.length > 0) {
            var push_title =
              notification_lang[data.aoc_app_language]["PUSH_TITLE"][
                "OPERATION_STATUS_CHANGE"
              ];
            var push_body =
              notification_lang[data.app_language][notificaion_type];
            fcmPush.sendPush(
              data.device_token,
              "AOC_V2",
              push_data,
              push_title,
              push_body
            );
          }
        });
      });
    }
    if (data.aocUsersDetail.length) {
      data.aocUsersDetail.forEach((aoc_user) => {
        if (
          typeof aoc_user.device_token == "object" &&
          Object.keys(aoc_user.device_token).length
        ) {
          Object.keys(aoc_user.device_token).forEach((app_type) => {
            var notification_settings = {};
            app_type = app_type.toLowerCase();
            notification_settings[app_type] = 1;
            var push_title =
              notification_lang[aoc_user.aoc_app_language]["PUSH_TITLE"][
                "OPERATION_STATUS_CHANGE"
              ];
            var push_body =
              data.request_type +
              ", " +
              data.ambulancesDetail.ambulance_box_code +
              " -" +
              data.ambulancesDetail.name1 +
              ", " +
              notification_lang[aoc_user.aoc_app_language][notificaion_type];
            UserNotificationSettings.findOne(
              { user_id: ObjectId(aoc_user._id) },
              notification_settings
            ).then((settings_data) => {
              if (
                settings_data &&
                settings_data[app_type] &&
                settings_data[app_type]["operation_status_change"]
              ) {
                fcmPush.sendPush(
                  aoc_user.device_token[String(app_type)],
                  "AOC_V2",
                  push_data,
                  push_title,
                  push_body,
                  "operation_status_change.mp3",
                  notification_lang["ENG"]["PUSH_TITLE"][
                    "OPERATION_STATUS_CHANGE"
                  ]
                );
              }
            });
          });
        }
      });
    }
  });
};

function getUserDetail(user, designation, resp, callback) {
  Designations.findOne(designation)
    .then((designation_data) => {
      var Users;
      if (designation_data && designation_data["name1"] == "Alive Users") {
        Users = AliveUsers;
      } else {
        Users = AocUsers;
      }
      Users.findOne(user)
        .then((user_data) => {
          callback({ user_data, designation_data });
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
}

exports.sendCrashPush = (ambulance_id, ambulance_crash_id) => {
  Ambulances.findOne({ _id: ObjectId(ambulance_id) }).then((data) => {
    AocUsers.find(
      { hospital_ids: data.hospital_id },
      { _id: 1, device_token: 1, aoc_app_language: 1 }
    ).then((user_data) => {
      if (user_data && user_data.length) {
        user_data.filter((element) => {
          if (element && element.device_token) {
            if (Object.keys(element.device_token).length) {
              Object.keys(element.device_token).forEach((key) => {
                notification_settings = {};
                notification_settings[key] = 1;
                UserNotificationSettings.findOne(
                  { user_id: ObjectId(element._id) },
                  notification_settings
                ).then((user_notification_settings_data) => {
                  if (
                    user_notification_settings_data[key] &&
                    user_notification_settings_data[key]["acns"]
                  ) {
                    fcmPush.sendPush(
                      element.device_token[String(key)],
                      "AOC_V2",
                      { ambulance_crash_id: ambulance_crash_id },
                      notification_lang[element.aoc_app_language]["PUSH_TITLE"]
                        .CRASH_NOTIFY,
                      data.name1 + "Ambulance is Crashed ",
                      configure.notificationSound.ACNS,
                      notification_lang["ENG"]["PUSH_TITLE"].CRASH_NOTIFY
                    );
                  }
                });
              });
            }
          }
          // if (element && element.device_token && element.notificationDetail.aoc.acns && element.device_token['aoc']) {
          //     Object.keys(element.device_token).map((key, value) => {
          //         var socket_data = {
          //             collapse_key: "AOC_V2",
          //             notification: {
          //                 title: push_title,
          //                 body: push_body,
          //                 color: '#FFFFFF',
          //             },
          //         };
          //         //socket.emit('NOTIFICATION_NOTIFY' + String(element._id), socket_data); // FOR USER PANEL NOTIFICATION_NOTIFY...
          //         fcmPush.sendPush(element.device_token[String(key)], "AOC_V2", "push_data", notification_lang[element.aoc_app_language]['PUSH_TITLE'].CRASH_NOTIFY, data.name1 + "Ambulance is Crashed ", configure.notificationSound.ACNS, notification_lang['ENG']['PUSH_TITLE'].CRASH_NOTIFY);
          //     })
          // }
        });
      }
    });
  });
};

exports.postAmbulanceSpeedNotification = (
  data,
  notification_type,
  push_title_lan,
  sound_file
) => {
  // var notification_type = notification_type;
  var push_data = {
    ambulance_id: data[0]._id,
    speed_color_code: data[0].ambulanceTrackingsDetail.speed_color_code,
  };

  // var push_title = push_title_lan;

  if (data[0].is_assign) {
    if (
      data[0].aocRequestsDetail.doctorsDetail &&
      data[0].aocRequestsDetail.doctorsDetail.length
    ) {
      data[0].aocRequestsDetail.doctorsDetail.filter((element) => {
        if (element.device_token && element.device_token !== "") {
          switch (push_title_lan) {
            case "AMBULANCE_STATUS":
              push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              push_body =
                (sound_file == "ambulance_tracking_online.mp3"
                  ? "Ambulance has online \n"
                  : "Ambulance has offline \n") +
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "," +
                data[0].ambulance_box_code;
              push_data =
                sound_file == "ambulance_tracking_online.mp3"
                  ? configure.statusColor.ONLINE
                  : configure.statusColor.OFFLINE;
              break;

            case "AMBULACNE_NEAR_SCENE":
              push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              push_body =
                "Ambulance Arrival In 10 Minutes \n" +
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "," +
                data[0].ambulance_box_code +
                ", " +
                notification_lang[element.app_language]["SPEED"] +
                " " +
                data[0].ambulanceTrackingsDetail.speed +
                " Km/h";
              break;

            default:
              push_title =
                notification_lang[element.app_language]["PUSH_TITLE"];
              var push_body =
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "\n" +
                +data[0].ambulance_box_code +
                ", " +
                notification_lang[element.app_language]["SPEED"] +
                " " +
                data[0].ambulanceTrackingsDetail.speed +
                " Km/h";
              break;
          }
          fcmPush.sendPush(
            element.device_token,
            "AOC_V2",
            push_data,
            push_title,
            push_body,
            sound_file,
            push_title_lan
          );
        }
      });
    }

    if (
      data[0].aocRequestsDetail.nursesDetail &&
      data[0].aocRequestsDetail.nursesDetail.length
    ) {
      data[0].aocRequestsDetail.nursesDetail.filter((element) => {
        switch (push_title_lan) {
          case "AMBULANCE_STATUS":
            var push_title =
              notification_lang[element.app_language]["PUSH_TITLE"][
                push_title_lan
              ];
            push_body =
              (sound_file == "ambulance_tracking_online.mp3"
                ? "Ambulance has online \n"
                : "Ambulance has offline \n") +
              data[0].aocRequestsDetail.request_type +
              ", " +
              data[0].name1 +
              "," +
              data[0].ambulance_box_code;
            push_data =
              sound_file == "ambulance_tracking_online.mp3"
                ? configure.statusColor.ONLINE
                : configure.statusColor.OFFLINE;
            break;

          case "AMBULACNE_NEAR_SCENE":
            var push_title =
              notification_lang[element.app_language]["PUSH_TITLE"][
                push_title_lan
              ];
            push_body =
              "Ambulance Arrival In 10 Minutes \n" +
              data[0].aocRequestsDetail.request_type +
              ", " +
              data[0].name1 +
              "," +
              data[0].ambulance_box_code +
              ", " +
              notification_lang[element.app_language]["SPEED"] +
              " " +
              data[0].ambulanceTrackingsDetail.speed +
              " Km/h";
            break;

          default:
            var push_title =
              notification_lang[element.app_language]["PUSH_TITLE"][
                push_title_lan
              ];
            var push_body =
              data[0].aocRequestsDetail.request_type +
              ", " +
              data[0].name1 +
              "\n" +
              +data[0].ambulance_box_code +
              ", " +
              notification_lang[element.app_language]["SPEED"] +
              " " +
              data[0].ambulanceTrackingsDetail.speed +
              " Km/h";
            break;
        }
        fcmPush.sendPush(
          element.device_token,
          "AOC_V2",
          push_data,
          push_title,
          push_body,
          sound_file,
          push_title_lan,
          data[0].ambulanceTrackingsDetail.speed_color_code
        );
        // }
      });
    }

    if (
      data[0].aocRequestsDetail.driversDetail &&
      data[0].aocRequestsDetail.driversDetail.length
    ) {
      data[0].aocRequestsDetail.driversDetail.filter((element) => {
        if (element.device_token && element.device_token !== "") {
          switch (push_title_lan) {
            case "AMBULANCE_STATUS":
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              push_body =
                (sound_file == "ambulance_tracking_online.mp3"
                  ? "Ambulance has online \n"
                  : "Ambulance has offline \n") +
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "," +
                data[0].ambulance_box_code;
              push_data =
                sound_file == "ambulance_tracking_online.mp3"
                  ? configure.statusColor.ONLINE
                  : configure.statusColor.OFFLINE;
              break;

            case "AMBULACNE_NEAR_SCENE":
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              push_body =
                "Ambulance Arrival In 10 Minutes \n" +
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "," +
                data[0].ambulance_box_code +
                ", " +
                notification_lang[element.app_language]["SPEED"] +
                " " +
                data[0].ambulanceTrackingsDetail.speed +
                " Km/h";
              break;

            default:
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              var push_body =
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "\n" +
                +data[0].ambulance_box_code +
                ", " +
                notification_lang[element.app_language]["SPEED"] +
                " " +
                data[0].ambulanceTrackingsDetail.speed +
                " Km/h";
              break;
          }
          fcmPush.sendPush(
            element.device_token,
            "AOC_V2",
            push_data,
            push_title,
            push_body,
            sound_file,
            push_title_lan,
            data[0].ambulanceTrackingsDetail.speed_color_code
          );
        }
      });
    }

    if (
      data[0].aocRequestsDetail.aocErStaffsDetail &&
      data[0].aocRequestsDetail.aocErStaffsDetail.length
    ) {
      data[0].aocRequestsDetail.aocErStaffsDetail.filter((element) => {
        if (element.device_token && element.device_token !== "") {
          switch (push_title_lan) {
            case "AMBULANCE_STATUS":
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              push_body =
                (sound_file == "ambulance_tracking_online.mp3"
                  ? "Ambulance has online \n"
                  : "Ambulance has offline \n") +
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "," +
                data[0].ambulance_box_code;
              push_data =
                sound_file == "ambulance_tracking_online.mp3"
                  ? configure.statusColor.ONLINE
                  : configure.statusColor.OFFLINE;
              break;

            case "AMBULACNE_NEAR_SCENE":
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              push_body =
                "Ambulance Arrival In 10 Minutes \n" +
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "," +
                data[0].ambulance_box_code +
                ", " +
                notification_lang[element.app_language]["SPEED"] +
                " " +
                data[0].ambulanceTrackingsDetail.speed +
                " Km/h";
              break;

            default:
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              var push_body =
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "\n" +
                +data[0].ambulance_box_code +
                ", " +
                notification_lang[element.app_language]["SPEED"] +
                " " +
                data[0].ambulanceTrackingsDetail.speed +
                " Km/h";
              break;
          }
          fcmPush.sendPush(
            element.device_token,
            "AOC_V2",
            push_data,
            push_title,
            push_body,
            sound_file,
            push_title_lan
          );
        }
      });
    }

    if (
      data[0].aocRequestsDetail.aocEmsStaffsDetail &&
      data[0].aocRequestsDetail.aocEmsStaffsDetail.length
    ) {
      data[0].aocRequestsDetail.aocEmsStaffsDetail.filter((element) => {
        if (element.device_token && element.device_token !== "") {
          switch (push_title_lan) {
            case "AMBULANCE_STATUS":
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              push_body =
                (sound_file == "ambulance_tracking_online.mp3"
                  ? "Ambulance has online \n"
                  : "Ambulance has offline \n") +
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "," +
                data[0].ambulance_box_code;
              push_data =
                sound_file == "ambulance_tracking_online.mp3"
                  ? configure.statusColor.ONLINE
                  : configure.statusColor.OFFLINE;
              break;

            case "AMBULACNE_NEAR_SCENE":
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              push_body =
                "Ambulance Arrival In 10 Minutes \n" +
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "," +
                data[0].ambulance_box_code +
                ", " +
                notification_lang[element.app_language]["SPEED"] +
                " " +
                data[0].ambulanceTrackingsDetail.speed +
                " Km/h";
              break;

            default:
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              var push_body =
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "\n" +
                +data[0].ambulance_box_code +
                ", " +
                notification_lang[element.app_language]["SPEED"] +
                " " +
                data[0].ambulanceTrackingsDetail.speed +
                " Km/h";
              break;
          }
          fcmPush.sendPush(
            element.device_token,
            "AOC_V2",
            push_data,
            push_title,
            push_body,
            sound_file,
            push_title_lan,
            data[0].ambulanceTrackingsDetail.speed_color_code
          );
        }
      });
    }

    getUserDetail(
      { _id: ObjectId(data[0].aocRequestsDetail.creater_id) },
      { _id: ObjectId(data[0].aocRequestsDetail.creater_type) },
      {},
      (user) => {
        if (
          user.user_data &&
          user.user_data.device_token &&
          user.designation_data["name1"] == "Alive Users"
        ) {
          var push_body =
            notification_lang[user.user_data.alive_app_language][
              notification_type
            ];
          if (data[0].is_assign) push_body = data[0].request_type + " ";

          switch (push_title_lan) {
            case "AMBULANCE_STATUS":
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              push_body =
                (sound_file == "ambulance_tracking_online.mp3"
                  ? "Ambulance has online \n"
                  : "Ambulance has offline \n") +
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "," +
                data[0].ambulance_box_code;
              push_data =
                sound_file == "ambulance_tracking_online.mp3"
                  ? configure.statusColor.ONLINE
                  : configure.statusColor.OFFLINE;
              break;

            case "AMBULACNE_NEAR_SCENE":
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              push_body =
                "Ambulance Arrival In 10 Minutes \n" +
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "," +
                data[0].ambulance_box_code +
                ", " +
                notification_lang[element.app_language]["SPEED"] +
                " " +
                data[0].ambulanceTrackingsDetail.speed +
                " Km/h";
              break;

            default:
              var push_title =
                notification_lang[user.user_data.alive_app_language][
                  "PUSH_TITLE"
                ][push_title_lan];
              var push_body =
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "\n" +
                +data[0].ambulance_box_code +
                ", " +
                notification_lang[user.user_data.alive_app_language]["SPEED"] +
                " " +
                data[0].ambulanceTrackingsDetail.speed +
                " Km/h";
              break;
          }

          fcmPush.sendPush(
            user.user_data.device_token,
            "ALIVE_V2",
            push_data,
            push_title,
            push_body,
            sound_file,
            push_title_lan,
            data[0].ambulanceTrackingsDetail.speed_color_code
          );
        }
        // else if (user.user_data && user.user_data.device_token && user.designation_data['name1'] == "Aoc Users") {
        //     if (data[0].is_assign) push_body = data[0].request_type + ' ';

        //         var notification_settings = {};
        //         var push_type = ''
        //             AocUsers.find({ hospital_ids: ObjectId(user.user_data.hospital_id) }).then(users => {
        //                 users.filter(element => {
        //                     if(element && element.device_token && Object.keys(element.device_token).length){
        //                     Object.keys(element.device_token).forEach((app_type) => {
        //                         switch (push_title_lan) {
        //                             case "AMBULANCE_STATUS":
        //                                 var push_title = notification_lang[element.aoc_app_language]['PUSH_TITLE'][push_title_lan];
        //                                 push_body = ((sound_file == "ambulance_tracking_online.mp3") ? 'Ambulance has online \n' : 'Ambulance has offline \n') + data[0].aocRequestsDetail.request_type + ', ' + data[0].name1 + ',' + data[0].ambulance_box_code;
        //                                 push_type = "ambulance_status_change"
        //                                 push_data = (sound_file == "ambulance_tracking_online.mp3") ? configure.statusColor.ONLINE : configure.statusColor.OFFLINE

        //                                 break;

        //                             case "AMBULACNE_NEAR_SCENE":
        //                                 var push_title = notification_lang[element.aoc_app_language]['PUSH_TITLE'][push_title_lan];
        //                                 push_body = 'Ambulance has online \n' + data[0].aocRequestsDetail.request_type + ', ' + data[0].name1 + ',' + data[0].ambulance_box_code;
        //                                 push_type = "arrival_at_scene";
        //                                 break;

        //                             default:
        //                                 var push_title = notification_lang[element.aoc_app_language]['PUSH_TITLE'][push_title_lan];
        //                                 push_body = data[0].aocRequestsDetail.request_type + ', ' + data[0].name1 + '\n' +
        //                                     + data[0].ambulance_box_code + ', ' + notification_lang[element.aoc_app_language]['SPEED'] + ' ' + data[0].ambulanceTrackingsDetail.speed + ' Km/h';
        //                                 push_type = "ambulance_speed";
        //                                 break;
        //                         }
        //                     notification_settings[app_type] = 1;
        //                     UserNotificationSettings.findOne({ user_id: ObjectId(element._id) }, notification_settings).then(settings_data => {
        //                         if (settings_data[app_type] && settings_data[app_type][push_type] && element.device_token ) {
        //                             console.log("Username----<" , element.first_name ,"lang------>",element.aoc_app_language);
        //                             // console.log(element.device_token[String(app_type)]);
        //                             fcmPush.sendPush(element.device_token[String(app_type)], "AOC_V2", push_data, push_title, push_body, sound_file, push_title_lan);
        //                         }
        //                     })
        //                 });
        //             }
        //             })
        //         })

        // }
      }
    );
  }

  if (data[0].aocUsersDetail && data[0].aocUsersDetail.length > 0) {
    data[0].aocUsersDetail.filter((aoc_user) => {
      switch (push_title_lan) {
        case "AMBULANCE_STATUS":
          var push_title =
            notification_lang[aoc_user.aoc_app_language]["PUSH_TITLE"][
              push_title_lan
            ];
          push_body =
            (sound_file == "ambulance_tracking_online.mp3"
              ? "Ambulance has online \n"
              : "Ambulance has offline \n") +
            data[0].aocRequestsDetail.request_type +
            ", " +
            data[0].name1 +
            "," +
            data[0].ambulance_box_code;
          push_data =
            sound_file == "ambulance_tracking_online.mp3"
              ? configure.statusColor.ONLINE
              : configure.statusColor.OFFLINE;
          push_type = "ambulance_status_change";
          break;

        case "AMBULACNE_NEAR_SCENE":
          var push_title =
            notification_lang[aoc_user.aoc_app_language]["PUSH_TITLE"][
              push_title_lan
            ];
          push_body =
            "Ambulance Arrival In 10 Minutes \n" +
            data[0].aocRequestsDetail.request_type +
            ", " +
            data[0].name1 +
            "," +
            data[0].ambulance_box_code +
            ", " +
            notification_lang[aoc_user.aoc_app_language]["SPEED"] +
            " " +
            data[0].ambulanceTrackingsDetail.speed +
            " Km/h";
          push_type = "arrival_at_scene";
          break;

        default:
          var push_title =
            notification_lang[aoc_user.aoc_app_language]["PUSH_TITLE"][
              push_title_lan
            ];
          var push_body =
            (data[0].aocRequestsDetail.request_type
              ? data[0].aocRequestsDetail.request_type + ", "
              : "") +
            data[0].name1 +
            "\n" +
            +data[0].ambulance_box_code +
            ", " +
            notification_lang[aoc_user.aoc_app_language]["SPEED"] +
            " " +
            data[0].ambulanceTrackingsDetail.speed +
            " Km/h";
          push_type = "ambulance_speed";
          break;
      }
      if (
        typeof aoc_user.device_token == "object" &&
        Object.keys(aoc_user.device_token).length
      ) {
        Object.keys(aoc_user.device_token).filter((app_type) => {
          var notification_settings = {};
          app_type = app_type.toLowerCase();
          notification_settings[app_type] = 1;

          // var push_title = notification_lang[aoc_user.aoc_app_language]['PUSH_TITLE']['OPERATION_STATUS_CHANGE'];
          // var push_body = notification_lang[aoc_user.aoc_app_language][notification_type];

          UserNotificationSettings.findOne(
            { user_id: ObjectId(aoc_user._id) },
            notification_settings
          ).then((settings_data) => {
            if (
              settings_data &&
              settings_data[app_type] &&
              settings_data[app_type][push_type] &&
              aoc_user.device_token[String(app_type)] !== undefined &&
              aoc_user.device_token[String(app_type)] !== "undefined"
            ) {
              var socket_data = {
                collapse_key: "AOC_V2",
                notification: {
                  title: push_title,
                  body: push_body,
                  color: push_data.speed_color_code,
                },
              };
              //socket.emit('NOTIFICATION_NOTIFY' + String(aoc_user._id), socket_data); // FOR USER PANEL NOTIFICATION_NOTIFY...
              fcmPush.sendPush(
                aoc_user.device_token[String(app_type)],
                "AOC_V2",
                push_data,
                push_title,
                push_body,
                sound_file,
                push_title_lan,
                data[0].ambulanceTrackingsDetail.speed_color_code
              );
              // fcmPush.sendPush(aoc_user.device_token[String(app_type)], "AOC_V2", push_data, push_title, push_body);
            }
          });
        });
      }
    });
  }
};

exports.postMonitorStatusNotification = (
  aoc_request_id,
  monitor_id,
  notification_type,
  push_title_lan,
  sound_file
) => {
  let monitorCondition = [
    {
      $match: {
        $and: [{ _id: ObjectId(monitor_id) }],
      },
    },
  ];
  if (aoc_request_id) {
    monitorCondition.push(
      {
        $lookup: {
          from: "aoc_requests",
          let: {
            monitor_id: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$monitor_id", "$$monitor_id"],
                    },
                    {
                      $ne: ["$request_status", "COMPLETED"],
                    },
                    {
                      $ne: ["$request_status", "CANCELED"],
                    },
                  ],
                },
              },
            },
          ],
          as: "aocRequestsDetail",
        },
      },
      {
        $unwind: {
          path: "$aocRequestsDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "aocRequestsDetail.doctor_ids",
          foreignField: "_id",
          as: "aocRequestsDetail.doctorsDetail",
        },
      },
      {
        $lookup: {
          from: "nurses",
          localField: "aocRequestsDetail.nurse_ids",
          foreignField: "_id",
          as: "aocRequestsDetail.nursesDetail",
        },
      },
      {
        $lookup: {
          from: "drivers",
          localField: "aocRequestsDetail.driver_ids",
          foreignField: "_id",
          as: "aocRequestsDetail.driversDetail",
        },
      },
      {
        $lookup: {
          from: "aoc_er_staffs",
          localField: "aocRequestsDetail.er_ids",
          foreignField: "_id",
          as: "aocRequestsDetail.aocErStaffsDetail",
        },
      },

      {
        $lookup: {
          from: "aoc_ems_staffs",
          localField: "aocRequestsDetail.ems_ids",
          foreignField: "_id",
          as: "aocRequestsDetail.aocEmsStaffsDetail",
        },
      },
      {
        $lookup: {
          from: "ambulances",
          localField: "aocRequestsDetail.ambulance_id",
          foreignField: "_id",
          as: "aocRequestsDetail.ambulancesDetail",
        },
      },
      {
        $unwind: {
          path: "$aocRequestsDetail.ambulancesDetail",
          preserveNullAndEmptyArrays: true,
        },
      }
    );
  }
  monitorCondition.push({
    $project: {
      _id: 1,
      name: 1,
      hospital_id: 1,
      is_assign: {
        $cond: [{ $ifNull: ["$aocRequestsDetail._id", false] }, 1, 0],
      },
      aocRequestsDetail: {
        _id: 1,
        request_type: "$aocRequestsDetail.request_type",
        request_code: 1,
        creater_id: 1,
        creater_type: 1,
        ambulancesDetail: 1,
        doctorsDetail: {
          _id: 1,
          device_token: {
            $ifNull: ["$aocRequestsDetail.doctorsDetail.device_token", ""],
          },
          app_language: 1,
        },
        nursesDetail: {
          _id: 1,
          device_token: {
            $ifNull: ["$aocRequestsDetail.nursesDetail.device_token", ""],
          },
          app_language: 1,
        },
        driversDetail: {
          _id: 1,
          device_token: {
            $ifNull: ["$aocRequestsDetail.driversDetail.device_token", ""],
          },
          app_language: 1,
        },
        aocErStaffsDetail: {
          _id: 1,
          device_token: {
            $ifNull: ["$aocRequestsDetail.aocErStaffsDetail.device_token", ""],
          },
          app_language: 1,
        },
        aocEmsStaffsDetail: {
          _id: 1,
          device_token: {
            $ifNull: ["$aocRequestsDetail.aocEmsStaffsDetail.device_token", ""],
          },
          app_language: 1,
        },
      },
    },
  });
  PatientMonitors.aggregate(monitorCondition)
    .then((data) => {
      var push_data = {
        ambulance_id: data[0].aocRequestsDetail.ambulancesDetail
          ? data[0].aocRequestsDetail.ambulancesDetail._id
          : "",
        speed_color_code:
          push_title_lan == "PATIENT_MONITOR_STATUS_ONLINE"
            ? configure.statusColor.ONLINE
            : configure.statusColor.OFFLINE,
      };
      var statusColor = "";

      if (data[0].is_assign) {
        if (
          data[0].aocRequestsDetail.doctorsDetail &&
          data[0].aocRequestsDetail.doctorsDetail.length
        ) {
          data[0].aocRequestsDetail.doctorsDetail.filter((element) => {
            if (element.device_token && element.device_token !== "") {
              switch (push_title_lan) {
                case "PATIENT_MONITOR_STATUS_ONLINE":
                  var push_title =
                    notification_lang[element.app_language]["PUSH_TITLE"][
                      push_title_lan
                    ];
                  push_body =
                    "Monitor has online \n" +
                    data[0].aocRequestsDetail.request_type +
                    ", " +
                    data[0].aocRequestsDetail.ambulancesDetail.name1 +
                    "," +
                    data[0].aocRequestsDetail.ambulancesDetail
                      .ambulance_box_code;
                  statusColor = configure.statusColor.ONLINE;
                  break;

                case "PATIENT_MONITOR_STATUS_OFFLINE":
                  var push_title =
                    notification_lang[element.app_language]["PUSH_TITLE"][
                      push_title_lan
                    ];
                  push_body =
                    "Monitor has offline \n" +
                    data[0].aocRequestsDetail.request_type +
                    ", " +
                    data[0].aocRequestsDetail.ambulancesDetail.name1 +
                    "," +
                    data[0].aocRequestsDetail.ambulancesDetail
                      .ambulance_box_code;
                  statusColor = configure.statusColor.OFFLINE;
                  break;

                default:
                  break;
              }
              fcmPush.sendPush(
                element.device_token,
                "AOC_V2",
                push_data,
                push_title,
                push_body,
                sound_file,
                push_title_lan,
                push_data.speed_color_code
              );
            }
          });
        }

        if (
          data[0].aocRequestsDetail.nursesDetail &&
          data[0].aocRequestsDetail.nursesDetail.length
        ) {
          data[0].aocRequestsDetail.nursesDetail.filter((element) => {
            switch (push_title_lan) {
              case "PATIENT_MONITOR_STATUS_ONLINE":
                var push_title =
                  notification_lang[element.app_language]["PUSH_TITLE"][
                    push_title_lan
                  ];
                push_body =
                  "Monitor has online \n" +
                  data[0].aocRequestsDetail.request_type +
                  ", " +
                  data[0].aocRequestsDetail.ambulancesDetail.name1 +
                  "," +
                  data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
                statusColor = configure.statusColor.ONLINE;
                break;

              case "PATIENT_MONITOR_STATUS_OFFLINE":
                var push_title =
                  notification_lang[element.app_language]["PUSH_TITLE"][
                    push_title_lan
                  ];
                push_body =
                  "Monitor has offline \n" +
                  data[0].aocRequestsDetail.request_type +
                  ", " +
                  data[0].aocRequestsDetail.ambulancesDetail.name1 +
                  "," +
                  data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
                statusColor = configure.statusColor.OFFLINE;
                break;

              default:
                break;
            }
            fcmPush.sendPush(
              element.device_token,
              "AOC_V2",
              push_data,
              push_title,
              push_body,
              sound_file,
              push_title_lan,
              statusColor
            );
            // }
          });
        }

        if (
          data[0].aocRequestsDetail.driversDetail &&
          data[0].aocRequestsDetail.driversDetail.length
        ) {
          data[0].aocRequestsDetail.driversDetail.filter((element) => {
            if (element.device_token && element.device_token !== "") {
              switch (push_title_lan) {
                case "PATIENT_MONITOR_STATUS_ONLINE":
                  var push_title =
                    notification_lang[element.app_language]["PUSH_TITLE"][
                      push_title_lan
                    ];
                  push_body =
                    "Monitor has online \n" +
                    data[0].aocRequestsDetail.request_type +
                    ", " +
                    data[0].aocRequestsDetail.ambulancesDetail.name1 +
                    "," +
                    data[0].aocRequestsDetail.ambulancesDetail
                      .ambulance_box_code;
                  statusColor = configure.statusColor.ONLINE;
                  break;

                case "PATIENT_MONITOR_STATUS_OFFLINE":
                  var push_title =
                    notification_lang[element.app_language]["PUSH_TITLE"][
                      push_title_lan
                    ];
                  push_body =
                    "Monitor has offline \n" +
                    data[0].aocRequestsDetail.request_type +
                    ", " +
                    data[0].aocRequestsDetail.ambulancesDetail.name1 +
                    "," +
                    data[0].aocRequestsDetail.ambulancesDetail
                      .ambulance_box_code;
                  statusColor = configure.statusColor.OFFLINE;
                  break;

                default:
                  break;
              }
              fcmPush.sendPush(
                element.device_token,
                "AOC_V2",
                push_data,
                push_title,
                push_body,
                sound_file,
                push_title_lan,
                statusColor
              );
            }
          });
        }

        if (
          data[0].aocRequestsDetail.aocErStaffsDetail &&
          data[0].aocRequestsDetail.aocErStaffsDetail.length
        ) {
          data[0].aocRequestsDetail.aocErStaffsDetail.filter((element) => {
            if (element.device_token && element.device_token !== "") {
              switch (push_title_lan) {
                case "PATIENT_MONITOR_STATUS_ONLINE":
                  var push_title =
                    notification_lang[element.app_language]["PUSH_TITLE"][
                      push_title_lan
                    ];
                  push_body =
                    "Monitor has online \n" +
                    data[0].aocRequestsDetail.request_type +
                    ", " +
                    data[0].aocRequestsDetail.ambulancesDetail.name1 +
                    "," +
                    data[0].aocRequestsDetail.ambulancesDetail
                      .ambulance_box_code;
                  statusColor = configure.statusColor.ONLINE;
                  break;

                case "PATIENT_MONITOR_STATUS_OFFLINE":
                  var push_title =
                    notification_lang[element.app_language]["PUSH_TITLE"][
                      push_title_lan
                    ];
                  push_body =
                    "Monitor has offline \n" +
                    data[0].aocRequestsDetail.request_type +
                    ", " +
                    data[0].aocRequestsDetail.ambulancesDetail.name1 +
                    "," +
                    data[0].aocRequestsDetail.ambulancesDetail
                      .ambulance_box_code;
                  statusColor = configure.statusColor.OFFLINE;
                  break;

                default:
                  break;
              }
              fcmPush.sendPush(
                element.device_token,
                "AOC_V2",
                push_data,
                push_title,
                push_body,
                sound_file,
                push_title_lan,
                statusColor
              );
            }
          });
        }

        if (
          data[0].aocRequestsDetail.aocEmsStaffsDetail &&
          data[0].aocRequestsDetail.aocEmsStaffsDetail.length
        ) {
          data[0].aocRequestsDetail.aocEmsStaffsDetail.filter((element) => {
            if (element.device_token && element.device_token !== "") {
              switch (push_title_lan) {
                case "PATIENT_MONITOR_STATUS_ONLINE":
                  var push_title =
                    notification_lang[element.app_language]["PUSH_TITLE"][
                      push_title_lan
                    ];
                  push_body =
                    "Monitor has online \n" +
                    data[0].aocRequestsDetail.request_type +
                    ", " +
                    data[0].aocRequestsDetail.ambulancesDetail.name1 +
                    "," +
                    data[0].aocRequestsDetail.ambulancesDetail
                      .ambulance_box_code;
                  statusColor = configure.statusColor.ONLINE;
                  break;

                case "PATIENT_MONITOR_STATUS_OFFLINE":
                  var push_title =
                    notification_lang[element.app_language]["PUSH_TITLE"][
                      push_title_lan
                    ];
                  push_body =
                    "Monitor has offline \n" +
                    data[0].aocRequestsDetail.request_type +
                    ", " +
                    data[0].aocRequestsDetail.ambulancesDetail.name1 +
                    "," +
                    data[0].aocRequestsDetail.ambulancesDetail
                      .ambulance_box_code;
                  statusColor = configure.statusColor.OFFLINE;
                  break;

                default:
                  break;
              }
              fcmPush.sendPush(
                element.device_token,
                "AOC_V2",
                push_data,
                push_title,
                push_body,
                sound_file,
                push_title_lan,
                statusColor
              );
            }
          });
        }
      } else {
        let monitorPushCondition = [
          {
            $match: {
              hospital_ids: ObjectId(data[0].hospital_id),
            },
          },
          {
            $lookup: {
              from: "user_notification_settings",
              localField: "_id",
              foreignField: "user_id",
              as: "notificationDetail",
            },
          },
          {
            $unwind: {
              path: "$notificationDetail",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              device_token: {
                aoc: 1,
              },
              notificationDetail: {
                aoc: {
                  patient_monitor_status_change: 1,
                },
              },
            },
          },
        ];
        AocUsers.aggregate(monitorPushCondition).then((user_data) => {
          user_data.filter((element) => {
            if (
              element &&
              element.device_token &&
              element.notificationDetail.aoc.patient_monitor_status_change &&
              element.device_token["aoc"]
            ) {
              let push_title = push_title_lan;
              let push_body = "";
              if (push_title_lan == "PATIENT_MONITOR_STATUS_ONLINE") {
                statusColor = configure.statusColor.ONLINE;
                push_body = "monitor has Online \n " + data[0].name;
              } else {
                statusColor = configure.statusColor.OFFLINE;
                push_body = "monitor has Offline \n " + data[0].name;
              }

              fcmPush.sendPush(
                element.device_token["aoc"],
                "AOC_V2",
                push_data,
                push_title,
                push_body,
                sound_file,
                push_title_lan,
                statusColor
              );
            }
          });
        });
      }

      getUserDetail(
        { _id: ObjectId(data[0].aocRequestsDetail.creater_id) },
        { _id: ObjectId(data[0].aocRequestsDetail.creater_type) },
        {},
        (user) => {
          if (
            user.user_data &&
            user.user_data.device_token &&
            user.designation_data["name1"] == "Alive Users"
          ) {
            var push_body =
              notification_lang[user.user_data.alive_app_language][
                notification_type
              ];
            if (data[0].is_assign) push_body = data[0].request_type + " ";

            switch (push_title_lan) {
              case "PATIENT_MONITOR_STATUS_ONLINE":
                var push_title =
                  notification_lang[element.app_language]["PUSH_TITLE"][
                    push_title_lan
                  ];
                push_body =
                  "Monitor has online \n" +
                  data[0].aocRequestsDetail.request_type +
                  ", " +
                  data[0].name1 +
                  "," +
                  data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
                statusColor = configure.statusColor.ONLINE;
                break;

              case "PATIENT_MONITOR_STATUS_OFFLINE":
                var push_title =
                  notification_lang[element.app_language]["PUSH_TITLE"][
                    push_title_lan
                  ];
                push_body =
                  "Monitor has offline \n" +
                  data[0].aocRequestsDetail.request_type +
                  ", " +
                  data[0].name1 +
                  "," +
                  data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
                statusColor = configure.statusColor.OFFLINE;
                break;

              default:
                break;
            }

            fcmPush.sendPush(
              user.user_data.device_token,
              "ALIVE_V2",
              push_data,
              push_title,
              push_body,
              sound_file,
              push_title_lan,
              statusColor
            );
          } else if (
            user.user_data &&
            user.user_data.device_token &&
            user.designation_data["name1"] == "Aoc Users"
          ) {
            if (data[0].is_assign) push_body = data[0].request_type + " ";

            if (
              user.user_data &&
              user.user_data.device_token &&
              Object.keys(user.user_data.device_token).length
            ) {
              var notification_settings = {};
              var push_type = "";
              Object.keys(user.user_data.device_token).forEach((app_type) => {
                switch (push_title_lan) {
                  case "PATIENT_MONITOR_STATUS_ONLINE":
                    var push_title =
                      notification_lang[element.app_language]["PUSH_TITLE"][
                        push_title_lan
                      ];
                    push_body =
                      "Monitor has online \n" +
                      data[0].aocRequestsDetail.request_type +
                      ", " +
                      data[0].name1 +
                      "," +
                      data[0].aocRequestsDetail.ambulancesDetail
                        .ambulance_box_code;
                    break;

                  case "PATIENT_MONITOR_STATUS_OFFLINE":
                    var push_title =
                      notification_lang[element.app_language]["PUSH_TITLE"][
                        push_title_lan
                      ];
                    push_body =
                      "Monitor has offline \n" +
                      data[0].aocRequestsDetail.request_type +
                      ", " +
                      data[0].name1 +
                      "," +
                      data[0].aocRequestsDetail.ambulancesDetail
                        .ambulance_box_code;
                    break;

                  default:
                    break;
                }

                notification_settings[app_type] = 1;
                AocUsers.find({
                  hospital_ids: ObjectId(user.user_data.hospital_id),
                }).then((users) => {
                  users.filter((element) => {
                    // console.log(element.first_name + " "+ element.last_name) ;
                    UserNotificationSettings.findOne(
                      { user_id: ObjectId(element._id) },
                      notification_settings
                    ).then((settings_data) => {
                      if (
                        settings_data &&
                        settings_data[app_type] &&
                        settings_data[app_type].push_type
                      ) {
                        var socket_data = {
                          collapse_key: "AOC_V2",
                          notification: {
                            title: push_title,
                            body: push_body,
                            color: push_data.speed_color_code,
                          },
                        };
                        socket.emit(
                          "NOTIFICATION_NOTIFY" + String(element._id),
                          socket_data
                        ); // FOR USER PANEL NOTIFICATION_NOTIFY...
                        fcmPush.sendPush(
                          element.device_token[String(app_type)],
                          "AOC_V2",
                          push_data,
                          push_title,
                          push_body,
                          sound_file,
                          push_title_lan,
                          push_data.speed_color_code
                        );
                      }
                    });
                  });
                });
                // UserNotificationSettings.findOne({ user_id: ObjectId(user.user_data._id) }, notification_settings).then(settings_data => {
                //     if (settings_data[app_type] && settings_data[app_type].push_type) {
                //         fcmPush.sendPush(user.user_data.device_token[String(app_type)], "AOC_V2", push_data, push_title, push_body,sound_file,push_title_lan,statusColor);
                //     }
                // })
              });
            }
          }
        }
      );
    })
    .catch((err) => console.log(err));
};

exports.postGlassStatusNotification = (
  aoc_request_id,
  glass_id,
  notification_type,
  push_title_lan,
  sound_file
) => {
  var statusColor = "";
  var notification_type = notification_type;
  let glassCondition = [
    {
      $match: {
        $and: [{ _id: ObjectId(glass_id) }],
      },
    },
  ];
  if (aoc_request_id) {
    glassCondition.push(
      {
        $lookup: {
          from: "aoc_requests",
          let: {
            glass_id: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$glass_id", "$$glass_id"],
                    },
                    {
                      $ne: ["$request_status", "COMPLETED"],
                    },
                    {
                      $ne: ["$request_status", "CANCELED"],
                    },
                  ],
                },
              },
            },
          ],
          as: "aocRequestsDetail",
        },
      },
      {
        $unwind: {
          path: "$aocRequestsDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "aocRequestsDetail.doctor_ids",
          foreignField: "_id",
          as: "aocRequestsDetail.doctorsDetail",
        },
      },
      {
        $lookup: {
          from: "nurses",
          localField: "aocRequestsDetail.nurse_ids",
          foreignField: "_id",
          as: "aocRequestsDetail.nursesDetail",
        },
      },
      {
        $lookup: {
          from: "drivers",
          localField: "aocRequestsDetail.driver_ids",
          foreignField: "_id",
          as: "aocRequestsDetail.driversDetail",
        },
      },
      {
        $lookup: {
          from: "aoc_er_staffs",
          localField: "aocRequestsDetail.er_ids",
          foreignField: "_id",
          as: "aocRequestsDetail.aocErStaffsDetail",
        },
      },

      {
        $lookup: {
          from: "aoc_ems_staffs",
          localField: "aocRequestsDetail.ems_ids",
          foreignField: "_id",
          as: "aocRequestsDetail.aocEmsStaffsDetail",
        },
      },
      {
        $lookup: {
          from: "ambulances",
          localField: "aocRequestsDetail.ambulance_id",
          foreignField: "_id",
          as: "aocRequestsDetail.ambulancesDetail",
        },
      },
      {
        $unwind: {
          path: "$aocRequestsDetail.ambulancesDetail",
          preserveNullAndEmptyArrays: true,
        },
      }
    );
  }
  glassCondition.push({
    $project: {
      _id: 1,
      name: 1,
      hospital_id: 1,
      is_assign: {
        $cond: [{ $ifNull: ["$aocRequestsDetail._id", false] }, 1, 0],
      },
      aocRequestsDetail: {
        _id: 1,
        request_type: "$aocRequestsDetail.request_type",
        request_code: 1,
        creater_id: 1,
        creater_type: 1,
        ambulancesDetail: {
          name1: 1,
          name2: 1,
          ambulance_phone: 1,
          number: 1,
          ambulance_box_code: 1,
        },
        doctorsDetail: {
          _id: 1,
          device_token: {
            $ifNull: ["$aocRequestsDetail.doctorsDetail.device_token", ""],
          },
          app_language: 1,
        },
        nursesDetail: {
          _id: 1,
          device_token: {
            $ifNull: ["$aocRequestsDetail.nursesDetail.device_token", ""],
          },
          app_language: 1,
        },
        driversDetail: {
          _id: 1,
          device_token: {
            $ifNull: ["$aocRequestsDetail.driversDetail.device_token", ""],
          },
          app_language: 1,
        },
        aocErStaffsDetail: {
          _id: 1,
          device_token: {
            $ifNull: ["$aocRequestsDetail.aocErStaffsDetail.device_token", ""],
          },
          app_language: 1,
        },
        aocEmsStaffsDetail: {
          _id: 1,
          device_token: {
            $ifNull: ["$aocRequestsDetail.aocEmsStaffsDetail.device_token", ""],
          },
          app_language: 1,
        },
      },
    },
  });
  GlassMacs.aggregate(glassCondition).then((data) => {
    var push_data = {
      ambulance_id: data[0].aocRequestsDetail.ambulancesDetail
        ? data[0].aocRequestsDetail.ambulancesDetail._id
        : "",
      speed_color_code:
        push_title_lan == "GLASS_MACS_STATUS_ONLINE"
          ? configure.statusColor.ONLINE
          : configure.statusColor.ONLINE,
    };

    if (data[0].is_assign) {
      if (
        data[0].aocRequestsDetail.doctorsDetail &&
        data[0].aocRequestsDetail.doctorsDetail.length
      ) {
        data[0].aocRequestsDetail.doctorsDetail.filter((element) => {
          if (element.device_token && element.device_token !== "") {
            switch (push_title_lan) {
              case "GLASS_MACS_STATUS_ONLINE":
                var push_title =
                  notification_lang[element.app_language]["PUSH_TITLE"][
                    push_title_lan
                  ];
                push_body =
                  "Glass has online \n" +
                  data[0].aocRequestsDetail.request_type +
                  ", " +
                  data[0].aocRequestsDetail.ambulancesDetail.name1 +
                  "," +
                  data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
                notification_type = push_title_lan;
                statusColor = configure.statusColor.ONLINE;
                break;

              case "GLASS_MACS_STATUS_OFFLINE":
                var push_title =
                  notification_lang[element.app_language]["PUSH_TITLE"][
                    push_title_lan
                  ];
                push_body =
                  "Glass has offline \n" +
                  data[0].aocRequestsDetail.request_type +
                  ", " +
                  data[0].aocRequestsDetail.ambulancesDetail.name1 +
                  "," +
                  data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
                statusColor = configure.statusColor.OFFLINE;
                break;

              default:
                break;
            }
            fcmPush.sendPush(
              element.device_token,
              "AOC_V2",
              push_data,
              push_title,
              push_body,
              sound_file,
              push_title_lan,
              statusColor
            );
          }
        });
      }

      if (
        data[0].aocRequestsDetail.nursesDetail &&
        data[0].aocRequestsDetail.nursesDetail.length
      ) {
        data[0].aocRequestsDetail.nursesDetail.filter((element) => {
          switch (push_title_lan) {
            case "GLASS_MACS_STATUS_ONLINE":
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              push_body =
                "Glass has online \n" +
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].aocRequestsDetail.ambulancesDetail.name1 +
                "," +
                data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
              statusColor = configure.statusColor.ONLINE;
              break;

            case "GLASS_MACS_STATUS_OFFLINE":
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              push_body =
                "Glass has offline \n" +
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].aocRequestsDetail.ambulancesDetail.name1 +
                "," +
                data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
              statusColor = configure.statusColor.OFFLINE;
              break;

            default:
              break;
          }
          fcmPush.sendPush(
            element.device_token,
            "AOC_V2",
            push_data,
            push_title,
            push_body,
            sound_file,
            push_title_lan,
            statusColor
          );
          // }
        });
      }

      if (
        data[0].aocRequestsDetail.driversDetail &&
        data[0].aocRequestsDetail.driversDetail.length
      ) {
        data[0].aocRequestsDetail.driversDetail.filter((element) => {
          if (element.device_token && element.device_token !== "") {
            switch (push_title_lan) {
              case "GLASS_MACS_STATUS_ONLINE":
                var push_title =
                  notification_lang[element.app_language]["PUSH_TITLE"][
                    push_title_lan
                  ];
                push_body =
                  "Glass has online \n" +
                  data[0].aocRequestsDetail.request_type +
                  ", " +
                  data[0].aocRequestsDetail.ambulancesDetail.name1 +
                  "," +
                  data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
                statusColor = configure.statusColor.ONLINE;
                break;

              case "GLASS_MACS_STATUS_OFFLINE":
                var push_title =
                  notification_lang[element.app_language]["PUSH_TITLE"][
                    push_title_lan
                  ];
                push_body =
                  "Glass has offline \n" +
                  data[0].aocRequestsDetail.request_type +
                  ", " +
                  data[0].aocRequestsDetail.ambulancesDetail.name1 +
                  "," +
                  data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
                statusColor = configure.statusColor.OFFLINE;
                break;

              default:
                break;
            }
            fcmPush.sendPush(
              element.device_token,
              "AOC_V2",
              push_data,
              push_title,
              push_body,
              sound_file,
              push_title_lan,
              statusColor
            );
          }
        });
      }

      if (
        data[0].aocRequestsDetail.aocErStaffsDetail &&
        data[0].aocRequestsDetail.aocErStaffsDetail.length
      ) {
        data[0].aocRequestsDetail.aocErStaffsDetail.filter((element) => {
          if (element.device_token && element.device_token !== "") {
            switch (push_title_lan) {
              case "GLASS_MACS_STATUS_ONLINE":
                var push_title =
                  notification_lang[element.app_language]["PUSH_TITLE"][
                    push_title_lan
                  ];
                push_body =
                  "Glass has online \n" +
                  data[0].aocRequestsDetail.request_type +
                  ", " +
                  data[0].aocRequestsDetail.ambulancesDetail.name1 +
                  "," +
                  data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
                statusColor = configure.statusColor.ONLINE;
                break;

              case "GLASS_MACS_STATUS_OFFLINE":
                var push_title =
                  notification_lang[element.app_language]["PUSH_TITLE"][
                    push_title_lan
                  ];
                push_body =
                  "Glass has offline \n" +
                  data[0].aocRequestsDetail.request_type +
                  ", " +
                  data[0].aocRequestsDetail.ambulancesDetail.name1 +
                  "," +
                  data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
                statusColor = configure.statusColor.OFFLINE;
                break;

              default:
                break;
            }
            fcmPush.sendPush(
              element.device_token,
              "AOC_V2",
              push_data,
              push_title,
              push_body,
              sound_file,
              push_title_lan,
              statusColor
            );
          }
        });
      }

      if (
        data[0].aocRequestsDetail.aocEmsStaffsDetail &&
        data[0].aocRequestsDetail.aocEmsStaffsDetail.length
      ) {
        data[0].aocRequestsDetail.aocEmsStaffsDetail.filter((element) => {
          if (element.device_token && element.device_token !== "") {
            switch (push_title_lan) {
              case "GLASS_MACS_STATUS_ONLINE":
                var push_title =
                  notification_lang[element.app_language]["PUSH_TITLE"][
                    push_title_lan
                  ];
                push_body =
                  "Glass has online \n" +
                  data[0].aocRequestsDetail.request_type +
                  ", " +
                  data[0].aocRequestsDetail.ambulancesDetail.name1 +
                  "," +
                  data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
                statusColor = configure.statusColor.ONLINE;
                break;

              case "GLASS_MACS_STATUS_OFFLINE":
                var push_title =
                  notification_lang[element.app_language]["PUSH_TITLE"][
                    push_title_lan
                  ];
                push_body =
                  "Glass has offline \n" +
                  data[0].aocRequestsDetail.request_type +
                  ", " +
                  data[0].aocRequestsDetail.ambulancesDetail.name1 +
                  "," +
                  data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
                statusColor = configure.statusColor.OFFLINE;
                break;

              default:
                break;
            }
            fcmPush.sendPush(
              element.device_token,
              "AOC_V2",
              push_data,
              push_title,
              push_body,
              sound_file,
              push_title_lan,
              statusColor
            );
          }
        });
      }
    } else {
      let glassPushCondition = [
        {
          $match: {
            hospital_ids: ObjectId(data[0].hospital_id),
          },
        },
        {
          $lookup: {
            from: "user_notification_settings",
            localField: "_id",
            foreignField: "user_id",
            as: "notificationDetail",
          },
        },
        {
          $unwind: {
            path: "$notificationDetail",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            device_token: {
              aoc: 1,
            },
            notificationDetail: {
              aoc: {
                glass_mac_status_change: 1,
              },
            },
          },
        },
      ];
      AocUsers.aggregate(glassPushCondition).then((user_data) => {
        user_data.filter((element) => {
          if (
            element &&
            element.device_token &&
            element.notificationDetail.aoc.glass_mac_status_change &&
            element.device_token["aoc"]
          ) {
            let push_title = push_title_lan;
            if (push_title_lan == "GLASS_MACS_STATUS_ONLINE") {
              push_body = "Glass has Online \n " + data[0].name;
            } else {
              push_body = "Glass has Offline \n " + data[0].name;
            }
            var socket_data = {
              collapse_key: "AOC_V2",
              notification: {
                title: push_title,
                body: push_body,
                color: push_data.speed_color_code,
              },
            };
            ////socket.emit('NOTIFICATION_NOTIFY' + String(element._id), socket_data); // FOR USER PANEL NOTIFICATION_NOTIFY...
            fcmPush.sendPush(
              element.device_token["aoc"],
              "AOC_V2",
              push_data,
              push_title,
              push_body,
              sound_file,
              push_title_lan,
              push_data.speed_color_code
            );
          }
        });
      });
    }

    getUserDetail(
      { _id: ObjectId(data[0].aocRequestsDetail.creater_id) },
      { _id: ObjectId(data[0].aocRequestsDetail.creater_type) },
      {},
      (user) => {
        if (
          user.user_data &&
          user.user_data.device_token &&
          user.designation_data["name1"] == "Alive Users"
        ) {
          var push_body =
            notification_lang[user.user_data.alive_app_language][
              notification_type
            ];
          if (data[0].is_assign) push_body = data[0].request_type + " ";

          switch (push_title_lan) {
            case "GLASS_MACS_STATUS_ONLINE":
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              push_body =
                "Glass has online \n" +
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "," +
                data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
              statusColor = configure.statusColor.ONLINE;
              break;

            case "GLASS_MACS_STATUS_OFFLINE":
              var push_title =
                notification_lang[element.app_language]["PUSH_TITLE"][
                  push_title_lan
                ];
              push_body =
                "Glass has offline \n" +
                data[0].aocRequestsDetail.request_type +
                ", " +
                data[0].name1 +
                "," +
                data[0].aocRequestsDetail.ambulancesDetail.ambulance_box_code;
              statusColor = configure.statusColor.OFFLINE;
              break;

            default:
              break;
          }

          fcmPush.sendPush(
            user.user_data.device_token,
            "ALIVE_V2",
            push_data,
            push_title,
            push_body,
            sound_file,
            push_title_lan,
            statusColor
          );
        } else if (
          user.user_data &&
          user.user_data.device_token &&
          user.designation_data["name1"] == "Aoc Users"
        ) {
          if (data[0].is_assign) push_body = data[0].request_type + " ";

          if (
            user.user_data &&
            user.user_data.device_token &&
            Object.keys(user.user_data.device_token).length
          ) {
            var notification_settings = {};
            Object.keys(user.user_data.device_token).forEach((app_type) => {
              switch (push_title_lan) {
                case "GLASS_MACS_STATUS_ONLINE":
                  var push_title =
                    notification_lang[user.user_data.aoc_app_language][
                      "PUSH_TITLE"
                    ][push_title_lan];
                  push_body =
                    "Glass has online \n" + data[0].aocRequestsDetail
                      ? data[0].aocRequestsDetail.request_type
                      : "" +
                        ", " +
                        data[0].name +
                        "," +
                        data[0].aocRequestsDetail.ambulancesDetail
                          .ambulance_box_code;
                  statusColor = configure.statusColor.ONLINE;
                  break;

                case "GLASS_MACS_STATUS_OFFLINE":
                  var push_title =
                    notification_lang[user.user_data.aoc_app_language][
                      "PUSH_TITLE"
                    ][push_title_lan];
                  push_body =
                    "Glass has offline \n" +
                    data[0].aocRequestsDetail.request_type +
                    ", " +
                    data[0].name +
                    "," +
                    data[0].aocRequestsDetail.ambulancesDetail
                      .ambulance_box_code;
                  statusColor = configure.statusColor.OFFLINE;
                  break;

                default:
                  break;
              }

              notification_settings[app_type] = 1;
              AocUsers.find({
                hospital_ids: ObjectId(user.user_data.hospital_id),
              }).then((users) => {
                users.filter((element) => {
                  // console.log(element.first_name + " " + element.last_name);
                  UserNotificationSettings.findOne(
                    { user_id: ObjectId(element._id) },
                    notification_settings
                  ).then((settings_data) => {
                    if (
                      settings_data &&
                      settings_data[app_type] &&
                      settings_data[app_type].push_type
                    ) {
                      fcmPush.sendPush(
                        element.device_token[String(app_type)],
                        "AOC_V2",
                        push_data,
                        push_title,
                        push_body,
                        sound_file,
                        push_title_lan,
                        statusColor
                      );
                    }
                  });
                });
              });
              // UserNotificationSettings.findOne({ user_id: ObjectId(user.user_data._id) }, notification_settings).then(settings_data => {
              //     if (settings_data[app_type] && settings_data[app_type].push_type) {
              //         fcmPush.sendPush(user.user_data.device_token[String(app_type)], "AOC_V2", push_data, push_title, push_body,sound_file,push_title_lan,statusColor);
              //     }
              // })
            });
          }
        }
      }
    );
  });
};

exports.createReqNotification = (aoc_request_id, aoc_zone_id) => {
  AocUsers.find({
    isactive: 1,
    isdeleted: false,
    zone_ids: { $in: [aoc_zone_id] },
  }).then((user_data) => {
    if (user_data && user_data.length) {
      user_data.filter((element) => {
        if (element && element.device_token) {
          if (Object.keys(element.device_token).length) {
            Object.keys(element.device_token).forEach((key) => {
              fcmPush.sendPush(
                element.device_token[key],
                "AOC_V2",
                { aoc_request_id: aoc_request_id },
                notification_lang[element.aoc_app_language]["PUSH_TITLE"]
                  .ALIVE_REQ_CREATE,
                "",
                "",
                notification_lang["ENG"]["PUSH_TITLE"].ALIVE_REQ_CREATE
              );
            });
          }
        }
      });
    }
  });
};
