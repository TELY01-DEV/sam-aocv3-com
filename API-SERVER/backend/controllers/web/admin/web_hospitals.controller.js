const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
var fs = require("fs");
var xmlReader = require("read-xml");
var convert = require("xml-js");
const AocZones = db.aoc_zones;
const Hospitals = db.hospitals;
const Provinces = db.provinces;
const Districts = db.districts;
const SubDistricts = db.subdistricts;

exports.getHospitalList = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);
  var getHospitalListCondition = [];

  if (req.body.province_ids && req.body.province_ids !== "null") {
    var provinceIds = String(req.body.province_ids).split(",");
    provinceIds = provinceIds.map((e) => {
      return ObjectId(e);
    });

    getHospitalListCondition.push({
      $match: {
        province_id: { $in: provinceIds },
      },
    });
  }
  if (req.body.district_ids && req.body.district_ids !== "null") {
    var districtIds = String(req.body.district_ids).split(",");
    districtIds = districtIds.map((e) => {
      return ObjectId(e);
    });

    getHospitalListCondition.push({
      $match: {
        district_id: { $in: districtIds },
      },
    });
  }
  if (req.body.subdistrict_ids && req.body.subdistrict_ids !== "null") {
    var subDistrictIds = String(req.body.subdistrict_ids).split(",");
    subDistrictIds = subDistrictIds.map((e) => {
      return ObjectId(e);
    });
    getHospitalListCondition.push({
      $match: {
        subdistrict_id: { $in: subDistrictIds },
      },
    });
  }
  getHospitalListCondition.push(
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
    { $count: "count" }
  );

  Hospitals.aggregate(getHospitalListCondition)
    .then((count) => {
      getHospitalListCondition.splice(-1, 1);
      getHospitalListCondition.push({ $sort: JSON.parse(req.body.sortValue) });
      getHospitalListCondition.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      getHospitalListCondition.push({ $limit: Number(pageSize) });
      Hospitals.aggregate(getHospitalListCondition).then((data) => {
        console.log("data", data);
        var response = {};
        response["count"] = count[0] ? count[0].count : 0;
        response["data"] = data;
        // response["token"] = data[0] ? data[0]._id : "";
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
            err.message || "Some error occurred while retrieving SubDistricts.",
            req.headers.isencryption
          )
        );
    });
};

