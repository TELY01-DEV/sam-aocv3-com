const { body } = require('express-validator');
const db = require("../../../config/db.config");
const AocUsers = db.aoc_users;

exports.validate = (req) => {
  switch (req) {
    case 'postUserLogin': {
      return [
        body("email", "email: E-mail doesn't exists.").exists(),
        body("password", "password: Password doesn't exists.").exists(),
        body("device_type", "device_type: Device type doesn't exists.").exists(),
        body("device_token", "device_token: Device token doesn't exists.").exists(),
        body("app_version", "app_version: App Version doesn't exists.").exists(),
      ]
    }
  }
}