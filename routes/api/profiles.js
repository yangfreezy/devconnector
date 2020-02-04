const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const request = require("request");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
const auth = require("../../middleware/auth");

/*
  @route     GET api/profiles
  @desc      Gets current user's profiles
  @access    Private
 */

router.get("/me", auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );

    if (!profile) {
      return res.status(400).json({ message: "No profile for this user." });
    }
    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Database error");
  }
  res.send("Profiles get route");
});

/*
  @route     GET api/profiles/github/:username
  @desc      Gets github repositories for user with their github username
  @access    Public
 */

router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      uri: encodeURI(
        `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}`
      ),
      method: "GET",
      headers: { "user-agent": "node.js" }
    };

    const data = request(options, (error, response, body) => {
      if (error) {
        console.error(error);
      }
      if (response.statusCode !== 200) {
        return res.status(404).json({ message: "Github profile not found" });
      }
      console.log(res);
      return res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Database error");
  }
});

/*
  @route     GET api/profiles/user/:user_id
  @desc      Gets profile by user_id
  @access    Public
 */

router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate("user", ["name", "avatar"]);
    if (!profile) {
      return res.status(400).json({ message: "Profile not found" });
    }
    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Database error.");
  }
});

/*
  @route     POST api/profiles
  @desc      Creates a user profile
  @access    Private
 */

router.post(
  "/",
  [
    auth,
    check("status", "Status is required.")
      .not()
      .isEmpty(),
    check("skills", "Skills are required.")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    const profileFields = {};

    profileFields.user = req.user.id;

    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map(skill => skill.trim());
    }

    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      const profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true }
      );
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

/*
  @route     PUT api/profiles/experience
  @desc      Creates an entry in the experiences array for a profile
  @access    Private
 */

router.put(
  "/experience",
  [
    auth,
    check("title", "Title is required.")
      .not()
      .isEmpty(),
    check("company", "Company is required.")
      .not()
      .isEmpty(),
    check("from", "Start date is required.")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

/*
  @route     PUT api/profiles/education
  @desc      Creates an entry in the education array for a profile
  @access    Private
 */

router.put(
  "/education",
  [
    auth,
    check("school", "School is required.")
      .not()
      .isEmpty(),
    check("fieldofstudy", "Field of study is required.")
      .not()
      .isEmpty(),
    check("from", "Start date is required.")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEducation = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEducation);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

/*
  @route     DELETE api/profiles/
  @desc      Deletes profile, user, posts, and messages
  @access    Private
 */

router.delete("/", auth, async (req, res) => {
  try {
    const profile = await Profile.findOneAndRemove({
      user: req.user.id
    });
    const user = await User.findOneAndRemove({
      id: req.params.user_id
    });
    if (!profile) {
      return res.status(400).json({ message: "Profile not found" });
    }
    return res.json({ message: "Profile and user deleted" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Database error.");
  }
});

/*
  @route     DELETE api/profiles/experience
  @desc      Deletes an experience from the experience array in a user's profile
  @access    Private
 */

router.delete("/experience/:experience_id", auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { experience: { _id: req.params.experience_id } } },
      { new: true }
    );
    return res.json({ foundProfile, message: "Profile experience deleted" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Database error.");
  }
});

/*
  @route     DELETE api/profiles/education
  @desc      Deletes an education from the education array in a user's profile
  @access    Private
 */

router.delete("/education/:education_id", auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { education: { _id: req.params.education_id } } },
      { new: true }
    );
    return res.json({ foundProfile, message: "Profile education deleted" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Database error.");
  }
});

/*
  @route     GET api/profiles
  @desc      Gets all current users profiles
  @access    Public
 */

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    return res.json(profiles);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Database error.");
  }
});

module.exports = router;
