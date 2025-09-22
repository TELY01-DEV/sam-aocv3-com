const { body } = require('express-validator');
const db = require("../../../config/db.config");
const AocUsers = db.aoc_users;

exports.validate = (req) => {
  switch (req) {
    case 'postUserExistCheck': {
      return [
        body("email", "email: Email doesn't exists.").exists().isEmail().custom(value => {
          return AocUsers.find({ "email": value }).then(aoc_user => {
            if (aoc_user.length) {
              return Promise.reject({ status: 1001, message: 'Email already in exist.' });
            }
          })
        }),
        body("phone", "phone: Phone doesn't exists.").exists().isLength({ min: 8, max:13 }).custom(value => {
          return AocUsers.find({ "phone": value }).then(aoc_user => {
            if (aoc_user.length) {
              return Promise.reject({ status: 1002, message: 'Phone already in exist.' });
            }
          })
        }),
      ]
    }

    case 'postUserRegister': {
      return [
        body("first_name", "name: Name doesn't exists.").exists(),
        body("last_name", "name: Name doesn't exists.").exists(),
        body("email", "email: Email doesn't exists.").exists().isEmail(),
        body("phone", "phone: Phone doesn't exists.").exists(),
        body("password", "password: Password doesn't exists.").exists(),
        body("hospital_id", "hospital_id: Hospital Id doesn't exists.").exists(),
        body("zone_id", "zone_id: Zone Id doesn't exists.").exists(),
        body("device_type", "device_type: Device Type doesn't exists.").exists(),
        body("device_token", "device_token: Device Token doesn't exists.").exists(),
        body("app_version", "app_version: App Version doesn't exists.").exists(),
      ]
    }

    case 'postUserLogin': {
      return [
        body("user_name", "user_name: User Name doesn't exists.").exists(),
        body("password", "password: Password doesn't exists.").exists(),
        body("device_type", "device_type: Device type doesn't exists.").exists(),
        body("device_token", "device_token: Device token doesn't exists.").exists(),
        body("app_version", "app_version: App Version doesn't exists.").exists(),
      ]
    }

    case 'postUserDetail': {
      return [
        body("user_id", "user_id: User id doesn't exists.").exists(),
      ]
    }

    case 'postUserDetailUpdate': {
      return [
        body("user_id", "user_id: User id doesn't exists.").exists(),
      ]
    }

    case 'postUserPushSettingUpdate': {
      return [
        body("user_id", "user_id: User id doesn't exists.").exists(),
      ]
    }

    case 'postUserDetailUpdate': {
      return [
        body("user_id", "user_id: User id doesn't exists.").exists(),
      ]
    }

    case 'postUserForgotPassword': {
      return [
        body("email", "email: Email doesn't exists.").exists().isEmail().custom(value => {
          return Users.find({ "email": value }).then(user => {
            if (!(user.length)) {
              return Promise.reject('Email not found');
            }
          })
        })
      ]
    }

    case 'postUserLogout': {
      return [
        body("user_id", "user_id: User id doesn't exists.").exists(),
      ]
    }
  }
}