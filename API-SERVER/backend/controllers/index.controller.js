const { redisClient } = require('../server');
const db = require("../config/db.config");

var fs = require('fs');
var xmlReader = require('read-xml');
var convert = require('xml-js');
var fcm = require('../config/fcm-push.js');

const Ambulances = db.ambulances;

exports.index = (req, res) => {
    res.render('index', { title: 'AOC-V.2 Server On' });
};

exports.clear_redis_data = (req, res) => {
    console.log('clear_redis_data');
    Ambulances.find({}, {_id: 1}).then((ambulances_data)=> {
        ambulances_data.forEach((ambulance_detail) => {
            redisClient.del(String(ambulance_detail._id));
        });
    })
    res.send();
}

exports.error_codes = (req, res) => {
    var error_codes = {
        500: 'Error on server.',
        1001: 'Email already in exist.',
        1002: 'Phone already in exist.',
        1003: 'Credential wrong.',
        1004: 'User Id wrong.',

        5001: 'Moniter already assign.',
        5002: 'Glass already assign.',
        5003: 'FastTrack already assign.',
    }
    res.json(error_codes);
};

exports.kmltest = (req, res) => {
    xmlReader.readXML(fs.readFileSync('./public/uploads/aoc_zones/kml/ChiangRai.kml'), function (err, data) {
        if (err) {
            console.error(err);
        }
        var coordinates = [];
        var xml = data.content;
        var result = JSON.parse(convert.xml2json(xml, { compact: true, spaces: 4 }));
        var coordinatesArr = String(result.kml.Document.Placemark.Polygon.outerBoundaryIs.LinearRing.coordinates._text).replace(/\n/g, '').split(',0');
        for (var i = 0; i < coordinatesArr.length; i++) {
            var results = String(coordinatesArr[i]).replace(/ /g, '');
            var latlon = results.split(",");
            if (latlon[1]) {
                var location = [latlon[1], latlon[0]];
                coordinates.push(location);
            }
        }
    });
};

exports.pushtest = async (req, res) => {
    var success = await fcm.sendPush(
        String(req.body.DeviceToken),
        String(req.body.collapse_key),
        String(req.body.data),
        String(req.body.title),
        String(req.body.body),
        String(req.body.sound),String(req.body.color));

    res.send(success);
}


const AocEmsStaff = db.aoc_ems_staffs;
const AocErStaff = db.aoc_er_staffs;
const EmsStaff = db.emt_staffs;

// setTimeout(() => {
//     AocErStaff.find({}).then(ems_data=> {
//         ems_data.forEach(ems_detail=>{
//             let emt_staffs = new EmsStaff(ems_detail);
//             emt_staffs.isNew = true; 
//             emt_staffs.save(emt_staffs).then(err=> {
//                 console.log(err);
//             })
//         })
//     })
// }, 3000);