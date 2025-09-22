const { redisClient } = require("../../../server");

const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const fcmPush = require("../../../config/fcm-push");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Patients = db.patients;
const PatientRequests = db.patient_requests;
const PatientMoniters = db.patient_monitors;
const AocRequests = db.aoc_requests;
const AmbulanceTrackings = db.ambulance_trackings;
const Ambulances = db.ambulances;
const FastTracks = db.fast_tracts;
const Devices = db.devices;
const GlassMacs = db.glass_macs;
const Drivers = db.drivers;
const Doctors = db.doctors;
const Nurses = db.nurses;
const Paramedics = db.paramedics;
const AocErStaffs = db.aoc_er_staffs;
const AocEmsStaffs = db.aoc_ems_staffs;
const AocUsers = db.aoc_users;
const Hospitals = db.hospitals;
const Designations = db.designations;
const AliveUsers = db.alive_users;

exports.postAmbulanceRequest = (req, res) => {
  new Promise(function (resolve, reject) {
    if (
      req.body.glass_id &&
      req.body.glass_id !== "" &&
      req.body.glass_id !== "null"
    ) {
      query = {
        glass_id: ObjectId(req.body.glass_id),
        $and: [
          { request_status: { $ne: "CANCELED" } },
          { request_status: { $ne: "COMPLETED" } },
        ],
      };
      AocRequests.findOne(query).then((data) => {
        if (data && data !== null) {
          res
            .status(201)
            .send(
              configure.apiResp(
                false,
                5002,
                {},
                "Glass assign recently",
                req.headers.isencryption
              )
            );
          reject;
        } else {
          resolve(true);
        }
      });
    } else {
      resolve(true);
    }
  })
    .then(function (data) {
      if (data) {
        if (
          req.body.moniter_id &&
          req.body.moniter_id !== "" &&
          req.body.moniter_id !== "null"
        ) {
          query = {
            moniter_id: ObjectId(req.body.moniter_id),
            $and: [
              { request_status: { $ne: "CANCELED" } },
              { request_status: { $ne: "COMPLETED" } },
            ],
          };
          return AocRequests.findOne(query).then((data) => {
            if (data && data !== null) {
              res
                .status(201)
                .send(
                  configure.apiResp(
                    false,
                    5001,
                    {},
                    "Moniter assign recently",
                    req.headers.isencryption
                  )
                );
              return false;
            } else {
              return true;
            }
          });
        } else {
          return true;
        }
      }
    })
    .then(function (data) {
      if (data) {
        if (
          req.body.fast_track_id &&
          req.body.fast_track_id !== "" &&
          req.body.fast_track_id !== "null"
        ) {
          query = {
            fast_track_id: ObjectId(req.body.fast_track_id),
            $and: [
              { request_status: { $ne: "CANCELED" } },
              { request_status: { $ne: "COMPLETED" } },
            ],
          };
          return AocRequests.findOne(query).then((data) => {
            if (data && data !== null) {
              res
                .status(201)
                .send(
                  configure.apiResp(
                    false,
                    5003,
                    {},
                    "Fasttrack assign recently",
                    req.headers.isencryption
                  )
                );
              return false;
            } else {
              return true;
            }
          });
        } else {
          return true;
        }
      }
    })
    .then(function (data) {
      if (data) {
        return AocRequests.findOne({
          $and: [
            { ambulance_id: ObjectId(req.body.ambulance_id) },
            { request_status: { $ne: "COMPLETED" } },
            { request_status: { $ne: "CANCELED" } },
          ],
        }).then((aoc_requests_data) => {
          if (aoc_requests_data) {
            res
              .status(201)
              .send(
                configure.apiResp(
                  true,
                  201,
                  {},
                  "Ambulance have an already ongoing request. Id : " +
                    aoc_requests_data._id,
                  req.headers.isencryption
                )
              );
          } else {
            return Patients.findOne({
              $and: [
                { unique_hn_code: String(req.body.unique_hn_code) },
                { unique_hn_code: { $ne: "" } },
              ],
            }).then((patients_data) => {
              // if (patients_data) {
              //     // redisClient.hmset(String(req.body.ambulance_id), 'patientsDetail', JSON.stringify(patients_data));
              //     return (patients_data._id);  // for HN code LOGIC...
              // } else
              if (
                req.body.patient_request_id &&
                req.body.patient_request_id !== "null"
              ) {
                var patients = {
                  first_name: req.body.first_name,
                  last_name: req.body.last_name ? req.body.last_name : "",
                  age:
                    Boolean(req.body.age) && req.body.age !== "null"
                      ? req.body.age
                      : 0,
                  gender:
                    Boolean(req.body.gender) && req.body.gender !== "null"
                      ? req.body.gender
                      : 2,
                  unique_hn_code: req.body.unique_hn_code
                    ? req.body.unique_hn_code
                    : "",
                };

                Patients.findOneAndUpdate(
                  { _id: ObjectId(req.body.patient_id) },
                  { $set: patients },
                  { new: true }
                ).then((patients_data) => {
                  // redisClient.hmset(String(req.body.ambulance_id), 'patientsDetail', JSON.stringify(patients_data));
                });
                return req.body.patient_id;
              } else {
                var patients = new Patients({
                  first_name: req.body.first_name,
                  last_name: req.body.last_name ? req.body.last_name : "",
                  age:
                    Boolean(req.body.age) && req.body.age !== "null"
                      ? req.body.age
                      : 0,
                  gender:
                    Boolean(req.body.gender) && req.body.gender !== "null"
                      ? req.body.gender
                      : 2,
                  unique_hn_code: req.body.unique_hn_code
                    ? req.body.unique_hn_code
                    : "",
                });

                return patients
                  .save(patients)
                  .then((data) => {
                    return data._id;
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
                            "Some error occurred while creating Patient.",
                          req.headers.isencryption
                        )
                      );
                  });
              }
            });
          }
        });
      }
    })
    .then(function (patient_id) {
      if (patient_id) {
        var patient_requests = new PatientRequests({
          patient_id: ObjectId(patient_id),
          sickness_type: req.body.sickness_type,
          severity_level: req.body.severity_level,
          hospital_id: req.body.source_hospital_id,
          is_trauma: Boolean(req.body.is_trauma) ? 1 : 0,
          diagnosis_note: req.body.diagnosis_note,
          request_status: "START_OPERATION",
        });

        if (req.body.request_type == "EMS") {
          req.body.destination = JSON.parse(req.body.destination);
          patient_requests["source"] = {
            address: req.body.destination.address,
            location: {
              lat: req.body.destination.location.lat,
              lon: req.body.destination.location.lon,
            },
          };
        } else {
          patient_requests["source"] = {
            _id: req.body.source_hospital_id,
          };
        }

        if (
          req.body.patient_request_id &&
          req.body.patient_request_id !== "null"
        ) {
          var patient_requests = {
            sickness_type: req.body.sickness_type,
            severity_level: req.body.severity_level,
            hospital_id: req.body.source_hospital_id,
            is_trauma: Boolean(req.body.is_trauma) ? 1 : 0,
            diagnosis_note: req.body.diagnosis_note,
            request_status: "START_OPERATION",
          };

          return PatientRequests.findOneAndUpdate(
            { _id: req.body.patient_request_id },
            { $set: patient_requests },
            { new: true }
          ).then((patient_requests_data) => {
            // redisClient.hmset(String(req.body.ambulance_id), 'patientRequestsDetail', JSON.stringify(patient_requests_data));
            return req.body.patient_request_id;
          });
        } else {
          return patient_requests
            .save(patient_requests)
            .then((patient_requests_data) => {
              // redisClient.hmsetS(String(req.body.ambulance_id), 'patientRequestsDetail', JSON.stringify(patient_requests_data));
              return patient_requests_data._id;
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
                      "Some error occurred while creating Patient Request.",
                    req.headers.isencryption
                  )
                );
            });
        }
      }
    })
    .then(function (patient_request_id) {
      let ambulance_assign_datetime = new Date();
      if (patient_request_id) {
        Designations.findOne({ name1: "Aoc Users" }).then(
          (designation_data) => {
            var aoc_requests = new AocRequests({
              request_type: req.body.request_type,
              ambulance_id: ObjectId(req.body.ambulance_id),
              ambulance_assign_datetime: ambulance_assign_datetime,
              request_status: "OPERATION_ASSIGNED",
              patient_request_id: ObjectId(patient_request_id),
              creater_id: ObjectId(req.body.user_id),
              creater_type: ObjectId(designation_data._id),
            });

            if (
              req.body.fast_track_id &&
              String(req.body.fast_track_id) !== "" &&
              req.body.fast_track_id !== "null"
            ) {
              aoc_requests["fast_track_id"] = ObjectId(req.body.fast_track_id);
            }

            if (
              req.body.request_note &&
              String(req.body.request_note) !== "" &&
              req.body.request_note !== "null"
            ) {
              aoc_requests["request_note"] = String(req.body.request_note);
            }

            if (String(req.body.driver_ids) !== "") {
              var driverIdsArr = String(req.body.driver_ids).split(",");
              var driver_ids = driverIdsArr.map((e) => {
                return ObjectId(e);
              });
              aoc_requests["driver_ids"] = driver_ids;
            }

            if (String(req.body.doctor_ids) !== "") {
              var doctorIdsArr = String(req.body.doctor_ids).split(",");
              var doctor_ids = doctorIdsArr.map((e) => {
                return ObjectId(e);
              });
              aoc_requests["doctor_ids"] = doctor_ids;
            }

            if (String(req.body.nurse_ids) !== "") {
              var nurseIdsArr = String(req.body.nurse_ids).split(",");
              var nurse_ids = nurseIdsArr.map((e) => {
                return ObjectId(e);
              });
              aoc_requests["nurse_ids"] = nurse_ids;
            }

            if (String(req.body.paramedic_ids) !== "") {
              var paramedicIdsArr = String(req.body.paramedic_ids).split(",");
              var paramedic_ids = paramedicIdsArr.map((e) => {
                return ObjectId(e);
              });
              aoc_requests["paramedic_ids"] = paramedic_ids;
            }

            if (String(req.body.er_ids) !== "") {
              var erIdsArr = String(req.body.er_ids).split(",");
              var er_ids = erIdsArr.map((e) => {
                return ObjectId(e);
              });
              aoc_requests["er_ids"] = er_ids;
            }

            if (String(req.body.ems_ids) !== "") {
              var emsIdsArr = String(req.body.ems_ids).split(",");
              var ems_ids = emsIdsArr.map((e) => {
                return ObjectId(e);
              });
              aoc_requests["ems_ids"] = ems_ids;
            }

            if (
              req.body.glass_id &&
              req.body.glass_id !== "" &&
              req.body.glass_id !== "null"
            ) {
              aoc_requests["glass_id"] = ObjectId(req.body.glass_id);
            }

            if (
              req.body.moniter_id &&
              req.body.moniter_id !== "" &&
              req.body.moniter_id !== "null"
            ) {
              aoc_requests["moniter_id"] = ObjectId(req.body.moniter_id);
            }

            if (
              req.body.patient_request_id &&
              req.body.patient_request_id !== "null"
            ) {
              AocRequests.findOne({
                patient_request_id: req.body.patient_request_id,
              }).then((data) => {
                data["ambulance_id"] = ObjectId(req.body.ambulance_id);
                data["request_status"] = "OPERATION_ASSIGNED";

                Ambulances.findOne({
                  _id: ObjectId(req.body.ambulance_id),
                }).then((ambulance_data) => {
                  request_code =
                    "ID-" +
                    String(req.body.request_type) +
                    "-" +
                    ("0" + new Date().getDate()).slice(-2) +
                    ("0" + (new Date().getMonth() + 1)).slice(-2) +
                    ("0" + new Date().getFullYear()).slice(-4) +
                    "-" +
                    String(ambulance_data.ambulance_box_code) +
                    "-" +
                    String(data.request_count);

                  data["request_code"] = request_code;
                  Hospitals.findOne({
                    _id: ObjectId(req.body.source_hospital_id),
                  }).then((source_hospital_data) => {
                    data["hospital_id"] = ObjectId(req.body.source_hospital_id);
                    data["source"] = {
                      _id: ObjectId(req.body.source_hospital_id),
                      location: {
                        lat: source_hospital_data["location"]["lat"],
                        lon: source_hospital_data["location"]["lon"],
                      },
                    };
                    if (req.body.request_type == "EMS") {
                      data["destination"] = {
                        address: req.body.destination.address,
                        location: {
                          lat: req.body.destination.location.lat
                            ? req.body.destination.location.lat
                            : 0,
                          lon: req.body.destination.location.lon
                            ? req.body.destination.location.lon
                            : 0,
                        },
                      };

                      AocRequests.findOneAndUpdate(
                        { _id: data._id },
                        { $set: data },
                        { new: true }
                      ).then((aoc_requests_data) => {
                        // redisClient.hmset(String(req.body.ambulance_id), 'aocRequestsDetail', JSON.stringify(patient_requests_data));
                      });
                      AmbulanceTrackings.findOneAndUpdate(
                        { ambulance_id: ObjectId(req.body.ambulance_id) },
                        {
                          $set: {
                            source_location: data["source"].location,
                            destination_location: data["destination"].location,
                          },
                        },
                        { new: true }
                      ).then((ambulance_trackings_data) => {
                        // redisClient.hmset(String(req.body.ambulance_id), 'ambulanceTrackingsDetail', JSON.stringify(ambulance_trackings_data));
                      });
                    } else {
                      Hospitals.findOne({
                        _id: ObjectId(req.body.destination_hospital_id),
                      }).then((destination_hospital_data) => {
                        data["destination"] = {
                          _id: ObjectId(req.body.destination_hospital_id),
                          location: {
                            lat: destination_hospital_data["location"]["lat"],
                            lon: destination_hospital_data["location"]["lon"],
                          },
                        };
                        AocRequests.findOneAndUpdate(
                          { _id: data._id },
                          { $set: data }
                        ).then();
                        AmbulanceTrackings.findOneAndUpdate(
                          { ambulance_id: ObjectId(req.body.ambulance_id) },
                          {
                            $set: {
                              source_location: data["source"].location,
                              destination_location:
                                data["destination"].location,
                            },
                          }
                        ).then((e) => {});
                      });
                    }
                  });
                  configure.getUserDetail(
                    { _id: ObjectId(data.creater_id) },
                    { _id: ObjectId(data.creater_type) },
                    {},
                    (user) => {
                      console.log("511 webuser")
                      // fcmPush.sendPush(user.designation_data.name1,user.user_data.device_token, 'ALIVE2', {unique_id : 2,state_id : 0 },"Operation Status","OPERATION_ASSIGNED");
                      configure.statusChangePushNotification(
                        data._id,
                        {
                          unique_id: 2,
                          state_id: String("OPERATION_ASSIGNED"),
                        },
                        "Operation Status",
                        "OPERATION_ASSIGNED"
                      );
                    }
                  );
                  var response = {};
                  response.user_detail = {};
                  response.user_detail._id = data._id;
                  res.send(
                    configure.apiResp(
                      true,
                      200,
                      response,
                      "",
                      req.headers.isencryption
                    )
                  );
                });
              });
            } else {
              aoc_requests.save(aoc_requests).then((data) => {
                Ambulances.findOne({ _id: ObjectId(req.body.ambulance_id) })
                  .then((ambulance_data) => {
                    request_code =
                      "ID-" +
                      String(req.body.request_type) +
                      "-" +
                      ("0" + new Date().getDate()).slice(-2) +
                      ("0" + (new Date().getMonth() + 1)).slice(-2) +
                      ("0" + new Date().getFullYear()).slice(-4) +
                      "-" +
                      String(ambulance_data.ambulance_box_code) +
                      "-" +
                      String(data.request_count);

                    data["request_code"] = request_code;
                    Hospitals.findOne({
                      _id: ObjectId(req.body.source_hospital_id),
                    }).then((source_hospital_data) => {
                      data["hospital_id"] = ObjectId(
                        req.body.source_hospital_id
                      );
                      data["source"] = {
                        _id: ObjectId(req.body.source_hospital_id),
                        location: {
                          lat: source_hospital_data["location"]["lat"],
                          lon: source_hospital_data["location"]["lon"],
                        },
                      };
                      if (req.body.request_type == "EMS") {
                        data["destination"] = {
                          address: req.body.destination.address,
                          location: {
                            lat: req.body.destination.location.lat
                              ? req.body.destination.location.lat
                              : 0,
                            lon: req.body.destination.location.lon
                              ? req.body.destination.location.lon
                              : 0,
                          },
                        };

                        AocRequests.findOneAndUpdate(
                          { _id: data._id },
                          { $set: data },
                          { new: true }
                        ).then((aoc_requests_data) => {
                          // redisClient.hmset(String(req.body.ambulance_id), 'aocRequestsDetail', JSON.stringify(aoc_requests_data));
                        });

                        AmbulanceTrackings.findOneAndUpdate(
                          { ambulance_id: ObjectId(req.body.ambulance_id) },
                          {
                            $set: {
                              source_location: data["source"].location,
                              destination_location:
                                data["destination"].location,
                            },
                          },
                          { new: true }
                        ).then((ambulance_trackings_data) => {
                          // redisClient.hmset(String(req.body.ambulance_id), 'ambulanceTrackingsDetail', JSON.stringify(ambulance_trackings_data));
                        });
                      } else {
                        Hospitals.findOne({
                          _id: ObjectId(req.body.destination_hospital_id),
                        }).then((destination_hospital_data) => {
                          data["destination"] = {
                            _id: ObjectId(req.body.destination_hospital_id),
                            location: {
                              lat: destination_hospital_data["location"]["lat"],
                              lon: destination_hospital_data["location"]["lon"],
                            },
                          };
                          AocRequests.findOneAndUpdate(
                            { _id: data._id },
                            { $set: data },
                            { new: true }
                          ).then((aoc_requests_data) => {
                            // redisClient.hmset(String(req.body.ambulance_id), 'aocRequestsDetail', JSON.stringify(aoc_requests_data));
                          });

                          AmbulanceTrackings.findOneAndUpdate(
                            { ambulance_id: ObjectId(req.body.ambulance_id) },
                            {
                              $set: {
                                source_location: data["source"].location,
                                destination_location:
                                  data["destination"].location,
                              },
                            },
                            { new: true }
                          ).then((ambulance_trackings_data) => {
                            // redisClient.hmset(String(req.body.ambulance_id), 'ambulanceTrackingsDetail', JSON.stringify(ambulance_trackings_data));
                          });
                        });
                      }
                    });

                    var response = {};
                    response.user_detail = {};
                    response.user_detail._id = data._id;
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
                          false,
                          500,
                          {},
                          err.message ||
                            "Some error occurred while  creating AocRequest.",
                          req.headers.isencryption
                        )
                      );
                  });
              });
            }
          }
        );
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postDriversList = (req, res) => {
  var getDriversListCondition = [
    {
      $match: {
        $and: [
          { isactive: 1 },
          { isdeleted: false },
          { hospital_id: ObjectId(req.body.hospital_id) },
        ],
      },
    },
    // {
    //     '$lookup': {
    //         'from': 'ambulances',
    //         'localField': 'hospital_id',
    //         'foreignField': 'hospital_id',
    //         'as': 'ambulancesDetail'
    //     }
    // },
    // {
    //     '$unwind': {
    //         "path": "$ambulancesDetail",
    //         "preserveNullAndEmptyArrays": false
    //     }
    // },
    {
      $lookup: {
        from: "aoc_requests",
        let: {
          driver_id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $in: [
                      "$$driver_id",
                      // "$driver_ids",
                      { $ifNull: ["$driver_ids", []] },
                    ],
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
        as: "aocRequestDetail",
      },
    },
    {
      $redact: {
        $cond: {
          if: { $gt: [{ $size: { $ifNull: ["$aocRequestDetail", []] } }, 0] },
          then: "$$PRUNE",
          else: "$$DESCEND",
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        first_name: { $first: "$first_name" },
        last_name: { $first: "$last_name" },
        createdAt: { $first: "$createdAt" },
      },
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        createdAt: 1,
      },
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
  ];

  Drivers.aggregate(getDriversListCondition)
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
            err.message || "Some error occurred while  retrieving Drivers.",
            req.headers.isencryption
          )
        );
    });
};

