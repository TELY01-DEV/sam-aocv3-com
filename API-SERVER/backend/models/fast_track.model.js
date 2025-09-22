module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var schema = mongoose.Schema(
      {
        name: { type: String, default: '' },
        isactive: { type: Number, default: 1 },
        isdeleted : {type: Boolean, default: false},
      },
      { timestamps: true }
    );

    const Fast_tracks = mongoose.model("fast_tracks", schema);
    return Fast_tracks;
  };