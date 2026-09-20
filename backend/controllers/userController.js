import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import contactModel from "../models/contactModel.js";
import jwt from "jsonwebtoken";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import { assertFutureSlot, releaseDoctorSlot, reserveDoctorSlot } from "../helpers/appointmentHelper.js";

// Helper function for strict sanitization
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return validator.escape(validator.trim(input));
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please fill all the fields" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character",
      });
    }
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({ name: sanitizeInput(name), email, password: hashedPassword });
    const user = await newUser.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({ success: true, message: "User registered successfully", token });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please fill all the fields" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({ success: true, message: "User logged in successfully", token });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, address, gender, dob, phone } = req.body;
    const user = await userModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = sanitizeInput(name);

    if (email) {
      if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Please enter a valid email" });
      }
      const emailExists = await userModel.findOne({ email });
      if (emailExists && emailExists._id.toString() !== user._id.toString()) {
        return res.status(409).json({ success: false, message: "Email already in use" });
      }
      user.email = email;
    }

    if (req.file) {
      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const uploadResult = await cloudinary.uploader.upload(base64);
      user.image = uploadResult.secure_url;
    }

    let parsedAddress;
    if (address) {
      parsedAddress = typeof address === "string" ? JSON.parse(address) : address;
      user.address = {
        line1: sanitizeInput(parsedAddress.line1 || user.address.line1),
        line2: sanitizeInput(parsedAddress.line2 || user.address.line2),
      };
    }

    if (gender) user.gender = sanitizeInput(gender);
    if (dob) user.dob = dob;
    if (phone) user.phone = sanitizeInput(phone);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        name: user.name,
        email: user.email,
        image: user.image,
        address: user.address,
        gender: user.gender,
        dob: user.dob,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};

export const bookAppointment = async (req, res) => {
  try {
    const { docId, slotDate, slotTime } = req.body;
    const userId = req.user.userId;

    if (!docId || !slotDate || !slotTime) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
      assertFutureSlot(slotDate, slotTime);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const docData = await doctorModel.findById(docId).select("-password");
    if (!docData) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    if (!docData.available) {
      return res.status(400).json({ success: false, message: "Doctor is not available" });
    }

    try {
      reserveDoctorSlot(docData, slotDate, slotTime);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    await docData.save();

    const userData = await userModel.findById(userId).select("-password");

    const appointmentData = {
      userId,
      docId,
      userData,
      docData: {
        _id: docData._id,
        name: docData.name,
        speciality: docData.speciality,
        fees: docData.fees,
        image: docData.image,
        address: docData.address,
      },
      slotDate,
      slotTime,
      amount: docData.fees,
      date: Date.now(),
      appointmentType: "INITIAL",
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    return res.status(200).json({
      success: true,
      message: "Appointment booked successfully",
      appointment: appointmentData,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

export const listAppointments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const appointments = await appointmentModel.find({ userId }).sort({ date: -1 });

    return res.status(200).json({ success: true, appointments });
  } catch (error) {
    console.error("Fetch appointments error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (appointmentData.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (appointmentData.cancelled) {
      return res.status(400).json({ success: false, message: "Already cancelled" });
    }
    
    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true, payment: false });
    
    const { docId, slotDate, slotTime } = appointmentData;
    const docData = await doctorModel.findById(docId);
    
    if(docData && docData.slots_booked && docData.slots_booked[slotDate]){
      releaseDoctorSlot(docData, slotDate, slotTime);
      await docData.save();
    }

    return res.status(200).json({ success: true, message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const payment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (appointmentData.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (appointmentData.payment) {
      return res.status(400).json({ success: false, message: "Appointment is already paid" });
    }

    // In a real scenario, Verify Stripe/Razorpay signature here.
    
    await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });

    return res.status(200).json({
      success: true,
      message: "Payment successful",
      updatedAppointment: { ...appointmentData.toObject(), payment: true },
    });

  } catch (error) {
    console.error("Payment error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const contactUs = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Please fill all the fields" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email" });
    }

    // Sanitize input
    const cleanName = sanitizeInput(name);
    const cleanMessage = sanitizeInput(message);

    const data = await contactModel.create({
      name: cleanName,
      email,
      message: cleanMessage,
    });
    return res.status(201).json({ success: true, message: "Message received successfully", data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
