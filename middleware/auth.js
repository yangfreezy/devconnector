const jwt = require("jsonwebtoken");

module.exports = async function(req, res, next) {
  // Get token from the header
  const token = req.header("x-auth-token");
  // Check token
  if (!token) {
    return res
      .status(401)
      .json({ errors: [{ message: "No token, authorization denied." }] });
  }
  try {
    await jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
      if (error) {
        return res.status(401).json({
          message: "Invalid token my friend."
        });
      } else {
        req.user = decoded.user ? decoded.user : decoded;
        return next();
      }
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      message: "Database error."
    });
  }
};
