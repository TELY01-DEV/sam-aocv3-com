module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var schema = mongoose.Schema(
      {
        name: { type: String, default: '' },
        hospital_id: [ObjectId]
      },
      { timestamps: true }
    );

    const Communities = mongoose.model("communities", schema);
    return Communities;
  };