exports.postDoctorsList = (req, res) => {
  var getDoctorsListCondition = [
    {
      $match: {
        $and: [
          { isactive: 1 },
          { isdeleted: false },
          { hospital_id: ObjectId(req.body.hospital_id) },
        ],
      },
    },
    // {
    //     '$lookup': {
    //         'from': 'ambulances',
    //         'localField': 'hospital_id',
    //         'foreignField': 'hospital_id',
    //         'as': 'ambulancesDetail'
    //     }
    // },
    // {
    //     '$unwind': {
    //         "path": "$ambulancesDetail",
    //         "preserveNullAndEmptyArrays": false
    //     }
    // },
    {
      $lookup: {
        from: "aoc_requests",
        let: {
          doctor_id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $in: [
                      "$$doctor_id",
                      // "$doctor_ids"
                      { $ifNull: ["$doctor_ids", []] },
                    ],
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
        as: "aocRequestDetail",
      },
    },
    {
      $redact: {
        $cond: {
          if: { $gt: [{ $size: { $ifNull: ["$aocRequestDetail", []] } }, 0] },
          then: "$$PRUNE",
          else: "$$DESCEND",
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        first_name: { $first: "$first_name" },
        last_name: { $first: "$last_name" },
        createdAt: { $first: "$createdAt" },
      },
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        createdAt: 1,
      },
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
  ];

  Doctors.aggregate(getDoctorsListCondition)
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
            err.message || "Some error occurred while  retrieving Doctors.",
            req.headers.isencryption
          )
        );
    });
};