exports.updateHospitalDetail = (req, res) => {
  var hosp_location = JSON.parse(req.body.location);
  var response = {};

  if (req.body._id != "null" && req.body._id != null) {
    var hospital = {
      name1: String(req.body.name1),
      name2: String(req.body.name2),
      areacode: String(req.body.areacode),
      province_id: ObjectId(req.body.province_id),
      // district_id: ObjectId(req.body.district_id),
      // subdistrict_id: ObjectId(req.body.subdistrict_id),
      full_name: String(req.body.full_name),
      email: String(req.body.email),
      phone: String(req.body.phone),
      password: String(req.body.password),
      address: String(req.body.address),
      contact_address: String(req.body.contact_address),
      voip_number: String(req.body.voip_number),
      remark: String(req.body.remark),
      type: String(req.body.type),
      organization_code: String(req.body.organization_code),
      hospital_area_type: String(req.body.hospital_area_type),
      isactive: Number(req.body.isactive),
    };
    if (hosp_location) {
      hospital["location"] = {
        lat: hosp_location.lat,
        lon: hosp_location.lon,
      };
      // hospital['location']['lat'] = hosp_location.lat
      // hospital['location']['lon'] = hosp_location.lon
    }
    if (req.body.district_id && req.body.district_id !== "null")
      hospital["district_id"] = ObjectId(req.body.district_id);
    if (req.body.subdistrict_id && req.body.subdistrict_id !== "null")
      hospital["subdistrict_id"] = ObjectId(req.body.subdistrict_id);

    Hospitals.findOneAndUpdate({ _id: req.body._id }, { $set: hospital })
      .then((data) => {
        if (req.files && req.files.length) {
          req.files.forEach((e) => {
            if (e.fieldname == "logo_image") {
              var logo_image = configure.fsUpload(data._id, "hospitalLogo", e);
              Hospitals.findOneAndUpdate(
                { _id: req.body._id },
                { $set: { logo_image: logo_image } }
              )
                .then()
                .catch((err) => console.log(err));
            } else {
              hospital["image"] = configure.fsUpload(
                data._id,
                "hospitalImages",
                e
              );
              Hospitals.findOneAndUpdate(
                { _id: req.body._id },
                { $set: hospital }
              )
                .then()
                .catch((err) => console.log(err));
            }
          });
        }

        response["data"] = data;
        response["success"] = true;
        //response["token"] = Array.isArray(data) ? data[0]._id : data._id;
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
                "Some error occurred while updating the Sub-District.",
              req.headers.isencryption
            )
          );
      });
  } else {
    var hospital = new Hospitals({
      name1: String(req.body.name1),
      name2: String(req.body.name2),
      areacode: String(req.body.areacode),
      province_id: ObjectId(req.body.province_id),
      // district_id: ObjectId(req.body.district_id),
      // subdistrict_id: ObjectId(req.body.subdistrict_id),
      full_name: String(req.body.full_name),
      email: String(req.body.email),
      phone: String(req.body.phone),
      password: String(req.body.password),
      address: String(req.body.address),
      contact_address: String(req.body.contact_address),
      voip_number: String(req.body.voip_number),
      remark: String(req.body.remark),
      type: String(req.body.type),
      organization_code: String(req.body.organization_code),
      hospital_area_type: String(req.body.hospital_area_type),
      isactive: Number(req.body.isactive),
      location: {
        lat: hosp_location.lat,
        lon: hosp_location.lon,
      },
    });
    if (req.body.district_id && req.body.district_id !== "null")
      hospital["district_id"] = ObjectId(req.body.district_id);
    if (req.body.subdistrict_id && req.body.subdistrict_id !== "null")
      hospital["subdistrict_id"] = ObjectId(req.body.subdistrict_id);

    hospital
      .save(hospital)
      .then((data) => {
        if (req.files && req.files.length) {
          let logo_image;
          req.files.forEach((e) => {
            if (e.fieldname == "logo_image") {
              logo_image = hospital["logo_image"] = configure.fsUpload(
                data._id,
                "hospitalLogo",
                e
              );
              Hospitals.findOneAndUpdate(
                { _id: data._id },
                { $set: { logo_image: logo_image } }
              )
                .then()
                .catch((err) => console.log(err));
            } else {
              logo_image = configure.fsUpload(data._id, "hospitalImages", e);
              Hospitals.findOneAndUpdate(
                { _id: data._id },
                { $set: { image: logo_image } }
              )
                .then()
                .catch((err) => console.log(err));
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
              false,
              500,
              {},
              err.message ||
                "Some error occurred while creating the Sub-District.",
              req.headers.isencryption
            )
          );
      });
  }
};

exports.deleteHospital = (req, res) => {
  Hospitals.findOneAndUpdate(
    { _id: req.body.hositalId },
    { $set: { isdeleted: true } }
  )
    .then((data) => {
      configure.fsRemove(data.image, "hospitalImages");
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
            false,
            500,
            {},
            err.message || "Some error occurred while deleting Hospital.",
            req.headers.isencryption
          )
        );
    });
};

exports.getAllSubDistrictList = (req, res) => {
  var getSubDistrictListCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          { isactive: 1 },
          { district_id: { $eq: ObjectId(req.body.districtId) } },
        ],
      },
    },
  ];

  SubDistricts.aggregate(getSubDistrictListCondition).then((data) => {
    var response = {};
    response["data"] = data;
    res.send(
      configure.apiResp(true, 200, response, "", req.headers.isencryption)
    );
  });
};

exports.getAllSubDistrictsList = (req, res) => {
  var districtIds = String(req.body.districtIds).split(",");
  districtIds = districtIds.map((e) => {
    return ObjectId(e);
  });

  var getAllSubDistrictsCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          { isactive: 1 },
          { district_id: { $in: districtIds } },
        ],
      },
    },
  ];

  SubDistricts.aggregate(getAllSubDistrictsCondition).then((data) => {
    var response = {};
    response["data"] = data;
    res.send(
      configure.apiResp(true, 200, response, "", req.headers.isencryption)
    );
  });
};

