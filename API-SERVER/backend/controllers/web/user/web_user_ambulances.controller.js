const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Ambulances = db.ambulances;
const AmbulanceTrackings = db.ambulance_trackings;
const AmbulanceTypes = db.ambulance_types;
const AocZones = db.aoc_zones;
const AocUsers = db.aoc_users;
const Hospitals = db.hospitals;
const Requests = db.requests;

exports.getHospitalOngoingAmbulanceList = (req, res) => {
  req.body.user_id = req.body.user_id
    ? req.body.user_id
    : "000000000000000000000000";
  var HospitalOngoingAmbulanceListCondition = [
    {
      $match: {
        $and: [
          { isactive: 1 },
          { isdeleted: false },
          { _id: ObjectId(req.body.user_id) },
        ],
      },
    },
    { $unwind: "$hospital_ids" },
    {
      $lookup: {
        from: "ambulances",
        localField: "hospital_ids",
        foreignField: "hospital_id",
        as: "ambulancesDetail",
      },
    },
    { $unwind: "$ambulancesDetail" },
    {
      $lookup: {
        from: "aoc_requests",
        let: {
          ambulance_id: "$ambulancesDetail._id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$ambulance_id", "$$ambulance_id"],
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
        as: "ambulancesDetail.aocRequestsDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulancesDetail.aocRequestsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "ambulance_trackings",
        localField: "ambulancesDetail._id",
        foreignField: "ambulance_id",
        as: "ambulancesDetail.ambulanceTrackingsDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulancesDetail.ambulanceTrackingsDetail",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $group: {
        _id: "$ambulancesDetail._id",
        ambulance_box_code: { $first: "$ambulancesDetail.ambulance_box_code" },
        name1: { $first: "$ambulancesDetail.name1" },
        aocRequestsDetail: {
          $first: {
            request_type: "$ambulancesDetail.aocRequestsDetail.request_type",
          },
        },
        ambulanceTrackingsDetail: {
          $first: {
            speed: "$ambulancesDetail.ambulanceTrackingsDetail.speed",
            location: "$ambulancesDetail.ambulanceTrackingsDetail.location",
            estimated_time:
              "$ambulancesDetail.ambulanceTrackingsDetail.estimated_time",
            updatedAt: "$ambulancesDetail.ambulanceTrackingsDetail.updatedAt",
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        ambulance_box_code: 1,
        name1: 1,
        aocRequestsDetail: {
          request_type: 1,
        },
        ambulanceTrackingsDetail: {
          speed: 1,
          location: 1,
          estimated_time: 1,
        },
        is_assign: {
          $cond: [
            { $ifNull: ["$aocRequestsDetail.request_type", false] },
            1,
            0,
          ],
        },
        is_tracking_on: {
          $cond: {
            if: {
              $gt: [
                {
                  $subtract: [
                    new Date(),
                    {
                      $cond: [
                        {
                          $ifNull: [
                            "$ambulanceTrackingsDetail.updatedAt",
                            false,
                          ],
                        },
                        "$ambulanceTrackingsDetail.updatedAt",
                        0,
                      ],
                    },
                  ],
                },
                configure.AMB_TRAKCING_TIMEOUT,
              ],
            },
            then: 0,
            else: 1,
          },
        },
      },
    },
    {
      $match: {
        $or: [{ is_tracking_on: 1 }, { is_assign: 1 }],
      },
    },
  ];

  AocUsers.aggregate(HospitalOngoingAmbulanceListCondition)
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
            err.message || "Some error occurred while retrieving Ambulances.",
            req.headers.isencryption
          )
        );
    });
};

