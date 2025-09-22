const db = require("../../config/db.config");
const configure = require("../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { validationResult } = require("express-validator");
const { redisClient } = require("../../server");

const AocZones = db.aoc_zones;
const Designations = db.designations;
const AocUsers = db.aoc_users;
const UserNotificationSettings = db.user_notification_settings;
const Hospitals = db.hospitals;
const TrackApps = db.track_apps;

exports.postAllZoneList = (req, res) => {
  var AocZonesListCondition = [
    {
      $match: {
        $and: [{ isactive: 1 }, { isdeleted: false }],
      },
    },
    {
      $project: {
        _id: 1,
        name1: 1,
        name2: 1,
      },
    },
  ];

  AocZones.aggregate(AocZonesListCondition)
    .then((data) => {
      var response = {};
      response["data"] = data;
      res.send(
        configure.apiResp(
          "true",
          200,
          response,
          "Succesfully postAllZoneList.",
          req.headers.isencryption
        )
      );
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          configure.apiResp(
            false,
            500,
            {},
            err.message || "Some error occurred while retrieving Requests.",
            req.headers.isencryption
          )
        );
    });
};

exports.postDesignationList = (req, res) => {
  var DesignationsListCondition = [
    {
      $match: {
        $and: [{ isactive: 1 }, { isdeleted: false }],
      },
    },
    {
      $project: {
        _id: 1,
        name1: 1,
        name2: 1,
      },
    },
  ];

  Designations.aggregate(DesignationsListCondition)
    .then((data) => {
      var response = {};
      response["data"] = data;
      res.send(
        configure.apiResp(
          "true",
          200,
          response,
          "Succesfully postDesignationList.",
          req.headers.isencryption
        )
      );
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          configure.apiResp(
            false,
            500,
            {},
            err.message || "Some error occurred while retrieving Designations.",
            req.headers.isencryption
          )
        );
    });
};

exports.postHospitalList = (req, res) => {
  var HospitalsListCondition = [
    {
      $match: {
        $and: [
          { isactive: 1 },
          { isdeleted: false },
          { zone_id: { $eq: ObjectId(req.body.zone_id) } },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        hospital_type: 1,
        name1: 1,
        name2: 1,
        full_name: 1,
      },
    },
  ];

  Hospitals.aggregate(HospitalsListCondition)
    .then((data) => {
      var response = {};
      response["data"] = data;
      res.send(
        configure.apiResp(
          "true",
          200,
          response,
          "Succesfully postHospitalList.",
          req.headers.isencryption
        )
      );
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          configure.apiResp(
            false,
            500,
            {},
            err.message || "Some error occurred while  retrieving Hospitals.",
            req.headers.isencryption
          )
        );
    });
};

exports.postUserExistCheck = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.send(
      configure.apiResp(
        "false",
        errors.errors[0].msg.status,
        {},
        errors.array()
      ),
      req.headers.isencryption
    );
    return;
  }

  configure.random(6, "Number").then((otp, err) => {
    var resp = {};
    resp.OTP = otp;
    res.send(configure.apiResp(true, 200, resp, "", req.headers.isencryption));
  });
};

