const db = require("../../../config/db.config");
const configure = require("../../../config/configure");

const IpServerDevices = db.ip_server_devices;
const Devices = db.devices;
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

exports.getMedicalDeviceList = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);

  var getMedicalDeviceListCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          {
            hospital_id: {
              $exists: true,
              $ne: null,
            },
          },
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
      $project: {
        _id: 1,
        brand_name: 1,
        device_type_id: 1,
        hospital_id: 1,
        isactive: 1,
        isdeleted: 1,
        name: 1,
        profile_picture: 1,
        updatedAt: 1,
        createdAt: 1,
        zone_id: "$hospitalDetails.zone_id",
        hospital_name: "$hospitalDetails.name1",
        remark: 1,
      },
    },

    { $count: "count" },
  ];

  Devices.aggregate(getMedicalDeviceListCondition)
    .then((count) => {
      getMedicalDeviceListCondition.splice(-1, 1);
      getMedicalDeviceListCondition.push({
        $sort: JSON.parse(req.body.sortValue),
      });
      getMedicalDeviceListCondition.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      getMedicalDeviceListCondition.push({ $limit: Number(pageSize) });

      Devices.aggregate(getMedicalDeviceListCondition).then((data) => {
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
            err.message ||
              "Some error occurred while retriving medical devices.",
            req.headers.isencryption
          )
        );
    });
};

exports.updateHospitalDeviceDetail = (req, res) => {
  var response = {};
  if (!req.body.old_device_id && !req.body._id) {
    var device = {
      hospital_id: ObjectId(req.body.hospital_id),
      updatedAt: Date.now(),
    };

    Devices.findOneAndUpdate(
      { _id: req.body.device_id },
      { $set: device }
    ).then((data) => {
      if (data) {
        var response = {};
        response["success"] = true;
        response["data"] = data;
        res.send(
          configure.apiResp(true, 200, response, "", req.headers.isencryption)
        );
      }
    });
  } else if (req.body.old_device_id == req.body.device_id) {
    var device = {
      device_type_id: ObjectId(req.body.device_type_id),
      hospital_id: ObjectId(req.body.hospital_id),
      remark: req.body.remark,
      updatedAt: Date.now(),
    };

    Devices.findOneAndUpdate({ _id: req.body._id }, { $set: device })
      .then((data) => {
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
              err.message || "Some error occurred while updating devices.",
              req.headers.isencryption
            )
          );
      });
  } else {
    var device = {
      hospital_id: ObjectId(req.body.hospital_id),
      remark: req.body.remark,
      updatedAt: Date.now(),
    };

    Devices.findOneAndUpdate(
      { _id: req.body.old_device_id },
      { $set: { hospital_id: null } }
    )
      .then((datas) => {
        Devices.findOneAndUpdate(
          { _id: req.body.device_id },
          { $set: { hospital_id: ObjectId(req.body.hospital_id) } }
        ).then((data) => {
          var response = {};
          response["success"] = true;
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
              err.message || "Some error occurred while creating devices.",
              req.headers.isencryption
            )
          );
      });
  }
};

exports.gethospitalDeviceList = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);

  var getMedicalDeviceListCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          { isactive: 1 },
          {
            $or: [
              { name: { $regex: String(req.body.searchValue), $options: "i" } },
              // { name2: { $regex: String(req.body.searchValue), $options: 'i' } },
              // { fullname: { $regex: String(req.body.searchValue), $options: 'i' } },
            ],
          },
        ],
      },
    },
    { $count: "count" },
  ];

  Devices.aggregate(getMedicalDeviceListCondition)
    .then((count) => {
      getMedicalDeviceListCondition.splice(-1, 1);
      getMedicalDeviceListCondition.push({
        $sort: JSON.parse(req.body.sortValue),
      });
      getMedicalDeviceListCondition.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      getMedicalDeviceListCondition.push({ $limit: Number(pageSize) });
      Devices.aggregate(getMedicalDeviceListCondition).then((data) => {
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
            err.message ||
              "Some error occurred while retrieving MedicalDevices.",
            req.headers.isencryption
          )
        );
    });
};