exports.getUserAmbulanceList = (req, res) => {
  var current_page = Number(req.body.current_page);
  var page_size = Number(req.body.page_size);

  var AmbulancesListCondition = [];

  AmbulancesListCondition.push(
    {
      $match: {
        $and: [
          { isactive: 1 },
          { isdeleted: false },
          { _id: ObjectId(req.body.user_id) },
        ],
      },
    },
    {
      $lookup: {
        from: "hospitals",
        localField: "hospital_ids",
        foreignField: "_id",
        as: "hospitalsDetail",
      },
    },
    { $unwind: "$hospitalsDetail" },
    {
      $lookup: {
        from: "ambulances",
        let: {
          hospital_id: "$hospitalsDetail._id",
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
        as: "hospitalsDetail.ambulancesDetail",
      },
    },
    // {
    //     '$lookup': {
    //         'from': 'ambulances',
    //         'localField': 'hospitalsDetail._id',
    //         'foreignField': 'hospital_id',
    //         'as': 'hospitalsDetail.ambulancesDetail'
    //     }
    // },
    {
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $lookup: {
        from: "aoc_requests",
        let: {
          ambulance_id: "$hospitalsDetail.ambulancesDetail._id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$ambulance_id", "$$ambulance_id"],
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
        as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail",
      },
    },
    {
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail",
        preserveNullAndEmptyArrays: true,
      },
    }
  );

  if (
    req.body.request_type_value !== "" &&
    (req.body.request_type_value == "EMS" ||
      req.body.request_type_value == "REF")
  ) {
    AmbulancesListCondition.push({
      $match: {
        "hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_type": {
          $eq: String(req.body.request_type_value),
        },
      },
    });
  } else if (req.body.request_type_value == "STB") {
    AmbulancesListCondition.push({
      $match: {
        "hospitalsDetail.ambulancesDetail.aocRequestsDetail._id": { $eq: null },
      },
    });
  }

  AmbulancesListCondition.push(
    {
      $match: {
        $or: [
          {
            "hospitalsDetail.name1": {
              $regex: String(req.body.search_value),
              $options: "i",
            },
          },
          {
            "hospitalsDetail.name2": {
              $regex: String(req.body.search_value),
              $options: "i",
            },
          },
          {
            "hospitalsDetail.full_name": {
              $regex: String(req.body.search_value),
              $options: "i",
            },
          },
          // { "hospitalsDetail.ambulancesDetail.name1": { $regex: String(req.body.search_value), $options: 'i' } },
          // { "hospitalsDetail.ambulancesDetail.name2": { $regex: String(req.body.search_value), $options: 'i' } },
          {
            "hospitalsDetail.ambulancesDetail.ambulance_box_code": {
              $regex: String(req.body.search_value),
              $options: "i",
            },
          },
        ],
      },
    },
    { $sort: { "hospitalsDetail.ambulancesDetail.ambulance_box_code": -1 } },
    {
      $group: {
        _id: "$hospitalsDetail._id",
        name1: { $first: "$hospitalsDetail.name1" },
        name2: { $first: "$hospitalsDetail.name2" },
        zone_id: { $first: "$hospitalsDetail.zone_id" },
        location: { $first: "$hospitalsDetail.location" },
        createdAt: { $first: "$hospitalsDetail.createdAt" },
        ambulances: {
          $push: {
            _id: "$hospitalsDetail.ambulancesDetail._id",
            name1: "$hospitalsDetail.ambulancesDetail.name1",
            name2: "$hospitalsDetail.ambulancesDetail.name2",
            number: "$hospitalsDetail.ambulancesDetail.number",
            ambulance_box_code:
              "$hospitalsDetail.ambulancesDetail.ambulance_box_code",
            profile_picture:
              "$hospitalsDetail.ambulancesDetail.profile_picture",
            aocRequestsDetail:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail",
          },
        },
      },
    },
    { $count: "count" }
  );

  AocUsers.aggregate(AmbulancesListCondition)
    .then((count) => {
      AmbulancesListCondition.splice(-1, 1);
      AmbulancesListCondition.push({
        $project: {
          _id: 1,
          name1: 1,
          name2: 1,
          zone_id: 1,
          location: 1,
          createdAt: 1,
          profile_picture_path: "/uploads/ambulance/profile_picture/",
          ambulances: {
            _id: 1,
            name1: 1,
            name2: 1,
            number: 1,
            ambulance_box_code: 1,
            profile_picture: 1,
            aocRequestsDetail: {
              _id: 1,
              request_type: 1,
            },
          },
        },
      });

      AmbulancesListCondition.push({ $sort: { _id: 1 } });
      AmbulancesListCondition.push({
        $skip: Number((current_page - 1) * page_size),
      });
      AmbulancesListCondition.push({ $limit: Number(page_size) });

      AocUsers.aggregate(AmbulancesListCondition)
        .then((data) => {
          var response = {};
          response["data"] = data;
          response["count"] = count[0] ? count[0].count : 0;
          if (count[0]) {
            data = data.map((e) => {
              if (e.ambulances.length) {
                return e.ambulances.map((ele) => {
                  if (ele.aocRequestsDetail) ele.is_assign = 1;
                  else ele.is_assign = 0;
                  return ele;
                });
              }
            });
          }
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
                response,
                err.message ||
                  "Some error occurred while retrieving Ambulances.",
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
            false,
            500,
            response,
            err.message || "Some error occurred while retrieving Ambulances.",
            req.headers.isencryption
          )
        );
    });
};

