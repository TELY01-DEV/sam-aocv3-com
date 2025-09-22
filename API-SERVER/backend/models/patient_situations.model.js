module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        situation: { type: String, default: '' },
        situation1: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false}
      },
      { timestamps: true }
    );

    const PatientSituations = mongoose.model("patient_situations", schema);
    return PatientSituations;
  };