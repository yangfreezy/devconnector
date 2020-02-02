const express = require("express");
const MongoClient = require("mongoose").Client;

const app = express();
const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Hello! Welcome to the DevConnector API");
});

app.listen(PORT, () => {
  console.log("Listening on port: " + PORT);
});