exports.getAmbulanceSnapShotsDetail = (req, res) => {
  var getAmbulanceSnapShotsDetailCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          { isactive: 1 },
          { _id: ObjectId(req.body.ambulance_id) },
        ],
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
        from: "aoc_requests",
        let: {
          ambulance_id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$ambulance_id", "$$ambulance_id"],
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
        from: "patient_monitors",
        localField: "aocRequestsDetail.moniter_id",
        foreignField: "_id",
        as: "aocRequestsDetail.patientMonitorsDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.patientMonitorsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "fast_tracks",
        localField: "aocRequestsDetail.fast_track_id",
        foreignField: "_id",
        as: "aocRequestsDetail.fastTracksDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.fastTracksDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "patient_requests",
        localField: "aocRequestsDetail.patient_request_id",
        foreignField: "_id",
        as: "patientRequestsDetail",
      },
    },
    {
      $unwind: {
        path: "$patientRequestsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "glass_macs",
        localField: "aocRequestsDetail.glass_id",
        foreignField: "_id",
        as: "aocRequestsDetail.patientGlassMacsDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.patientGlassMacsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "patients",
        localField: "patientRequestsDetail.patient_id",
        foreignField: "_id",
        as: "patientsDetail",
      },
    },
    {
      $unwind: {
        path: "$patientsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "ambulance_trackings",
        localField: "_id",
        foreignField: "ambulance_id",
        as: "ambulanceTrackingDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulanceTrackingDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "ambulance_images",
        localField: "_id",
        foreignField: "ambulance_id",
        as: "ambulanceImagesDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulanceImagesDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.request_status_change",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "aoc_users",
        localField: "aocRequestsDetail.request_status_change.user_id",
        foreignField: "_id",
        as: "aocRequestsDetail.request_status_change.aocUsersDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.request_status_change.aocUsersDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "designations",
        localField:
          "aocRequestsDetail.request_status_change.aocUsersDetail.designation_id",
        foreignField: "_id",
        as: "aocRequestsDetail.request_status_change.aocUsersDetail.designationDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.request_status_change.aocUsersDetail.designationDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        name1: { $first: "$name1" },
        name2: { $first: "$name2" },
        number: { $first: "$number" },
        ambulance_box_code: { $first: "$ambulance_box_code" },
        profile_picture: { $first: "$profile_picture" },
        aocRequestsDetail: { $first: "$aocRequestsDetail" },
        patientsDetail: { $first: "$patientsDetail" },
        patientRequestsDetail: { $first: "$patientRequestsDetail" },
        ambulanceTrackingDetail: { $first: "$ambulanceTrackingDetail" },
        ambulanceImagesDetail: { $first: "$ambulanceImagesDetail" },
        requestStatusChange: {
          $last: "$aocRequestsDetail.request_status_change",
        },
        patientMonitorsDetail: {
          $first: "$aocRequestsDetail.patientMonitorsDetail",
        },
        patientGlassMacsDetail: {
          $first: "$aocRequestsDetail.patientGlassMacsDetail",
        },

        // "SourceHospitalDetail": { $first: '$SourceHospitalDetail' },
        // "DestinationHospitalDetail": { $first: '$DestinationHospitalDetail' },
        // "medicalEquipmentsDetail": { $first: '$medicalEquipmentsDetail' },
      },
    },
    {
      $project: {
        _id: 1,
        name1: 1,
        name2: 1,
        number: 1,
        ambulance_box_code: 1,
        profile_picture: 1,
        patientsDetail: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          age: 1,
          gender: 1,
        },
        is_assign: {
          $cond: [{ $ifNull: ["$aocRequestsDetail._id", false] }, 1, 0],
        },
        aocRequestsDetail: {
          _id: 1,
          doctorsDetail: {
            first_name: 1,
            last_name: 1,
          },
          nursesDetail: {
            first_name: 1,
            last_name: 1,
          },
          driversDetail: {
            first_name: 1,
            last_name: 1,
          },
          aocErStaffsDetail: {
            first_name: 1,
            last_name: 1,
          },
          aocEmsStaffsDetail: {
            first_name: 1,
            last_name: 1,
          },
          paramedicsDetail: {
            first_name: 1,
            last_name: 1,
          },
          request_code: 1,
          source: 1,
          patientGlassMacsDetail: {
            _id: "$aocRequestsDetail.patientGlassMacsDetail._id",
            rtmp_url: {
              $concat: [
                process.env.STREAMING_SERVER_URL,
                {
                  $substr: [
                    {
                      $toString:
                        "$aocRequestsDetail.patientGlassMacsDetail._id",
                    },
                    19,
                    5,
                  ],
                },
              ],
            },
          },
          destination: 1,
          patientMonitorsDetail: 1,
          requestStatusChange: {
            user_id: 1,
            request_status: 1,
            createdAt: "$aocRequestsDetail.request_status_change.createdAt",
            updatedAt: "$aocRequestsDetail.request_status_change.updatedAt",
            request_status: {
              $cond: [
                { $ifNull: ["$aocRequestsDetail.request_status", false] },
                "$aocRequestsDetail.request_status",
                "",
              ],
            },
            aocUsersDetail: {
              _id: "$aocRequestsDetail.request_status_change.aocUsersDetail._id",
              first_name:
                "$aocRequestsDetail.request_status_change.aocUsersDetail.first_name",
              last_name:
                "$aocRequestsDetail.request_status_change.aocUsersDetail.last_name",
              designation:
                "$aocRequestsDetail.request_status_change.aocUsersDetail.designationDetail.name1",
            },
          },
          previous_status: {
            $cond: [
              { $eq: ["$aocRequestsDetail.request_type", "EMS"] },
              {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "OPERATION_ASSIGNED",
                        ],
                      },
                      then: "",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "START_OPERATION",
                        ],
                      },
                      then: "OPERATION_ASSIGNED",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "DEPART_FROM_BASE_HOSPITAL",
                        ],
                      },
                      then: "START_OPERATION",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_SCENE",
                        ],
                      },
                      then: "DEPART_FROM_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_TO_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_SCENE",
                    },
                    {
                      case: {
                        $and: [
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "DEPART_FROM_SCENE",
                            ],
                          },
                          {
                            $eq: [
                              "$aocRequestsDetail.destination_type",
                              "BASE",
                            ],
                          },
                        ],
                      },
                      then: "GO_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $and: [
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "DEPART_FROM_SCENE",
                            ],
                          },
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "ANOTHER",
                            ],
                          },
                        ],
                      },
                      then: "GO_TO_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_BASE_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "COME_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "GO_BACK_TO_BASE_HOSPITAL",
                    },
                  ],
                  default: "CANCELED",
                },
              },
              {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "OPERATION_ASSIGNED",
                        ],
                      },
                      then: "",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "START_OPERATION",
                        ],
                      },
                      then: "OPERATION_ASSIGNED",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "DEPART_FROM_BASE_HOSPITAL",
                        ],
                      },
                      then: "START_OPERATION",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "COME_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "GO_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: ["$aocRequestsDetail.request_status", "COMPLETED"],
                      },
                      then: "COME_BACK_TO_BASE_HOSPITAL",
                    },
                  ],
                  default: "CANCELED",
                },
              },
            ],
          },
          next_status: {
            $cond: [
              { $eq: ["$aocRequestsDetail.request_type", "EMS"] },
              {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "OPERATION_ASSIGNED",
                        ],
                      },
                      then: "START_OPERATION",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "START_OPERATION",
                        ],
                      },
                      then: "DEPART_FROM_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "DEPART_FROM_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_SCENE",
                        ],
                      },
                      then: "GO_TO_BASE_HOSPITAL, GO_TO_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_TO_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_SCENE",
                    },
                    {
                      case: {
                        $and: [
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "DEPART_FROM_SCENE",
                            ],
                          },
                          {
                            $eq: [
                              "$aocRequestsDetail.destination_type",
                              "BASE",
                            ],
                          },
                        ],
                      },
                      then: "ARRIVAL_AT_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $and: [
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "DEPART_FROM_SCENE",
                            ],
                          },
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "ANOTHER",
                            ],
                          },
                        ],
                      },
                      then: "ARRIVAL_AT_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_BASE_HOSPITAL",
                        ],
                      },
                      then: "COMPLETED",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "GO_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "COME_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "COME_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "COMPLETED",
                    },
                  ],
                  default: "CANCELED",
                },
              },
              {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "OPERATION_ASSIGNED",
                        ],
                      },
                      then: "START_OPERATION",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "START_OPERATION",
                        ],
                      },
                      then: "DEPART_FROM_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "DEPART_FROM_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "GO_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "COME_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "COME_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "COMPLETED",
                    },
                  ],
                  default: "CANCELED",
                },
              },
            ],
          },
          request_type: "$aocRequestsDetail.request_type",
          request_note: 1,
          fastTracksDetail: {
            _id: { $ifNull: ["$aocRequestsDetail.fastTracksDetail._id", ""] },
            name: { $ifNull: ["$aocRequestsDetail.fastTracksDetail.name", ""] },
          },
        },
        patientRequestsDetail: {
          diagnosis_note: 1,
          sickness_type: 1,
          severity_color_code: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      1,
                    ],
                  },
                  then: configure.severityColorPanel._1,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      2,
                    ],
                  },
                  then: configure.severityColorPanel._2,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      3,
                    ],
                  },
                  then: configure.severityColorPanel._3,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      4,
                    ],
                  },
                  then: configure.severityColorPanel._4,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      5,
                    ],
                  },
                  then: configure.severityColorPanel._5,
                },
              ],
              default: configure.severityColorPanel._1,
            },
          },
          createdAt: 1,
        },
        ambulanceTrackingDetail: {
          speed: { $toInt: "$ambulanceTrackingDetail.speed" },
          estimated_time: { $toInt: "$ambulanceTrackingDetail.estimated_time" },
          location: 1,
        },
        ambulanceImagesDetail: {
          _id: 1,
          images: 1,
        },
      },
    },
  ];

  Ambulances.aggregate(getAmbulanceSnapShotsDetailCondition)
    .then(async (data) => {
      var resp = {};
      if (data.length) {
        resp.ambulance_data = data;
        resp["ambulance_picture_url"] = await configure.fsUploadURL(
          "ambulanceProfile"
        );
        res.send(
          configure.apiResp(true, 200, resp, "", req.headers.isencryption)
        );
      } else {
        Ambulances.findOne({
          _id: ObjectId(req.body.ambulance_id),
          isactive: 1,
        }).then((data) => {
          if (data) {
            res.send(
              configure.apiResp(
                false,
                403,
                {},
                "Request Data not found.",
                req.headers.isencryption
              )
            );
          } else {
            res.send(
              configure.apiResp(
                false,
                404,
                {},
                "Ambulance is Deactivate by admin.",
                req.headers.isencryption
              )
            );
          }
        });
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
            err.message || "Some error occurred while retrieving Ambulances.",
            req.headers.isencryption
          )
        );
    });
};

