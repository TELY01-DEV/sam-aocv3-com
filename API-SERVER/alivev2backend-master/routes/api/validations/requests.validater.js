const { body } = require('express-validator');
const db = require("../../../config/db.config");
const AocUsers = db.aoc_users;

exports.validate = (req) => {
    switch (req) {
        case 'postAliveUserCreateRequest': {
            return [
                body("alive_user_code", "alive_user_code: Alive User Code doesn't exists.").exists(),
            ]
        }

        case 'postAliveUserGetRequestStatus': {
            return [
                body("aoc_requests_id", "aoc_requests_id: Aoc Requests Id doesn't exists.").exists(),
            ]
        }
        
        case 'postAliveUserCancelRequest': {
            return [
                body("aoc_requests_id", "aoc_requests_id: Aoc Requests Id doesn't exists.").exists(),
            ]
        }
    }
}