const db = require("../../config/db.config");
const configure = require("../../config/configure");
const { validationResult } = require("express-validator");
const { redisClient } = require("../../server");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const AocUsers = db.aoc_users;

exports.postUserLogin = async (req, res) => {
  const errors = validationResult(req);

  if (req.body.is_version_check && !Boolean(req.body.is_version_check)) {
    res.send(
      configure.apiResp(
        false,
        201,
        {},
        "You have to update your app from app store or test flight.",
        req.headers.isencryption
      )
    );
    return;
  }

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
      if (aoc_users.length) {
        aoc_users[0].device_token = aoc_users[0].device_token
          ? aoc_users[0].device_token
          : {};
        aoc_users[0].device_token[String(req.body.app_type)] = String(
          req.body.device_token
        );

        aoc_users[0].api_token = aoc_users[0].api_token
          ? aoc_users[0].api_token
          : {};
        aoc_users[0].api_token[String(req.body.app_type)] = ObjectId();
        for (let [key, value] of Object.entries(aoc_users[0].device_token)) {
          if (
            value == String(req.body.device_token) &&
            key !== String(req.body.app_type)
          ) {
            aoc_users[0].device_token[key] = "";
          }
        }
        AocUsers.findOneAndUpdate(
          { _id: aoc_users[0]._id },
          {
            is_online: 1,
            device_type: String(req.body.device_type),
            device_token: aoc_users[0].device_token,
            api_token: aoc_users[0].api_token,
            app_version: String(req.body.app_version),
          },
          { fields: { _id: 1 }, new: true }
        ).then();
        aoc_users[0].profile_picture =
          configure.fsUploadURL("userProfile") + aoc_users[0].profile_picture;

        resp.user_detail = {};
        resp.user_detail._id = aoc_users[0]._id;
        resp.user_detail.isactive = aoc_users[0].isactive;
        resp.user_detail.notifications = aoc_users[0].notifications;
        resp.user_detail.api_token =
          aoc_users[0].api_token[String(req.body.app_type)];

        // redisClient.set(String(aoc_users[0]._id), JSON.stringify(aoc_users[0].api_token), (err, reply) => { })

        redisClient.hmset(
          String(aoc_users[0]._id),
          "api_token",
          JSON.stringify(aoc_users[0].api_token)
        );
        redisClient.hmset(
          String(aoc_users[0]._id),
          "ambulance_ids",
          aoc_users[0].ambulancesDetail.join()
        );
        req.session.api_token = aoc_users[0].api_token["aoc"];
        req.session.save(function (err) {
          // session saved
        });
        res.send(
          configure.apiResp(true, 200, resp, "", req.headers.isencryption)
        );

        var cond = {};
        cond["device_token." + String(req.body.app_type)] = String(
          req.body.device_token
        );

        AocUsers.findOne(cond).then((e) => {
          var update = { device_token: {} };
          update["device_token"][String(req.body.app_type)] = "";
          AocUsers.findOneAndUpdate(
            { _id: e._id, _id: { $ne: aoc_users[0]._id } },
            { $set: update }
          );
        });
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
    res.send(configure.apiResp(false, 400, {}, errors.array()));
    return;
  }

  const condition = {
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
  };

  AocUsers.find({ _id: req.body.user_id })
    .then((aoc_users) => {
      var resp = {};

      if (aoc_users.length) {
        aoc_users[0].device_token[String(req.body.app_type)] = "";
        aoc_users[0].api_token[String(req.body.app_type)] = "";

        redisClient.hmset(
          String(aoc_users._id),
          "api_token",
          JSON.stringify(aoc_users[0].api_token)
        );
        // redisClient.hmset(String(aoc_users._id), 'ambulance_ids', '');

        AocUsers.findOneAndUpdate(
          { _id: aoc_users[0]._id },
          { is_online: false, device_token: aoc_users[0].device_token },
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

exports.postUserDetail = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.send(configure.apiResp(false, 400, {}, errors.array()));
    return;
  }

  const condition = [
    { $match: { _id: ObjectId(req.body.user_id) } },
    {
      $lookup: {
        from: "hospitals",
        localField: "hospital_id",
        foreignField: "_id",
        as: "hospitalDetails",
      },
    },
    {
      $unwind: {
        path: "$hospitalDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "designations",
        localField: "designation_id",
        foreignField: "_id",
        as: "designationDetails",
      },
    },
    {
      $unwind: {
        path: "$designationDetails",
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
        profile_picture: { $first: "$profile_picture" },
        device_type: { $first: "$device_type" },
        device_token: { $first: "$device_token" },
        app_version: { $first: "$app_version" },
        location: { $first: "$location" },
        hospitalDetails: { $first: "$hospitalDetails" },
        designationDetails: { $first: "$designationDetails" },
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
        profile_picture: 1,
        device_type: 1,
        device_token: 1,
        app_version: 1,
        location: 1,
        hospitalDetails: {
          _id: 1,
          name1: 1,
          name2: 1,
          full_name: 1,
          location: 1,
        },
        designationDetails: {
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
