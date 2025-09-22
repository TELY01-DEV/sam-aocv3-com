const db = require("../../../config/db.config");
const configure = require("../../../config/configure");

const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Ambulances = db.ambulances;
const AmbulanceTypes = db.ambulance_types;
const AmbulanceServiceMaintenances = db.ambulance_service_maintenances;
const AocZones = db.aoc_zones;
const Hospitals = db.hospitals;
const MedicalEquipments = db.medical_equipments;
const TrackApps = db.track_apps;

exports.getAmbulanceList = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);
  var AmbulancesListCondition = [];
  if (req.body.zone_id && req.body.zone_id !== "null") {
    AmbulancesListCondition.push({
      $match: {
        $and: [{ zone_id: ObjectId(req.body.zone_id) }],
      },
    });
  }
  if (req.body.hospital_id && req.body.hospital_id !== "null") {
    AmbulancesListCondition.push({
      $match: {
        $and: [{ hospital_id: ObjectId(req.body.hospital_id) }],
      },
    });
  }
  AmbulancesListCondition.push({
    $match: {
      $and: [
        { isdeleted: false },
        {
          $or: [
            { name1: { $regex: String(req.body.searchValue), $options: "i" } },
            { name2: { $regex: String(req.body.searchValue), $options: "i" } },
            { number: { $regex: String(req.body.searchValue), $options: "i" } },
            {
              ambulance_box_code: {
                $regex: String(req.body.searchValue),
                $options: "i",
              },
            },
          ],
        },
      ],
    },
  });
  AmbulancesListCondition.push(
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
      $lookup: {
        from: "ambulance_types",
        localField: "type_id",
        foreignField: "_id",
        as: "typeDetail",
      },
    },
    {
      $unwind: {
        path: "$typeDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "track_apps",
        localField: "_id",
        foreignField: "ambulance_id",
        as: "trackappsDetail",
      },
    },
    {
      $unwind: {
        path: "$trackappsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        ambulance_box_code: 1,
        ambulance_phone: 1,
        ambulance_picture: 1,
        hospital_id: 1,
        is_online: 1,
        is_box_tracking: 1,
        isactive: 1,
        isdeleted: 1,
        medical_equipment_ids: 1,
        name1: 1,
        name2: 1,
        number: 1,
        type_id: 1,
        updatedAt: 1,
        zone_id: 1,
        profile_picture: 1,
        profile_picture_path: "/uploads/ambulance/profile_picture/",
        _id: 1,
        trackappsDetail: {
          _id: "$trackappsDetail._id",
          device_code: "$trackappsDetail.device_code",
        },
        hospital_fullname: "$hospitalDetail.full_name",
        ambulance_type_name: "$typeDetail.name1",
      },
    },
    { $count: "count" }
  );

  Ambulances.aggregate(AmbulancesListCondition)
    .then((count) => {
      AmbulancesListCondition.splice(-1, 1);
      AmbulancesListCondition.push({ $sort: JSON.parse(req.body.sortValue) });
      AmbulancesListCondition.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      AmbulancesListCondition.push({ $limit: Number(pageSize) });
      Ambulances.aggregate(AmbulancesListCondition).then((data) => {
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
            err.message || "Some error occurred while retrieving Ambulances.",
            req.headers.isencryption
          )
        );
    });
};

exports.getAllAmbulanceTypesList = (req, res) => {
  var getAllAmbulanceTypesListCondition = [
    {
      $match: {
        $and: [{ isdeleted: false }, { isactive: 1 }],
      },
    },
  ];

  AmbulanceTypes.aggregate(getAllAmbulanceTypesListCondition).then((data) => {
    var response = {};
    response["data"] = data;
    res.send(
      configure.apiResp(true, 200, response, "", req.headers.isencryption)
    );
  });
};