exports.getZoneList = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);

  var getZoneListCondition = [
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
                check_name: {
                  $regex: String(req.body.searchValue),
                  $options: "i",
                },
              },
              {
                phone: { $regex: String(req.body.searchValue), $options: "i" },
              },
            ],
          },
        ],
      },
    },
    { $count: "count" },
  ];

  AocZones.aggregate(getZoneListCondition)
    .then((count) => {
      getZoneListCondition.splice(-1, 1);

      getZoneListCondition.push({
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
          kml_file: 1,
        },
      });
      getZoneListCondition.push({ $sort: JSON.parse(req.body.sortValue) });
      getZoneListCondition.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      getZoneListCondition.push({ $limit: Number(pageSize) });
      AocZones.aggregate(getZoneListCondition).then((data) => {
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
            err.message || "Some error occurred while retriving Zones.",
            req.headers.isencryption
          )
        );
    });
};

exports.getZoneDetail = (req, res) => {
  var getZoneDetailCondition = [
    { $match: { _id: { $eq: ObjectId(req.body.zoneId) } } },
    {
      $lookup: {
        from: "hospitals",
        localField: "_id",
        foreignField: "zone_id",
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
        from: "provinces",
        localField: "hospitalDetails.province_id",
        foreignField: "_id",
        as: "hospitalDetails.provinceDetails",
      },
    },
    {
      $lookup: {
        from: "districts",
        localField: "hospitalDetails.district_id",
        foreignField: "_id",
        as: "hospitalDetails.districtDetails",
      },
    },
    {
      $lookup: {
        from: "subdistricts",
        localField: "hospitalDetails.subdistrict_id",
        foreignField: "_id",
        as: "hospitalDetails.subdistricDetails",
      },
    },
    {
      $project: {
        _id: 1,
        hospital_detail: {
          _id: "$hospitalDetails._id",
          name1: "$hospitalDetails.name1",
        },
        province_detail: {
          _id: { $arrayElemAt: ["$hospitalDetails.provinceDetails._id", 0] },
          name1: {
            $arrayElemAt: ["$hospitalDetails.provinceDetails.name1", 0],
          },
        },
        district_detail: {
          _id: { $arrayElemAt: ["$hospitalDetails.districtDetails._id", 0] },
          name1: {
            $arrayElemAt: ["$hospitalDetails.districtDetails.name1", 0],
          },
        },
        subdistrict_detail: {
          _id: { $arrayElemAt: ["$hospitalDetails.subdistricDetails._id", 0] },
          name1: {
            $arrayElemAt: ["$hospitalDetails.subdistricDetails.name1", 0],
          },
        },
      },
    },
  ];

  AocZones.aggregate(getZoneDetailCondition).then((data) => {
    var response = {};
    response["data"] = data;
    res.send(
      configure.apiResp(true, 200, response, "", req.headers.isencryption)
    );
  });
};

exports.getAllDistrictsList = (req, res) => {
  var provinceIds = String(req.body.provinceIds).split(",");
  provinceIds = provinceIds.map((e) => {
    return ObjectId(e);
  });

  var getAllDistrictsCondition = [
    {
      $match: {
        $and: [
          { isdeleted: false },
          { isactive: 1 },
          { province_id: { $in: provinceIds } },
        ],
      },
    },
  ];

  Districts.aggregate(getAllDistrictsCondition).then((data) => {
    var response = {};
    response["data"] = data;
    res.send(
      configure.apiResp(true, 200, response, "", req.headers.isencryption)
    );
  });
};

