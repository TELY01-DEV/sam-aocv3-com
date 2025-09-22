const db = require("../../../config/db.config");
const configure = require("../../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const Versions = db.versions;

exports.getAllAppVersions = (req, res) => {
    Versions.findOne({}).then((version_detail)=> {
        var response = {};
            response['version_detail'] = version_detail;
        res.send(configure.apiResp(true, 200, response, '', req.headers.isencryption));;
    }).catch(err => {
        res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving App Versions.", req.headers.isencryption));
    });
}

exports.updateAppVersions = (req, res) => {

    Versions.findOne({}).then((version_detail)=> {
        switch (req.body.app_type) {
            case 'android':
                version_detail['tv_app']['android']['rmt_hos'] = req.body.tv_app_android_rmt_hos;
                version_detail['tv_app']['android']['ekg'] = req.body.tv_app_android_ekg;
                version_detail['tv_app']['android']['er'] = req.body.tv_app_android_er;
                version_detail['tv_app']['android']['ccc'] = req.body.tv_app_android_ccc;
                version_detail['tv_app']['android']['aoc_tv'] = req.body.tv_app_android_aoc_tv;
                version_detail['tv_app']['android']['aoc_tv_oneonetwo'] = req.body.tv_app_android_aoc_tv_oneonetwo;
                break;

            case 'ios':
                version_detail['tv_app']['ios']['rmt_hos'] = req.body.tv_app_ios_rmt_hos;
                version_detail['tv_app']['ios']['ekg'] = req.body.tv_app_ios_ekg;
                version_detail['tv_app']['ios']['er'] = req.body.tv_app_ios_er;
                version_detail['tv_app']['ios']['ccc'] = req.body.tv_app_ios_ccc;
                version_detail['tv_app']['ios']['aoc_tv'] = req.body.tv_app_ios_aoc_tv;
                version_detail['tv_app']['ios']['aoc_tv_oneonetwo'] = req.body.tv_app_ios_aoc_tv_oneonetwo;
                break;
        }

        Versions.findOneAndUpdate({}, { $set: { 'tv_app': version_detail['tv_app']}}, { new: true }).then((version_detail)=> {
            var response = {};
            response['version_detail'] = version_detail;
            res.send(configure.apiResp(true, 200, response, '',req.headers.isencryption));;
        });
    }).catch(err => {
        res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving App Versions.", req.headers.isencryption));
    });
}