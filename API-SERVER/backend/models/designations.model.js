module.exports = mongoose => {
  var ObjectId = mongoose.Schema.Types.ObjectId;

    var schema = mongoose.Schema(
      {
        name1: { type: String, default: '' },
        name2: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        isdeleted: { type: Boolean, default: false },
        createdAt: { type: Date ,default: Date.now},
        updatedAt: { type: Date ,default: Date.now},
      },
      { timestamps: true }
    );

    const Designations = mongoose.model("designations", schema);
    return Designations;
  };