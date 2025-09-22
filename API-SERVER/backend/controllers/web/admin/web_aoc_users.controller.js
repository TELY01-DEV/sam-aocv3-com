const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const fcmPush = require("../../../config/fcm-push");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const AocUsers = db.aoc_users;
const AmbulanceTypes = db.ambulance_types;
const Hospitals = db.hospitals;
const AmbulanceEquipments = db.ambulance_equipments;
const First_Responders = db.first_responders;
const Devices = db.devices;
const Drivers = db.drivers;
const Doctors = db.doctors;
const Nurses = db.nurses;
const GlassMacs = db.glass_macs;
const AocErStaffs = db.aoc_er_staffs;
const AocEmsStaffs = db.aoc_ems_staffs;
const Provinces = db.provinces;
const Districts = db.districts;
const PatientMonitors = db.patient_monitors;
const MedicalEquipments = db.medical_equipments;
const SubDistricts = db.subdistricts;
const Ambulances = db.ambulances;
const Paramedics = db.paramedics;
const AocVolunteers = db.volunteers;
const AocZones = db.aoc_zones;
const Designations = db.designations;
const UserNotificationSettings = db.user_notification_settings;
const CommunicationDeviceTypes = db.communication_device_types;
const CommunicationDevices = db.communication_devices;
const IpServerCommunications = db.stream_servers;
const IpServerDevice = db.ip_server_devices;
const AmbulanceEquipmentCatalogy = db.ambulance_equipment_catalogies;

exports.getAocUsersList = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);

  var getAocUserListCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          {
            $or: [
              {
                first_name: {
                  $regex: String(req.body.searchValue),
                  $options: "i",
                },
              },
              {
                last_name: {
                  $regex: String(req.body.searchValue),
                  $options: "i",
                },
              },
              {
                email: { $regex: String(req.body.searchValue), $options: "i" },
              },
              {
                phone: { $regex: String(req.body.searchValue), $options: "i" },
              },
            ],
          },
        ],
      },
    },
    // {
    //     '$lookup': {
    //         'from': 'hospitals',
    //         'localField': 'hospital_id',
    //         'foreignField': '_id',
    //         'as': 'hospitalDetail'
    //     },
    // },
    // {
    //     '$unwind': {
    //         "path": "$hospitalDetail",
    //         // "preserveNullAndEmptyArrays": true
    //     }
    // },
    {
      $lookup: {
        from: "aoc_zones",
        localField: "zone_id",
        foreignField: "_id",
        as: "zoneDetail",
      },
    },
    {
      $unwind: {
        path: "$zoneDetail",
        // "preserveNullAndEmptyArrays": true
      },
    },
    {
      $project: {
        app_version: 1,
        birthdate: 1,
        createdAt: 1,
        device_type: 1,
        email: 1,
        first_name: 1,
        gender: 1,
        hospital_id: 1,
        hospital_ids: 1,
        is_online: 1,
        isactive: 1,
        isdeleted: 1,
        last_name: 1,
        location: 1,
        password: 1,
        phone: 1,
        profile_picture: 1,
        updatedAt: 1,
        zone_id: 1,
        zone_ids: 1,
        hospital_fullname: "$hospitalDetail.full_name",
        zone_name: "$zoneDetail.name1",
      },
    },
    { $count: "count" },
  ];

  AocUsers.aggregate(getAocUserListCondition)
    .then((count) => {
      getAocUserListCondition.splice(-1, 1);
      if (pageSize < 999) {
        getAocUserListCondition.push({ $sort: JSON.parse(req.body.sortValue) });
        getAocUserListCondition.push({
          $skip: Number((currentPage - 1) * pageSize),
        });
        getAocUserListCondition.push({ $limit: Number(pageSize) });
      }
      AocUsers.aggregate(getAocUserListCondition).then((data) => {
        var response = {};
        response["count"] = count[0] ? count[0].count : 0;
        response["data"] = data;
        res.send(
          configure.apiResp(true, 200, response, "", req.headers.isencryption)
        );
      });
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          configure.apiResp(
            true,
            500,
            {},
            err.message || "Some error occurred while retrieving Aoc Users.",
            req.headers.isencryption
          )
        );
    });
};

