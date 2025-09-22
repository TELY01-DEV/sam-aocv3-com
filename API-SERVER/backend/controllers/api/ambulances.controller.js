const { redisClient } = require("../../server");
const db = require("../../config/db.config");
const configure = require("../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Ambulances = db.ambulances;
const Hospitals = db.hospitals;
const AocUsers = db.aoc_users;

exports.postHospitalAmbulanceList = (req, res) => {
  var AmbulancesListCondition = [];
  if (req.body.user_id) {
    var Collection = AocUsers;

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
      { $unwind: "$hospitalsDetail" }
    );
  } else {
    var Collection = Hospitals;

    AmbulancesListCondition.push(
      {
        $match: {
          $and: [{ isactive: 1 }, { isdeleted: false }],
        },
      },
      {
        $group: {
          _id: "$_id",
          hospital_id: { $first: "$_id" },
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
      { $unwind: "$hospitalsDetail" }
    );
  }

  AmbulancesListCondition.push(
    {
      $lookup: {
        from: "ambulances",
        localField: "hospitalsDetail._id",
        foreignField: "hospital_id",
        as: "ambulancesDetail",
      },
    },
    { $unwind: "$ambulancesDetail" },
    {
      $lookup: {
        from: "ambulance_types",
        localField: "ambulancesDetail.type_id",
        foreignField: "_id",
        as: "ambulancesDetail.ambulanceTypesDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulancesDetail.ambulanceTypesDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
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
        from: "patient_requests",
        localField: "ambulancesDetail.aocRequestsDetail.patient_request_id",
        foreignField: "_id",
        as: "ambulancesDetail.patientRequestsDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulancesDetail.patientRequestsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "patient_monitors",
        localField: "ambulancesDetail.aocRequestsDetail.moniter_id",
        foreignField: "_id",
        as: "ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
      },
    },
    {
      $unwind: {
        path: "$ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
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
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        hospitalsDetail: 1,
        ambulancesDetail: {
          _id: 1,
          name1: 1,
          name2: 1,
          ambulance_box_code: 1,
          ambulanceTypesDetail: 1,
          aocRequestsDetail: {
            _id: 1,
            request_status: 1,
            request_type: 1,
            patientMonitorsDetail: {
              _id: 1,
              name: 1,
              serial_number: 1,
              is_online: 1,
              web_address: 1,
              web_port: 1,
              software_version: 1,
              hardware_version: 1,
              app_version: 1,
              type: 1,
              name: 1,
              isactive: 1,
              web_view: 1,
              web_view_url: 1,
              rtmp_url: {
                $cond: {
                  if: {
                    $eq: [
                      "$aocRequestsDetail.patientMonitorsDetail.type",
                      "JENNY",
                    ],
                  },
                  then: {
                    $concat: [
                      "rtmp://",
                      String(process.env.MONITER_STREAMING_SERVER_IP),
                      ":1935/live/temp_",
                      {
                        $toString:
                          "$aocRequestsDetail.patientMonitorsDetail.serial_number",
                      },
                    ],
                  },
                  else: "",
                },
              },
            },
          },
          ambulanceTrackingsDetail: {
            _id: 1,
            location: 1,
            speed: 1,
            heading: 1,
            estimated_time: {
              $cond: [
                {
                  $ifNull: [
                    {
                      $toInt:
                        "$ambulancesDetail.ambulanceTrackingsDetail.estimated_time",
                    },
                    false,
                  ],
                },
                {
                  $toInt:
                    "$ambulancesDetail.ambulanceTrackingsDetail.estimated_time",
                },
                0,
              ],
            },
            speed_color_code: {
              $switch: {
                branches: [
                  {
                    case: {
                      $gt: [
                        {
                          $toInt:
                            "$ambulancesDetail.ambulanceTrackingsDetail.speed",
                        },
                        120,
                      ],
                    },
                    then: configure.speedColor.GT_120,
                  },
                  {
                    case: {
                      $gt: [
                        {
                          $toInt:
                            "$ambulancesDetail.ambulanceTrackingsDetail.speed",
                        },
                        80,
                      ],
                    },
                    then: configure.speedColor.GT_80_LTE_120,
                  },
                  {
                    case: {
                      $lte: [
                        {
                          $toInt:
                            "$ambulancesDetail.ambulanceTrackingsDetail.speed",
                        },
                        80,
                      ],
                    },
                    then: configure.speedColor.LTE_80,
                  },
                ],
                default: configure.speedColor.LTE_80,
              },
            },
          },
          patientRequestsDetail: {
            _id: 1,
            severity_level: {
              $cond: [
                {
                  $ifNull: [
                    "$ambulancesDetail.patientRequestsDetail.severity_level",
                    false,
                  ],
                },
                {
                  $toInt:
                    "$ambulancesDetail.patientRequestsDetail.severity_level",
                },
                0,
              ],
            },
            severity_color_code: {
              $switch: {
                branches: [
                  {
                    case: {
                      $eq: [
                        {
                          $toInt:
                            "$ambulancesDetail.patientRequestsDetail.severity_level",
                        },
                        1,
                      ],
                    },
                    then: configure.severityColor._1,
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $toInt:
                            "$ambulancesDetail.patientRequestsDetail.severity_level",
                        },
                        2,
                      ],
                    },
                    then: configure.severityColor._2,
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $toInt:
                            "$ambulancesDetail.patientRequestsDetail.severity_level",
                        },
                        3,
                      ],
                    },
                    then: configure.severityColor._3,
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $toInt:
                            "$ambulancesDetail.patientRequestsDetail.severity_level",
                        },
                        4,
                      ],
                    },
                    then: configure.severityColor._4,
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $toInt:
                            "$ambulancesDetail.patientRequestsDetail.severity_level",
                        },
                        5,
                      ],
                    },
                    then: configure.severityColor._5,
                  },
                ],
                default: configure.severityColor._1,
              },
            },
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
                              "$ambulancesDetail.ambulanceTrackingsDetail.updatedAt",
                              false,
                            ],
                          },
                          "$ambulancesDetail.ambulanceTrackingsDetail.updatedAt",
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
          is_assign: {
            $cond: [
              { $ifNull: ["$ambulancesDetail.aocRequestsDetail", false] },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        hospitalsDetail: 1,
        ambulancesDetail: {
          _id: 1,
          name1: 1,
          name2: 1,
          ambulance_box_code: 1,
          ambulanceTypesDetail: 1,
          aocRequestsDetail: 1,
          patientRequestsDetail: 1,
          is_tracking_on: 1,
          is_assign: 1,
          ambulanceTrackingsDetail: {
            _id: 1,
            location: 1,
            speed: 1,
            heading: 1,
            estimated_time: 1,
            location: 1,
            speed_color_code: {
              $switch: {
                branches: [
                  {
                    case: {
                      $and: [
                        {
                          $eq: [
                            { $toInt: "$ambulancesDetail.is_tracking_on" },
                            1,
                          ],
                        },
                        { $eq: [{ $toInt: "$ambulancesDetail.is_assign" }, 1] },
                      ],
                    },
                    then: "$ambulancesDetail.ambulanceTrackingsDetail.speed_color_code",
                  },
                  {
                    case: {
                      $and: [
                        {
                          $eq: [
                            { $toInt: "$ambulancesDetail.is_tracking_on" },
                            1,
                          ],
                        },
                        { $eq: [{ $toInt: "$ambulancesDetail.is_assign" }, 0] },
                      ],
                    },
                    then: configure.trackingAssignColor.TR_1_ASN_0,
                  },
                  {
                    case: {
                      $and: [
                        {
                          $eq: [
                            { $toInt: "$ambulancesDetail.is_tracking_on" },
                            0,
                          ],
                        },
                        { $eq: [{ $toInt: "$ambulancesDetail.is_assign" }, 1] },
                      ],
                    },
                    then: configure.trackingAssignColor.TR_0_ASN_1,
                  },
                ],
                default: configure.trackingAssignColor.TR_0_ASN_1,
              },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: "$hospitalsDetail._id",
        full_name: { $first: "$hospitalsDetail.full_name" },
        name1: { $first: "$hospitalsDetail.name1" },
        name2: { $first: "$hospitalsDetail.name2" },
        ambulancesDetail: {
          $addToSet: {
            _id: "$ambulancesDetail._id",
            name1: "$ambulancesDetail.name1",
            name2: "$ambulancesDetail.name2",
            ambulance_box_code: "$ambulancesDetail.ambulance_box_code",
            ambulanceTypesDetail: "$ambulancesDetail.ambulanceTypesDetail",
            aocRequestsDetail: "$ambulancesDetail.aocRequestsDetail",
            patientRequestsDetail: "$ambulancesDetail.patientRequestsDetail",
            is_tracking_on: "$ambulancesDetail.is_tracking_on",
            is_assign: "$ambulancesDetail.is_assign",
            ambulanceTrackingsDetail:
              "$ambulancesDetail.ambulanceTrackingsDetail",
          },
        },
      },
    }
  );

  Collection.aggregate(AmbulancesListCondition)
    .then((data) => {
      res.send(
        configure.apiResp(true, 200, data, "", req.headers.isencryption)
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

exports.postAmbulanceDetail = (req, res) => {
  var getAmbulanceDetailCondition = [
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
        from: "hospitals",
        localField: "aocRequestsDetail.source._id",
        foreignField: "_id",
        as: "aocRequestsDetail.source.hospitalsDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.source.hospitalsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "hospitals",
        localField: "aocRequestsDetail.destination._id",
        foreignField: "_id",
        as: "aocRequestsDetail.destination.hospitalsDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.destination.hospitalsDetail",
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
        from: "drivers",
        localField: "aocRequestsDetail.driver_ids",
        foreignField: "_id",
        as: "aocRequestsDetail.driversDetail",
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
        from: "glass_macs",
        localField: "aocRequestsDetail.glass_id",
        foreignField: "_id",
        as: "aocRequestsDetail.glassMacsDetail",
      },
    },
    {
      $unwind: {
        path: "$aocRequestsDetail.glassMacsDetail",
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
      $project: {
        _id: 1,
        name1: 1,
        name2: 1,
        ambulance_phone: 1,
        number: 1,
        ambulance_box_code: 1,
        is_online: 1,
        tracking_server_url: String(process.env.TRACKING_SERVER_URL),
        is_assign: {
          $cond: [{ $ifNull: ["$aocRequestsDetail._id", false] }, 1, 0],
        },
        aocRequestsDetail: {
          _id: 1,
          is_trauma: 1,
          destination: {
            address: 1,
            hospitalsDetail: {
              _id: 1,
              name1: 1,
              name2: 1,
              full_name: 1,
              address: 1,
            },
          },
          source: {
            address: 1,
            hospitalsDetail: {
              _id: 1,
              name1: 1,
              name2: 1,
              full_name: 1,
              address: 1,
            },
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
          request_code: 1,
          fastTracksDetail: {
            _id: 1,
            name: 1,
          },
          doctorsDetail: {
            _id: 1,
            first_name: 1,
            last_name: 1,
          },
          driversDetail: {
            _id: 1,
            first_name: 1,
            last_name: 1,
          },
          nursesDetail: {
            _id: 1,
            first_name: 1,
            last_name: 1,
          },
          aocErStaffsDetail: {
            _id: 1,
            first_name: 1,
            last_name: 1,
          },
          aocEmsStaffsDetail: {
            _id: 1,
            first_name: 1,
            last_name: 1,
          },

          patientMonitorsDetail: {
            _id: 1,
            name: 1,
            type: 1,
            serial_number: 1,
            web_address: 1,
            web_view_url: 1,
            rtmp_url: {
              $cond: {
                if: {
                  $eq: [
                    "$aocRequestsDetail.patientMonitorsDetail.type",
                    "JENNY",
                  ],
                },
                then: {
                  $concat: [
                    "rtmp://",
                    String(process.env.MONITER_STREAMING_SERVER_IP),
                    ":1935/live/temp_",
                    {
                      $toString:
                        "$aocRequestsDetail.patientMonitorsDetail.serial_number",
                    },
                  ],
                },
                else: "",
              },
            },
            web_view: 1,
            web_port: 1,
            is_online: 1,
          },
          glassMacsDetail: {
            _id: 1,
            name: 1,
            mac_address: 1,
            is_online: 1,
            rtmp_url: {
              $cond: [
                { $ifNull: ["$aocRequestsDetail.glassMacsDetail._id", false] },
                {
                  $concat: [
                    "rtmp://stm.aocopt.com:1935/live/temp_",
                    {
                      $substr: [
                        { $toString: "$aocRequestsDetail.glassMacsDetail._id" },
                        {
                          $subtract: [
                            {
                              $strLenCP: {
                                $toString:
                                  "$aocRequestsDetail.glassMacsDetail._id",
                              },
                            },
                            5,
                          ],
                        },
                        {
                          $strLenCP: {
                            $toString: "$aocRequestsDetail.glassMacsDetail._id",
                          },
                        },
                      ],
                    },
                  ],
                },
                "",
              ],
            },
          },
        },
        patientRequestsDetail: {
          _id: 1,
          severity_level: 1,
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
                  then: configure.severityColor._1,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      2,
                    ],
                  },
                  then: configure.severityColor._2,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      3,
                    ],
                  },
                  then: configure.severityColor._3,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      4,
                    ],
                  },
                  then: configure.severityColor._4,
                },
                {
                  case: {
                    $eq: [
                      { $toInt: "$patientRequestsDetail.severity_level" },
                      5,
                    ],
                  },
                  then: configure.severityColor._5,
                },
              ],
              default: configure.severityColor._1,
            },
          },
          diagnosis_note: 1,
        },
        patientsDetail: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          age: 1,
          gender: 1,
        },
        is_tracking_on: {
          $cond: {
            if: {
              $gt: [
                {
                  $subtract: [
                    new Date(),
                    "$ambulanceTrackingsDetail.updatedAt",
                  ],
                },
                configure.AMB_TRAKCING_TIMEOUT,
              ],
            },
            then: 0,
            else: 1,
          },
        },
        // "direction_map" : "https://maps.googleapis.com/maps/api/staticmap?center=22.2763829,70.7780373&zoom=13&size=800x450&maptype=roadmap&path=color:0x0080FF80|weight:7|22.271057,70.767363|22.275465,70.777406&path=color:0xFF008080|weight:7|22.2738719,70.7556933|22.271057,70.767363&markers=color:blue%7Clabel:S%7C22.2738719,70.7556933&markers=color:red%7C22.271057,%2070.767363&markers=color:green%7Clabel:E%7C22.275465,%2070.777406&key=AIzaSyAIOJRDeFlwPICCvcabVmjoscJgVzs63Ls",
        medicalEquipmentsDetail: {
          _id: 1,
          name: 1,
          is_visible: 1,
          picture: 1,
          icon_image: 1,
        },
        ambulanceTrackingsDetail: {
          $ifNull: [
            {
              _id: "$ambulanceTrackingsDetail._id",
              location: "$ambulanceTrackingsDetail.location",
              heading: "$ambulanceTrackingsDetail.heading",
              speed: "$ambulanceTrackingsDetail.speed",
              estimated_time: {
                $toInt: "$ambulanceTrackingsDetail.estimated_time",
              },
              covered_distance: {
                $toInt: "$ambulanceTrackingsDetail.covered_distance",
              },
              speed_color_code: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $gt: [
                          { $toInt: "$ambulanceTrackingsDetail.speed" },
                          120,
                        ],
                      },
                      then: configure.speedColor.GT_120,
                    },
                    {
                      case: {
                        $gt: [
                          { $toInt: "$ambulanceTrackingsDetail.speed" },
                          80,
                        ],
                      },
                      then: configure.speedColor.GT_80_LTE_120,
                    },
                    {
                      case: {
                        $lte: [
                          { $toInt: "$ambulanceTrackingsDetail.speed" },
                          80,
                        ],
                      },
                      then: configure.speedColor.LTE_80,
                    },
                  ],
                  default: configure.speedColor.LTE_80,
                },
              },
            },
            {},
          ],
        },
        ambulanceImagesDetail: {
          $ifNull: ["$ambulanceImagesDetail.images", {}],
        },
      },
    },
    {
      $project: {
        _id: 1,
        name1: 1,
        name2: 1,
        ambulance_phone: 1,
        number: 1,
        ambulance_box_code: 1,
        is_online: 1,
        tracking_server_url: 1,
        is_assign: 1,
        aocRequestsDetail: 1,
        patientRequestsDetail: 1,
        patientsDetail: 1,
        is_tracking_on: 1,
        medicalEquipmentsDetail: 1,
        ambulanceTrackingsDetail: {
          _id: 1,
          location: 1,
          heading: 1,
          speed: 1,
          estimated_time: 1,
          covered_distance: 1,
          speed_color_code: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $eq: [{ $toInt: "$is_tracking_on" }, 1] },
                      { $eq: [{ $toInt: "$is_assign" }, 1] },
                    ],
                  },
                  then: "$ambulanceTrackingsDetail.speed_color_code",
                },
                {
                  case: {
                    $and: [
                      { $eq: [{ $toInt: "$is_tracking_on" }, 1] },
                      { $eq: [{ $toInt: "$is_assign" }, 0] },
                    ],
                  },
                  then: configure.trackingAssignColor.TR_1_ASN_0,
                },
                {
                  case: {
                    $and: [
                      { $eq: [{ $toInt: "$is_tracking_on" }, 0] },
                      { $eq: [{ $toInt: "$is_assign" }, 1] },
                    ],
                  },
                  then: configure.trackingAssignColor.TR_0_ASN_1,
                },
              ],
              default: configure.trackingAssignColor.TR_0_ASN_1,
            },
          },
        },
        ambulanceImagesDetail: 1,
      },
    },
  ];

  Ambulances.aggregate(getAmbulanceDetailCondition)
    .then((data) => {
      var resp = {};
      if (data.length) {
        resp.ambulance_data = data[0];
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
