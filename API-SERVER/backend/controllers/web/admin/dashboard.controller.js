const db = require("../../../config/db.config");
const configure = require("../../../config/configure");

// List of collections to query for isDelete and isActive counts
const collections = {
  aocUsers: db.aoc_users,
  doctors: db.doctors,
  drivers: db.drivers,
  nurses: db.nurses,
  aocErStaffs: db.aoc_er_staffs,
  aocEmsStaffs: db.aoc_ems_staffs,
  ambulanceDetail: db.ambulances,
  hospitalDetail: db.hospitals,
};

// aoc_request query conditions based on request_status
const aocRequestStatuses = {
  total: {},
  completed: { request_status: "COMPLETED" },
  canceled: { request_status: "CANCELED" },
  assigned: { request_status: "OPERATION_ASSIGNED" },
};

exports.getDashboardDetails = async (req, res) => {
  try {
    const results = {};

    // Fetch data for collections with isDelete and isActive counts
    for (const [key, collection] of Object.entries(collections)) {
      const totalCondition = { isdeleted: false };
      const activeCondition = { isdeleted: false, isactive: true };
      const deActiveCondition = { isdeleted: false, isactive: false };

      const total = await collection.countDocuments(totalCondition);
      const isActive = await collection.countDocuments(activeCondition);
      const isNotActive = await collection.countDocuments(deActiveCondition);

      results[key] = {
        total: total,
        isactive: isActive,
        deactive: isNotActive,
      };
    }

    // Fetch request status counts for aoc_request
    const aocRequestDetail = {};

    for (const [statusKey, statusCondition] of Object.entries(
      aocRequestStatuses
    )) {
      const count = await db.aoc_requests.countDocuments(statusCondition);
      aocRequestDetail[statusKey] = [{ count: count }];
    }

    results["aocRequestDetail"] = [aocRequestDetail];

    // Send response
    res.send(
      configure.apiResp(
        true,
        200,
        { data: results },
        "",
        req.headers.isencryption
      )
    );
  } catch (err) {
    res
      .status(500)
      .send(
        configure.apiResp(
          true,
          500,
          {},
          err.message || "Some error occurred while retrieving data.",
          req.headers.isencryption
        )
      );
  }
};