exports.isActiveChange = (req, res) => {
  let isactive = String(req.body.isactive) == "true" ? 1 : 0;
  var collection = AocUsers;

  switch (req.body.type) {
    case "aoc_users":
      collection = AocUsers;
      break;
    case "drivers":
      collection = Drivers;
      break;
    case "doctors":
      collection = Doctors;
      break;
    case "nurses":
      collection = Nurses;
      break;
    case "devices":
    case "hospital-device":
      collection = Devices;
      break;
    case "aoc_erstaff":
      collection = AocErStaffs;
      break;
    case "aoc_emsstaff":
      collection = AocEmsStaffs;
      break;
    case "provinces":
      collection = Provinces;
      break;
    case "districts":
      collection = Districts;
      break;
    case "subdistricts":
      collection = SubDistricts;
      break;
    case "ambulances":
      collection = Ambulances;
      break;
    case "ambulance_equipment":
      collection = AmbulanceEquipments;
      break;
    case "AmbulanceType":
      collection = AmbulanceTypes;
      break;
    case "patient_monitor":
      collection = PatientMonitors;
      break;
    case "glass_macs":
      collection = GlassMacs;
      break;
    case "medical_equipments":
      collection = MedicalEquipments;
      break;
    case "first_responders":
      collection = First_Responders;
      break;
    case "paramedics":
      collection = Paramedics;
      break;
    case "volunteers":
      collection = AocVolunteers;
      break;
    case "hospitals":
      collection = Hospitals;
      break;
    case "zone":
      collection = AocZones;
      break;
    case "communication_device":
      collection = CommunicationDevices;
      break;
    case "communication_device_type":
    case "medical-device-type":
      collection = CommunicationDeviceTypes;
      break;
    case "stream_server":
      collection = IpServerCommunications;
      break;
    case "amb_communication_devices":
      collection = CommunicationDevices;
      break;
    case "ip_server_devices":
      collection = IpServerDevice;
      break;
    case "ambulance_equipment_catalogy":
      collection = AmbulanceEquipmentCatalogy;
      break;

    default:
      break;
  }

  collection
    .findOneAndUpdate(
      { _id: req.body.id },
      { $set: { isactive: Number(isactive) } },
      { new: true }
    )
    .then((data) => {
      console.log("data", data);
      if (
        req.body.type == "aoc_users" &&
        Object.keys(data.device_token).length
      ) {
        Object.keys(data.device_token).forEach((app_type) => {
          fcmPush.sendPush(
            data.device_token[app_type],
            "AOC_V2",
            { isactive: Number(isactive) },
            "AOC_USER_" + (isactive ? "APPROVED" : "DECLINED"),
            "AOC admin has " +
              (isactive ? "Approved" : "Decline") +
              " your account."
          );
        });
      }

      var response = {};
      response["success"] = true;
      res.send(
        configure.apiResp(true, 200, response, "", req.headers.isencryption)
      );
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          configure.apiResp(
            true,
            500,
            {},
            err.message || "Some error occurred while User Active/Deactive.",
            req.headers.isencryption
          )
        );
    });
};

