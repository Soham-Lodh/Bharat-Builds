import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import contactModel from "../models/contactModel.js";
import userModel from "../models/userModel.js";
import { releaseDoctorSlot } from "../helpers/appointmentHelper.js";

export const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;

    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address ||
      !imageFile
    ) {
      return res.json({
        success: false,
        message: "All fields including image are required",
      });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid email" });
    }

    const passwordCheck = checkPasswordStrength(password, name, email);
    if (!passwordCheck.valid) {
      return res.json({ success: false, message: passwordCheck.message });
    }

    const salt = await bcrypt.genSalt(15);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (err, res) => {
          if (err) reject(err);
          else resolve(res);
        }
      );
      stream.end(imageFile.buffer);
    });

    const imageUrl = result.secure_url;

    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: JSON.parse(address),
      date: Date.now(),
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    res.json({ success: true, message: "Doctor added" });
  } catch (err) {
    console.error("Error adding doctor:", err);
    res.json({
      success: false,
      message: "Server error while adding doctor",
      error: err.message,
    });
  }
};

function checkPasswordStrength(password, name, email) {
  const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
  if (!password || password.length < 8)
    return {
      valid: false,
      message: "Password must be at least 8 characters long.",
    };
  if (!specialCharRegex.test(password))
    return {
      valid: false,
      message: "Password must contain at least one special character.",
    };

  const nameParts = name ? name.toLowerCase().split(" ") : [];
  const emailParts = email ? email.toLowerCase().split(/[@._]/) : [];
  const passwordLower = password.toLowerCase();

  for (const part of [...nameParts, ...emailParts]) {
    if (part && part.length >= 3 && passwordLower.includes(part)) {
      return {
        valid: false,
        message: `Password should not contain parts of your name or email: "${part}"`,
      };
    }
  }

  return { valid: true, message: "Password is strong." };
}

async function uploadDoctorImage(imageFile) {
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image" },
      (err, res) => {
        if (err) reject(err);
        else resolve(res);
      }
    );
    stream.end(imageFile.buffer);
  });

  return result.secure_url;
}

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.json({ success: false, message: "Fill all details" });

    if (
      email === process.env.ADMIN_EMAIL?.trim() &&
      password === process.env.ADMIN_PASSWORD?.trim()
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      return res.json({ success: true, token });
    }

    return res.json({ success: false, message: "Invalid credentials" });
  } catch (err) {
    console.error(err);
    return res.json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

export const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password");
    return res.json({ success: true, doctors });
  } catch (err) {
    console.error(err);
    return res.json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const {
      docId,
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
      available,
    } = req.body;
    const imageFile = req.file;

    if (!docId) {
      return res.status(400).json({
        success: false,
        message: "Doctor id is required",
      });
    }

    const doctor = await doctorModel.findById(docId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const nextEmail = email?.trim() || doctor.email;
    if (!validator.isEmail(nextEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email",
      });
    }

    let parsedAddress = doctor.address;
    if (address) {
      try {
        parsedAddress = JSON.parse(address);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid address format",
        });
      }
    }

    const updateData = {
      name: name?.trim() || doctor.name,
      email: nextEmail,
      speciality: speciality || doctor.speciality,
      degree: degree || doctor.degree,
      experience: experience || doctor.experience,
      about: about || doctor.about,
      fees: fees !== undefined && fees !== "" ? Number(fees) : doctor.fees,
      address: parsedAddress,
      available:
        available === undefined || available === ""
          ? doctor.available
          : available === true || available === "true",
    };

    if (Number.isNaN(updateData.fees)) {
      return res.status(400).json({
        success: false,
        message: "Fees must be a valid number",
      });
    }

    if (password && password.trim()) {
      const passwordCheck = checkPasswordStrength(
        password,
        updateData.name,
        updateData.email
      );
      if (!passwordCheck.valid) {
        return res.status(400).json({
          success: false,
          message: passwordCheck.message,
        });
      }

      const salt = await bcrypt.genSalt(15);
      updateData.password = await bcrypt.hash(password, salt);
    }

    if (imageFile) {
      updateData.image = await uploadDoctorImage(imageFile);
    }

    const updatedDoctor = await doctorModel
      .findByIdAndUpdate(docId, updateData, { new: true })
      .select("-password");

    return res.json({
      success: true,
      message: "Doctor details updated successfully",
      doctor: updatedDoctor,
    });
  } catch (err) {
    console.error("Error updating doctor:", err);

    if (err?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating doctor",
      error: err.message,
    });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const { docId } = req.body;

    if (!docId) {
      return res.status(400).json({
        success: false,
        message: "Doctor id is required",
      });
    }

    const doctor = await doctorModel.findById(docId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const deletedAppointments = await appointmentModel.deleteMany({
      docId,
    });

    await doctorModel.findByIdAndDelete(docId);

    return res.json({
      success: true,
      message: `Doctor deleted successfully with ${deletedAppointments.deletedCount} related appointments removed`,
    });
  } catch (err) {
    console.error("Error deleting doctor:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting doctor",
      error: err.message,
    });
  }
};

export const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    res.json({ success: true, appointments });
  } catch (err) {
    console.error(err);
    return res.json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

export const adminCancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointmentData.cancelled) {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
      payment: false,
    });
    const { docId, slotDate, slotTime } = appointmentData;
    const docData = await doctorModel.findById(docId);
    if (docData) {
      releaseDoctorSlot(docData, slotDate, slotTime);
      await docData.save();
    }
    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const messages = async (req, res) => {
  try {
    const messages = await contactModel.find({});
    return res.json({ success: true, messages });
  } catch (err) {
    console.error(err);
    return res.json({
      success: false,
      message: err.message,
    });
  }
};

export const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patients: users.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