exports.postNursesList = (req, res) => {
  var getNursesListCondition = [
    {
      $match: {
        $and: [
          { isactive: 1 },
          { isdeleted: false },
          { hospital_id: ObjectId(req.body.hospital_id) },
        ],
      },
    },
    // {
    //     '$lookup': {
    //         'from': 'ambulances',
    //         'localField': 'hospital_id',
    //         'foreignField': 'hospital_id',
    //         'as': 'ambulancesDetail'
    //     }
    // },
    // {
    //     '$unwind': {
    //         "path": "$ambulancesDetail",
    //         "preserveNullAndEmptyArrays": false
    //     }
    // },
    {
      $lookup: {
        from: "aoc_requests",
        let: {
          nurse_id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $in: [
                      "$$nurse_id",
                      // "$nurse_ids",
                      { $ifNull: ["$nurse_ids", []] },
                    ],
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
        as: "aocRequestDetail",
      },
    },
    {
      $redact: {
        $cond: {
          if: { $gt: [{ $size: { $ifNull: ["$aocRequestDetail", []] } }, 0] },
          then: "$$PRUNE",
          else: "$$DESCEND",
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        first_name: { $first: "$first_name" },
        last_name: { $first: "$last_name" },
        createdAt: { $first: "$createdAt" },
      },
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        createdAt: 1,
      },
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
  ];

  Nurses.aggregate(getNursesListCondition)
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
            err.message || "Some error occurred while  retrieving Nurses.",
            req.headers.isencryption
          )
        );
    });
};

exports.postParamedicsList = (req, res) => {
  var getParamedicsListCondition = [
    {
      $match: {
        $and: [
          { isactive: 1 },
          { isdeleted: false },
          { hospital_id: ObjectId(req.body.hospital_id) },
        ],
      },
    },
    {
      $lookup: {
        from: "aoc_requests",
        let: {
          paramedic_id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $in: [
                      "$$paramedic_id",
                      // "$paramedic_ids",
                      { $ifNull: ["$paramedic_ids", []] },
                    ],
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
        as: "aocRequestDetail",
      },
    },
    {
      $redact: {
        $cond: {
          if: { $gt: [{ $size: { $ifNull: ["$aocRequestDetail", []] } }, 0] },
          then: "$$PRUNE",
          else: "$$DESCEND",
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        first_name: { $first: "$first_name" },
        last_name: { $first: "$last_name" },
        createdAt: { $first: "$createdAt" },
      },
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        createdAt: 1,
      },
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
  ];

  Paramedics.aggregate(getParamedicsListCondition)
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
            err.message || "Some error occurred while  retrieving Paramedics.",
            req.headers.isencryption
          )
        );
    });
};

exports.postAocErStaffsList = (req, res) => {
  var getAocErStaffsListCondition = [
    {
      $match: {
        $and: [
          { isactive: 1 },
          { isdeleted: false },
          { hospital_id: ObjectId(req.body.hospital_id) },
        ],
      },
    },
    // {
    //     '$lookup': {
    //         'from': 'ambulances',
    //         'localField': 'hospital_id',
    //         'foreignField': 'hospital_id',
    //         'as': 'ambulancesDetail'
    //     }
    // },
    // {
    //     '$unwind': {
    //         "path": "$ambulancesDetail",
    //         "preserveNullAndEmptyArrays": false
    //     }
    // },
    {
      $lookup: {
        from: "aoc_requests",
        let: {
          er_id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $in: [
                      "$$er_id",
                      // "$er_ids"
                      { $ifNull: ["$er_ids", []] },
                    ],
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
        as: "aocRequestDetail",
      },
    },
    {
      $redact: {
        $cond: {
          if: { $gt: [{ $size: { $ifNull: ["$aocRequestDetail", []] } }, 0] },
          then: "$$PRUNE",
          else: "$$DESCEND",
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        first_name: { $first: "$first_name" },
        last_name: { $first: "$last_name" },
        createdAt: { $first: "$createdAt" },
      },
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        createdAt: 1,
      },
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
  ];

  AocErStaffs.aggregate(getAocErStaffsListCondition)
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
            err.message || "Some error occurred while  retrieving AocErStaffs.",
            req.headers.isencryption
          )
        );
    });
};

