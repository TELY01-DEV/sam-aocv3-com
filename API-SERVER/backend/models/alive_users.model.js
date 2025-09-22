module.exports = mongoose => {
    var Mixed = mongoose.Schema.Types.Mixed;

    var schema = mongoose.Schema(
      {
        first_name :{ type: String, default: '' },
        last_name :{ type: String, default: '' },
        device_type: { type: String, default: '' },
        device_token: Mixed,
        device_code: { type: String, default: '' },
        profile_image: { type: String, default: '' },
        phone: { type: String, default: '' },
        app_version: { type: String, default: '' },
        location: {
            lat: { type: Number, default: 0 },
            lon: { type: Number, default: 0 },
        }, 
        notification_settings :Mixed,
        alive_user_code: { type: Number, default: 0 },
        alive_app_language: { type: String, enum : ['ENG', 'THAI'] ,default: 'ENG'}

      },
      { timestamps: true }
    );

    const AliveUsers = mongoose.model("alive_users", schema);
  
    return AliveUsers;
  };