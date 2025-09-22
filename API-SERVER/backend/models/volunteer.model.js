module.exports = mongoose => {
  var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema(
      {
        first_name: { type: String, default: '' },
        last_name: { type: String, default: '' },
        hospital_id: ObjectId,
        profile_picture: { type: String, default: '' },
        email: { type: String, default: '' },
        gender: { type: Number, default: 0 },
        remark: { type: String, default: '' },
        about: { type: String, default: '' },
        updatedAt: { type: Date, default: Date.now() },
        createdAt: { type: Date, default: Date.now() },
        phone: { type: String, default: '' },
        birthdate: { type: Date, default: '' },
        password: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false},
      },
      { timestamps: true }
    );

    schema.index({ hospital_id: 1, isactive: 1, isdeleted: 1 });
    const Volunteers = mongoose.model("volunteers", schema);
  
    return Volunteers;
  };