exports.postAocEmsStaffsList = (req, res) => {
  var getAocEmsStaffsListCondition = [
    {
      $match: {
        $and: [
          { isactive: 1 },
          { isdeleted: false },
          { hospital_id: ObjectId(req.body.hospital_id) },
        ],
      },
    },
    // {
    //     '$lookup': {
    //         'from': 'ambulances',
    //         'localField': 'hospital_id',
    //         'foreignField': 'hospital_id',
    //         'as': 'ambulancesDetail'
    //     }
    // },
    // {
    //     '$unwind': {
    //         "path": "$ambulancesDetail",
    //         "preserveNullAndEmptyArrays": false
    //     }
    // },
    {
      $lookup: {
        from: "aoc_requests",
        let: {
          ems_id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $in: [
                      "$$ems_id",
                      // "$ems_ids"
                      { $ifNull: ["$ems_ids", []] },
                    ],
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
        as: "aocRequestDetail",
      },
    },
    {
      $redact: {
        $cond: {
          if: { $gt: [{ $size: { $ifNull: ["$aocRequestDetail", []] } }, 0] },
          then: "$$PRUNE",
          else: "$$DESCEND",
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        first_name: { $first: "$first_name" },
        last_name: { $first: "$last_name" },
        createdAt: { $first: "$createdAt" },
      },
    },
    {
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        createdAt: 1,
      },
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
  ];

  AocEmsStaffs.aggregate(getAocEmsStaffsListCondition)
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
            err.message ||
              "Some error occurred while  retrieving AocEmsStaffs.",
            req.headers.isencryption
          )
        );
    });
};

exports.getAocRequestsMembersList = (req, res) => {
  var getAocRequestsMembersListCondition = [
    {
      $match: {
        $and: [{ _id: ObjectId(req.body.aoc_request_id) }],
      },
    },
    {
      $lookup: {
        from: "doctors",
        localField: "doctor_ids",
        foreignField: "_id",
        as: "doctorsDetail",
      },
    },
    {
      $lookup: {
        from: "nurses",
        localField: "nurse_ids",
        foreignField: "_id",
        as: "nursesDetail",
      },
    },
    {
      $lookup: {
        from: "drivers",
        localField: "driver_ids",
        foreignField: "_id",
        as: "driversDetail",
      },
    },
    {
      $lookup: {
        from: "aoc_er_staffs",
        localField: "er_ids",
        foreignField: "_id",
        as: "aocErStaffsDetail",
      },
    },
    {
      $lookup: {
        from: "aoc_ems_staffs",
        localField: "ems_ids",
        foreignField: "_id",
        as: "aocEmsStaffsDetail",
      },
    },
    {
      $lookup: {
        from: "paramedics",
        localField: "paramedic_ids",
        foreignField: "_id",
        as: "paramedicsDetail",
      },
    },
    {
      $project: {
        _id: 1,
        moniter_id: 1,
        doctorsDetail: {
          _id: 1,
          first_name: 1,
          last_name: 1,
        },
        nursesDetail: {
          _id: 1,
          first_name: 1,
          last_name: 1,
        },
        driversDetail: {
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
        paramedicsDetail: {
          _id: 1,
          first_name: 1,
          last_name: 1,
        },
      },
    },
  ];

  AocRequests.aggregate(getAocRequestsMembersListCondition).then((data) => {
    PatientMoniters.findOne(
      { _id: ObjectId(data[0].moniter_id) },
      { name: 1, serial_number: 1 }
    ).then((patient_moniter_detail) => {
      if (data.length) {
        data[0]["patientMonitersDetail"] = patient_moniter_detail;
        res.send(
          configure.apiResp(true, 200, data[0], "", req.headers.isencryption)
        );
      } else {
        res.send(
          configure.apiResp(
            false,
            403,
            {},
            "Request Data not found.",
            req.headers.isencryption
          )
        );
      }
    });
  });
};

exports.postMonitersList = (req, res) => {
  var getMonitersListCondition = [
    {
      $match: {
        $and: [
          { isactive: 1 },
          { isdeleted: false },
          { _id: ObjectId(req.body.ambulance_id) },
        ],
      },
    },
    {
      $lookup: {
        from: "patient_monitors",
        let: {
          hospital_id: "$hospital_id",
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
        as: "patientMonitorsDetail",
      },
    },
    {
      $unwind: {
        path: "$patientMonitorsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "aoc_requests",
        let: {
          monitor_id: "$patientMonitorsDetail._id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$moniter_id", "$$monitor_id"],
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
        as: "aocRequestDetail",
      },
    },
    {
      $redact: {
        $cond: {
          if: { $gt: [{ $size: { $ifNull: ["$aocRequestDetail", []] } }, 0] },
          then: "$$PRUNE",
          else: "$$DESCEND",
        },
      },
    },
    {
      $group: {
        _id: "$patientMonitorsDetail._id",
        name: { $first: "$patientMonitorsDetail.name" },
        model: { $first: "$patientMonitorsDetail.model" },
        brand_name: { $first: "$patientMonitorsDetail.brand_name" },
        createdAt: { $first: "$patientMonitorsDetail.createdAt" },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ];

  Ambulances.aggregate(getMonitersListCondition)
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
            err.message ||
              "Some error occurred while  retrieving  Patient Monitors.",
            req.headers.isencryption
          )
        );
    });
};

exports.postGlassList = (req, res) => {
  var getGlassListCondition = [
    {
      $match: {
        $and: [
          { isactive: 1 },
          { isdeleted: false },
          { _id: ObjectId(req.body.ambulance_id) },
        ],
      },
    },
    {
      $lookup: {
        from: "glass_macs",
        let: {
          hospital_id: "$hospital_id",
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
        as: "glassMacsDetail",
      },
    },
    {
      $unwind: {
        path: "$glassMacsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "aoc_requests",
        let: {
          glass_id: "$glassMacsDetail._id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$glass_id", "$$glass_id"],
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
        as: "ambulancesDetails.aocRequestDetail",
      },
    },
    {
      $redact: {
        $cond: {
          if: {
            $gt: [
              {
                $size: { $ifNull: ["$ambulancesDetails.aocRequestDetail", []] },
              },
              0,
            ],
          },
          then: "$$PRUNE",
          else: "$$DESCEND",
        },
      },
    },
    {
      $group: {
        _id: "$glassMacsDetail._id",
        name: { $first: "$glassMacsDetail.name" },
        createdAt: { $first: "$glassMacsDetail.createdAt" },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ];

  Ambulances.aggregate(getGlassListCondition)
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
            err.message || "Some error occurred while  retrieving GlassMacs.",
            req.headers.isencryption
          )
        );
    });
};

exports.postFastTracksList = (req, res) => {
  var getFastTrackListCondition = [
    {
      $match: {
        $and: [{ isactive: 1 }, { isdeleted: false }],
      },
    },
    {
      $lookup: {
        from: "aoc_requests",
        let: {
          fast_track_id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$fast_track_id", "$$fast_track_id"],
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
        as: "ambulancesDetails.aocRequestDetail",
      },
    },
    {
      $redact: {
        $cond: {
          if: {
            $gt: [
              {
                $size: { $ifNull: ["$ambulancesDetails.aocRequestDetail", []] },
              },
              0,
            ],
          },
          then: "$$PRUNE",
          else: "$$DESCEND",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
      },
    },
  ];

  FastTracks.aggregate(getFastTrackListCondition)
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
            err.message || "Some error occurred while  retrieving FastTracks.",
            req.headers.isencryption
          )
        );
    });
};

