module.exports = (mongoose) => {
  var schema = mongoose.Schema(
    {
      tv_app: {
        android: {
          rmt_hos: { type: String, default: "" },
          er: { type: String, default: "" },
          ccc: { type: String, default: "" },
          ekg: { type: String, default: "" },
          aoc_tv: { type: String, default: "" },
          aoc_tv_oneonetwo: { type: String, default: "" },
        },
        ios: {
          rmt_hos: { type: String, default: "" },
          er: { type: String, default: "" },
          ccc: { type: String, default: "" },
          ekg: { type: String, default: "" },
          aoc_tv: { type: String, default: "" },
          aoc_tv_oneonetwo: { type: String, default: "" },
        },
      },
    },
    { timestamps: true }
  );

  const Versions = mongoose.model("versions", schema);

  return Versions;
};
