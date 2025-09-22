const db = require("../../config/db.config");
const configure = require("../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const PatientMonitors = db.patient_monitors;
const AocRequests = db.aoc_requests;
exports.postPatientMonitorsDetail = (req, res) => {
  var resp = {};

  var patient_monitors = {
    is_online: Number(req.body.is_online),
    web_address: String(req.body.web_address),
    web_port: String(req.body.web_port),
  };

  PatientMonitors.findOneAndUpdate(
    { serial_number: req.body.serial_number },
    { $set: patient_monitors }
  )
    .then(async (data) => {
      resp["success"] = true;
      res.send(configure.apiResp(true, 200, resp, ""));
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while updating the Sub-District.",
      });
    });
};

exports.postPatientMonitorsRegister = (req, res) => {
  PatientMonitors.findOne({ serial_number: String(req.body.serial_number) })
    .then((data) => {
      var resp = {};
      if (data) {
        resp["_id"] = data["_id"];
        resp["name"] = data["name"];
        resp["software_version"] = data["software_version"];
        resp["hardware_version"] = data["hardware_version"];
        resp["app_version"] = data["app_version"];
        resp["web_address"] = data["web_address"];
        resp["web_port"] = data["web_port"];
        resp["serial_number"] = data["serial_number"];
        resp["type"] = data["type"];
        res.send(configure.apiResp(true, 200, resp, ""));
      } else {
        var patient_monitors = new PatientMonitors({
          name: String(req.body.name),
          type: req.body.type ? String(req.body.type) : "DGT7",
          software_version: String(req.body.software_version),
          hardware_version: String(req.body.hardware_version),
          app_version: String(req.body.app_version),
          web_address: String(process.env.ECG_SERVER),
          web_port: String(process.env.ECG_PORT),
          serial_number: String(req.body.serial_number),
        });

        patient_monitors
          .save(patient_monitors)
          .then((data) => {
            resp["_id"] = data["_id"];
            resp["name"] = data["name"];
            resp["software_version"] = data["software_version"];
            resp["hardware_version"] = data["hardware_version"];
            resp["app_version"] = data["app_version"];
            resp["web_address"] = data["web_address"];
            resp["web_port"] = data["web_port"];
            resp["serial_number"] = data["serial_number"];
            resp["type"] = data["type"];
            res.send(configure.apiResp(true, 200, resp, ""));
          })
          .catch((err) => {
            res.status(500).send({
              message:
                err.message ||
                "Some error occurred while register the Patient Moniter Register.",
            });
          });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message ||
          "Some error occurred while register the Patient Moniter Register.",
      });
    });
};