exports.patientRequestList = (req, res) => {
  var current_page = Number(req.body.current_page);
  var page_size = Number(req.body.page_size);

  var PatientRequestsListCondition = [
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
        from: "patient_requests",
        let: {
          zone_ids: "$zone_ids",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $in: ["$zone_id", "$$zone_ids"],
                  },
                  {
                    if: { $ifNull: ["$hospital_id", true] },
                    then: false,
                    else: true,
                  },
                  {
                    $eq: ["$request_status", "IDEAL"],
                  },
                ],
              },
            },
          },
        ],
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
        as: "patientRequestsDetail.patientsDetail",
      },
    },
    {
      $unwind: {
        path: "$patientRequestsDetail.patientsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $and: [
          {
            $or: [
              {
                "patientRequestsDetail.sickness_type": {
                  $regex: String(req.body.search_value),
                  $options: "i",
                },
              },
              {
                "patientRequestsDetail.patientsDetail.first_name": {
                  $regex: String(req.body.search_value),
                  $options: "i",
                },
              },
              {
                "patientRequestsDetail.patientsDetail.last_name": {
                  $regex: String(req.body.search_value),
                  $options: "i",
                },
              },
            ],
          },
        ],
      },
    },
    {
      $lookup: {
        from: "aoc_requests",
        localField: "patientRequestsDetail._id",
        foreignField: "patient_request_id",
        as: "patientRequestsDetail.aocRequestsDetail",
      },
    },
    {
      $unwind: {
        path: "$patientRequestsDetail.aocRequestsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    { $count: "count" },
  ];

  AocUsers.aggregate(PatientRequestsListCondition)
    .then((count) => {
      PatientRequestsListCondition.splice(-1, 1);
      PatientRequestsListCondition.push({
        $project: {
          _id: 0,
          patientRequestsDetail: {
            _id: 1,
            aocRequestsDetail: { _id: 1 },
            _id: 1,
            source: {
              address: 1,
            },
            destination: {
              address: 1,
            },
            hospital_id: 1,
            zone_id: 1,
            sickness_type: 1,
            patientsDetail: {
              _id: 1,
              first_name: 1,
              last_name: 1,
            },
            createdAt: 1,
          },
        },
      });
      PatientRequestsListCondition.push({
        $sort: { "patientRequestsDetail.createdAt": -1 },
      });
      PatientRequestsListCondition.push({
        $skip: Number((current_page - 1) * page_size),
      });
      PatientRequestsListCondition.push({ $limit: Number(page_size) });
      AocUsers.aggregate(PatientRequestsListCondition)
        .then((data) => {
          var response = {};
          response["data"] = data;
          response["count"] = count[0] ? count[0].count : 0;
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
                err.message ||
                  "Some error occurred while  retrieving PatientRequests.",
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
            {},
            err.message ||
              "Some error occurred while  retrieving PatientRequests.",
            req.headers.isencryption
          )
        );
    });
};

exports.AocRequestsList = (req, res) => {
  if (req.body.user_id) {
    var AocRequestsListCondition = [];

    AocRequestsListCondition.push(
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
          localField: "hospitalsDetail._id",
          foreignField: "hospital_id",
          as: "hospitalsDetail.ambulancesDetail",
        },
      },
      { $unwind: "$hospitalsDetail.ambulancesDetail" },
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
      }
    );
    if (
      req.body.request_status &&
      req.body.request_status !== undefined &&
      req.body.request_status !== "undefined"
    ) {
      AocRequestsListCondition[AocRequestsListCondition.length - 1]["$lookup"][
        "pipeline"
      ][0]["$match"]["$expr"]["$and"].push({
        $eq: ["$request_status", String(req.body.request_status)],
      });
    }
    if (
      req.body.search_value &&
      req.body.search_value !== undefined &&
      req.body.search_value !== "undefined"
    ) {
      AocRequestsListCondition.push({
        $match: {
          $or: [
            {
              "hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_code":
                { $regex: String(req.body.search_value), $options: "i" },
            },
            {
              "hospitalsDetail.ambulancesDetail.ambulance_box_code": {
                $regex: String(req.body.search_value),
                $options: "i",
              },
            },
            {
              "hospitalsDetail.ambulancesDetail.name2": {
                $regex: String(req.body.search_value),
                $options: "i",
              },
            },
            {
              "hospitalsDetail.ambulancesDetail.name1": {
                $regex: String(req.body.search_value),
                $options: "i",
              },
            },
          ],
        },
      });
    }
    AocRequestsListCondition.push({
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail",
        preserveNullAndEmptyArrays: true,
      },
    });
    if (
      req.body.request_status &&
      req.body.request_status !== undefined &&
      req.body.request_status !== "undefined"
    ) {
      AocRequestsListCondition[AocRequestsListCondition.length - 1]["$unwind"][
        "preserveNullAndEmptyArrays"
      ] = false;
    }
    AocRequestsListCondition.push(
      {
        $lookup: {
          from: "patient_monitors",
          localField:
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.moniter_id",
          foreignField: "_id",
          as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
        },
      },
      {
        $unwind: {
          path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "patient_requests",
          localField:
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patient_request_id",
          foreignField: "_id",
          as: "hospitalsDetail.ambulancesDetail.patientRequestsDetail",
        },
      },
      {
        $unwind: {
          path: "$hospitalsDetail.ambulancesDetail.patientRequestsDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "ambulance_trackings",
          localField: "hospitalsDetail.ambulancesDetail._id",
          foreignField: "ambulance_id",
          as: "hospitalsDetail.ambulancesDetail.ambulanceTrackingsDetail",
        },
      },
      {
        $unwind: {
          path: "$hospitalsDetail.ambulancesDetail.ambulanceTrackingsDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$hospitalsDetail.ambulancesDetail._id",
          name1: { $first: "$hospitalsDetail.ambulancesDetail.name1" },
          name2: { $first: "$hospitalsDetail.ambulancesDetail.name2" },
          number: { $first: "$hospitalsDetail.ambulancesDetail.number" },
          is_online: { $first: "$hospitalsDetail.ambulancesDetail.is_online" },
          ambulance_box_code: {
            $first: "$hospitalsDetail.ambulancesDetail.ambulance_box_code",
          },
          aocRequestsDetail: {
            $first: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail",
          },
          patientRequestsDetail: {
            $first: "$hospitalsDetail.ambulancesDetail.patientRequestsDetail",
          },
          ambulanceTrackingsDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.ambulanceTrackingsDetail",
          },
        },
      },
      {
        $project: {
          _id: 1,
          name1: 1,
          name2: 1,
          number: 1,
          is_online: 1,
          ambulance_box_code: { $toInt: "$ambulance_box_code" },
          aocRequestsDetail: {
            _id: 1,
            request_status: 1,
            request_type: 1,
            createdAt: 1,
            patientMonitorsDetail: 1,
            // {
            //     "web_view":{$ifNull : ["$hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientMonitorsDetail.web_view",""]},
            //     "type":"$hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientMonitorsDetail.type",
            //     'serial_number': {
            //         $cond: [
            //             { $ifNull: [
            //                 "$aocRequestsDetail.patientMonitorsDetail.serial_number"
            //                 , false] },
            //             "$aocRequestsDetail.patientMonitorsDetail.serial_number",
            //             ''
            //         ]
            //     }
            // }
          },
          patientRequestsDetail: {
            _id: "$patientRequestsDetail._id",
            severity_level: "$patientRequestsDetail.severity_level",
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
          },
          is_assign: {
            $cond: [{ $ifNull: ["$aocRequestsDetail._id", false] }, 1, 0],
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
          ambulanceTrackingsDetail: {
            _id: 1,
            speed: 1,
            updatedAt: 1,
            estimated_time: {
              $toInt: "$ambulanceTrackingsDetail.estimated_time",
            },
            speed_color_code: {
              $switch: {
                branches: [
                  {
                    case: {
                      $gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 120],
                    },
                    then: configure.speedColorPanel.GT_120,
                  },
                  {
                    case: {
                      $gt: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80],
                    },
                    then: configure.speedColorPanel.GT_80_LTE_120,
                  },
                  {
                    case: {
                      $lte: [{ $toInt: "$ambulanceTrackingsDetail.speed" }, 80],
                    },
                    then: configure.speedColorPanel.LTE_80,
                  },
                ],
                default: configure.speedColorPanel.LTE_80,
              },
            },
          },
        },
      },
      {
        $match: {
          $or: [{ is_tracking_on: 1 }, { is_assign: 1 }],
        },
      },
      {
        $project: {
          _id: 1,
          name1: 1,
          name2: 1,
          ambulance_box_code: 1,
          aocRequestsDetail: 1,
          patientRequestsDetail: 1,
          is_tracking_on: 1,
          is_assign: 1,
          ambulanceTrackingsDetail: {
            _id: 1,
            speed: 1,
            estimated_time: 1,
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
                    then: configure.trackingAssignColorPanel.TR_1_ASN_0,
                  },
                  {
                    case: {
                      $and: [
                        { $eq: [{ $toInt: "$is_tracking_on" }, 0] },
                        { $eq: [{ $toInt: "$is_assign" }, 1] },
                      ],
                    },
                    then: configure.trackingAssignColorPanel.TR_0_ASN_1,
                  },
                ],
                default: configure.trackingAssignColorPanel.TR_0_ASN_1,
              },
            },
          },
          driversDetail: 1,
        },
      },
      { $sort: { is_assign: -1, is_tracking_on: -1, ambulance_box_code: -1 } }
    );
    if (
      req.body.sort_value &&
      req.body.sort_value !== undefined &&
      req.body.sort_value !== "undefined"
    ) {
      AocRequestsListCondition[AocRequestsListCondition.length - 1]["$sort"] = {
        ...AocRequestsListCondition[AocRequestsListCondition.length - 1][
          "$sort"
        ],
        ...JSON.parse(req.body.sort_value),
      };
    }

    AocUsers.aggregate(AocRequestsListCondition)
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
              err.message ||
                "Some error occurred while  retrieving AocRequests.",
              req.headers.isencryption
            )
          );
      });
  } else {
    var response = {};
    response.message = "userid required !";
    res.send(
      configure.apiResp(true, 200, response, "", req.headers.isencryption)
    );
  }
};

