const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator");

const auth = require("../../middleware/auth");
const User = require("../../models/User");

/*
  @route     GET api/auth
  @desc      Gets authentication
  @access    Public
 */

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    return res.json(user);
  } catch (err) {
    console.error("Error in auth");
    return res
      .status(500)
      .json({ message: "Error retrieving valid user from the database" });
  }
});

/*
  @route     POST api/auth
  @desc      Logs in user, returns token
  @access    Public
 */

router.post(
  "/",
  [
    check("email")
      .isEmail()
      .exists(),
    check("password").exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        return res
          .status(401)
          .json({ errors: [{ message: "Invalid credentials." }] });
      }

      const isMatch = await bcrypt.compare(password, existingUser.password);

      if (!isMatch) {
        return res
          .status(401)
          .json({ errors: [{ message: "Invalid credentials." }] });
      }

      const payload = {
        user: { id: existingUser.id }
      };

      await jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 360000 },
        async (err, token) => {
          if (err) {
            console.error("Error signing jwt", err.message);
            return res
              .status(500)
              .json({ errors: [{ message: "Invalid credentials." }] });
          }
          return res.json({ token });
        }
      );
    } catch (err) {
      console.error("Error in auth.", err.message);
      return res
        .status(500)
        .json({ errors: [{ message: "Invalid credentials." }] });
    }
  }
);

module.exports = router;