exports.updateUserDetail = (req, res) => {
  var response = {};

  if (req.body._id !== "null") {
    var hospitalIds = String(req.body.hospital_ids).split(",");
    hospitalIds = hospitalIds.map((e) => {
      return ObjectId(e);
    });

    var zoneIds = String(req.body.zone_ids).split(",");
    zoneIds = zoneIds.map((e) => {
      return ObjectId(e);
    });

    var aoc_user = {
      first_name: String(req.body.first_name),
      last_name: String(req.body.last_name),
      phone: String(req.body.phone),
      zone_ids: zoneIds,
      zone_id: ObjectId(req.body.zone_id),
      hospital_ids: hospitalIds,
      hospital_id: ObjectId(req.body.hospital_id),
      is_scan: String(req.body.is_scan),
      password: String(req.body.password),
      email: String(req.body.email),
      birthdate: new Date(req.body.birthdate),
      gender: Number(req.body.gender),
      // isactive: (req.body.isactive) ? 1 : 0,
    };

    AocUsers.findOneAndUpdate({ _id: req.body._id }, { $set: aoc_user })
      .then(async (data) => {
        if (req.files && req.files.length) {
          ProfileImageURL = await configure.fsUpload(
            data._id,
            "userProfile",
            req.files[0]
          );
          aoc_user.userProfile = ProfileImageURL;
          AocUsers.findOneAndUpdate(
            { _id: req.body._id },
            { $set: { profile_picture: ProfileImageURL } }
          ).then((data, err) => {
            console.log(err);
          });
        }
        if (!data) {
          res
            .status(404)
            .send(
              configure.apiResp(
                false,
                404,
                {},
                "Users data not found !.",
                req.headers.isencryption
              )
            );
        } else {
          response["data"] = data;
          response["success"] = true;
          res.send(
            configure.apiResp(true, 200, response, "", req.headers.isencryption)
          );
        }
      })
      .catch((err) => {
        res
          .status(500)
          .send(
            configure.apiResp(
              true,
              500,
              {},
              err.message || "Some error occurred while User retrive",
              req.headers.isencryption
            )
          );
      });
  } else {
    var hospitalIds = String(req.body.hospital_ids).split(",");
    hospitalIds = hospitalIds.map((e) => {
      return ObjectId(e);
    });

    var zoneIds = String(req.body.zone_ids).split(",");
    zoneIds = zoneIds.map((e) => {
      return ObjectId(e);
    });
    Designations.findOne({ name1: "Aoc Users" })
      .then((user_data) => {
        var aoc_user = new AocUsers({
          first_name: String(req.body.first_name),
          last_name: String(req.body.last_name),
          phone: String(req.body.phone),
          zone_ids: zoneIds,
          zone_id: ObjectId(req.body.zone_id),
          password: String(req.body.password),
          hospital_ids: hospitalIds,
          hospital_id: ObjectId(req.body.hospital_id),
          is_scan: String(req.body.is_scan),
          email: String(req.body.email),
          birthdate: Date(req.body.birthdate),
          gender: Number(req.body.gender),
          designation_id: ObjectId(user_data._id),
          isactive: 1,
        });

        aoc_user
          .save(aoc_user)
          .then((data) => {
            var notification_settings = {
              acns: false,
              ambulance_status_change: false,
              operation_status_change: false,
              arrival_at_scene: false,
              glass_mac_status_change: false,
              patient_monitor_status_change: false,
              ambulance_speed: false,
              ambulance_estimated_time: false,
            };

            var user_notification_settings = new UserNotificationSettings({
              designation_id: ObjectId(user_data._id),
              user_id: ObjectId(data._id),
              aoc: notification_settings,
              ccc: notification_settings,
              rmt_hos: notification_settings,
              ekg: notification_settings,
              er: notification_settings,
              aoc_tv: notification_settings,
              aoc_tv_oneonetwo: notification_settings,
            });

            user_notification_settings.save(user_notification_settings).then();

            if (req.files && req.files.length) {
              ProfileImageURL = configure.fsUpload(
                data._id,
                "userProfile",
                req.files[0]
              );
              AocUsers.findOneAndUpdate(
                { _id: data._id },
                { $set: { profile_picture: ProfileImageURL } }
              ).then((data, err) => {
                console.log(err);
              });
            }
            let user_notificaton_setting = new UserNotificationSettings({
              user_id: data._id,
              designation_id: data.designation_id,
            });
            user_notificaton_setting.save(user_notificaton_setting).then();
            var response = {};
            response["success"] = true;
            response["data"] = data;
            res.send(
              configure.apiResp(
                true,
                200,
                response,
                "",
                req.headers.isencryption
              )
            );
          })
          .catch((err) => {
            res
              .status(500)
              .send(
                configure.apiResp(
                  true,
                  500,
                  {},
                  err.message || "Some error occurred while creating the User.",
                  req.headers.isencryption
                )
              );
          });
      })
      .catch((err) => {
        res
          .status(500)
          .send(
            configure.apiResp(
              true,
              500,
              {},
              err.message || "Some error occurred while creating the User.",
              req.headers.isencryption
            )
          );
      });
  }
};

