const db = require("../../../config/db.config");
const configure = require("../../../config/configure");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Ambulances = db.ambulances;
const AmbulanceTrackingHistories = db.ambulance_tracking_histories;
const AmbulanceImageHistories = db.ambulance_image_histories;
const AmbulanceEquipments = db.ambulance_equipments;
const AmbulanceEquipmentCatalogies = db.ambulance_equipment_catalogies;
const AmbulanceServiceMaintenances = db.ambulance_service_maintenances;
const AmbulanceTypes = db.ambulance_types;

exports.getAmbulanceEquipmentList = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);

  var getAmbulanceEquipmentsListCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          {
            $or: [
              { name: { $regex: String(req.body.searchValue), $options: "i" } },
            ],
          },
        ],
      },
    },
    { $count: "count" },
  ];

  AmbulanceEquipments.aggregate(getAmbulanceEquipmentsListCondition)
    .then((count) => {
      getAmbulanceEquipmentsListCondition.splice(-1, 1);
      getAmbulanceEquipmentsListCondition.push({
        $sort: JSON.parse(req.body.sortValue),
      });
      getAmbulanceEquipmentsListCondition.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      getAmbulanceEquipmentsListCondition.push({ $limit: Number(pageSize) });
      AmbulanceEquipments.aggregate(getAmbulanceEquipmentsListCondition).then(
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
            true,
            500,
            {},
            err.message ||
              "Some error occurred while retrieving AmbulanceEquipments.",
            req.headers.isencryption
          )
        );
    });
};

exports.getAmbulanceEquipmentCatalogyList = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);

  var getAmbulanceEquipmentCatalogyListCondition = [
    {
      $match: {
        $and: [
          // { isactive: 1 },
          { isdeleted: false },
          {
            $or: [
              { name: { $regex: String(req.body.searchValue), $options: "i" } },
            ],
          },
        ],
      },
    },
    { $count: "count" },
  ];

  AmbulanceEquipmentCatalogies.aggregate(
    getAmbulanceEquipmentCatalogyListCondition
  )
    .then((count) => {
      getAmbulanceEquipmentCatalogyListCondition.splice(-1, 1);
      getAmbulanceEquipmentCatalogyListCondition.push({
        $sort: JSON.parse(req.body.sortValue),
      });
      getAmbulanceEquipmentCatalogyListCondition.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      getAmbulanceEquipmentCatalogyListCondition.push({
        $limit: Number(pageSize),
      });
      AmbulanceEquipmentCatalogies.aggregate(
        getAmbulanceEquipmentCatalogyListCondition
      ).then((data) => {
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
              "Some error occurred while retrieving AmbulanceEquipmentCatalogies.",
            req.headers.isencryption
          )
        );
    });
};

exports.getAmbulanceMaintenanceList = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);

  var AmbulanceServiceMaintenancesListCondition = [
    {
      $match: {
        $and: [
          { isactive: 1 },
          { isdeleted: false },
          {
            $or: [
              { name: { $regex: String(req.body.searchValue), $options: "i" } },
            ],
          },
        ],
      },
    },
    { $count: "count" },
  ];

  AmbulanceServiceMaintenances.aggregate(
    AmbulanceServiceMaintenancesListCondition
  )
    .then((count) => {
      AmbulanceServiceMaintenancesListCondition.splice(-1, 1);
      AmbulanceServiceMaintenancesListCondition.push({
        $sort: JSON.parse(req.body.sortValue),
      });
      AmbulanceServiceMaintenancesListCondition.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      AmbulanceServiceMaintenancesListCondition.push({
        $limit: Number(pageSize),
      });
      AmbulanceServiceMaintenances.aggregate(
        AmbulanceServiceMaintenancesListCondition
      ).then((data) => {
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
              "Some error occurred while retrieving AmbulanceServiceMaintenances.",
            req.headers.isencryption
          )
        );
    });
};