exports.getAllAocZonesList = (req, res) => {
  var getAllAocZonesListCondition = [
    {
      $match: {
        $and: [{ isdeleted: false }, { isactive: 1 }],
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

  AocZones.aggregate(getAllAocZonesListCondition).then((data) => {
    var response = {};
    response["data"] = data;
    res.send(
      configure.apiResp(true, 200, response, "", req.headers.isencryption)
    );
  });
};

exports.getHospitalsList = (req, res) => {
  var getHospitalsListCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          { isactive: 1 },
          { zone_id: { $eq: ObjectId(req.body.zoneId) } },
        ],
      },
    },
    {
      $project: {
        _id: 1,
        name1: 1,
        name2: 1,
        full_name: 1,
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

exports.checkAmbulanceBoxCodeExist = (req, res) => {
  var AmbulanceBoxCodeExistCond = {
    $and: [
      { ambulance_box_code: { $eq: String(req.body.ambulance_box_code) } },
    ],
  };
  if (req.body.ambulance_id !== "null") {
    AmbulanceBoxCodeExistCond["$and"].push({
      _id: { $ne: ObjectId(req.body.ambulance_id) },
    });
  }

  Ambulances.findOne(AmbulanceBoxCodeExistCond)
    .then((data) => {
      var response = {};
      response["success"] = "true";
      if (data) {
        response["data"] = 1;
        res.send(
          configure.apiResp(true, 200, response, "", req.headers.isencryption)
        );
      } else {
        response["data"] = 0;
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
            err.message ||
              "Some error occurred while checking the ambulance boxcode exist.",
            req.headers.isencryption
          )
        );
    });
};

exports.updateAmbulanceDetail = (req, res) => {
  var response = {};
  if (req.body._id !== "null") {
    var ambulances = {
      name1: String(req.body.name1),
      name2: String(req.body.name2),
      ambulance_phone: String(req.body.ambulance_phone),
      number: String(req.body.number),
      type_id: ObjectId(req.body.type_id),
      zone_id: ObjectId(req.body.zone_id),
      hospital_id: ObjectId(req.body.hospital_id),
      isactive: Number(req.body.isactive),
      is_box_tracking: Number(req.body.is_box_tracking),
    };

    if (!isNaN(req.body.ambulance_box_code))
      ambulances["ambulance_box_code"] = String(req.body.ambulance_box_code);

    if (
      req.body.medical_equipment_ids &&
      req.body.medical_equipment_ids !== ""
    ) {
      var medicalEquipmentIds = String(req.body.medical_equipment_ids).split(
        ","
      );
      ambulances["medical_equipment_ids"] = medicalEquipmentIds.map((e) => {
        return ObjectId(e);
      });
    }

    Ambulances.findOneAndUpdate({ _id: req.body._id }, { $set: ambulances })
      .then(async (data) => {
        if (
          req.body.track_app_id !== null &&
          req.body.track_app_id !== "null"
        ) {
          TrackApps.updateMany(
            { ambulance_id: ObjectId(req.body._id) },
            { $unset: { ambulance_id: 1 } }
          )
            .then((e) => {
              TrackApps.findOneAndUpdate(
                { _id: ObjectId(req.body.track_app_id) },
                { $set: { ambulance_id: ObjectId(data._id) } }
              )
                .then()
                .catch((err) => console.log(err));
            })
            .catch((err) => console.log(err));
        } else {
          TrackApps.updateMany(
            { ambulance_id: ObjectId(req.body._id) },
            { $unset: { ambulance_id: 1 } }
          )
            .then()
            .catch((err) => console.log(err));
        }
        if (req.files && req.files.length) {
          var ranNum = await configure.random(4, "Number");
          var ProfileImageURL = await configure.fsUpload(
            String(ranNum + "" + req.body._id),
            "ambulanceProfile",
            req.files[0]
          );
          Ambulances.findOneAndUpdate(
            { _id: ObjectId(req.body._id) },
            { $set: { profile_picture: ProfileImageURL } }
          ).then((data, err) => {
            console.log(err);
          });
        }
        response["data"] = data;
        response["success"] = "true";
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
                "Some error occurred while updating the Ambulance.",
              req.headers.isencryption
            )
          );
      });
  } else {
    var ambulances = new Ambulances({
      name1: String(req.body.name1),
      name2: String(req.body.name2),
      ambulance_phone: String(req.body.ambulance_phone),
      number: String(req.body.number),
      type_id: ObjectId(req.body.type_id),
      zone_id: ObjectId(req.body.zone_id),
      hospital_id: ObjectId(req.body.hospital_id),
      isactive: Number(req.body.isactive),
      is_box_tracking: Number(req.body.is_box_tracking),
    });

    if (!isNaN(req.body.ambulance_box_code))
      ambulances["ambulance_box_code"] = String(req.body.ambulance_box_code);

    ambulances
      .save(ambulances)
      .then(async (data) => {
        if (req.files && req.files.length) {
          var ProfileImageURL = await configure.fsUpload(
            data._id,
            "ambulanceProfile",
            req.files[0]
          );
          Ambulances.findOneAndUpdate(
            { _id: ObjectId(data._id) },
            { $set: { profile_picture: ProfileImageURL } }
          ).then((data, err) => {
            console.log(err);
          });
        }
        if (
          req.body.track_app_id !== null &&
          req.body.track_app_id !== "null"
        ) {
          TrackApps.findOneAndUpdate(
            { _id: req.body.track_app_id },
            { $set: { ambulance_id: ObjectId(data._id) } }
          )
            .then()
            .catch((err) => console.log(err));
        }
        var response = {};
        response["success"] = "true";
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
                "Some error occurred while creating the Ambulance.",
              req.headers.isencryption
            )
          );
      });
  }
};