exports.getZonesHospitalsList = (req, res) => {
  var zoneIds = String(req.body.zoneIds).split(",");
  zoneIds = zoneIds.map((e) => {
    return ObjectId(e);
  });

  var getHospitalsListCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          { isactive: 1 },
          { zone_id: { $in: zoneIds } },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        name1: 1,
        name2: 1,
        full_name: 1,
        zone_id: 1,
      },
    },
  ];

  Hospitals.aggregate(getHospitalsListCondition).then((data) => {
    var response = {};
    response["data"] = data;
    res.send(
      configure.apiResp(true, 200, response, "", req.headers.isencryption)
    );
  });
};

exports.getHospitalsByUserList = (req, res) => {
  req.body.user_id = req.body.user_id
    ? req.body.user_id
    : "000000000000000000000000";

  var getHospitalsListCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          { isactive: 1 },
          { _id: ObjectId(req.body.user_id) },
        ],
      },
    },
    {
      $lookup: {
        from: "hospitals",
        localField: "hospital_ids",
        foreignField: "_id",
        as: "hospitalDetails",
      },
    },
    {
      $lookup: {
        from: "aoc_zones",
        localField: "zone_ids",
        foreignField: "_id",
        as: "zoneDetails",
      },
    },
    {
      $lookup: {
        from: "hospitals",
        localField: "hospital_id",
        foreignField: "_id",
        as: "hospitalDetail",
      },
    },
    {
      $unwind: {
        path: "$hospitalDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        hospitalDetails: "$hospitalDetails._id",
        _id: 1,
        zoneDetails: {
          _id: 1,
          name1: 1,
        },
        baseHospitalLocation: "$hospitalDetail.location",
      },
    },
  ];

  AocUsers.aggregate(getHospitalsListCondition).then((data) => {
    var response = {};
    response["data"] = data;
    res.send(
      configure.apiResp(true, 200, response, "", req.headers.isencryption)
    );
  });
};
exports.checkEmail = (req, res) => {
  var collection = AocUsers;

  switch (req.body.type) {
    case "aoc_users":
      collection = AocUsers;
      break;
    case "drivers":
      collection = Drivers;
      break;
    case "doctors":
      collection = Doctors;
      break;
    case "nurses":
      collection = Nurses;
      break;
    case "devices":
      collection = Devices;
      break;
    case "aoc_erstaff":
      collection = AocErStaffs;
      break;
    case "aoc_emsstaff":
      collection = AocEmsStaffs;
      break;
    case "provinces":
      collection = Provinces;
      break;
    case "districts":
      collection = Districts;
      break;
    case "subdistricts":
      collection = SubDistricts;
      break;
    case "first_responders":
      collection = First_Responders;
      break;
    case "paramedics":
      collection = Paramedics;
      break;
    case "volunteers":
      collection = AocVolunteers;
      break;
    case "hospitals":
      collection = Hospitals;
      break;
    case "zone":
      collection = AocZones;
      break;
    // case 'ambulances':
    //     collection = Ambulances;
    //     break;
    // case 'ambulance_equipment':
    //     collection =AmbulanceEquipments;
    //     break;
    // case 'AmbulanceType':
    //     collection =  AmbulanceTypes;
    //     break;
    // case 'patient_monitor':
    //     collection =PatientMonitors;
    //     break;
    // case 'glass_macs':
    //     collection = GlassMacs;
    //     break;
    // case 'medical_equipments':
    //     collection =MedicalEquipments ;
    //     break;
    default:
      break;
  }

  var query = {};
  if (req.body.email) {
    query["$and"] = [{ email: { $eq: req.body.email } }];
  } else {
    query["$and"] = [{ phone: { $eq: req.body.phone } }];
  }

  if (
    req.body._id &&
    req.body._id !== null &&
    req.body._id !== "null" &&
    req.body._id !== ""
  ) {
    query["$and"].push({ _id: { $ne: ObjectId(req.body._id) } });
  }

  collection
    .findOne(query)
    // collection.findOne({ email: req.body.email })
    .then((data) => {
      let response = {};
      if (data) {
        response["success"] = true;
        response["data"] = data._id;
        res.send(
          configure.apiResp(true, 200, response, "", req.headers.isencryption)
        );
      } else {
        response["success"] = false;
        res.send(
          configure.apiResp(true, 200, response, "", req.headers.isencryption)
        );
      }
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          configure.apiResp(
            true,
            500,
            {},
            err.message || "Some error occurred while User Active/Deactive.",
            req.headers.isencryption
          )
        );
    });
};
