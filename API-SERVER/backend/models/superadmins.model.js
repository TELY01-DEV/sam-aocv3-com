module.exports = mongoose => {
    var ObjectId = mongoose.Schema.Types.ObjectId;
  
      var schema = mongoose.Schema(
        {
          email: { type: String, default: '' },
          password: { type: String, default: '' },
          username: { type: String, default: '' },
          token: { type: String, default: '' },
          },
        { timestamps: true }
      );
  
      const SuperAdmin = mongoose.model("superadmins", schema);
      return SuperAdmin;
    };