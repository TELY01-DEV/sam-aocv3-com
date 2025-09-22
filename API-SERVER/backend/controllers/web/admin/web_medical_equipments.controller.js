const db = require("../../../config/db.config");
const configure = require("../../../config/configure");

const MedicalEquipments = db.medical_equipments;

exports.getMedicalEquipmentsList = (req, res) => {
  var currentPage = Number(req.body.currentPage);
  var pageSize = Number(req.body.pageSize);

  var getMedicalEquipmentsListCondition = [
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

  MedicalEquipments.aggregate(getMedicalEquipmentsListCondition)
    .then((count) => {
      getMedicalEquipmentsListCondition.splice(-1, 1);
      getMedicalEquipmentsListCondition.push({
        $sort: JSON.parse(req.body.sortValue),
      });
      getMedicalEquipmentsListCondition.push({
        $skip: Number((currentPage - 1) * pageSize),
      });
      getMedicalEquipmentsListCondition.push({ $limit: Number(pageSize) });
      MedicalEquipments.aggregate(getMedicalEquipmentsListCondition).then(
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
              "Some error occurred while retrieving MedicalEquipments.",
            req.headers.isencryption
          )
        );
    });
};

exports.updateMedicalEquDetail = (req, res) => {
  var response = {};
  if (req.body._id !== "null") {
    var medical_equipments = {
      name: String(req.body.name),
      remark: String(req.body.remark),
      isactive: 1,
    };

    MedicalEquipments.findOneAndUpdate(
      { _id: req.body._id },
      { $set: medical_equipments }
    )
      .then((data) => {
        if (req.files && req.files.length) {
          req.files.forEach((e) => {
            if (e.fieldname == "medicalEquipmentImage") {
              configure.random(4, "Number").then(async (ran) => {
                var ProfileImage = String(Date.now() + ran);
                const ProfileImageURL = configure.fsUpload(
                  req.body._id,
                  "medicalEquipmentImage",
                  e
                );
                MedicalEquipments.findOneAndUpdate(
                  { _id: req.body._id },
                  { $set: { medical_equipment_image: ProfileImageURL } }
                ).then((data, err) => {});
              });
            } else {
              configure.random(4, "Number").then(async (ran) => {
                var ProfileImage = String(Date.now() + ran);
                const ProfileImageURL = configure.fsUpload(
                  req.body._id + "_icon",
                  "iconImage",
                  e
                );
                MedicalEquipments.findOneAndUpdate(
                  { _id: req.body._id },
                  { $set: { icon_image: ProfileImageURL } }
                ).then((data, err) => {});
              });
            }
          });
          // configure.random(4, 'Number').then(async (ran) => {
          //     var ProfileImage = String(Date.now() + ran);
          //     ProfileImageURL = await configure.fsUpload(ProfileImage, 'medical_equipment', req.files[0]);
          //     medical_equipments.profile_picture = ProfileImageURL;
          //     //console.log(ProfileImageURL);
          //     MedicalEquipments.findOneAndUpdate({ _id: req.body._id }, { $set: { userProfile: ProfileImageURL } }).then((data, err) => {
          //         //console.log(data);
          //         // console.log(data[0].userProfile);
          //         console.log(err);
          //     })
          // })

          // configure.random(4, 'Number').then(async (ran) => {
          //     var ProfileImage = String(Date.now() + ran);
          //     IconImageURL = await configure.fsUpload(IconImage, 'icon_image', req.files[1]);
          //     medical_equipments.icon_image = IconImageURL;
          //     //console.log(IconImageURL);
          //     MedicalEquipments.findOneAndUpdate({ _id: req.body._id }, { $set: { userIcon: IconImageURL } }).then((data, err) => {
          //         //console.log(data);
          //         // console.log(data[0].userProfile);
          //         console.log(err);
          //     })
          // })
          // let user_image =  configure.fsUpload(data._id, 'userProfile',);
          // console.log("imagesss",imagess);
        }
        if (!data) {
          res
            .status(404)
            .send(
              configure.apiResp(
                false,
                404,
                {},
                "Medical equipments data not found !.",
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
              err.message ||
                "Some error occurred while .updating Medicalequipments.",
              req.headers.isencryption
            )
          );
      });
  } else {
    var medical_equipments = new MedicalEquipments({
      name: String(req.body.name),
      remark: String(req.body.remark),
      isactive: req.body.isactive,
    });

    medical_equipments
      .save(medical_equipments)
      .then((data) => {
        var medical = {};
        req.files.forEach(async (e) => {
          if (req.files && req.files.length) {
            medical["medical_equipment_image"] = await configure.fsUpload(
              data._id,
              "medicalEquipmentImage",
              e
            );
            MedicalEquipments.findOneAndUpdate(
              { _id: data._id },
              { $set: medical }
            ).then();
          } else {
            medical["icon_image"] = await configure.fsUpload(
              data._id + "_icon",
              "iconImage",
              e
            );
            MedicalEquipments.findOneAndUpdate(
              { _id: data._id },
              { $set: medical }
            ).then();
          }
        });
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
                "Some error occurred while .creating  Medicalequipments.",
              req.headers.isencryption
            )
          );
      });
  }
};