exports.postUserRegister = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.send(
      configure.apiResp(
        false,
        errors.errors[0].msg.status,
        {},
        errors.array(),
        req.headers.isencryption
      )
    );
    return;
  }

  let aoc_users = new AocUsers({
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    phone: req.body.phone,
    password: req.body.password,
    hospital_id: ObjectId(req.body.hospital_id),
    hospital_ids: [ObjectId(req.body.hospital_id)],
    zone_id: [ObjectId(req.body.zone_id)],
    designation_id: ObjectId(req.body.designation_id),
    device_type: req.body.device_type,
    device_token: {
      aoc: req.body.device_token,
    },
    api_token: {
      aoc: ObjectId(),
    },
    app_version: req.body.app_version,
    location: {
      lat: req.body.latitude ? req.body.latitude : 0,
      lon: req.body.longitude ? req.body.longitude : 0,
    },
    aoc_app_language: req.body.aoc_app_language,
  });

  if (req.files.length) {
    images = {};
    req.files.forEach((key, i) => {
      configure.random(4, "Number").then((ran) => {
        var profile_picture = String(Date.now() + ran);
        aoc_users.profile_picture = configure.fsUpload(
          profile_picture,
          "userProfile",
          key
        );
      });
    });
  }

  aoc_users
    .save(aoc_users)
    .then((data) => {
      var user_notification_settings = new UserNotificationSettings({
        designation_id: ObjectId(req.body.designation_id),
        user_id: ObjectId(data._id),
      });

      user_notification_settings.save(user_notification_settings).then();

      var resp = {};
      resp.user_detail = {};
      resp.user_detail._id = data._id;
      resp.user_detail.isactive = data.isactive;
      console.log(data.api_token["aoc"]);

      resp.user_detail.api_token = data.api_token["aoc"];
      // redisClient.set(String(data._id), JSON.stringify(data.api_token), (err, reply) => { })

      redisClient.hmset(
        String(data._id),
        "api_token",
        JSON.stringify(data.api_token)
      );
      // redisClient.hmset(String(aoc_users._id), 'ambulance_ids', (aoc_users.ambulancesDetail).join());

      res.send(
        configure.apiResp(true, 200, resp, "", req.headers.isencryption)
      );
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          configure.apiResp(
            false,
            500,
            {},
            err.message || "Some error occurred while creating the User.",
            req.headers.isencryption
          )
        );
    });
};

exports.postUserLogin = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.send(configure.apiResp(false, 400, {}, errors.array()));
    return;
  }

  const condition = [
    {
      $match: {
        $or: [
          {
            $and: [
              {
                email: String(req.body.user_name),
                password: String(req.body.password),
              },
            ],
          },
          {
            $and: [
              {
                phone: String(req.body.user_name),
                password: String(req.body.password),
              },
            ],
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$hospital_ids",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "ambulances",
        let: {
          hospital_id: "$hospital_ids",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$hospital_id", "$$hospital_id"],
                  },
                  {
                    $eq: ["$isactive", 1],
                  },
                  {
                    $eq: ["$isdeleted", false],
                  },
                ],
              },
            },
          },
        ],
        as: "ambulancesDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulancesDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        device_token: 1,
        api_token: 1,
        profile_picture: 1,
        aoc_app_language: 1,
        isactive: 1,
        ambulancesDetail: {
          _id: 1,
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        device_token: { $first: "$device_token" },
        api_token: { $first: "$api_token" },
        profile_picture: { $first: "$profile_picture" },
        aoc_app_language: { $first: "$aoc_app_language" },
        isactive: { $first: "$isactive" },
        ambulancesDetail: { $addToSet: "$ambulancesDetail._id" },
      },
    },
  ];

  AocUsers.aggregate(condition)
    .then((aoc_users) => {
      var resp = {};
      if (aoc_users.length == 1) {
        aoc_users = aoc_users[0];
        aoc_users.device_token = aoc_users.device_token
          ? aoc_users.device_token
          : {};
        aoc_users.device_token["aoc"] = String(req.body.device_token);
        aoc_users.api_token = aoc_users.api_token ? aoc_users.api_token : {};
        aoc_users.api_token["aoc"] = String(ObjectId());
        AocUsers.findOneAndUpdate(
          { _id: aoc_users._id },
          {
            is_online: 1,
            device_type: String(req.body.device_type),
            device_token: aoc_users.device_token,
            api_token: aoc_users.api_token,
            app_version: String(req.body.app_version),
          },
          { fields: { _id: 1 }, new: true }
        ).then();
        aoc_users.profile_picture =
          configure.fsUploadURL("userProfile") + aoc_users.profile_picture;
        resp.user_detail = {};
        resp.user_detail._id = aoc_users._id;
        resp.user_detail.aoc_app_language = aoc_users.aoc_app_language;
        resp.user_detail.isactive = aoc_users.isactive;
        resp.user_detail.api_token = aoc_users.api_token["aoc"]; //aoc_users.api_token; //aoc_users?.api_token["aoc"] || "";
        // redisClient.set(String(aoc_users._id), JSON.stringify(aoc_users.api_token), (err, reply) => { console.log(err);})
        redisClient.hmset(
          String(aoc_users._id),
          "api_token",
          JSON.stringify(aoc_users.api_token)
        );
        redisClient.hmset(
          String(aoc_users._id),
          "ambulance_ids",
          aoc_users.ambulancesDetail.join()
        );
        req.session.api_token = aoc_users.api_token;
        req.session.save(function (err) {
          // session saved
        });
        res.send(
          configure.apiResp(true, 200, resp, "", req.headers.isencryption)
        );
      } else {
        res.send(
          configure.apiResp(
            false,
            1003,
            {},
            "Credentials are wrong.",
            req.headers.isencryption
          )
        );
      }
    })
    .catch((err) => {
	console.log("error",err)
      res
        .status(500)
        .send(
          configure.apiResp(
            false,
            500,
            {},
            err.message || "Some error occurred while retrieving User.",
            req.headers.isencryption
          )
        );
    });
};

