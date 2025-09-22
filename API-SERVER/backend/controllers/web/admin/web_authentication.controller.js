const db = require("../../../config/db.config");
const configure = require("../../../config/configure");

const AocUsers = db.aoc_users;
const SuperAdmins = db.superadmins;
exports.signIn = (req, res) => {
  let signInCond = [
    {
      $match: {
        $and: [
          { email: { $eq: String(req.body.email) } },
          { password: { $eq: String(req.body.password) } },
        ],
      },
    },
    {
      $lookup: {
        from: "designations",
        localField: "designation_id",
        foreignField: "_id",
        as: "designationsDetail",
      },
    },
    {
      $unwind: {
        path: "$designationsDetail",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];
  SuperAdmins.aggregate(signInCond)
    .then((superadmins) => {
      if (superadmins.length) {
        req.session.token = superadmins[0]._id;
        var response = {};
        if (superadmins[0].designationsDetail)
          response["designation"] = superadmins[0].designationsDetail["name1"];
        response["success"] = true;
        response["token"] = req.session.token;
        response["message"] = superadmins[0].username;
        req.session.save(function (err) {
          // session saved
        });
        res.send(
          configure.apiResp(true, 200, response, "", req.headers.isencryption)
        );
      } else {
        res.send(
          configure.apiResp(
            true,
            201,
            response,
            "User is not Authenticated",
            req.headers.isencryption
          )
        );
      }
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Aoc Users.",
      });
    });
};

exports.signOut = (req, res) => {
  if (req.session) {
    var response = {};
    response["success"] = "true";
    req.session.destroy(function (err) {
      // session saved
    });
  }
  res.send(
    configure.apiResp(true, 200, response, "", req.headers.isencryption)
  );
};
