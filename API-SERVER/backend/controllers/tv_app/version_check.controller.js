const db = require("../../config/db.config");
const configure = require("../../config/configure");

const Versions = db.versions;

exports.postTvAppVersionCheck = (req, res) => {
    Versions.findOne({}).then(((version_detail)=> {
        if(version_detail['tv_app'][req.body.device_type][req.body.app_type] == req.body.app_version){
            res.send(configure.apiResp(true, 200, {}, '', req.headers.isencryption));
        } else {
            res.send(configure.apiResp(false, 201, {}, 'You have to update your app from app store or test flight.', req.headers.isencryption));
        }
    }));
}