exports.postUserPushSettingUpdate = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.send(configure.apiResp(false, 400, {}, errors.array()));
    return;
  }
  var user_id = req.body.user_id;

  UserNotificationSettings.findOne({ user_id: user_id }, { aoc: 1 }).then(
    (aoc_user_notifications) => {
      var updateDetail = aoc_user_notifications
        ? aoc_user_notifications["aoc"]
        : {};

      Object.keys(req.body).forEach((e) => {
        updateDetail[e] = req.body[e];
      });

      UserNotificationSettings.findOneAndUpdate(
        { _id: aoc_user_notifications._id },
        { $set: { aoc: updateDetail } },
        { new: true }
      )
        .then((aoc_users) => {
          var resp = req.body;

          res.send(
            configure.apiResp(true, 200, resp, "", req.headers.isencryption)
          );
        })
        .catch((err) => {
          res
            .status(500)
            .send(
              configure.apiResp(
                false,
                500,
                {},
                err.message ||
                  "Some error occurred while updating User Push Settings.",
                req.headers.isencryption
              )
            );
        });
    }
  );
};

exports.postUserDetailUpdate = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.send(configure.apiResp(false, 400, {}, errors.array()));
    return;
  }

  var updateDetail = req.body;
  var user_id = req.body.user_id;
  var device_token = "";

  delete updateDetail["user_id"];
  if (updateDetail["zone_id"])
    updateDetail["zone_id"] = ObjectId(updateDetail["zone_id"]);
  if (updateDetail["hospital_id"])
    updateDetail["hospital_id"] = ObjectId(updateDetail["hospital_id"]);
  if (updateDetail["device_token"]) {
    device_token = updateDetail["device_token"];
    updateDetail["device_token"] = {};
    updateDetail["device_token"]["aoc"] = String(device_token);
  }

  AocUsers.findOneAndUpdate(
    { _id: user_id },
    { $set: updateDetail },
    { new: true }
  )
    .then((aoc_users) => {
      var resp = req.body;

      if (req.files && req.files.length) {
        images = {};
        configure.random(24).then(async (num) => {
          configure.fsRemove(aoc_users.profile_picture, "userProfile");
          var new_profile_picture = await configure.fsUpload(
            num,
            "userProfile",
            req.files[0]
          );
          resp.profile_picture = new_profile_picture;
          AocUsers.findOneAndUpdate(
            { _id: user_id },
            { $set: { profile_picture: new_profile_picture } }
          ).then();
          res.send(
            configure.apiResp(true, 200, resp, "", req.headers.isencryption)
          );
        });
      } else {
        res.send(
          configure.apiResp(true, 200, resp, "", req.headers.isencryption)
        );
      }
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          configure.apiResp(
            false,
            500,
            {},
            err.message || "Some error occurred while retrieving User.",
            req.headers.isencryption
          )
        );
    });
};