exports.getAmbulanceTypeList = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);

  var AmbulanceTypesListCondition = [
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
            ],
          },
        ],
      },
    },
    { $count: "count" },
  ];

  AmbulanceTypes.aggregate(AmbulanceTypesListCondition)
    .then((count) => {
      AmbulanceTypesListCondition.splice(-1, 1);
      AmbulanceTypesListCondition.push({
        $sort: JSON.parse(req.body.sortValue),
      });
      AmbulanceTypesListCondition.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      AmbulanceTypesListCondition.push({ $limit: Number(pageSize) });
      AmbulanceTypes.aggregate(AmbulanceTypesListCondition).then((data) => {
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
              "Some error occurred while retrieving AmbulanceTypes.",
            req.headers.isencryption
          )
        );
    });
};

exports.updateAmbulanceTypeDetail = (req, res) => {
  var response = {};

  if (req.body._id != "null" && req.body._id != null) {
    var ambulance_types = {
      name1: String(req.body.name1),
      name2: String(req.body.name2),
      isactive: Number(req.body.isactive),
    };

    AmbulanceTypes.findOneAndUpdate(
      { _id: req.body._id },
      { $set: ambulance_types }
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
                "Some error occurred while updating the Ambulance Type.",
              req.headers.isencryption
            )
          );
      });
  } else {
    var ambulance_types = new AmbulanceTypes({
      name1: String(req.body.name1),
      name2: String(req.body.name2),
      isactive: Number(req.body.isactive),
    });

    ambulance_types
      .save(ambulance_types)
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
              true,
              500,
              {},
              err.message ||
                "Some error occurred while creating the Ambulance Type.",
              req.headers.isencryption
            )
          );
      });
  }
};

exports.updateAmbulanceEquipmentCatalogy = (req, res) => {
  var response = {};

  if (req.body._id != "null" && req.body._id != null) {
    var ambulance_equipment_catalogies = {
      id_number: String(req.body.id_number),
      name: String(req.body.name),
      remark: String(req.body.remark),
      isactive: Number(req.body.isactive),
    };

    AmbulanceEquipmentCatalogies.findOneAndUpdate(
      { _id: req.body._id },
      { $set: ambulance_equipment_catalogies }
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
                "Some error occurred while updating the Ambulance Eqpipment Catalogy.",
              req.headers.isencryption
            )
          );
      });
  } else {
    var ambulance_equipment_catalogies = new AmbulanceEquipmentCatalogies({
      id_number: String(req.body.id_number),
      name: String(req.body.name),
      remark: String(req.body.remark),
      isactive: Number(req.body.isactive),
    });

    ambulance_equipment_catalogies
      .save(ambulance_equipment_catalogies)
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
              true,
              500,
              {},
              err.message ||
                "Some error occurred while creating the Ambulance Eqpipment Catalogy..",
              req.headers.isencryption
            )
          );
      });
  }
};

exports.deleteAmbulanceType = (req, res) => {
  AmbulanceTypes.findOneAndUpdate(
    { _id: req.body.ambulanceTypeId },
    { $set: { isdeleted: true } }
  )
    .then((data) => {
      var response = {};
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
              "Some error occurred while deleting the Ambulance Type.",
            req.headers.isencryption
          )
        );
    });
};

