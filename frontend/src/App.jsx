import ScrollToTop from "./components/ScrollToTop";
import { Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Doctors from "./pages/Doctors";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import MyAppointments from "./pages/MyAppointments";
import MyProfile from "./pages/MyProfile";
import Appointments from "./pages/Appointments";
import MedicalCopilot from "./pages/MedicalCopilot";
import NotFound from "./pages/NotFound";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";

const App = () => {
  const location = useLocation();

  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-out",
      once: false,
      offset: 100,
    });

    // VERY IMPORTANT: refresh on route change
    AOS.refresh();
  }, [location.pathname]);

  const noLayout = location.pathname === "/login";

  return (
    <div className="mx-4 sm:mx-[10%]">
      <ScrollToTop />

      {!noLayout && <NavBar />}
      <ToastContainer />

      {/* PAGE ANIMATION WRAPPER */}
      <div data-aos="fade-up">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:speciality" element={<Doctors />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/my-appointments" element={<MyAppointments />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/medical-copilot" element={<MedicalCopilot />} />
          <Route path="/appointments/:docId" element={<Appointments />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {!noLayout && <Footer />}
    </div>
  );
};

export default App;
