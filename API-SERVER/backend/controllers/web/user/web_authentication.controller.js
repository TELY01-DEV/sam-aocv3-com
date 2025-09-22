const db = require("../../../config/db.config");
const AocUsers = db.aoc_users;
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { redisClient } = require("../../../server");
const configure = require("../../../config/configure");
exports.signIn = (req, res) => {
  if (req.body.user_type == "Aoc User") {
    AocUsers.find({
      email: req.body.email,
      password: req.body.password,
      //isactive: 1,
    })
      .then((aoc_users) => {
        console.log("aoc_users", aoc_users);
        if (aoc_users && aoc_users.length) {
          req.session.token = aoc_users[0]._id;
          var response = {};
          req.session.user_id = aoc_users._id;

          // AocUsers.findOneAndUpdate({'_id': aoc_users._id}, {
          //     'api_token.aoc_web' : String(ObjectId()),
          //     'device_token.aoc_web' : String("web_token"),
          //     'is_online': 1,
          //     'device_type': String(req.body.device_type),
          //     'device_token': aoc_users.device_token,
          //     'api_token': aoc_users.api_token,
          //     'app_version': String(req.body.app_version),
          // }, { 'fields': { _id: 1 }, 'new': true }).then();

          // aoc_users.save();
          // redisClient.set(String(aoc_users._id), JSON.stringify(aoc_users.api_token['aoc_web']), (err, reply) => { console.log(err);})
          response["success"] = true;
          response["token"] = req.session.token;
          response["data"] = aoc_users[0].hospital_id;
          console.log("response", response);
          req.session.save(function (err) {
            // session saved
          });
          res.send(
            configure.apiResp(true, 200, response, "", req.headers.isencryption)
          );
        } else {
          var response = {};
          res.send(
            configure.apiResp(
              false,
              200,
              response,
              "User not Authenticated !",
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
              response,
              err.message || "Some error occurred while retrieving Aoc Users.",
              req.headers.isencryption
            )
          );
      });
  } else {
    var response = {};
    response["success"] = false;
    // aoc_users['aoc_web'].api_token = "";
    // aoc_users['aoc_web'].device_token = "";
    response["message"] = "User not Authenticated !";
    res.send(
      configure.apiResp(true, 200, response, "", req.headers.isencryption)
    );
  }
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