exports.aocRequestHistory = (req, res) => {
  var current_page = Number(req.body.current_page);
  var page_size = Number(req.body.page_size);

  var AocRequestsHistoryListCondition = [
    {
      $match: {
        _id: ObjectId(req.body.user_id),
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
    {
      $unwind: {
        path: "$hospitalsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "ambulances",
        localField: "hospitalsDetail._id",
        foreignField: "hospital_id",
        as: "hospitalsDetail.ambulancesDetail",
      },
    },
    {
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "aoc_requests",
        localField: "hospitalsDetail.ambulancesDetail._id",
        foreignField: "ambulance_id",
        as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail",
      },
    },
    {
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail",
        preserveNullAndEmptyArrays: false,
      },
    },
  ];

  if (req.body.request_status && req.body.request_status !== "") {
    AocRequestsHistoryListCondition.push({
      $match: {
        "hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_status":
          String(req.body.request_status),
      },
    });
  } else {
    AocRequestsHistoryListCondition.push({
      $match: {
        $or: [
          {
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_status":
              "COMPLETED",
          },
          {
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_status":
              "CANCELED",
          },
        ],
      },
    });
  }

  if (req.body.request_type && req.body.request_type !== "") {
    AocRequestsHistoryListCondition.push({
      $match: {
        "hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_type":
          String(req.body.request_type).toUpperCase(),
      },
    });
  }

  AocRequestsHistoryListCondition.push(
    {
      $lookup: {
        from: "hospitals",
        localField:
          "hospitalsDetail.ambulancesDetail.aocRequestsDetail.source._id",
        foreignField: "_id",
        as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.sourceHospitalsDetail",
      },
    },
    {
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.sourceHospitalsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "hospitals",
        localField:
          "hospitalsDetail.ambulancesDetail.aocRequestsDetail.destination._id",
        foreignField: "_id",
        as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.destinationHospitalsDetail",
      },
    },
    {
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.destinationHospitalsDetail",
        preserveNullAndEmptyArrays: true,
      },
    }
  );

  if (req.body.hospital_id && req.body.hospital_id !== "") {
    AocRequestsHistoryListCondition.push({
      $match: {
        "hospitalsDetail.ambulancesDetail.aocRequestsDetail.sourceHospitalsDetail._id":
          ObjectId(req.body.hospital_id),
      },
    });
  }

  if (req.body.zone_id && req.body.zone_id !== "") {
    AocRequestsHistoryListCondition.push(
      {
        $lookup: {
          from: "aoc_zones",
          localField:
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.sourceHospitalsDetail.zone_id",
          foreignField: "_id",
          as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.sourceHospitalsDetail.aocZonesDetail",
        },
      },
      {
        $unwind: {
          path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.sourceHospitalsDetail.aocZonesDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "hospitalsDetail.ambulancesDetail.aocRequestsDetail.sourceHospitalsDetail.aocZonesDetail._id":
            ObjectId(req.body.zone_id),
        },
      }
    );
  }

  AocRequestsHistoryListCondition.push({ $count: "count" });

  AocUsers.aggregate(AocRequestsHistoryListCondition)
    .then((count) => {
      AocRequestsHistoryListCondition.splice(-1, 1);

      AocRequestsHistoryListCondition.push(
        {
          $lookup: {
            from: "patient_requests",
            localField:
              "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patient_request_id",
            foreignField: "_id",
            as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail",
          },
        },
        {
          $unwind: {
            path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "patients",
            localField:
              "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patient_id",
            foreignField: "_id",
            as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
          },
        },
        {
          $unwind: {
            path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
            preserveNullAndEmptyArrays: true,
          },
        }
      );

      AocRequestsHistoryListCondition.push(
        {
          $lookup: {
            from: "ambulances",
            localField:
              "hospitalsDetail.ambulancesDetail.aocRequestsDetail.ambulance_id",
            foreignField: "_id",
            as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.ambulancesDetail",
          },
        },
        {
          $unwind: {
            path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.ambulancesDetail",
            preserveNullAndEmptyArrays: true,
          },
        }
      );

      AocRequestsHistoryListCondition.push(
        {
          $lookup: {
            from: "patient_monitors",
            localField:
              "hospitalsDetail.ambulancesDetail.aocRequestsDetail.moniter_id",
            foreignField: "_id",
            as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
          },
        },
        {
          $unwind: {
            path: "$c",
            preserveNullAndEmptyArrays: true,
          },
        }
      );

      AocRequestsHistoryListCondition.push({
        $lookup: {
          from: "doctors",
          localField:
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.doctor_ids",
          foreignField: "_id",
          as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.doctorsDetail",
        },
      });

      AocRequestsHistoryListCondition.push({
        $lookup: {
          from: "nurses",
          localField:
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.nurse_ids",
          foreignField: "_id",
          as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.nursesDetail",
        },
      });

      AocRequestsHistoryListCondition.push({
        $lookup: {
          from: "drivers",
          localField:
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.driver_ids",
          foreignField: "_id",
          as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.driversDetail",
        },
      });

      AocRequestsHistoryListCondition.push({
        $lookup: {
          from: "aoc_er_staffs",
          localField:
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.er_ids",
          foreignField: "_id",
          as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.aocErStaffsDetail",
        },
      });

      AocRequestsHistoryListCondition.push({
        $lookup: {
          from: "aoc_ems_staffs",
          localField:
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.ems_ids",
          foreignField: "_id",
          as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.aocEmsStaffsDetail",
        },
      });

      AocRequestsHistoryListCondition.push({
        $group: {
          _id: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail._id",
          request_status: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_status",
          },
          patientsDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
          },
          ambulancesDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.ambulancesDetail",
          },
          // 'sourceHospitalsDetail': { '$first': '$sourceHospitalsDetail' },
          destinationHospitalsDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.destinationHospitalsDetail",
          },
          destinationDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.destination",
          },
          doctorsDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.doctorsDetail",
          },
          nursesDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.nursesDetail",
          },
          driversDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.driversDetail",
          },
          aocErStaffsDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.aocErStaffsDetail",
          },
          aocEmsStaffsDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.aocEmsStaffsDetail",
          },
          patientMonitorsDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
          },
          createdAt: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.createdAt",
          },
          updatedAt: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.updatedAt",
          },
          request_code: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_code",
          },
        },
      });

      AocRequestsHistoryListCondition.push({ $sort: { updatedAt: -1 } });
      AocRequestsHistoryListCondition.push({
        $skip: Number((current_page - 1) * page_size),
      });
      AocRequestsHistoryListCondition.push({ $limit: Number(page_size) });

      AocUsers.aggregate(AocRequestsHistoryListCondition)
        .then((data) => {
          var response = {};
          response["data"] = data;
          response["count"] = count[0] ? count[0].count : 0;
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
                err.message ||
                  "Some error occurred while  retrieving Ambulances.",
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
            {},
            err.message || "Some error occurred while  retrieving Ambulances.",
            req.headers.isencryption
          )
        );
    });
};