exports.getAllHospitalsList = (req, res) => {
  var getAllHospitalsCondition = [
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
        full_name: 1,
      },
    },
  ];

  if (
    req.body.provinceIds &&
    req.body.provinceIds.length &&
    req.body.provinceIds !== ""
  ) {
    var provinceIds = String(req.body.provinceIds).split(",");
    provinceIds = provinceIds.map((e) => {
      return ObjectId(e);
    });
    getAllHospitalsCondition = [
      {
        $match: {
          $and: [
            { isdeleted: false },
            { isactive: 1 },
            { province_id: { $in: provinceIds } },
          ],
        },
      },
    ];
  }
  if (
    req.body.districtIds &&
    req.body.districtIds.length &&
    req.body.districtIds !== ""
  ) {
    var districtIds = String(req.body.districtIds).split(",");
    districtIds = districtIds.map((e) => {
      return ObjectId(e);
    });
    getAllHospitalsCondition = [
      {
        $match: {
          $and: [
            { isdeleted: false },
            { isactive: 1 },
            { district_id: { $in: districtIds } },
          ],
        },
      },
    ];
  } else {
    getAllHospitalsCondition.push({
      $match: { district_id: { $eq: null } },
    });
  }
  if (
    req.body.subDistrictIds &&
    req.body.subDistrictIds.length &&
    req.body.subDistrictIds !== ""
  ) {
    var subDistrictIds = String(req.body.subDistrictIds).split(",");
    subDistrictIds = subDistrictIds.map((e) => {
      return ObjectId(e);
    });
    getAllHospitalsCondition = [
      {
        $match: {
          $and: [
            { isdeleted: false },
            { isactive: 1 },
            { subdistrict_id: { $in: subDistrictIds } },
          ],
        },
      },
    ];
  } else {
    getAllHospitalsCondition.push({
      $match: { subdistrict_id: { $eq: null } },
    });
  }
  Hospitals.aggregate(getAllHospitalsCondition).then((data) => {
    var response = {};
    response["data"] = data;
    res.send(
      configure.apiResp(true, 200, response, "", req.headers.isencryption)
    );
  });
};

// exports.updateZoneDetail = (req, res) => {
//   var response = {};

//   let hospitalList = req.body.hospital_id.split(",");

//   hospitalIds = hospitalList.map((e) => {
//     return ObjectId(e);
//   });
//   if (req.body._id !== "null" && req.body._id !== null && req.body._id) {
//     var aoc_zones = {
//       name1: String(req.body.name1),
//       name2: String(req.body.name2),
//       check_name: String(req.body.check_name),
//       phone: Number(req.body.phone),
//       is_panel: Number(req.body.is_panel),
//       isactive: Number(req.body.isactive),
//     };

//     AocZones.findOneAndUpdate({ _id: req.body._id }, { $set: aoc_zones })
//       .then((data) => {
//         if (req.files && req.files.length) {
//           kmlUrl = configure.fsUpload(
//             "KML_" + data._id,
//             "geofencing",
//             req.files[0]
//           );
//           AocZones.findOneAndUpdate(
//             { _id: data._id },
//             { $set: { kml_file: kmlUrl } }
//           ).then((data, err) => {
//             if (err) console.log(err);

//             xmlReader.readXML(
//               fs.readFileSync("./public/uploads/aoc_zones/kml/" + kmlUrl),
//               function (err, file_data) {
//                 if (err) {
//                   console.error(err);
//                 }
//                 var coordinates = [];
//                 var xml = file_data.content;
//                 var result = JSON.parse(
//                   convert.xml2json(xml, { compact: true, spaces: 4 })
//                 );
//                 var coordinatesArr = String(
//                   result.kml.Document.Placemark.Polygon.outerBoundaryIs
//                     .LinearRing.coordinates._text
//                 )
//                   .replace(/\n/g, "")
//                   .split(",0");
//                 for (var i = 0; i < coordinatesArr.length; i++) {
//                   var results = String(coordinatesArr[i]).replace(/ /g, "");
//                   var latlon = results.split(",");
//                   if (latlon[1]) {
//                     var location = [latlon[1], latlon[0]];
//                     coordinates.push(location);
//                   }
//                 }
//                 AocZones.findOneAndUpdate(
//                   { _id: data._id },
//                   { $set: { geofence: coordinates } }
//                 ).then((err) => {
//                   res
//                     .status(500)
//                     .send(
//                       configure.apiResp(
//                         false,
//                         500,
//                         {},
//                         err.message ||
//                           "Some error occurred while update zone detail.",
//                         req.headers.isencryption
//                       )
//                     );
//                 });
//               }
//             );
//           });
//         }
//         response["data"] = data;
//         response["success"] = "true";

//         Hospitals.updateMany(
//           { zone_id: ObjectId(req.body._id) },
//           {
//             $set: {
//               zone_id: null,
//             },
//           }
//         ).then((data) => {
//           hospitalIds.forEach((element) => {
//             Hospitals.findOneAndUpdate(
//               { _id: ObjectId(element) },
//               {
//                 $set: {
//                   zone_id: ObjectId(req.body._id),
//                 },
//               }
//             )
//               .then()
//               .catch((err) => {
//                 console.log(
//                   err.message ||
//                     "Some error occurred while updating the Hospital."
//                 );
//               });
//           });
//         });