exports.getAmbulanceTrackingDetail = (req, res) => {
  var getAmbulanceTrackingDetailCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          { isactive: 1 },
          { _id: ObjectId(req.body.ambulance_id) },
        ],
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
        from: "aoc_requests",
        let: {
          ambulance_id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$ambulance_id", "$$ambulance_id"],
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
        from: "patient_monitors",
        localField: "aocRequestsDetail.moniter_id",
        foreignField: "_id",
        as: "aocRequestsDetail.patientMonitorsDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.patientMonitorsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "fast_tracks",
        localField: "aocRequestsDetail.fast_track_id",
        foreignField: "_id",
        as: "aocRequestsDetail.fastTracksDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.fastTracksDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "patient_requests",
        localField: "aocRequestsDetail.patient_request_id",
        foreignField: "_id",
        as: "patientRequestsDetail",
      },
    },
    {
      $unwind: {
        path: "$patientRequestsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "patients",
        localField: "patientRequestsDetail.patient_id",
        foreignField: "_id",
        as: "patientsDetail",
      },
    },
    {
      $unwind: {
        path: "$patientsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "medical_equipments",
        localField: "medical_equipments",
        foreignField: "_id",
        as: "medicalEquipmentsDetail",
      },
    },
    {
      $lookup: {
        from: "ambulance_trackings",
        localField: "_id",
        foreignField: "ambulance_id",
        as: "ambulanceTrackingsDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulanceTrackingsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "ambulance_images",
        localField: "_id",
        foreignField: "ambulance_id",
        as: "ambulanceImagesDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulanceImagesDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.request_status_change",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "aoc_users",
        localField: "aocRequestsDetail.request_status_change.user_id",
        foreignField: "_id",
        as: "aocRequestsDetail.request_status_change.aocUsersDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.request_status_change.aocUsersDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "designations",
        localField:
          "aocRequestsDetail.request_status_change.aocUsersDetail.designation_id",
        foreignField: "_id",
        as: "aocRequestsDetail.request_status_change.aocUsersDetail.designationDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.request_status_change.aocUsersDetail.designationDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        name1: { $first: "$name1" },
        name2: { $first: "$name2" },
        number: { $first: "$number" },
        ambulance_box_code: { $first: "$ambulance_box_code" },
        profile_picture: { $first: "$profile_picture" },
        medicalEquipmentDetail: { $first: "$medicalEquipmentDetail" },
        patientsDetail: { $first: "$patientsDetail" },
        ambulanceImagesDetail: { $first: "$ambulanceImagesDetail" },
        aocRequestsDetail: { $first: "$aocRequestsDetail" },
        patientRequestsDetail: { $first: "$patientRequestsDetail" },
        ambulanceTrackingsDetail: { $first: "$ambulanceTrackingsDetail" },
        requestStatusChange: {
          $last: "$aocRequestsDetail.request_status_change",
        },
        hospitalsDetail: { $first: "$hospitalsDetail" },
        patientMonitorsDetail: {
          $first: "$aocRequestsDetail.patientMonitorsDetail",
        },

        // "SourceHospitalDetail": { $first: '$SourceHospitalDetail' },
        // "DestinationHospitalDetail": { $first: '$DestinationHospitalDetail' },
      },
    },
    {
      $project: {
        _id: 1,
        name1: 1,
        name2: 1,
        number: 1,
        ambulance_box_code: 1,
        profile_picture: 1,
        medicalEquipmentDetail: {
          _id: 1,
          name: 1,
          picture: 1,
          icon_image: 1,
        },
        patientsDetail: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          age: 1,
          gender: 1,
        },
        ambulanceImagesDetail: {
          _id: 1,
          images: 1,
        },
        aocRequestsDetail: {
          _id: 1,
          patientMonitorsDetail: 1,
          requestStatusChange: {
            user_id: 1,
            request_status: 1,
            createdAt: "$aocRequestsDetail.request_status_change.createdAt",
            updatedAt: "$aocRequestsDetail.request_status_change.updatedAt",
            request_status: {
              $cond: [
                { $ifNull: ["$aocRequestsDetail.request_status", false] },
                "$aocRequestsDetail.request_status",
                "",
              ],
            },
            aocUsersDetail: {
              _id: "$aocRequestsDetail.request_status_change.aocUsersDetail._id",
              first_name:
                "$aocRequestsDetail.request_status_change.aocUsersDetail.first_name",
              last_name:
                "$aocRequestsDetail.request_status_change.aocUsersDetail.last_name",
              designation:
                "$aocRequestsDetail.request_status_change.aocUsersDetail.designationDetail.name1",
            },
          },
          request_status: {
            $cond: [
              { $ifNull: ["$aocRequestsDetail.request_status", false] },
              "$aocRequestsDetail.request_status",
              "",
            ],
          },
          request_code: 1,
          previous_status: {
            $cond: [
              { $eq: ["$aocRequestsDetail.request_type", "EMS"] },
              {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "OPERATION_ASSIGNED",
                        ],
                      },
                      then: "",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "START_OPERATION",
                        ],
                      },
                      then: "OPERATION_ASSIGNED",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "DEPART_FROM_BASE_HOSPITAL",
                        ],
                      },
                      then: "START_OPERATION",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_SCENE",
                        ],
                      },
                      then: "DEPART_FROM_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_TO_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_SCENE",
                    },
                    {
                      case: {
                        $and: [
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "DEPART_FROM_SCENE",
                            ],
                          },
                          {
                            $eq: [
                              "$aocRequestsDetail.destination_type",
                              "BASE",
                            ],
                          },
                        ],
                      },
                      then: "GO_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $and: [
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "DEPART_FROM_SCENE",
                            ],
                          },
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "ANOTHER",
                            ],
                          },
                        ],
                      },
                      then: "GO_TO_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_BASE_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "COME_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "GO_BACK_TO_BASE_HOSPITAL",
                    },
                  ],
                  default: "CANCELED",
                },
              },
              {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "OPERATION_ASSIGNED",
                        ],
                      },
                      then: "",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "START_OPERATION",
                        ],
                      },
                      then: "OPERATION_ASSIGNED",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "DEPART_FROM_BASE_HOSPITAL",
                        ],
                      },
                      then: "START_OPERATION",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "COME_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "GO_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: ["$aocRequestsDetail.request_status", "COMPLETED"],
                      },
                      then: "COME_BACK_TO_BASE_HOSPITAL",
                    },
                  ],
                  default: "CANCELED",
                },
              },
            ],
          },
          next_status: {
            $cond: [
              { $eq: ["$aocRequestsDetail.request_type", "EMS"] },
              {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "OPERATION_ASSIGNED",
                        ],
                      },
                      then: "START_OPERATION",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "START_OPERATION",
                        ],
                      },
                      then: "DEPART_FROM_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "DEPART_FROM_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_SCENE",
                        ],
                      },
                      then: "GO_TO_BASE_HOSPITAL, GO_TO_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_TO_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_SCENE",
                    },
                    {
                      case: {
                        $and: [
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "DEPART_FROM_SCENE",
                            ],
                          },
                          {
                            $eq: [
                              "$aocRequestsDetail.destination_type",
                              "BASE",
                            ],
                          },
                        ],
                      },
                      then: "ARRIVAL_AT_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $and: [
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "DEPART_FROM_SCENE",
                            ],
                          },
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "ANOTHER",
                            ],
                          },
                        ],
                      },
                      then: "ARRIVAL_AT_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_BASE_HOSPITAL",
                        ],
                      },
                      then: "COMPLETED",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "GO_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "COME_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "COME_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "COMPLETED",
                    },
                  ],
                  default: "CANCELED",
                },
              },
              {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "OPERATION_ASSIGNED",
                        ],
                      },
                      then: "START_OPERATION",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "START_OPERATION",
                        ],
                      },
                      then: "DEPART_FROM_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "DEPART_FROM_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "GO_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "COME_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "COME_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "COMPLETED",
                    },
                  ],
                  default: "CANCELED",
                },
              },
            ],
          },
          request_type: "$aocRequestsDetail.request_type",
          request_note: "$aocRequestsDetail.request_note",
          source: 1,
          destination: 1,
          fastTracksDetail: {
            _id: { $ifNull: ["$aocRequestsDetail.fastTracksDetail._id", ""] },
            name: { $ifNull: ["$aocRequestsDetail.fastTracksDetail.name", ""] },
          },
        },
        patientRequestsDetail: {
          diagnosis_note: 1,
          sickness_type: 1,
          severity_color_code: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      1,
                    ],
                  },
                  then: configure.severityColorPanel._1,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      2,
                    ],
                  },
                  then: configure.severityColorPanel._2,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      3,
                    ],
                  },
                  then: configure.severityColorPanel._3,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      4,
                    ],
                  },
                  then: configure.severityColorPanel._4,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      5,
                    ],
                  },
                  then: configure.severityColorPanel._5,
                },
              ],
              default: configure.severityColorPanel._1,
            },
          },
          createdAt: 1,
        },
        ambulanceTrackingsDetail: {
          _id: 1,
          speed: { $toInt: "$ambulanceTrackingsDetail.speed" },
          location: {
            $ifNull: [
              "$ambulanceTrackingsDetail.location",
              "$hospitalsDetail.location",
            ],
          },
          // 'source_location': 1,
          // 'destination_location': 1,
          heading: 1,
          covered_distance: 1,
          estimated_time: {
            $toInt: "$ambulanceTrackingsDetail.estimated_time",
          },
        },
      },
    },
  ];

  Ambulances.aggregate(getAmbulanceTrackingDetailCondition)
    .then(async (data) => {
      var resp = {};
      if (data.length) {
        resp.ambulance_data = data;
        resp["ambulance_picture_url"] = await configure.fsUploadURL(
          "ambulanceProfile"
        );
        res.send(
          configure.apiResp(true, 200, resp, "", req.headers.isencryption)
        );
      } else {
        res.send(
          configure.apiResp(
            false,
            1003,
            {},
            "data not found.",
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
            err.message || "Some error occurred while retrieving Ambulances.",
            req.headers.isencryption
          )
        );
    });
};

