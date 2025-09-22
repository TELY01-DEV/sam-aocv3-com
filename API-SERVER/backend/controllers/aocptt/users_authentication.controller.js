const db = require("../../config/db.config");
const configure = require("../../config/configure");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { validationResult } = require('express-validator');
const { redisClient } = require('../../server');

const AocUsers = db.aoc_users;

exports.postUserLogin = async (req, res) => {
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.send(configure.apiResp(false, 400, {}, errors.array()));
        return;
    }

    const condition = [
        {
            '$match': {
                "$or": [
                    {
                        "$and": [
                            {
                                'email': String(req.body.email),
                                'password': String(req.body.password),
                            }
                        ]
                    },
                    {
                        "$and": [
                            {
                                'phone': String(req.body.phone),
                                'password': String(req.body.password),
                            }
                        ]
                    }
                ]
            }
        },
    ];

    AocUsers.aggregate(condition)
    .then((aoc_users) => {

        var resp = {};
        if(aoc_users.length == 1){
                aoc_users = aoc_users[0];
                aoc_users.device_token = (aoc_users.device_token)?(aoc_users.device_token):{};
                aoc_users.device_token['aocptt'] = String(req.body.device_token);
                aoc_users.api_token = (aoc_users.api_token)?(aoc_users.api_token):{};
                aoc_users.api_token['aocptt'] = String(ObjectId());
                AocUsers.findOneAndUpdate({'_id': aoc_users._id}, { 
                    'device_type': String(req.body.device_type),
                    'device_token': aoc_users.device_token,
                    'api_token': aoc_users.api_token,
                }, { 'fields': { _id: 1 }, 'new': true }).then();
    
               
                req.session.api_token = aoc_users.api_token;
                req.session.save(function(err) {
                    // session saved
                });
                resp.id = aoc_users._id;
                res.send(configure.apiResp(true, 200, resp, '',req.headers.isencryption));
            } else {
            res.send(configure.apiResp(false, 1003, {}, 'Credentials are wrong.',req.headers.isencryption));
        }
    })
    .catch(err => {
        res.status(500).send(configure.apiResp(false, 500, {}, err.message || "Some error occurred while retrieving User.",req.headers.isencryption));
    });
};