//         res.send(
//           configure.apiResp(true, 200, response, "", req.headers.isencryption)
//         );
//       })
//       .catch((err) => {
//         res
//           .status(500)
//           .send(
//             configure.apiResp(
//               false,
//               500,
//               {},
//               err.message || "Some error occurred while updating zones.",
//               req.headers.isencryption
//             )
//           );
//       });
//   } else {
//     var aoc_zones = new AocZones({
//       name1: String(req.body.name1),
//       name2: String(req.body.name2),
//       check_name: String(req.body.check_name),
//       phone: Number(req.body.phone),
//       is_panel: Number(req.body.is_panel),
//       isactive: Number(req.body.isactive),
//     });

//     aoc_zones
//       .save(aoc_zones)
//       .then((data) => {
//         var response = {};
//         response["success"] = "true";
//         response["data"] = data;

//         hospitalIds.forEach((element) => {
//           Hospitals.findOneAndUpdate(
//             { _id: ObjectId(element) },
//             {
//               $set: {
//                 zone_id: ObjectId(data._id),
//               },
//             }
//           )
//             .then((data) => {
//               // console.log(data);
//             })
//             .catch((err) => {
//               console.log(
//                 err.message ||
//                   "Some error occurred while updating the Hospital."
//               );
//             });
//         });
//         res.send(
//           configure.apiResp(true, 200, response, "", req.headers.isencryption)
//         );
//       })
//       .catch((err) => {
//         res
//           .status(500)
//           .send(
//             configure.apiResp(
//               false,
//               500,
//               {},
//               err.message || "Some error occurred while creating zones.",
//               req.headers.isencryption
//             )
//           );
//       });
//   }
// };

