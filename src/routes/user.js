const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const { connections } = require("mongoose");
const userRouter = express.Router();

const USER_SAFE_DATA = [
  "firstName",
  "lastName",
  "about",
  "imageURL",
  "age",
  "gender",
];

userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connectionRequest = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
    }).populate("fromUserId", USER_SAFE_DATA);
    // console.log(connectionRequest);

    const data = connectionRequest.map((row) => ({
      reqId: row._id,
      User: row.fromUserId,
    }));

    res.json({ data });
  } catch (error) {
    res.status(404).send("ERROR: " + error.message);
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    // Shivam - sends ConnectionRequest to - elon musk - & If It accepted by elon musk
    // Then It should show me in the connection list of Shivam

    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { toUserId: loggedInUser._id, status: "accepted" },
        { fromUserId: loggedInUser._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);

    const data = connectionRequests.map((row) => {
      if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });

    res.json({ data });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

userRouter.delete("/user/:_id", userAuth, async (req, res) => {
  try {
    const { _id } = req.params;
    const loggedInUser = req.user;

    if (loggedInUser._id.toString() !== _id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this account" });
    }

    // Remove the Connection and Update the Connection List in the Database
    await User.findByIdAndDelete(_id);
    res.json({ message: "User deleted Successfully !!" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;

    const skip = (page - 1) * limit;

    // find the all connection request (sent + recevied)
    const connectionRequests = await ConnectionRequest.find({
      $or: [{ fromUserId: loggedInUser._id }, { toUserId: loggedInUser._id }],
    }).select("fromUserId toUserId");

    const hideUsersFromFeed = new Set();
    connectionRequests.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });

    const users = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideUsersFromFeed) } }, // Not present in Array of hideUsersFromFeed
        { _id: { $ne: loggedInUser._id } }, // find all user where id is not equal to loggedInUser._id
      ],
    })
      .select(USER_SAFE_DATA)
      .skip(skip)
      .limit(limit);

    res.json({ data: users });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = userRouter;