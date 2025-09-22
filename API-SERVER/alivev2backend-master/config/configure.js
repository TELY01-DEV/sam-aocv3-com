const { Buffer } = require('buffer');
const fs = require('fs');

exports.AMB_TRAKCING_TIMEOUT = 60000;

exports.apiResp = (success, status, content, message) => {
    message = (typeof message !== String) ? JSON.stringify(message) : message;
    var resp = { success, status, content, message };
    return (resp);
}

exports.apiReq = (req, res, next) => {
    return (req);
}

exports.severityColor = {
    '_1': 'FF0000',
    '_2': 'FFC0CB',
    '_3': 'FFFF00',
    '_4': '00FF00',
    '_5': 'FFFFFF'
}

exports.speedColor = {
    // 'LTE_80': '267633',
    // 'GT_80_LTE_120': 'FFFF00',
    // 'GT_120': 'FF0303'
    'LTE_80': 'a7ff83',
    'GT_80_LTE_120': 'FFFF00',
    'GT_120': 'FF6B49'
}

exports.trackingAssignColor = {
    'TR_0_ASN_1': '3C54A4',
    'TR_1_ASN_0': 'b0aeae',
    'TR_0_ASN_0': 'b0aeae',
}