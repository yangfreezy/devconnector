const express = require("express");
const router = express.Router();

/*
  @route     GET api/posts
  @desc      Gets posts
  @access    Public
 */

router.get("/", (req, res) => {
  return res.send("Posts get route");
});

module.exports = router;
