const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const fcmPush = require("../../../config/fcm-push");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const AocUsers = db.aoc_users;
const UserNotificationSettings = db.user_notification_settings;

exports.updateUserNotification = (req, res) => {
    UserNotificationSettings.findOne({ user_id: ObjectId(req.body.user_id) }, { [req.body.app_type]:1 }).then(data=>{
        var updated_notifications = {};
        updated_notifications[String(req.body.app_type)] = data[req.body.app_type];
        updated_notifications[String(req.body.app_type)][String(req.body.notification_type)] = String(req.body.notification_value);
        UserNotificationSettings.findOneAndUpdate({ user_id: ObjectId(req.body.user_id) }, { $set: updated_notifications }).then(data=>{
            res.send(configure.apiResp(true, 200, {}, 'notificaion changes updated',req.headers.isencryption));
        }).catch(err=>console.log(err));
    }).catch(err=>console.log(err));
}


exports.getUserNotification = (req, res) => {
    UserNotificationSettings.findOne({ user_id: ObjectId(req.body.user_id) }).then(data => {
        res.send(configure.apiResp(true, 200, data, 'notificaion changes updated',req.headers.isencryption));
    })
}