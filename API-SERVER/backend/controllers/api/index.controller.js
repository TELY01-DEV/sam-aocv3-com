var configure = require('../../config/configure.js');

exports.checkConnection = (req, res) => {
    resp = {};
    if(req.body.device_type && req.body.device_type == 'ios') resp['app_version'] = '2.7';
    else resp['app_version'] = '2.0.6';

    res.send(configure.apiResp(true, 200, resp, '',req.headers.isencryption));

};