exports.updateAmbulanceUsageMaintenance = (req, res) => {
  var response = {};

  if (req.body._id != "null" && req.body._id != null) {
    var ambulance_equipment_catalogies = {
      name: String(req.body.name),
      isactive: Number(req.body.isactive),
      brand: String(req.body.brand),
      model: String(req.body.model),
      picture: String(req.body.picture),
      image: String(req.body.image),
      remark: String(req.body.remark),
      isdeleted: Boolean(req.body.isdeleted),
    };

    AmbulanceServiceMaintenances.findOneAndUpdate(
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
    var ambulance_usage_maintenace = new AmbulanceServiceMaintenances({
      name: String(req.body.name),
      isactive: Number(req.body.isactive),
      brand: String(req.body.brand),
      model: String(req.body.model),
      picture: String(req.body.picture),
      image: String(req.body.image),
      remark: String(req.body.remark),
      isdeleted: Boolean(req.body.isdeleted),
    });

    ambulance_usage_maintenace
      .save(ambulance_usage_maintenace)
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

exports.deleteAmbulance = (req, res) => {
  Ambulances.findOneAndUpdate(
    { _id: req.body.ambulanceId },
    { $set: { isdeleted: true } }
  )
    .then((data) => {
      var response = {};
      response["data"] = data;
      response["success"] = "true";
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
            err.message || "Some error occurred while deleting the Ambulance.",
            req.headers.isencryption
          )
        );
    });
};

exports.getAmbulanceUsageMaintenanceList = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);

  var AmbulancesListCondition = [
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

  Ambulances.aggregate(AmbulancesListCondition)
    .then((count) => {
      AmbulancesListCondition.splice(-1, 1);
      AmbulancesListCondition.push({ $sort: JSON.parse(req.body.sortValue) });
      AmbulancesListCondition.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      AmbulancesListCondition.push({ $limit: Number(pageSize) });
      Ambulances.aggregate(AmbulancesListCondition).then((data) => {
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
            err.message || "Some error occurred while retriving the Ambulance.",
            req.headers.isencryption
          )
        );
    });
};

exports.getAllMedicalEquipmentsList = (req, res) => {
  var getAllMedicalEquipmentsListCondition = [
    {
      $match: {
        $and: [{ isdeleted: false }, { isactive: 1 }],
      },
    },
  ];

  MedicalEquipments.aggregate(getAllMedicalEquipmentsListCondition).then(
    (data) => {
      var response = {};
      response["data"] = data;
      res.send(
        configure.apiResp(true, 200, response, "", req.headers.isencryption)
      );
    }
  );
};
