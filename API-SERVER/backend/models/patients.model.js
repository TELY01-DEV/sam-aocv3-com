module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        first_name: { type: String, default: '' },
        last_name: { type: String, default: '' },
        profile_image: { type: String, default: '' },
        age: { type: Number, default: 1 },
        gender: { type: Number, default: 1 },
        phone : { type: String,  default: '' },
        unique_hn_code: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false},
      },
      { timestamps: true }
    );

    schema.index({ unique_hn_code: 1, isactive: 1, isdeleted: 1 });
    const Patients = mongoose.model("patients", schema);
    return Patients;
  };