exports.postPatientMonitorsStatusChange = (req, res) => {
  if (typeof req.body.is_online === "string") {
    if (req.body.is_online.toLowerCase() == "true") {
      req.body.is_online = 1;
    } else if (req.body.is_online.toLowerCase() == "false") {
      req.body.is_online = 0;
    }
  }

  // Attempt to find and update by `_id` first
  PatientMonitors.findOneAndUpdate(
    { _id: ObjectId(req.body.patient_monitor_id) },
    { $set: { is_online: Number(req.body.is_online) } },
    { new: true }
  )
    .then((data) => {
      if (!data) {
        // If `_id` not found, try finding and updating by `serial_number`
        return PatientMonitors.findOneAndUpdate(
          { serial_number: req.body.serial_number },
          { $set: { is_online: Number(req.body.is_online) } },
          { new: true }
        );
      }
      return data;
    })
    .then((data) => {
      if (data) {
        const patientMonitorsStatusChangeCondition = [
          {
            $match: {
              _id: ObjectId(data._id),
            },
          },
          {
            $lookup: {
              from: "aoc_requests",
              let: { patient_monitor_id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$moniter_id", "$$patient_monitor_id"] },
                        { $ne: ["$request_status", "COMPLETED"] },
                        { $ne: ["$request_status", "CANCELED"] },
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
              from: "ambulances",
              localField: "aocRequestsDetail.ambulance_id",
              foreignField: "_id",
              as: "aocRequestsDetail.ambulancesDetail",
            },
          },
          {
            $unwind: {
              path: "$aocRequestsDetail.ambulancesDetail",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "patient_requests",
              localField: "aocRequestsDetail.patient_request_id",
              foreignField: "_id",
              as: "aocRequestsDetail.patientRequestsDetail",
            },
          },
          {
            $unwind: {
              path: "$aocRequestsDetail.patientRequestsDetail",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "patients",
              localField: "aocRequestsDetail.patientRequestsDetail.patient_id",
              foreignField: "_id",
              as: "aocRequestsDetail.patientRequestsDetail.patientsDetail",
            },
          },
          {
            $unwind: {
              path: "$aocRequestsDetail.patientRequestsDetail.patientsDetail",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              name: 1,
              software_version: 1,
              hardware_version: 1,
              app_version: 1,
              web_address: 1,
              web_port: 1,
              serial_number: 1,
              type: 1,
              aocRequestsDetail: {
                _id: 1,
                ambulancesDetail: {
                  name1: 1,
                  name2: 1,
                  ambulance_box_code: 1,
                },
                request_code: 1,
                patientRequestsDetail: {
                  severity_level: 1,
                  patientsDetail: 1,
                },
              },
            },
          },
        ];

        // Run aggregation with the constructed condition
        PatientMonitors.aggregate(patientMonitorsStatusChangeCondition)
          .then((data) => {
            if (Number(req.body.is_online)) {
              const query = {
                moniter_id: ObjectId(data[0]["_id"]),
                request_status: { $nin: ["COMPLETED", "CANCELED"] },
              };
              AocRequests.findOne(query)
                .then((request_data) => {
                  configure.postMonitorStatusNotification(
                    request_data ? request_data["_id"] : null,
                    data[0]["_id"],
                    "PATIENT_MONITOR_STATUS",
                    "PATIENT_MONITOR_STATUS_ONLINE",
                    configure.notificationSound.PATIENT_MONITOR_STATUS_ONLINE
                  );
                })
                .catch((err) => console.log(err));
              res.send(configure.apiResp(true, 200, data[0], ""));
            } else {
              const query = {
                monitor_id: ObjectId(data[0]["_id"]),
              };
              AocRequests.find(query)
                .sort({ updatedAt: -1 })
                .then((request_data) => {
                  configure.postMonitorStatusNotification(
                    request_data ? request_data["_id"] : null,
                    data[0]["_id"],
                    "PATIENT_MONITOR_STATUS",
                    "PATIENT_MONITOR_STATUS_OFFLINE",
                    configure.notificationSound.PATIENT_MONITOR_STATUS_OFFLINE
                  );
                  res.send(configure.apiResp(true, 200, {}, ""));
                });
            }
          })
          .catch((err) => {
            res.status(500).send({
              message:
                err.message ||
                "Some error occurred while retrieving Patient Monitor detail.",
            });
          });
      } else {
        res.status(201).send({
          message: "Patient Monitor not found.",
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message ||
          "Some error occurred while changing the Patient Monitors' status.",
      });
    });
};

exports.getPatientMonitorsList = async (req, res) => {
  try {
    const isOnlineFilter = req.query.is_online == "true";

    const query = isOnlineFilter ? { is_online: 1 } : {};

    const patientMonitors = await PatientMonitors.find(query);

    let cleanedData = [];
    if (patientMonitors) {
      cleanedData = patientMonitors.map((doc) => {
        // Convert Mongoose document to plain JavaScript object
        const obj = doc.toObject();

        // Iterate over each key in the object and replace null/undefined with an empty string
        for (const key in obj) {
          if (
            obj[key] === null ||
            obj[key] === undefined ||
            obj[key] === "undefined"
          ) {
            obj[key] = "";
          }
        }

        return obj;
      });
    }

    return res.status(200).json({
      success: true,
      data: cleanedData,
    });
  } catch (error) {
    console.error("Error fetching patient monitors:", error);
    return res.status(500).send({
      success: false,
      message:
        error.message ||
        "Some error occurred while changing the Patient Monitors' status.",
    });
  }
};

// exports.postPatientMonitorsStatusChange = (req, res) => {
//   console.log("req.body.patient_monitor_id", req.body);
//   PatientMonitors.findOneAndUpdate(
//     {
//       $or: [
//         { _id: ObjectId(req.body.patient_monitor_id) },
//         { serial_number: req.body.serial_number },
//       ],
//     },
//     { $set: { is_online: Number(req.body.is_online) } },
//     { new: true }
//   )
//     .then((data) => {
//       if (data) {
//         var patientMonitorsStatusChangeCondition = [
//           {
//             $match: {
//               _id: ObjectId(data._id),
//             },
//           },
//           {
//             $lookup: {
//               from: "aoc_requests",
//               let: {
//                 patient_monitor_id: "$_id",
//               },
//               pipeline: [
//                 {
//                   $match: {
//                     $expr: {
//                       $and: [
//                         {
//                           $eq: ["$moniter_id", "$$patient_monitor_id"],
//                         },
//                         {
//                           $ne: ["$request_status", "COMPLETED"],
//                         },
//                         {
//                           $ne: ["$request_status", "CANCELED"],
//                         },
//                       ],
//                     },
//                   },
//                 },
//               ],
//               as: "aocRequestsDetail",
//             },
//           },
//           {
//             $unwind: {
//               path: "$aocRequestsDetail",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             $lookup: {
//               from: "ambulances",
//               localField: "aocRequestsDetail.ambulance_id",
//               foreignField: "_id",
//               as: "aocRequestsDetail.ambulancesDetail",
//             },
//           },
//           {
//             $unwind: {
//               path: "$aocRequestsDetail.ambulancesDetail",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             $lookup: {
//               from: "patient_requests",
//               localField: "aocRequestsDetail.patient_request_id",
//               foreignField: "_id",
//               as: "aocRequestsDetail.patientRequestsDetail",
//             },
//           },
//           {
//             $unwind: {
//               path: "$aocRequestsDetail.patientRequestsDetail",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             $lookup: {
//               from: "patients",
//               localField: "aocRequestsDetail.patientRequestsDetail.patient_id",
//               foreignField: "_id",
//               as: "aocRequestsDetail.patientRequestsDetail.patientsDetail",
//             },
//           },
//           {
//             $unwind: {
//               path: "$aocRequestsDetail.patientRequestsDetail.patientsDetail",
//               preserveNullAndEmptyArrays: true,
//             },
//           },
//           {
//             $project: {
//               name: 1,
//               software_version: 1,
//               hardware_version: 1,
//               app_version: 1,
//               web_address: 1,
//               web_port: 1,
//               serial_number: 1,
//               type: 1,
//               aocRequestsDetail: {
//                 _id: 1,
//                 ambulancesDetail: {
//                   name1: 1,
//                   name2: 1,
//                   ambulance_box_code: 1,
//                 },
//                 request_code: 1,
//                 patientRequestsDetail: {
//                   severity_level: 1,
//                   patientsDetail: 1,
//                 },
//               },
//             },
//           },
//         ];

//         PatientMonitors.aggregate(patientMonitorsStatusChangeCondition)
//           .then((data) => {
//             if (Number(req.body.is_online)) {
//               let query = {
//                 moniter_id: { $eq: ObjectId(data[0]["_id"]) },
//                 request_status: { $ne: "COMPLETED" },
//                 request_status: { $ne: "CANCELED" },
//               };
//               AocRequests.findOne(query)
//                 .then((request_data) => {
//                   configure.postMonitorStatusNotification(
//                     request_data ? request_data["_id"] : null,
//                     data[0]["_id"],
//                     "PATIENT_MONITOR_STATUS",
//                     "PATIENT_MONITOR_STATUS_ONLINE",
//                     configure.notificationSound.PATIENT_MONITOR_STATUS_ONLINE
//                   );
//                 })
//                 .catch((err) => console.log(err));
//               res.send(configure.apiResp(true, 200, data[0], ""));
//             } else {
//               let query = {
//                 monitor_id: { $eq: ObjectId(data[0]["_id"]) },
//               };
//               AocRequests.find(query)
//                 .sort({ updatedAt: -1 })
//                 .then((request_data) => {
//                   configure.postMonitorStatusNotification(
//                     request_data ? request_data["_id"] : null,
//                     data[0]["_id"],
//                     "PATIENT_MONITOR_STATUS",
//                     "PATIENT_MONITOR_STATUS_OFFLINE",
//                     configure.notificationSound.PATIENT_MONITOR_STATUS_OFFLINE
//                   );

//                   res.send(configure.apiResp(true, 200, {}, ""));
//                 });
//             }
//           })
//           .catch((err) => {
//             console.log("1", err.message);
//             res.status(500).send({
//               message:
//                 err.message ||
//                 "Some error occurred while retrieving Patient Monitor detail.",
//             });
//           });
//       } else {
//         console.log("2", err.message);
//         res.status(201).send({
//           message: "Patient Monitor not found.",
//         });
//       }
//     })
//     .catch((err) => {
//       console.log("3", err.message);
//       res.status(500).send({
//         message:
//           err.message ||
//           "Some error occurred while status change the Patient Monitors.",
//       });
//     });
// };
