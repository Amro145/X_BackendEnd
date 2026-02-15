import { genTokenAndSetCookie } from "../lib/genToken.js";
import User from "../Models/auth.model.js";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../MiddleWare/asyncHandler.js";
import { signupSchema, loginSchema } from "../Validators/auth.validator.js";

export const signup = asyncHandler(async (req, res) => {
  const validatedData = await signupSchema.parseAsync(req.body);
  const { userName, email, password } = validatedData;

  const isUserExist = await User.findOne({ email })
  if (isUserExist) {
    return res.status(400).json({ message: "User Already Exists" })
  }
  // hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)
  // create user
  const newUser = new User({
    userName,
    email,
    password: hashedPassword
  })
  if (newUser) {
    await newUser.save()
    genTokenAndSetCookie(newUser._id, res)

    // Remove password from response
    newUser.password = undefined;
    return res.status(201).json(newUser)

  } else {
    return res.status(400).json({ message: "Invalid data" })
  }
});

export const login = asyncHandler(async (req, res) => {
  const validatedData = await loginSchema.parseAsync(req.body);
  const { email, password } = validatedData;

  const user = await User.findOne({ email })
  const isPasswordMatch = await bcrypt.compare(password, user?.password || "")
  if (!user || !isPasswordMatch) {
    return res.status(400).json({ message: "Invalid email or password" });
  }
  genTokenAndSetCookie(user._id, res)
  user.password = undefined;
  return res.status(200).json(user)
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV !== "development" ? "none" : "lax",
    secure: process.env.NODE_ENV !== "development",
    path: "/",
  });
  return res.status(200).json({ message: "Logout Successfully" });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  return res.status(200).json(user);
});
