const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Drivers = db.drivers;
const Doctors = db.doctors;
const Nurses = db.nurses;
const AocErStaffs = db.aoc_er_staffs;
const AocEmsStaffs = db.aoc_ems_staffs;
const AocUsers = db.aoc_users;
const Devices = db.devices;
const UserPresenceLogs = db.user_presence_logs;

exports.ListUsers = (req, res) => {
  var current_page = Number(req.body.current_page);
  var page_size = Number(req.body.page_size);
  var collection = AocUsers;

  if (req.body.user_type == "aoc_users") {
    AocUsers.findOne(
      { _id: ObjectId(req.body.user_id) },
      {
        _id: 1,
        first_name: 1,
        last_name: 1,
        email: 1,
        isactive: 1,
        createdAt: 1,
        profile_picture: 1,
      }
    ).then((data) => {
      var response = {};
      response["count"] = 1;
      response["data"] = [data];
      res.send(
        configure.apiResp(true, 200, response, "", req.headers.isencryption)
      );
    });
    return;
  }

  var getUserListCondition = [
    {
      $match: {
        $and: [
          { _id: ObjectId(req.body.user_id) },
          { isactive: 1 },
          { isdeleted: false },
        ],
      },
    },
  ];

  getUserListCondition.push({
    $lookup: {
      from: req.body.user_type,
      let: {
        hospital_ids: "$hospital_ids",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $in: ["$hospital_id", "$$hospital_ids"],
                },
                { isdeleted: false },
              ],
            },
          },
        },
      ],
      as: req.body.user_type + "Detail",
    },
  });

  getUserListCondition.push({
    $unwind: {
      path: "$" + req.body.user_type + "Detail",
      preserveNullAndEmptyArrays: false,
    },
  });

  if (req.body.search_value && req.body.search_value !== "") {
    let search_value = {};
    search_value["first_name"] = {};
    search_value["last_name"] = {};
    search_value["first_name"][req.body.user_type + "Detail.first_name"] = {
      $regex: String(req.body.search_value),
      $options: "i",
    };
    search_value["last_name"][req.body.user_type + "Detail.last_name"] = {
      $regex: String(req.body.search_value),
      $options: "i",
    };

    getUserListCondition.push({
      $match: {
        $or: [search_value["first_name"], search_value["last_name"]],
      },
    });
  }

  getUserListCondition.push({
    $group: {
      _id: "$" + req.body.user_type + "Detail._id",
      first_name: { $first: "$" + req.body.user_type + "Detail.first_name" },
      last_name: { $first: "$" + req.body.user_type + "Detail.last_name" },
      email: { $first: "$" + req.body.user_type + "Detail.email" },
      isactive: { $first: "$" + req.body.user_type + "Detail.isactive" },
      createdAt: { $first: "$" + req.body.user_type + "Detail.createdAt" },
      profile_picture: {
        $first: "$" + req.body.user_type + "Detail.profile_picture",
      },
    },
  });

  getUserListCondition.push({ $count: "count" });
  AocUsers.aggregate(getUserListCondition)
    .then((count) => {
      getUserListCondition.splice(-1, 1);
      getUserListCondition.push({ $sort: { createdAt: -1 } });

      if (req.body.page_size !== 0) {
        getUserListCondition.push({
          $skip: Number((current_page - 1) * page_size),
        });
        getUserListCondition.push({ $limit: Number(page_size) });
      }

      getUserListCondition.push({
        $project: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          email: 1,
          isactive: 1,
          profile_picture: 1,
        },
      });

      AocUsers.aggregate(getUserListCondition).then((data) => {
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
            false,
            500,
            {},
            err.message || "Some error occurred while retriving Users.",
            req.headers.isencryption
          )
        );
    });
};

exports.checkInOutChange = (req, res) => {
  var collection = AocUsers;
  switch (req.body.user_type) {
    case "AocUser":
      collection = AocUsers;
      break;

    case "Driver":
      collection = Drivers;
      break;

    case "Nurse":
      collection = Nurses;
      break;

    case "AocErStaff":
      collection = AocErStaffs;
      break;

    case "AocEmsStaff":
      collection = AocEmsStaffs;
      break;

    case "Doctor":
      collection = Doctors;
      break;
    default:
      break;
  }

  collection
    .findOneAndUpdate(
      { _id: req.body.user_id },
      { $set: { isactive: req.body.isactive == "true" ? 1 : 0 } }
    )
    .then();
  if (req.body.isactive == "false") {
    UserPresenceLogs.findOneAndUpdate(
      { user_id: req.body.user_id, check_out_datetime: null },
      { $set: { check_out_datetime: Date.now() } }
    )
      .then((data) => {
        var response = {};
        response.data = data;
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
              false,
              500,
              {},
              err.message || "Some error occurred while User Active/Deactive.",
              req.headers.isencryption
            )
          );
      });
  } else {
    let usertype = "";
    if (req.body.user_type == "AocUser") {
      usertype = "AOC_USERS";
    } else if (req.body.user_type == "Driver") {
      usertype = "DRIVERS";
    } else if (req.body.user_type == "Doctor") {
      usertype = "DOCTORS";
    } else if (req.body.user_type == "Nurse") {
      usertype = "NURSES";
    } else if (req.body.user_type == "AocErStaff") {
      usertype = "AOC_ER_STAFFS";
    } else if (req.body.user_type == "AocEmsStaff") {
      usertype = "AOC_EMS_STAFFS";
    }
    let userpreference = new UserPresenceLogs({
      user_type: usertype,
      user_id: ObjectId(req.body.user_id),
      check_in_datetime: Date.now(),
      check_out_datetime: null,
    });
    userpreference
      .save(userpreference)
      .then((data) => {
        var response = {};
        response["success"] = true;
        response["data"] = data;
        res.send(
          configure.apiResp(true, 200, response, "", req.headers.isencryption)
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
              err.message || "Some error occurred while creating the userLog.",
              req.headers.isencryption
            )
          );
      });
  }
};

exports.getUserHospital = (req, res) => {
  var userHospitalCondition = [
    {
      $match: {
        $and: [{ _id: ObjectId(req.body.user_id) }],
      },
    },
    {
      $project: {
        _id: 1,
        hospital_id: 1,
      },
    },
  ];

  AocUsers.aggregate(userHospitalCondition)
    .then((data) => {
      var response = {};
      response["data"] = data;
      res.send(
        configure.apiResp(true, 200, response, "", req.headers.isencryption)
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
            err.message,
            req.headers.isencryption
          )
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