exports.aocOngoingRequestHistory = (req, res) => {
  var current_page = Number(req.body.current_page);
  var page_size = Number(req.body.page_size);

  var AocRequestsHistoryListCondition = [
    {
      $match: {
        _id: ObjectId(req.body.user_id),
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
    {
      $unwind: {
        path: "$hospitalsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "ambulances",
        localField: "hospitalsDetail._id",
        foreignField: "hospital_id",
        as: "hospitalsDetail.ambulancesDetail",
      },
    },
    {
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "aoc_requests",
        localField: "hospitalsDetail.ambulancesDetail._id",
        foreignField: "ambulance_id",
        as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail",
      },
    },
    {
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail",
        preserveNullAndEmptyArrays: false,
      },
    },
  ];

  if (req.body.request_status && req.body.request_status !== "") {
    AocRequestsHistoryListCondition.push({
      $match: {
        "hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_status":
          req.body.request_status,
      },
    });
  } else {
    AocRequestsHistoryListCondition.push({
      $match: {
        $and: [
          {
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_status":
              { $ne: "COMPLETED" },
          },
          {
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_status":
              { $ne: "CANCELED" },
          },
        ],
      },
    });
  }

  if (req.body.request_type && req.body.request_type !== "") {
    AocRequestsHistoryListCondition.push({
      $match: {
        "hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_type":
          req.body.request_type,
      },
    });
  }

  AocRequestsHistoryListCondition.push(
    {
      $lookup: {
        from: "hospitals",
        localField:
          "hospitalsDetail.ambulancesDetail.aocRequestsDetail.source._id",
        foreignField: "_id",
        as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.sourceHospitalsDetail",
      },
    },
    {
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.sourceHospitalsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "hospitals",
        localField:
          "hospitalsDetail.ambulancesDetail.aocRequestsDetail.destination._id",
        foreignField: "_id",
        as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.destinationHospitalsDetail",
      },
    },
    {
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.destinationHospitalsDetail",
        preserveNullAndEmptyArrays: true,
      },
    }
  );

  if (req.body.hospital_id && req.body.hospital_id !== "") {
    AocRequestsHistoryListCondition.push({
      $match: {
        "hospitalsDetail.ambulancesDetail.aocRequestsDetail.sourceHospitalsDetail._id":
          ObjectId(req.body.hospital_id),
      },
    });
  }

  if (req.body.zone_id && req.body.zone_id !== "") {
    AocRequestsHistoryListCondition.push(
      {
        $lookup: {
          from: "aoc_zones",
          localField:
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.sourceHospitalsDetail.zone_id",
          foreignField: "_id",
          as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.aocZonesDetail",
        },
      },
      {
        $unwind: {
          path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.aocZonesDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          "hospitalsDetail.ambulancesDetail.aocRequestsDetail.aocZonesDetail._id":
            ObjectId(req.body.zone_id),
        },
      }
    );
  }

  AocRequestsHistoryListCondition.push({ $count: "count" });

  AocUsers.aggregate(AocRequestsHistoryListCondition)
    .then((count) => {
      AocRequestsHistoryListCondition.splice(-1, 1);

      AocRequestsHistoryListCondition.push(
        {
          $lookup: {
            from: "patient_requests",
            localField:
              "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patient_request_id",
            foreignField: "_id",
            as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail",
          },
        },
        {
          $unwind: {
            path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "patients",
            localField:
              "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patient_id",
            foreignField: "_id",
            as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
          },
        },
        {
          $unwind: {
            path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
            preserveNullAndEmptyArrays: true,
          },
        }
      );

      AocRequestsHistoryListCondition.push(
        {
          $lookup: {
            from: "ambulances",
            localField:
              "hospitalsDetail.ambulancesDetail.aocRequestsDetail.ambulance_id",
            foreignField: "_id",
            as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.ambulancesDetail",
          },
        },
        {
          $unwind: {
            path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.ambulancesDetail",
            preserveNullAndEmptyArrays: true,
          },
        }
      );

      AocRequestsHistoryListCondition.push(
        {
          $lookup: {
            from: "patient_monitors",
            localField:
              "hospitalsDetail.ambulancesDetail.aocRequestsDetail.moniter_id",
            foreignField: "_id",
            as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
          },
        },
        {
          $unwind: {
            path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
            preserveNullAndEmptyArrays: true,
          },
        }
      );

      AocRequestsHistoryListCondition.push(
        {
          $lookup: {
            from: "glass_macs",
            localField:
              "hospitalsDetail.ambulancesDetail.aocRequestsDetail.glass_id",
            foreignField: "_id",
            as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.glassMacsDetail",
          },
        },
        {
          $unwind: {
            path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.glassMacsDetail",
            preserveNullAndEmptyArrays: true,
          },
        }
      );

      AocRequestsHistoryListCondition.push({
        $lookup: {
          from: "doctors",
          localField:
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.doctor_ids",
          foreignField: "_id",
          as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.doctorsDetail",
        },
      });

      AocRequestsHistoryListCondition.push({
        $lookup: {
          from: "nurses",
          localField:
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.nurse_ids",
          foreignField: "_id",
          as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.nursesDetail",
        },
      });

      AocRequestsHistoryListCondition.push({
        $lookup: {
          from: "drivers",
          localField:
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.driver_ids",
          foreignField: "_id",
          as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.driversDetail",
        },
      });

      AocRequestsHistoryListCondition.push({
        $lookup: {
          from: "aoc_er_staffs",
          localField:
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.er_ids",
          foreignField: "_id",
          as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.aocErStaffsDetail",
        },
      });

      AocRequestsHistoryListCondition.push({
        $lookup: {
          from: "aoc_ems_staffs",
          localField:
            "hospitalsDetail.ambulancesDetail.aocRequestsDetail.ems_ids",
          foreignField: "_id",
          as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.aocEmsStaffsDetail",
        },
      });

      AocRequestsHistoryListCondition.push({
        $group: {
          _id: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail._id",
          ambulance_id: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.ambulance_id",
          },
          request_status: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_status",
          },
          patientsDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
          },
          ambulancesDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.ambulancesDetail",
          },
          // 'sourceHospitalsDetail': { '$first': '$sourceHospitalsDetail' },
          destinationHospitalsDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.destinationHospitalsDetail",
          },
          destinationDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.destination",
          },
          doctorsDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.doctorsDetail",
          },
          nursesDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.nursesDetail",
          },
          driversDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.driversDetail",
          },
          aocErStaffsDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.aocErStaffsDetail",
          },
          aocEmsStaffsDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.aocEmsStaffsDetail",
          },
          patientMonitorsDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientMonitorsDetail",
          },
          glassMacsDetail: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.glassMacsDetail",
          },
          createdAt: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.createdAt",
          },
          updatedAt: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.updatedAt",
          },
          request_code: {
            $first:
              "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_code",
          },
        },
      });

      AocRequestsHistoryListCondition.push({ $sort: { createdAt: -1 } });
      AocRequestsHistoryListCondition.push({
        $skip: Number((current_page - 1) * page_size),
      });
      AocRequestsHistoryListCondition.push({ $limit: Number(page_size) });

      AocUsers.aggregate(AocRequestsHistoryListCondition)
        .then((data) => {
          var response = {};
          response["data"] = data;
          response["count"] = count[0] ? count[0].count : 0;
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
                err.message ||
                  "Some error occurred while  retrieving Ambulances.",
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
            {},
            err.message || "Some error occurred while  retrieving Ambulances.",
            req.headers.isencryption
          )
        );
    });
};

