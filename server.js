const express = require("express");
const connectDB = require("./config/db");

require("dotenv").config();

const app = express();

app.use(express.json({ extended: false }));

connectDB();

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Hello! Welcome to the DevConnector API");
});

app.use("/api/messages", require("./routes/api/messages"));
app.use("/api/users", require("./routes/api/users"));
app.use("/api/profiles", require("./routes/api/profiles"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/posts", require("./routes/api/posts"));

app.listen(PORT, () => {
  console.log("Listening on port: " + PORT);
});