exports.getAmbulanceEcgDetail = (req, res) => {
  var getAmbulanceEcgDetailCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          { isactive: 1 },
          { _id: ObjectId(req.body.ambulance_id) },
        ],
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
        from: "aoc_requests",
        let: {
          ambulance_id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$ambulance_id", "$$ambulance_id"],
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
        from: "patient_monitors",
        localField: "aocRequestsDetail.moniter_id",
        foreignField: "_id",
        as: "aocRequestsDetail.patientMonitorsDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.patientMonitorsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "fast_tracks",
        localField: "aocRequestsDetail.fast_track_id",
        foreignField: "_id",
        as: "aocRequestsDetail.fastTracksDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.fastTracksDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "patient_requests",
        localField: "aocRequestsDetail.patient_request_id",
        foreignField: "_id",
        as: "patientRequestsDetail",
      },
    },
    {
      $unwind: {
        path: "$patientRequestsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "patients",
        localField: "patientRequestsDetail.patient_id",
        foreignField: "_id",
        as: "patientsDetail",
      },
    },
    {
      $unwind: {
        path: "$patientsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "ambulance_trackings",
        localField: "_id",
        foreignField: "ambulance_id",
        as: "ambulanceTrackingDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulanceTrackingDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "ambulance_images",
        localField: "_id",
        foreignField: "ambulance_id",
        as: "ambulanceImagesDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulanceImagesDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.request_status_change",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "aoc_users",
        localField: "aocRequestsDetail.request_status_change.user_id",
        foreignField: "_id",
        as: "aocRequestsDetail.request_status_change.aocUsersDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.request_status_change.aocUsersDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "designations",
        localField:
          "aocRequestsDetail.request_status_change.aocUsersDetail.designation_id",
        foreignField: "_id",
        as: "aocRequestsDetail.request_status_change.aocUsersDetail.designationDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.request_status_change.aocUsersDetail.designationDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$_id",
        name1: { $first: "$name1" },
        name2: { $first: "$name2" },
        number: { $first: "$number" },
        profile_picture: { $first: "$profile_picture" },
        ambulance_box_code: { $first: "$ambulance_box_code" },
        patientsDetail: { $first: "$patientsDetail" },
        ambulanceImagesDetail: { $first: "$ambulanceImagesDetail" },
        aocRequestsDetail: { $first: "$aocRequestsDetail" },
        patientRequestsDetail: { $first: "$patientRequestsDetail" },
        ambulanceTrackingDetail: { $first: "$ambulanceTrackingDetail" },
        requestStatusChange: {
          $last: "$aocRequestsDetail.request_status_change",
        },

        // "ambulanceTrackingsDetail": { $first: '$ambulanceTrackingsDetail' },
        // "SourceHospitalDetail": { $first: '$SourceHospitalDetail' },
        // "DestinationHospitalDetail": { $first: '$DestinationHospitalDetail' },
      },
    },
    {
      $project: {
        _id: 1,
        name1: 1,
        name2: 1,
        number: 1,
        ambulance_box_code: 1,
        profile_picture: 1,
        patientsDetail: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          age: 1,
          gender: 1,
        },
        ambulanceImagesDetail: {
          _id: 1,
          images: 1,
        },
        aocRequestsDetail: {
          _id: 1,
          source: 1,
          destination: 1,
          requestStatusChange: {
            user_id: 1,
            request_status: 1,
            createdAt: "$aocRequestsDetail.request_status_change.createdAt",
            updatedAt: "$aocRequestsDetail.request_status_change.updatedAt",
            request_status: {
              $cond: [
                { $ifNull: ["$aocRequestsDetail.request_status", false] },
                "$aocRequestsDetail.request_status",
                "",
              ],
            },
            aocUsersDetail: {
              _id: "$aocRequestsDetail.request_status_change.aocUsersDetail._id",
              first_name:
                "$aocRequestsDetail.request_status_change.aocUsersDetail.first_name",
              last_name:
                "$aocRequestsDetail.request_status_change.aocUsersDetail.last_name",
              designation:
                "$aocRequestsDetail.request_status_change.aocUsersDetail.designationDetail.name1",
            },
          },
          fastTracksDetail: {
            _id: { $ifNull: ["$aocRequestsDetail.fastTracksDetail._id", ""] },
            name: { $ifNull: ["$aocRequestsDetail.fastTracksDetail.name", ""] },
          },
          request_status: {
            $cond: [
              { $ifNull: ["$aocRequestsDetail.request_status", false] },
              "$aocRequestsDetail.request_status",
              "",
            ],
          },
          request_code: 1,
          request_type: "$aocRequestsDetail.request_type",
          previous_status: {
            $cond: [
              { $eq: ["$aocRequestsDetail.request_type", "EMS"] },
              {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "OPERATION_ASSIGNED",
                        ],
                      },
                      then: "",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "START_OPERATION",
                        ],
                      },
                      then: "OPERATION_ASSIGNED",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "DEPART_FROM_BASE_HOSPITAL",
                        ],
                      },
                      then: "START_OPERATION",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_SCENE",
                        ],
                      },
                      then: "DEPART_FROM_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_TO_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_SCENE",
                    },
                    {
                      case: {
                        $and: [
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "DEPART_FROM_SCENE",
                            ],
                          },
                          {
                            $eq: [
                              "$aocRequestsDetail.destination_type",
                              "BASE",
                            ],
                          },
                        ],
                      },
                      then: "GO_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $and: [
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "DEPART_FROM_SCENE",
                            ],
                          },
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "ANOTHER",
                            ],
                          },
                        ],
                      },
                      then: "GO_TO_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_BASE_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "COME_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "GO_BACK_TO_BASE_HOSPITAL",
                    },
                  ],
                  default: "CANCELED",
                },
              },
              {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "OPERATION_ASSIGNED",
                        ],
                      },
                      then: "",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "START_OPERATION",
                        ],
                      },
                      then: "OPERATION_ASSIGNED",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "DEPART_FROM_BASE_HOSPITAL",
                        ],
                      },
                      then: "START_OPERATION",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "COME_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "GO_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: ["$aocRequestsDetail.request_status", "COMPLETED"],
                      },
                      then: "COME_BACK_TO_BASE_HOSPITAL",
                    },
                  ],
                  default: "CANCELED",
                },
              },
            ],
          },
          next_status: {
            $cond: [
              { $eq: ["$aocRequestsDetail.request_type", "EMS"] },
              {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "OPERATION_ASSIGNED",
                        ],
                      },
                      then: "START_OPERATION",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "START_OPERATION",
                        ],
                      },
                      then: "DEPART_FROM_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "DEPART_FROM_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_SCENE",
                        ],
                      },
                      then: "GO_TO_BASE_HOSPITAL, GO_TO_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_SCENE",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_TO_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "DEPART_FROM_SCENE",
                    },
                    {
                      case: {
                        $and: [
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "DEPART_FROM_SCENE",
                            ],
                          },
                          {
                            $eq: [
                              "$aocRequestsDetail.destination_type",
                              "BASE",
                            ],
                          },
                        ],
                      },
                      then: "ARRIVAL_AT_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $and: [
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "DEPART_FROM_SCENE",
                            ],
                          },
                          {
                            $eq: [
                              "$aocRequestsDetail.request_status",
                              "ANOTHER",
                            ],
                          },
                        ],
                      },
                      then: "ARRIVAL_AT_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_BASE_HOSPITAL",
                        ],
                      },
                      then: "COMPLETED",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "GO_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "COME_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "COME_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "COMPLETED",
                    },
                  ],
                  default: "CANCELED",
                },
              },
              {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "OPERATION_ASSIGNED",
                        ],
                      },
                      then: "START_OPERATION",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "START_OPERATION",
                        ],
                      },
                      then: "DEPART_FROM_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "DEPART_FROM_BASE_HOSPITAL",
                        ],
                      },
                      then: "ARRIVAL_AT_ANOTHER_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "ARRIVAL_AT_ANOTHER_HOSPITAL",
                        ],
                      },
                      then: "GO_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "GO_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "COME_BACK_TO_BASE_HOSPITAL",
                    },
                    {
                      case: {
                        $eq: [
                          "$aocRequestsDetail.request_status",
                          "COME_BACK_TO_BASE_HOSPITAL",
                        ],
                      },
                      then: "COMPLETED",
                    },
                  ],
                  default: "CANCELED",
                },
              },
            ],
          },
          request_note: 1,
          fast_track_id: 1,
          // "fastTracksDetail": {
          //     '_id': 1,
          //     'name': 1,
          // },
          patientMonitorsDetail: 1,
          // {
          //     '_id': 1,
          //     'name': 1,
          //     'type': 1,
          //     'web_address': 1,
          //     'web_port': 1,
          //     'serial_number': "aocRequestsDetail.patientMonitorsDetail.serial_number",

          // }
        },
        patientRequestsDetail: {
          diagnosis_note: 1,
          sickness_type: 1,
          severity_color_code: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      1,
                    ],
                  },
                  then: configure.severityColorPanel._1,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      2,
                    ],
                  },
                  then: configure.severityColorPanel._2,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      3,
                    ],
                  },
                  then: configure.severityColorPanel._3,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      4,
                    ],
                  },
                  then: configure.severityColorPanel._4,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      5,
                    ],
                  },
                  then: configure.severityColorPanel._5,
                },
              ],
              default: configure.severityColorPanel._1,
            },
          },
          createdAt: 1,
        },
        ambulanceTrackingDetail: {
          speed: { $toInt: "$ambulanceTrackingDetail.speed" },
          estimated_time: { $toInt: "$ambulanceTrackingDetail.estimated_time" },
          location: 1,
        },
      },
    },
  ];

  Ambulances.aggregate(getAmbulanceEcgDetailCondition)
    .then(async (data) => {
      var resp = {};
      if (data.length) {
        resp.ambulance_data = data;
        resp["ambulance_picture_url"] = await configure.fsUploadURL(
          "ambulanceProfile"
        );
        res.send(
          configure.apiResp(true, 200, resp, "", req.headers.isencryption)
        );
      } else {
        res.send(
          configure.apiResp(
            false,
            1003,
            {},
            "data not found.",
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
            err.message || "Some error occurred while retrieving Ambulances.",
            req.headers.isencryption
          )
        );
    });
};

