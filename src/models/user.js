const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 20,
    },
    lastName: {
      type: String,
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: (props) => `${props.value} is not a valid email address`,
      },
    },
    password: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: {
        values: ["male", "female", "others"],
        message: `{VALUE} is not a valid gender type`,
      },
    },
    imageURL: {
      type: String,
      default: "https://statinfer.com/wp-content/uploads/dummy-user.png",
    },
    about: {
      type: String,
      default: "This is random description about the user !",
    },
    skills: {
      type: [String],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

userSchema.index({ firstName: 1 });
userSchema.index({ gender: 1 });

userSchema.methods.getJWT = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
  return bcrypt.compare(passwordInputByUser, this.password);
};
const User = mongoose.model("User", userSchema);

module.exports = User;