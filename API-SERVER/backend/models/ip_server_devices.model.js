module.exports = (mongoose) => {
  var schema = mongoose.Schema(
    {
      ip_server_device_id: { type: String, default: "" },
      ip_address: { type: String, default: "" },
      domain: { type: String, default: "" },
      created_by: { type: String, default: "" },
      updated_by: { type: String, default: "" },
      isactive: { type: Number, default: 1 },
      isdeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
  );

  const IpServerDevices = mongoose.model("ip_server_devices", schema);

  return IpServerDevices;
};