exports.getAmbulanceSnapTrackEcgDetail = (req, res) => {
  var getAmbulanceSnapTrackEcgDetailCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          { isactive: 1 },
          { _id: ObjectId(req.body.ambulance_id) },
        ],
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
        from: "aoc_requests",
        let: {
          ambulance_id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$ambulance_id", "$$ambulance_id"],
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
        from: "fast_tracks",
        localField: "aocRequestsDetail.fast_track_id",
        foreignField: "_id",
        as: "aocRequestsDetail.fastTracksDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.fastTracksDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "glass_macs",
        localField: "aocRequestsDetail.glass_id",
        foreignField: "_id",
        as: "aocRequestsDetail.patientGlassMacsDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.patientGlassMacsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "patient_requests",
        localField: "aocRequestsDetail.patient_request_id",
        foreignField: "_id",
        as: "patientRequestsDetail",
      },
    },
    {
      $unwind: {
        path: "$patientRequestsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "patients",
        localField: "patientRequestsDetail.patient_id",
        foreignField: "_id",
        as: "patientsDetail",
      },
    },
    {
      $unwind: {
        path: "$patientsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "ambulance_trackings",
        localField: "_id",
        foreignField: "ambulance_id",
        as: "ambulanceTrackingDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulanceTrackingDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "ambulance_images",
        localField: "_id",
        foreignField: "ambulance_id",
        as: "ambulanceImagesDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulanceImagesDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "medical_equipments",
        localField: "medical_equipment_ids",
        foreignField: "_id",
        as: "medicalEquipmentsDetail",
      },
    },
    {
      $lookup: {
        from: "hospitals",
        localField: "aocRequestsDetail.source._id",
        foreignField: "_id",
        as: "SourceHospitalDetail",
      },
    },
    {
      $unwind: {
        path: "$SourceHospitalDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "hospitals",
        localField: "aocRequestsDetail.destination._id",
        foreignField: "_id",
        as: "DestinationHospitalDetail",
      },
    },
    {
      $unwind: {
        path: "$DestinationHospitalDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "patient_monitors",
        localField: "aocRequestsDetail.moniter_id",
        foreignField: "_id",
        as: "aocRequestsDetail.patientMonitorsDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.patientMonitorsDetail",
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
    // {
    //     '$unwind': {
    //         "path": "$aocRequestsDetail.request_status_change",
    //         "preserveNullAndEmptyArrays": true
    //     }
    // },
    // {
    //     '$lookup': {
    //         'from': 'aoc_users',
    //         'localField': 'aocRequestsDetail.request_status_change.user_id',
    //         'foreignField': '_id',
    //         'as': 'aocRequestsDetail.request_status_change.aocUsersDetail'
    //     }
    // },
    // {
    //     '$unwind': {
    //         "path": "$aocRequestsDetail.request_status_change.aocUsersDetail",
    //         "preserveNullAndEmptyArrays": true
    //     }
    // },
    // {
    //     '$lookup': {
    //         'from': 'designations',
    //         'localField': 'aocRequestsDetail.request_status_change.aocUsersDetail.designation_id',
    //         'foreignField': '_id',
    //         'as': 'aocRequestsDetail.request_status_change.aocUsersDetail.designationDetail'
    //     }
    // },
    // {
    //     '$unwind': {
    //         "path": "$aocRequestsDetail.request_status_change.aocUsersDetail.designationDetail",
    //         "preserveNullAndEmptyArrays": true
    //     }
    // },
    {
      $group: {
        _id: "$aocRequestsDetail._id",
        ambulance_id: { $first: "$_id" },
        name1: { $first: "$name1" },
        name2: { $first: "$name2" },
        number: { $first: "$number" },
        SourceHospitalDetail: { $first: "$SourceHospitalDetail" },
        DestinationHospitalDetail: { $first: "$DestinationHospitalDetail" },
        patientsDetail: { $first: "$patientsDetail" },
        aocRequestsDetail: { $first: "$aocRequestsDetail" },
        patientRequestsDetail: { $first: "$patientRequestsDetail" },
        ambulanceTrackingDetail: { $first: "$ambulanceTrackingDetail" },
        ambulanceImagesDetail: { $first: "$ambulanceImagesDetail" },
        medicalEquipmentsDetail: { $first: "$medicalEquipmentsDetail" },
      },
    },
    {
      $project: {
        _id: 1,
        name1: 1,
        name2: 1,
        number: 1,
        SourceHospitalDetail: {
          address: 1,
          full_name: 1,
        },
        DestinationHospitalDetail: {
          address: 1,
          full_name: 1,
        },
        patientsDetail: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          age: 1,
          gender: 1,
        },
        // "requestStatusChange": {
        //     'user_id': 1,
        //     'request_status': 1,
        //     'createdAt': 1,
        //     'aocUsersDetail': {
        //         '_id': 1,
        //         'first_name': 1,
        //         'last_name': 1,
        //         'designation':'$aocRequestsDetail.request_status_change.aocUsersDetail.designationDetail.name1'
        //     }
        // },
        aocRequestsDetail: {
          _id: 1,
          source: 1,
          destination: 1,
          patientGlassMacsDetail: {
            _id: 1,
            rtmp_url: {
              $concat: [
                process.env.STREAMING_SERVER_URL,
                {
                  $substr: [
                    {
                      $toString:
                        "$aocRequestsDetail.patientGlassMacsDetail._id",
                    },
                    19,
                    5,
                  ],
                },
              ],
            },
          },
          request_status_change: {
            user_id: 1,
            request_status: 1,
            createdAt: 1,
          },
          patientMonitorsDetail: {
            name: 1,
            serial_number: 1,
          },
          doctorsDetail: {
            first_name: 1,
            last_name: 1,
          },
          nursesDetail: {
            first_name: 1,
            last_name: 1,
          },
          driversDetail: {
            first_name: 1,
            last_name: 1,
          },
          aocErStaffsDetail: {
            first_name: 1,
            last_name: 1,
          },
          aocEmsStaffsDetail: {
            first_name: 1,
            last_name: 1,
          },
          request_status: {
            $cond: [
              { $ifNull: ["$aocRequestsDetail.request_status", false] },
              "$aocRequestsDetail.request_status",
              "",
            ],
          },
          request_type: "$aocRequestsDetail.request_type",
          request_note: 1,
          fast_track_id: 1,
          fastTracksDetail: {
            _id: { $ifNull: ["$aocRequestsDetail.fastTracksDetail._id", ""] },
            name: { $ifNull: ["$aocRequestsDetail.fastTracksDetail.name", ""] },
          },
        },
        patientRequestsDetail: {
          diagnosis_note: 1,
          sickness_type: 1,
          severity_color_code: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      1,
                    ],
                  },
                  then: configure.severityColorPanel._1,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      2,
                    ],
                  },
                  then: configure.severityColorPanel._2,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      3,
                    ],
                  },
                  then: configure.severityColorPanel._3,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      4,
                    ],
                  },
                  then: configure.severityColorPanel._4,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      5,
                    ],
                  },
                  then: configure.severityColorPanel._5,
                },
              ],
              default: configure.severityColorPanel._1,
            },
          },
          createdAt: 1,
        },
        ambulanceTrackingDetail: {
          _id: 1,
          speed: { $toInt: "$ambulanceTrackingDetail.speed" },
          location: 1,
          source_location: 1,
          destination_location: 1,
          heading: 1,
          covered_distance: 1,
          estimated_time: { $toInt: "$ambulanceTrackingDetail.estimated_time" },
        },
        ambulanceImagesDetail: {
          _id: 1,
          images: 1,
        },
        medicalEquipmentsDetail: {
          _id: 1,
          name: 1,
          medical_equipment_image: 1,
          icon_image: 1,
        },
      },
    },
  ];

  Ambulances.aggregate(getAmbulanceSnapTrackEcgDetailCondition)
    .then((data) => {
      var response = {};
      if (data.length) {
        response.ambulance_data = data;
        response.medicalEquipmentsurl = configure.fsUploadURL(
          "medicalEquipmentIconImage"
        );
        res.send(
          configure.apiResp(true, 200, response, "", req.headers.isencryption)
        );
      } else {
        Ambulances.findOne({
          _id: ObjectId(req.body.ambulance_id),
          isactive: 1,
        }).then((data) => {
          if (data) {
            res.send(
              configure.apiResp(
                false,
                403,
                {},
                "Request Data not found.",
                req.headers.isencryption
              )
            );
          } else {
            res.send(
              configure.apiResp(
                false,
                404,
                {},
                "Ambulance is Deactivate by admin.",
                req.headers.isencryption
              )
            );
          }
        });
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
            err.message || "Some error occurred while retrieving Ambulances.",
            req.headers.isencryption
          )
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
        name1: 1,
        name2: 1,
        check_name: 1,
        phone: 1,
        is_panel: 1,
        created_by: 1,
        updated_by: 1,
        isactive: 1,
        isdeleted: 1,
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
          { zone_id: { $eq: ObjectId(req.body.zone_id) } },
        ],
      },
    },
  ];

  Hospitals.aggregate(getHospitalsListCondition).then((data) => {
    var response = { data };
    res.send(
      configure.apiResp(true, 200, response, "", req.headers.isencryption)
    );
  });
};