exports.updateAmbulanceEquipment = (req, res) => {
  var response = {};

  if (req.body._id !== null && req.body._id !== "null") {
    var ambulance_equipment = {
      name: String(req.body.name),
      remark: String(req.body.remark),
      profile_image: String(req.body.profile_image),
      icon_image: String(req.body.icon_image),
      isactive: Number(req.body.is_visible),
    };

    AmbulanceEquipments.findOneAndUpdate(
      { _id: req.body._id },
      { $set: ambulance_equipment }
    )
      .then((data) => {
        if (req.files && req.files.length) {
          req.files.forEach((e) => {
            if (e.fieldname == "equipmentProfileImage") {
              const ProfileImageURL = configure.fsUpload(
                data._id,
                "equipmentProfileImage",
                e
              );
              AmbulanceEquipments.findOneAndUpdate(
                { _id: data._id },
                { $set: { profile_image: ProfileImageURL } }
              ).then((data, err) => {});
            } else {
              const ProfileImageURL = configure.fsUpload(
                data._id + "_icon",
                "equipmentIconImage",
                e
              );
              AmbulanceEquipments.findOneAndUpdate(
                { _id: data._id },
                { $set: { icon_image: ProfileImageURL } }
              ).then((data, err) => {});
            }
          });
        }
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
                "Some error occurred while updating the Ambulance Type.",
              req.headers.isencryption
            )
          );
      });
  } else {
    var ambulance_equipment = new AmbulanceEquipments({
      name: String(req.body.name),
      remark: String(req.body.remark),
      profile_image: String(req.body.profile_image),
      icon_image: String(req.body.icon_image),
      isactive: Number(req.body.is_visible),
    });

    ambulance_equipment
      .save(ambulance_equipment)
      .then((data) => {
        if (req.files && req.files.length) {
          req.files.forEach((e) => {
            if (e.fieldname == "equipmentProfileImage") {
              const ProfileImageURL = configure.fsUpload(
                data._id,
                "equipmentProfileImage",
                e
              );
              AmbulanceEquipments.findOneAndUpdate(
                { _id: data._id },
                { $set: { profile_image: ProfileImageURL } }
              ).then((data, err) => {});
            } else {
              const ProfileImageURL = configure.fsUpload(
                data._id + "_icon",
                "equipmentIconImage",
                e
              );
              AmbulanceEquipments.findOneAndUpdate(
                { _id: data._id },
                { $set: { icon_image: ProfileImageURL } }
              ).then((data, err) => {});
            }
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
              true,
              500,
              {},
              err.message ||
                "Some error occurred while creating the Ambulance Type.",
              req.headers.isencryption
            )
          );
      });
  }
};

// Create or update Ambulance Service Maintenance
exports.updateAmbulanceServiceMaintenance = (req, res) => {
  var response = {};

  // Check if the request contains an ID for updating
  if (req.body._id !== null && req.body._id !== "null") {
    var ambulanceServiceMaintenance = {
      name: String(req.body.name),
      remark: String(req.body.remark),
      isactive: Number(req.body.isactive),
      updated_by: String(req.body.updated_by),
    };

    AmbulanceServiceMaintenances.findOneAndUpdate(
      { _id: req.body._id },
      { $set: ambulanceServiceMaintenance },
      { new: true } // This option returns the updated document
    )
      .then((data) => {
        // Handle file uploads if there are any files in the request
        if (req.files && req.files.length) {
          req.files.forEach((e) => {
            if (e.fieldname === "maintenanceProfileImage") {
              const ProfileImageURL = configure.fsUpload(
                data._id,
                "maintenanceProfileImage",
                e
              );
              AmbulanceServiceMaintenances.findOneAndUpdate(
                { _id: data._id },
                { $set: { profile_image: ProfileImageURL } }
              ).then((data, err) => {});
            }
          });
        }

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
                "Some error occurred while updating the Ambulance Service Maintenance.",
              req.headers.isencryption
            )
          );
      });
  } else {
    // If no ID is provided, create a new record
    var ambulanceServiceMaintenance = new AmbulanceServiceMaintenances({
      name: String(req.body.name),
      remark: String(req.body.remark),
      isactive: Number(req.body.isactive),
      created_by: String(req.body.created_by),
    });

    ambulanceServiceMaintenance
      .save()
      .then((data) => {
        // Handle file uploads if there are any files in the request
        if (req.files && req.files.length) {
          req.files.forEach((e) => {
            if (e.fieldname === "maintenanceProfileImage") {
              const ProfileImageURL = configure.fsUpload(
                data._id,
                "maintenanceProfileImage",
                e
              );
              AmbulanceServiceMaintenances.findOneAndUpdate(
                { _id: data._id },
                { $set: { profile_image: ProfileImageURL } }
              ).then((data, err) => {});
            }
          });
        }

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
                "Some error occurred while creating the Ambulance Service Maintenance.",
              req.headers.isencryption
            )
          );
      });
  }
};

