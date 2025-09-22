module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        first_name: { type: String, default: '' },
        last_name: { type: String, default: '' },
        age: { type: Number, default: 1 },
        gender: { type: Number, default: 1 },
        unique_hn_code: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false},
      },
      { timestamps: true }
    );

    const Patients = mongoose.model("patients", schema);
    return Patients;
  };