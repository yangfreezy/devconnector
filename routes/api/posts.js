const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

const User = require("../../models/User");
const Post = require("../../models/Post");
const auth = require("../../middleware/auth");

/*
  @route     PUT api/posts/:post_id/like
  @desc      Creates a posts
  @access    Private
 */

router.put("/:post_id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    post.likes = post.likes.concat({ user: req.user.id });
    await post.save();
    return res.status(200).json({ message: "Like created", post });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ errors: [err] });
  }
});

/*
  @route     PUT api/posts/:post_id/comment
  @desc      Creates a comment on a post
  @access    Private
 */

router.put(
  "/:post_id/comment",
  [
    auth,
    check("text", "Text is required.")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const post = await Post.findById(req.params.post_id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const user = await User.findById(req.user.id);

      post.comments = post.comments.concat({
        text: req.body.text,
        user: user._id,
        name: user.name,
        avatar: user.avatar
      });

      await post.save();
      return res.status(200).json({ message: "Comment added", post });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ errors: [err] });
    }
  }
);

/*
  @route     PUT api/posts/:post_id/uncomment/:comment_id
  @desc      Removes a comment on a post given the post id and comment id
  @access    Private
 */

router.put("/:post_id/uncomment/:comment_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const user = await User.findById(req.user.id);

    post.comments = await post.comments.filter(comment => {
      if (req.user.id === comment.user._id.toString()) {
        return comment._id.toString() !== req.params.comment_id;
      }
    });

    await post.save();
    return res.status(200).json({ message: "Comment added", post });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ errors: [err] });
  }
});

/*
  @route     GET api/posts/:user_id
  @desc      Gets a users posts
  @access    Private
 */

router.get("/user/:user_id", auth, async (req, res) => {
  try {
    const post = await Post.find({ user: req.params.user_id }).sort({
      date: -1
    });
    return res.status(200).json({ post });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ errors: [err] });
  }
});

/*
  @route     GET api/posts/:post_id
  @desc      Gets a post by post id
  @access    Private
 */

router.get("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.status(200).json({ post });
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Post not found" });
    }
    console.error(err.message);
    return res.status(500).json({ errors: [err] });
  }
});

/*
  @route     PUT api/posts/:post_id/unlike
  @desc      Removes a like from a post
  @access    Private
 */

router.put("/:post_id/unlike", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    post.likes = post.likes.filter(like => {
      like.user.toString() == req.user.id;
    });
    await post.save();
    return res.status(200).json({ message: "Like removed", post });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ errors: [err] });
  }
});

/*
  @route     DELETE api/posts/:post_id
  @desc      Deletes a post by post id
  @access    Private
 */

router.delete("/:post_id", auth, async (req, res) => {
  try {
    const post = await Post.findOneAndRemove({ _id: req.params.post_id });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (req.user.id !== String(post.user)) {
      return res
        .status(401)
        .json({ message: "User unauthorized to delete these posts" });
    }
    return res.status(200).json({ post });
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Post not found" });
    }
    console.error(err.message);
    return res.status(500).json({ errors: [err] });
  }
});

/*
  @route     DELETE api/posts/:user_id
  @desc      Deletes all posts matching a user id
  @access    Private
 */

router.delete("/user/:user_id", auth, async (req, res) => {
  if (req.user.id !== req.params.user_id) {
    return res
      .status(401)
      .json({ message: "User unauthorized to delete these posts" });
  }
  try {
    const post = await Post.deleteMany(
      { user: req.params.user_id },
      { new: true }
    );
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    return res.status(200).json({ post });
  } catch (err) {
    if (err.kind === "ObjectId") {
      return res.status(404).json({ message: "Post not found" });
    }
    console.error(err.message);
    return res.status(500).json({ errors: [err] });
  }
});

/*
  @route     POST api/posts
  @desc      Creates a posts
  @access    Private
 */

router.post(
  "/",
  [
    auth,
    check("text", "Text is required.")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id);
      const post = new Post({
        text: req.body.text,
        user: req.user.id,
        name: user.name,
        avatar: user.avatar
      });
      await post.save();
      return res.status(200).json({ message: "Post created", post });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ errors: [err] });
    }
  }
);

/*
  @route     GET api/posts/
  @desc      Gets all posts
  @access    Private
 */

router.get("/", auth, async (req, res) => {
  try {
    const post = await Post.find().sort({
      date: -1
    });
    return res.status(200).json({ post });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ errors: [err] });
  }
});

module.exports = router;
