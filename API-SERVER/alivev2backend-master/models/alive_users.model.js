module.exports = mongoose => {
    var Mixed = mongoose.Schema.Types.Mixed;

    var schema = mongoose.Schema(
      {
        first_name :{ type: String, default: '' },
        last_name : { type: String, default: '' },
        device_type: { type: String, default: '' },
        device_token: { type: String, default: '' },
        device_code: { type: String, default: '' },
        app_version: { type: String, default: '' },
        location: {
            lat: { type: Number, default: 0 },
            lon: { type: Number, default: 0 },
        }, 
        alive_user_code: { type: Number, default: 0 }
      },
      { timestamps: true }
    );

    const AliveUsers = mongoose.model("alive_users", schema);
  
    return AliveUsers;
  };