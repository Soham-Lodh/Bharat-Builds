import {
  doctorsList,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  doctorChangeAvailability,
  getDoctorAppointments,
  doctorCancelAppointment,
  doctorDashboard,
  doctorCompleteAppointment,
} from "../controllers/doctorController.js";
import express from "express";
import authDoctor from "../middleware/authDoctor.js";
import upload from "../middleware/multer.js";

const doctorRouter = express.Router();

doctorRouter.get("/list", doctorsList);
doctorRouter.post("/login", loginDoctor);

// Doctor Dashboard Routes (protected with authDoctor)
doctorRouter.post("/profile", authDoctor, getDoctorProfile);
doctorRouter.post("/update-profile", authDoctor, upload.single("docImg"), updateDoctorProfile);
doctorRouter.post("/change-availability", authDoctor, doctorChangeAvailability);
doctorRouter.post("/appointments", authDoctor, getDoctorAppointments);
doctorRouter.post("/cancel-appointment", authDoctor, doctorCancelAppointment);
doctorRouter.post("/complete-appointment", authDoctor, upload.single("prescription"), doctorCompleteAppointment);
doctorRouter.post("/dashboard", authDoctor, doctorDashboard);

export default doctorRouter;