exports.getHospitalAmbulanceList = (req, res) => {
  var getHospitalAmbulanceListCondition = [
    {
      $match: {
        $and: [
          { hospital_id: ObjectId(req.body.hospital_id) },
          { isdeleted: false },
          { isactive: 1 },
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
        name1: 1,
        name2: 1,
        number: 1,
        ambulance_box_code: 1,
        hospitalDetails: {
          _id: 1,
          name1: 1,
          logo_image: 1,
          logo_path: configure.fsUploadURL("hospitalLogo"),
        },
      },
    },
  ];

  Ambulances.aggregate(getHospitalAmbulanceListCondition).then((data) => {
    var response = {};
    response["data"] = data;
    res.send(
      configure.apiResp(true, 200, response, "", req.headers.isencryption)
    );
  });
};

exports.getlAmbulanceTrackingHistoriesReport = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);

  var getlAmbulanceTrackingHistoriesReportCond = [
    {
      $match: {
        $and: [
          { ambulance_id: ObjectId(req.body.ambulance_id) },
          { createdAt: { $gte: new Date(req.body.startDateTime) } },
          { createdAt: { $lte: new Date(req.body.endDateTime) } },
        ],
      },
    },

    {
      $project: {
        _id: 0,
        speed: 1,
        createdAt: 1,
      },
    },
    { $count: "count" },
  ];

  AmbulanceTrackingHistories.aggregate(
    getlAmbulanceTrackingHistoriesReportCond
  ).then((count) => {
    var response = {};

    getlAmbulanceTrackingHistoriesReportCond.splice(-1, 1);
    getlAmbulanceTrackingHistoriesReportCond.push({ $sort: { createdAt: -1 } });
    getlAmbulanceTrackingHistoriesReportCond.push({
      $skip: Number((currentPage - 1) * pageSize),
    });
    getlAmbulanceTrackingHistoriesReportCond.push({ $limit: Number(pageSize) });

    AmbulanceTrackingHistories.aggregate(
      getlAmbulanceTrackingHistoriesReportCond
    ).then((data) => {
      response["count"] = count[0] ? count[0].count : 0;
      response["data"] = data;
      res.send(
        configure.apiResp(true, 200, response, "", req.headers.isencryption)
      );
    });
  });
};

exports.getlAmbulanceImageHistoriesReport = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);

  let getlAmbulanceImageHistoriesReportCond = [
    {
      $match: {
        $and: [
          { ambulance_id: ObjectId(req.body.ambulance_id) },
          { createdAt: { $gte: new Date(req.body.startDateTime) } },
          { createdAt: { $lte: new Date(req.body.endDateTime) } },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        images: 1,
        createdAt: 1,
      },
    },
    { $count: "count" },
  ];

  AmbulanceImageHistories.aggregate(getlAmbulanceImageHistoriesReportCond).then(
    (count) => {
      var response = {};

      getlAmbulanceImageHistoriesReportCond.splice(-1, 1);
      getlAmbulanceImageHistoriesReportCond.push({ $sort: { createdAt: -1 } });
      getlAmbulanceImageHistoriesReportCond.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      getlAmbulanceImageHistoriesReportCond.push({ $limit: Number(pageSize) });
      AmbulanceImageHistories.aggregate(
        getlAmbulanceImageHistoriesReportCond
      ).then((data) => {
        response["count"] = count[0] ? count[0].count : 0;
        response["image_url"] = process.env.TRACKING_SERVER_URL;
        response["data"] = data;
        res.send(
          configure.apiResp(true, 200, response, "", req.headers.isencryption)
        );
      });
    }
  );
};
