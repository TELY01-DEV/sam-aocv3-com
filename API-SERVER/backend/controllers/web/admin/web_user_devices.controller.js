const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Devices = db.devices;

exports.getDeviceList = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);
  var getDevicesListCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          // {"hospital_id":{
          //     "$exists": false,
          //     "$ne": null
          // }},
          {
            $or: [
              { name: { $regex: String(req.body.searchValue), $options: "i" } },
            ],
          },
        ],
      },
    },
    {
      $lookup: {
        from: "device_types",
        localField: "device_type_id",
        foreignField: "_id",
        as: "deviceTypeDetails",
      },
    },
    {
      $unwind: {
        path: "$deviceTypeDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        profile_picture: 1,
        isactive: 1,
        brand_name: 1,
        device_type_id: 1,
        deviceTypeDetails: {
          _id: 1,
          name: 1,
        },
      },
    },
    { $count: "count" },
  ];

  Devices.aggregate(getDevicesListCondition)
    .then((count) => {
      getDevicesListCondition.splice(-1, 1);
      getDevicesListCondition.push({ $sort: JSON.parse(req.body.sortValue) });
      getDevicesListCondition.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      getDevicesListCondition.push({ $limit: Number(pageSize) });
      Devices.aggregate(getDevicesListCondition)
        // Devices.find({})
        .then((data) => {
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
            err.message || "Some error occurred while retrieving Devices.",
            req.headers.isencryption
          )
        );
    });
};

exports.updateDeviceDetail = (req, res) => {
  var response = {};
  if (req.body._id != "null" && req.body._id != null) {
    var device = {
      name: String(req.body.name),
      // profile_picture: String(req.body.profile_picture),
      device_type_id: req.body.device_type_id,
      brand_name: String(req.body.brand_name),
      isactive: req.body.isactive,
    };

    Devices.findOneAndUpdate({ _id: req.body._id }, { $set: device })
      .then((data) => {
        if (req.files != undefined && req.files.length > 0) {
          configure.random(4, "Number").then(async (ran) => {
            var ProfileImage = String(Date.now() + ran);
            let ProfileImageURL = await configure.fsUpload(
              data._id,
              "deviceImageProfile",
              req.files[0]
            );
            device.userProfile = ProfileImageURL;
            Devices.findOneAndUpdate(
              { _id: req.body._id },
              { $set: { profile_picture: ProfileImageURL } }
            ).then((data, err) => {
              console.log(err);
            });
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
                "Devices data not found !.",
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
              false,
              500,
              {},
              err.message || "Some error occurred while updating Devices.",
              req.headers.isencryption
            )
          );
      });
  } else {
    var device = new Devices({
      name: String(req.body.name),
      profile_picture: String(req.body.profile_picture),
      device_type_id: req.body.device_type_id,
      brand_name: String(req.body.brand_name),
      isactive: req.body.isactive,
    });

    device
      .save(device)
      .then((data) => {
        if (req.files && req.files.length) {
          const ProfileImageURL = configure.fsUpload(
            data._id,
            "deviceImageProfile",
            req.files[0]
          );
          Devices.findOneAndUpdate(
            { _id: data._id },
            { $set: { profile_picture: ProfileImageURL } }
          ).then((data, err) => {
            console.log(err);
          });
        }
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
              err.message || "Some error occurred while updating Devices.",
              req.headers.isencryption
            )
          );
      });
  }
};

exports.deviceLists = (req, res) => {
  var getDevicesListCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          {
            hospital_id: {
              $exists: true,
              // "$ne": null
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "device_types",
        localField: "device_type_id",
        foreignField: "_id",
        as: "deviceTypeDetails",
      },
    },
    {
      $unwind: {
        path: "$deviceTypeDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        profile_picture: 1,
        isactive: 1,
        brand_name: 1,
        deviceTypeDetails: {
          _id: 1,
          name: 1,
        },
      },
    },
  ];

  Devices.aggregate(getDevicesListCondition)
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
            err.message || "Some error occurred while retriving Devices.",
            req.headers.isencryption
          )
        );
    });
};