exports.getMedicalDeviceTypeList = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);

  var getMedicalDeviceTypeListCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          {
            $or: [
              {
                name1: { $regex: String(req.body.searchValue), $options: "i" },
              },
              {
                name2: { $regex: String(req.body.searchValue), $options: "i" },
              },
              {
                fullname: {
                  $regex: String(req.body.searchValue),
                  $options: "i",
                },
              },
            ],
          },
        ],
      },
    },
    { $count: "count" },
  ];

  MedicalDeviceTypes.aggregate(getMedicalDeviceTypeListCondition)
    .then((count) => {
      getMedicalDeviceTypeListCondition.splice(-1, 1);
      getMedicalDeviceTypeListCondition.push({
        $sort: JSON.parse(req.body.sortValue),
      });
      getMedicalDeviceTypeListCondition.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      getMedicalDeviceTypeListCondition.push({ $limit: Number(pageSize) });
      MedicalDeviceTypes.aggregate(getMedicalDeviceTypeListCondition).then(
        (data) => {
          var response = {};
          response["count"] = count[0] ? count[0].count : 0;
          response["data"] = data;
          res.send(
            configure.apiResp(true, 200, response, "", req.headers.isencryption)
          );
        }
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
              "Some error occurred while retrieving MedicalDeviceTypes.",
            req.headers.isencryption
          )
        );
    });
};

exports.getIpServerDevicesList = (req, res) => {
  var currentPage = Number(req.body.currentPage) || 1;
  var pageSize = Number(req.body.pageSize) || 10;

  var searchValue = String(req.body.searchValue || "");

  // Build the aggregation query
  var ipServerDevicesListCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false }, // Exclude deleted records
          {
            $or: [
              { ip_address: { $regex: searchValue, $options: "i" } },
              { domain: { $regex: searchValue, $options: "i" } },
            ],
          },
        ],
      },
    },
    { $count: "count" },
  ];

  IpServerDevices.aggregate(ipServerDevicesListCondition)
    .then((count) => {
      ipServerDevicesListCondition.splice(-1, 1); // Remove the count query
      ipServerDevicesListCondition.push({
        $sort: JSON.parse(req.body.sortValue || '{"createdAt": -1}'), // Default sort by createdAt descending
      });
      ipServerDevicesListCondition.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      ipServerDevicesListCondition.push({ $limit: Number(pageSize) });

      IpServerDevices.aggregate(ipServerDevicesListCondition).then((data) => {
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
            err.message ||
              "Some error occurred while retrieving IpServerDevices.",
            req.headers.isencryption
          )
        );
    });
};

// Update or create IP Server Device details
exports.updateIpServerDeviceDetail = (req, res) => {
  var response = {};

  // Check if the request contains an ID for updating
  if (req.body._id != "null" && req.body._id != null) {
    var ipServerDevice = {
      ip_server_device_id: String(req.body.ip_server_device_id),
      ip_address: String(req.body.ip_address),
      domain: String(req.body.domain),
      isactive: Number(req.body.isactive),
    };

    IpServerDevices.findOneAndUpdate(
      { _id: req.body._id },
      { $set: ipServerDevice },
      { new: true } // This option returns the updated document
    )
      .then((data) => {
        response["data"] = data;
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
              err.message ||
                "Some error occurred while updating the IP Server Device.",
              req.headers.isencryption
            )
          );
      });
  } else {
    // If no ID is provided, create a new record
    var ipServerDevice = new IpServerDevices({
      ip_server_device_id: String(req.body.ip_server_device_id),
      ip_address: String(req.body.ip_address),
      domain: String(req.body.domain),
      isactive: Number(req.body.isactive),
      isdeleted: false,
    });

    ipServerDevice
      .save()
      .then((data) => {
        response["success"] = true;
        response["data"] = data;
        res.send(
          configure.apiResp(true, 200, response, "", req.headers.isencryption)
        );
      })
      .catch((err) => {
        console.log("err", err);
        res
          .status(500)
          .send(
            configure.apiResp(
              true,
              500,
              {},
              err.message ||
                "Some error occurred while creating the IP Server Device.",
              req.headers.isencryption
            )
          );
      });
  }
};

// Delete IP Server Device (soft delete by setting isdeleted = true)
exports.deleteIpServerDevice = (req, res) => {
  var response = {};

  if (req.body._id != "null" && req.body._id != null) {
    IpServerDevices.findOneAndUpdate(
      { _id: req.body._id },
      { $set: { isdeleted: true, updated_by: req.body.updated_by } }, // Soft delete by setting 'isdeleted' to true
      { new: true }
    )
      .then((data) => {
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
              true,
              500,
              {},
              err.message ||
                "Some error occurred while deleting the IP Server Device.",
              req.headers.isencryption
            )
          );
      });
  } else {
    res
      .status(400)
      .send(
        configure.apiResp(
          true,
          400,
          {},
          "Invalid ID. Please provide a valid ID for deletion.",
          req.headers.isencryption
        )
      );
  }
};