exports.getTotalAocRequest = (req, res) => {
  console.log("getTotalAocRequest req.body", req.body);
  req.body.user_id = req.body.user_id
    ? req.body.user_id
    : "000000000000000000000000";

  var AocRequestsListCondition = [
    {
      $match: {
        _id: ObjectId(req.body.user_id),
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
    {
      $unwind: {
        path: "$hospitalsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "ambulances",
        localField: "hospitalsDetail._id",
        foreignField: "hospital_id",
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
      $lookup: {
        from: "aoc_requests",
        localField: "ambulancesDetail._id",
        foreignField: "ambulance_id",
        as: "ambulancesDetail.aocRequestsDetails",
      },
    },
    {
      $unwind: {
        path: "$ambulancesDetail.aocRequestsDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        ems: {
          $cond: [
            {
              $eq: ["$ambulancesDetail.aocRequestsDetails.request_type", "EMS"],
            },
            1,
            0,
          ],
        },
        ref: {
          $cond: [
            {
              $eq: ["$ambulancesDetail.aocRequestsDetails.request_type", "REF"],
            },
            1,
            0,
          ],
        },
        in: {
          $cond: [
            {
              $eq: ["$ambulancesDetail.aocRequestsDetails.request_type", "IN"],
            },
            1,
            0,
          ],
        },
        out: {
          $cond: [
            {
              $eq: ["$ambulancesDetail.aocRequestsDetails.request_type", "OUT"],
            },
            1,
            0,
          ],
        },
        back: {
          $cond: [
            {
              $eq: [
                "$ambulancesDetail.aocRequestsDetails.request_type",
                "BACK",
              ],
            },
            1,
            0,
          ],
        },
        other: {
          $cond: [
            {
              $eq: [
                "$ambulancesDetail.aocRequestsDetails.request_type",
                "OTHER",
              ],
            },
            1,
            0,
          ],
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        ems: { $sum: "$ems" },
        ref: { $sum: "$ref" },
        in: { $sum: "$in" },
        out: { $sum: "$out" },
        back: { $sum: "$back" },
        other: { $sum: "$other" },
      },
    },
  ];

  AocUsers.aggregate(AocRequestsListCondition)
    .then((data) => {
      var response = {};
      response["data"] = data;
      console.log("data", data);
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
            err.message || "Some error occurred while  retrieving AocRequests.",
            req.headers.isencryption
          )
        );
    });
};

exports.postSeverityColorCodesList = (req, res) => {
  var response = {};
  response["data"] = configure.severityColorPanel;
  res.send(
    configure.apiResp(true, 200, response, "", req.headers.isencryption)
  );
};

exports.getAmbPatientReq = (req, res) => {
  var getAmbPatientReqCond = [
    {
      $match: {
        $and: [
          { isactive: 1 },
          { isdeleted: false },
          { zone_id: ObjectId(req.body.zone_id) },
        ],
      },
    },
    {
      $lookup: {
        from: "ambulances",
        let: {
          hospital_id: "$_id",
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
      $unwind: "$ambulancesDetail",
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
      $redact: {
        $cond: {
          if: {
            $gt: [
              {
                $size: { $ifNull: ["$ambulancesDetail.aocRequestsDetail", []] },
              },
              0,
            ],
          },
          then: "$$PRUNE",
          else: "$$DESCEND",
        },
      },
    },
    {
      $group: {
        _id: "$ambulancesDetail._id",
        name1: { $first: "$ambulancesDetail.name1" },
        name2: { $first: "$ambulancesDetail.name2" },
        ambulance_box_code: { $first: "$ambulancesDetail.ambulance_box_code" },
        hospitalsDetail: {
          $first: {
            _id: "$_id",
            full_name: "$full_name",
          },
        },
      },
    },
    { $sort: { _id: -1 } },
  ];

  Hospitals.aggregate(getAmbPatientReqCond)
    .then((ambulances_data) => {
      if (ambulances_data.length) {
        ambulances_data;
        var response = {};
        response["data"] = ambulances_data;
        res.send(
          configure.apiResp(true, 200, response, "", req.headers.isencryption)
        );
      } else {
        res
          .status(201)
          .send(
            configure.apiResp(
              true,
              201,
              response,
              "No ambulance available.",
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
            err.message || "Some error occurred while  retrieving AocRequests.",
            req.headers.isencryption
          )
        );
    });
};

exports.postPatientReqAmbulance = (req, res) => {
  var patientReqAmbulanceCond = [
    {
      $match: {
        _id: ObjectId(req.body.ambulance_id),
      },
    },
  ];

  Ambulances.aggregate(patientReqAmbulanceCond).then((ambulances_data) => {
    var PatientRequestsCond = [
      {
        $match: {
          _id: ObjectId(req.body.patient_request_id),
        },
      },
      {
        $lookup: {
          from: "patients",
          localField: "patient_id",
          foreignField: "_id",
          as: "patientsDetail",
        },
      },
      {
        $unwind: "$patientsDetail",
      },
    ];

    PatientRequests.aggregate(PatientRequestsCond).then(
      (patient_requests_data) => {
        var response = {};
        response["patient_requests_data"] = patient_requests_data;
        response["ambulances_data"] = ambulances_data[0];
        res.send(
          configure.apiResp(true, 200, response, "", req.headers.isencryption)
        );
      }
    );
  });
};

exports.postPatientReqCancelRequest = (req, res) => {
  AocRequests.findOne({ _id: ObjectId(req.body.aoc_requests_id) }).then(
    (aoc_request) => {
      if (aoc_request.request_status == "CANCELED") {
        var resp = {
          message: "Request already CANCELED!!",
        };
        res.send(
          configure.apiResp(true, 201, resp, "", req.headers.isencryption)
        );
      } else {
        AocRequests.findOneAndUpdate(
          { _id: ObjectId(req.body.aoc_requests_id) },
          { $set: { request_status: "CANCELED" } },
          { new: true }
        ).then((aoc_requests_data) => {
          PatientRequests.findOneAndUpdate(
            { _id: ObjectId(aoc_requests_data.patient_request_id) },
            { $set: { request_status: "CANCELED" } },
            { new: true }
          ).then((patient_requests_data) => {
            var resp = {};
            resp["data"] = aoc_requests_data;
            res.send(
              configure.apiResp(true, 200, resp, "", req.headers.isencryption)
            );
          });
        });
      }
    }
  );
};

exports.aocRequestStatusChangeHistory = (req, res) => {
  var current_page = Number(req.body.current_page);
  var page_size = Number(req.body.page_size);

  var AocRequestStatusChangeHistoryCondition = [
    {
      $match: {
        _id: ObjectId(req.body.user_id),
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
        from: "hospitals",
        let: {
          hospital_id: "$hospital_ids",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$_id", "$$hospital_id"],
                  },
                ],
              },
            },
          },
        ],
        as: "hospitalsDetail",
      },
    },
  ];

  if (req.body.hospital_id && req.body.hospital_id !== "") {
    AocRequestStatusChangeHistoryCondition[
      AocRequestStatusChangeHistoryCondition.length - 1
    ]["$lookup"]["pipeline"][0]["$match"]["$expr"]["$and"].push({
      $eq: ["$_id", ObjectId(req.body.hospital_id)],
    });
  }

  AocRequestStatusChangeHistoryCondition.push(
    {
      $unwind: {
        path: "$hospitalsDetail",
        preserveNullAndEmptyArrays: false,
      },
    },
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
                ],
              },
            },
          },
        ],
        as: "hospitalsDetail.ambulancesDetail",
      },
    }
  );

  if (req.body.ambulance_id && req.body.ambulance_id !== "") {
    AocRequestStatusChangeHistoryCondition[
      AocRequestStatusChangeHistoryCondition.length - 1
    ]["$lookup"]["pipeline"][0]["$match"]["$expr"]["$and"].push({
      $eq: ["$_id", ObjectId(req.body.ambulance_id)],
    });
  }
  console.log(AocRequestStatusChangeHistoryCondition);
  AocRequestStatusChangeHistoryCondition.push(
    {
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail",
        preserveNullAndEmptyArrays: true,
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
                    $eq: ["$request_status", "COMPLETED"],
                  },
                ],
              },
            },
          },
        ],
        as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail",
      },
    }
  );

  AocRequestStatusChangeHistoryCondition.push(
    {
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $lookup: {
        from: "patient_requests",
        localField:
          "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patient_request_id",
        foreignField: "_id",
        as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail",
      },
    },
    {
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "patients",
        localField:
          "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patient_id",
        foreignField: "_id",
        as: "hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
      },
    },
    {
      $unwind: {
        path: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.patientRequestsDetail.patientsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$hospitalsDetail.ambulancesDetail.aocRequestsDetail._id",
        request_status_change: {
          $first:
            "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_status_change",
        },
        request_type: {
          $first:
            "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_type",
        },
        request_code: {
          $first:
            "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.request_code",
        },
        ambulancesDetail: { $first: "$hospitalsDetail.ambulancesDetail" },
        createdAt: {
          $first:
            "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.createdAt",
        },
        updatedAt: {
          $first:
            "$hospitalsDetail.ambulancesDetail.aocRequestsDetail.updatedAt",
        },
      },
    },
    { $count: "count" }
  );

  AocUsers.aggregate(AocRequestStatusChangeHistoryCondition)
    .then((count) => {
      AocRequestStatusChangeHistoryCondition.splice(-1, 1);

      AocRequestStatusChangeHistoryCondition.push({
        $project: {
          _id: 1,
          request_status_change: 1,
          request_type: 1,
          request_code: 1,
          ambulancesDetail: {
            name1: 1,
            name2: 1,
            ambulance_box_code: 1,
            aocRequestsDetail: {
              patientRequestsDetail: {
                patientsDetail: {
                  _id: 1,
                  first_name: 1,
                  last_name: 1,
                },
              },
            },
          },
          createdAt: 1,
          updatedAt: 1,
        },
      });

      AocRequestStatusChangeHistoryCondition.push({ $sort: { updatedAt: -1 } });
      AocRequestStatusChangeHistoryCondition.push({
        $skip: Number((current_page - 1) * page_size),
      });
      AocRequestStatusChangeHistoryCondition.push({
        $limit: Number(page_size),
      });

      AocUsers.aggregate(AocRequestStatusChangeHistoryCondition)
        .then((data) => {
          var response = {};
          response["data"] = data;
          response["count"] = count[0] ? count[0].count : 0;
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
                err.message ||
                  "Some error occurred while  retrieving Ambulances.",
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
            {},
            err.message || "Some error occurred while  retrieving Ambulances.",
            req.headers.isencryption
          )
        );
    });
};
