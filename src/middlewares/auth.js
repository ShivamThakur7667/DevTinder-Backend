const jwt = require("jsonwebtoken");
const User = require("../models/user");

const JWT_SECRET = process.env.JWT_SECRET;

const userAuth = async (req, res, next) => {
  try {
    const cookies = req.cookies;
    const { token } = cookies;
    if (!token) {
      return res.status(401).send("You are not Logged In !!");
    }

    const decodedObj = jwt.verify(token, JWT_SECRET);

    const { _id } = decodedObj;

    const user = await User.findById(_id);

    if (!user) {
      throw new Error("User not found");
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(400).send(" ERROR : " + error.message);
  }
};

module.exports = {
  userAuth,
};
