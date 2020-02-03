const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });
    console.log("MongoDB Connected.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