exports.postUserDetail = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.send(
      configure.apiResp(
        false,
        400,
        {},
        errors.array(),
        req.headers.isencryption
      )
    );
    return;
  }

  const condition = [
    { $match: { _id: ObjectId(req.body.user_id) } },
    {
      $lookup: {
        from: "user_notification_settings",
        localField: "_id",
        foreignField: "user_id",
        as: "notificationSettingsDetail",
      },
    },
    {
      $unwind: {
        path: "$notificationSettingsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "hospitals",
        localField: "hospital_id",
        foreignField: "_id",
        as: "hospitalsDetail",
      },
    },
    {
      $unwind: {
        path: "$hospitalsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "designations",
        localField: "designation_id",
        foreignField: "_id",
        as: "designationsDetail",
      },
    },
    {
      $unwind: {
        path: "$designationsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "aoc_zones",
        localField: "zone_id",
        foreignField: "_id",
        as: "aocZonesDetail",
      },
    },
    {
      $unwind: {
        path: "$aocZonesDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "hospitals",
        localField: "zone_ids",
        foreignField: "zone_id",
        as: "zoneHospitalsDetail",
      },
    },
    {
      $unwind: {
        path: "$zoneHospitalsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        first_name: { $first: "$first_name" },
        last_name: { $first: "$last_name" },
        email: { $first: "$email" },
        phone: { $first: "$phone" },
        gender: { $first: "$gender" },
        aoc_app_language: { $first: "$aoc_app_language" },
        profile_picture: { $first: "$profile_picture" },
        device_type: { $first: "$device_type" },
        device_token: { $first: "$device_token" },
        app_version: { $first: "$app_version" },
        location: { $first: "$location" },
        notification_settings: { $first: "$notificationSettingsDetail" },
        hospitalsDetail: { $first: "$hospitalsDetail" },
        zoneHospitalsDetail: { $addToSet: "$zoneHospitalsDetail" },
        aocZonesDetail: { $first: "$aocZonesDetail" },
        designationsDetail: { $first: "$designationsDetail" },
        isactive: { $first: "$isactive" },
        createdAt: { $first: "$createdAt" },
      },
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        email: 1,
        phone: 1,
        gender: 1,
        notification_settings: "$notification_settings.aoc",
        aoc_app_language: 1,
        profile_picture: 1,
        device_type: 1,
        device_token: 1,
        app_version: 1,
        location: 1,
        hospitalsDetail: {
          _id: 1,
          name1: 1,
          name2: 1,
          full_name: 1,
          location: 1,
        },
        aocZonesDetail: {
          _id: 1,
          name1: 1,
          name2: 1,
        },
        zoneHospitalsDetail: {
          _id: 1,
          name1: 1,
          name2: 1,
          full_name: 1,
          location: 1,
        },
        designationsDetail: {
          _id: 1,
          name1: 1,
          name2: 1,
        },
        isactive: 1,
        createdAt: { $subtract: ["$createdAt", new Date("1970-01-01")] },
      },
    },
  ];

  AocUsers.aggregate(condition)
    .then((aoc_users) => {
      var resp = {};
      if (aoc_users.length) {
        delete aoc_users[0].password;
        aoc_users[0].profile_picture =
          configure.fsUploadURL("userProfile") + aoc_users[0].profile_picture;
        resp.user_detail = aoc_users[0];
        res.send(
          configure.apiResp(true, 200, resp, "", req.headers.isencryption)
        );
      } else {
        res.send(
          configure.apiResp(
            false,
            1003,
            {},
            "Users not found.",
            req.headers.isencryption
          )
        );
      }
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          configure.apiResp(
            false,
            500,
            {},
            err.message || "Some error occurred while retrieving User.",
            req.headers.isencryption
          )
        );
    });
};

exports.postUserLogout = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.send(
      configure.apiResp(
        false,
        400,
        {},
        errors.array(),
        req.headers.isencryption
      )
    );
    return;
  }

  AocUsers.findOne({ _id: req.body.user_id })
    .then((aoc_users) => {
      if (req.body.device_code)
        TrackApps.update(
          { device_code: req.body.device_code },
          { $unset: { ambulance_id: 1 } }
        ).then();
      var resp = {};
      if (aoc_users) {
        aoc_users.api_token["aoc"] = "";
        aoc_users.device_token["aoc"] = "";

        redisClient.hmset(
          String(aoc_users._id),
          "api_token",
          JSON.stringify(aoc_users.api_token)
        );
        // redisClient.hmset(String(aoc_users._id), 'ambulance_ids', '');

        AocUsers.findOneAndUpdate(
          { _id: aoc_users._id },
          { is_online: false, device_token: aoc_users.device_token },
          { fields: { _id: 1 }, new: true }
        ).then();
        res.send(
          configure.apiResp(true, 200, resp, "", req.headers.isencryption)
        );
      } else {
        res.send(
          configure.apiResp(
            false,
            1003,
            {},
            "User Id are wrong.",
            req.headers.isencryption
          )
        );
      }
    })
    .catch((err) => {
      res
        .status(500)
        .send(
          configure.apiResp(
            false,
            500,
            {},
            err.message || "Some error occurred while retrieving User.",
            req.headers.isencryption
          )
        );
    });
};
