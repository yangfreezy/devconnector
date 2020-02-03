const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");
const jwt = require("jsonwebtoken");

const User = require("../../models/User");

/*
  @route     POST api/users
  @desc      Registers a user
  @access    Public
 */

router.post(
  "/",
  [
    check("name", "Name is required")
      .not()
      .isEmpty(),
    check("email", "Email must be a valid email").isEmail(),
    check("password", "Password must be at least 5 characters long").isLength({
      min: 5
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ errors: [{ message: "User already exists." }] });
    }

    const avatar = gravatar.url(email, {
      s: "200",
      r: "pg",
      mm: "mm"
    });

    const newUser = new User({ name, email, avatar, password });

    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    try {
      await newUser.save();
      const payload = { user: { id: newUser.id } };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) {
            return res
              .status(500)
              .json({ errors: [{ message: "Internal server error." }] });
          }
          return res.json({
            message: "User created",
            token
          });
        }
      );
    } catch (err) {
      console.log("Error in users.js", err);
      return res
        .status(500)
        .json({ errors: [{ message: "Internal server error." }] });
    }
  }
);

module.exports = router;
