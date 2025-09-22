module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema(
      {
        user_type: { type: String, enum : ['AOC_USERS', 'DRIVERS', 'DOCTORS', 'NURSES', 'AOC_ER_STAFFS', 'AOC_EMS_STAFFS'], default: 'AOC_USERS' },
        user_id: ObjectId,
        check_in_datetime: { type: Date, default: Date.now() },
        check_out_datetime: { type: Date, default : null }
      },
    );

    const UserPresenceLogs = mongoose.model("user_presence_logs", schema);
  
    return UserPresenceLogs;

  };