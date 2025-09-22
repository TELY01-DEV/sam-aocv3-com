module.exports = mongoose => {
  var ObjectId = mongoose.Schema.Types.ObjectId;
  var Mixed = mongoose.Schema.Types.Mixed;

    var schema = mongoose.Schema(
      {

        first_name: { type: String, default: '' },
        last_name: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        gender: { type: Number, default: 0 },
        profile_picture: { type: String, default: '' },
        birthdate: { type: Date, default: '' },
        password: { type: String, default: '' },
        hospital_id: ObjectId,
        designation_id: ObjectId,
        device_type: { type: String, default: '' },
        device_token: { type: String, default: '' },
        app_version: { type: String, default: '' },
        is_online: { type: Boolean, default: false },
        isactive: { type: Number, default: 0 },
        isdeleted : {type: Boolean, default: false},
        notification_settings :Mixed,
        app_language: { type: String, enum : ['ENG', 'THAI'] ,default: 'ENG'}
      },
      { timestamps: true }
    );
    
    schema.index({ hospital_id: 1, isactive: 1, isdeleted: 1 });
    const Paramedics = mongoose.model("paramedics", schema);
  
    return Paramedics;
  };