exports.updateZoneDetail = (req, res) => {
  var response = {};

  let hospitalList = req.body.hospital_id
    ? req.body.hospital_id.split(",")
    : [];

  let hospitalIds = hospitalList.map((e) => {
    return ObjectId(e);
  });

  console.log("req.body", req.body);

  if (req.body._id != "null" && req.body._id != null) {
    var aoc_zones = {
      name1: String(req.body.name1),
      name2: String(req.body.name2),
      check_name: String(req.body.check_name),
      phone: Number(req.body.phone),
      is_panel: Number(req.body.is_panel),
      isactive: Number(req.body.isactive),
    };

    AocZones.findOneAndUpdate({ _id: req.body._id }, { $set: aoc_zones })
      .then((data) => {
        if (req.files && req.files[0]) {
          const file = req.files[0];

          // Simulating file upload process
          const kmlUrl = configure.fsUpload(
            "KML_" + data._id,
            "geofencing",
            file
          );

          AocZones.findOneAndUpdate(
            { _id: data._id },
            { $set: { kml_file: kmlUrl } }
          ).then((data, err) => {
            if (err) console.log(err);

            xmlReader.readXML(
              fs.readFileSync("../public/uploads/aoc_zones/kml/" + kmlUrl),
              function (err, file_data) {
                if (err) {
                  console.error(err);
                }

                var coordinates = [];
                var xml = file_data.content;

                var result = JSON.parse(
                  convert.xml2json(xml, { compact: true, spaces: 4 })
                );

                var coordinatesArr = String(
                  //result.kml.Document.Placemark.Polygon.outerBoundaryIs
                  result.kml.Document.Placemark.MultiGeometry.Polygon
                    .outerBoundaryIs.LinearRing.coordinates._text
                )
                  .replace(/\n/g, "")
                  .replace(/\t/g, "")
                  .split(",0 ");

                for (var i = 0; i < coordinatesArr.length; i++) {
                  var results = String(coordinatesArr[i]).replace(/ /g, "");
                  var latlon = results.split(",");

                  if (latlon[1]) {
                    var location = [latlon[1], latlon[0]];
                    coordinates.push(location);
                  }
                }

                AocZones.findOneAndUpdate(
                  { _id: data._id },
                  { $set: { geofence: coordinates } }
                ).then((data, err) => {
                  console.log("err", err);
                  if (err) {
                    return res
                      .status(500)
                      .send(
                        configure.apiResp(
                          false,
                          500,
                          {},
                          err.message ||
                            "Some error occurred while updating zone details.",
                          req.headers.isencryption
                        )
                      );
                  }
                });
              }
            );
          });
        }

        response["data"] = data;
        response["success"] = "true";

        Hospitals.updateMany(
          { zone_id: ObjectId(req.body._id) },
          { $set: { zone_id: null } }
        ).then((data) => {
          hospitalIds.forEach((element) => {
            Hospitals.findOneAndUpdate(
              { _id: ObjectId(element) },
              { $set: { zone_id: ObjectId(req.body._id) } }
            )
              .then()
              .catch((err) => {
                console.log(
                  err.message ||
                    "Some error occurred while updating the Hospital."
                );
              });
          });
        });

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
              err.message || "Some error occurred while updating zones.",
              req.headers.isencryption
            )
          );
      });
  } else {
    var aoc_zones = new AocZones({
      name1: String(req.body.name1),
      name2: String(req.body.name2),
      check_name: String(req.body.check_name),
      phone: Number(req.body.phone),
      is_panel: Number(req.body.is_panel),
      isactive: Number(req.body.isactive),
    });

    aoc_zones
      .save(aoc_zones)
      .then((data) => {
        let id = data._id;
        var response = {};
        response["success"] = "true";
        response["data"] = data;

        hospitalIds.forEach((element) => {
          Hospitals.findOneAndUpdate(
            { _id: ObjectId(element) },
            { $set: { zone_id: ObjectId(id) } }
          )
            .then((data) => {
              if (req.files && req.files[0]) {
                const file = req.files[0];

                // Simulating file upload process
                const kmlUrl = configure.fsUpload(
                  "KML_" + id,
                  "geofencing",
                  file
                );

                xmlReader.readXML(
                  fs.readFileSync("../public/uploads/aoc_zones/kml/" + kmlUrl),
                  function (err, file_data) {
                    if (err) {
                      console.error(err);
                    }

                    var coordinates = [];
                    var xml = file_data.content;

                    var result = JSON.parse(
                      convert.xml2json(xml, { compact: true, spaces: 4 })
                    );

                    var coordinatesArr = String(
                      //result.kml.Document.Placemark.Polygon.outerBoundaryIs
                      result.kml.Document.Placemark.MultiGeometry.Polygon
                        .outerBoundaryIs.LinearRing.coordinates._text
                    )
                      .replace(/\n/g, "")
                      .replace(/\t/g, "")
                      .split(",0 ");

                    for (var i = 0; i < coordinatesArr.length; i++) {
                      var results = String(coordinatesArr[i]).replace(/ /g, "");
                      var latlon = results.split(",");

                      if (latlon[1]) {
                        var location = [latlon[1], latlon[0]];
                        coordinates.push(location);
                      }
                    }

                    AocZones.findOneAndUpdate(
                      { _id: id },
                      { $set: { geofence: coordinates, kml_file: kmlUrl } }
                    ).then((data, err) => {
                      console.log("err", err, data);
                      if (err) {
                        return res
                          .status(500)
                          .send(
                            configure.apiResp(
                              false,
                              500,
                              {},
                              err.message ||
                                "Some error occurred while updating zone details.",
                              req.headers.isencryption
                            )
                          );
                      }
                    });
                  }
                );
              }
            })
            .catch((err) => {
              console.log(
                err.message ||
                  "Some error occurred while updating the Hospital."
              );
            });
        });

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
              err.message || "Some error occurred while creating zones.",
              req.headers.isencryption
            )
          );
      });
  }
};

exports.deleteZone = (req, res) => {
  AocZones.findOneAndUpdate(
    { _id: req.body.zoneId },
    { $set: { isdeleted: true } }
  )
    .then((data) => {
      Hospitals.findOneAndUpdate(
        { zone_id: req.body.zoneId },
        { $unset: ["zone_id"] }
      )
        .then()
        .catch((err) => console.log(err));
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
            false,
            500,
            {},
            err.message || "Some error occurred while deleting the Zone.",
            req.headers.isencryption
          )
        );
    });
};
