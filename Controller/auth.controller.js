import { genTokenAndSetCookie } from "../lib/genToken.js";
import User from "../Models/auth.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  const { userName, email, password } = req.body
  try {
    // Validate required fields
    if (!userName?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" })
    }

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

  } catch (error) {
    console.log("Signup Error:", error);
    return res.status(500).json({
      message: "Error in signup",
      error: error.message || "Unknown error"
    })
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body
  try {
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email })
    const isPasswordMatch = await bcrypt.compare(password, user?.password || "")
    if (!user || !isPasswordMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    genTokenAndSetCookie(user._id, res)
    user.password = undefined;
    return res.status(200).json(user)

  } catch (error) {
    return res.status(500).json({ message: "Error in login", error })
  }
};
export const logout = async (req, res) => {
  try {

    res.cookie("jwt", "", { maxAge: 0 })
    req.user = null;
    return res.status(200).json({ message: "Logout Successfully" })

  } catch (error) {
    return res.status(500).json({ message: "Error in logout ", error })
  }
};
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")
    return res.status(200).json(user)
  } catch (error) {
    return res.status(500).json({ message: "Error in get Me ", error })

  }
}
