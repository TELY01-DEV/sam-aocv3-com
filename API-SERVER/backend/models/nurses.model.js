module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var Mixed = mongoose.Schema.Types.Mixed;

    var schema = mongoose.Schema(
      {
        first_name: { type: String, default: '' },
        last_name: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        password: { type: String, default: '' },
        profile_picture: { type: String, default: '' },
        hospital_id: ObjectId,
        birthdate: { type: Date, default: '' },
        device_type: { type: String, default: '' },
        device_token: { type: String, default: '' },
        app_version: { type: String, default: '' },
        is_online: { type: Boolean, default: false },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false},
        gender: { type: Number, default: 0 },
        notification_settings :Mixed,
        app_language: { type: String, enum : ['ENG', 'THAI'] ,default: 'ENG'}
      },
      { timestamps: true }
    );

    schema.index({ hospital_id: 1, isactive: 1, isdeleted: 1 });
    const Nurses = mongoose.model("nurses", schema);
  
    return Nurses;
  };