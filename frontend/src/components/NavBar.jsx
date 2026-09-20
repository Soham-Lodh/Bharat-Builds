import React, { useState, useEffect, useContext, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets_frontend/assets";
import { AppContext } from "../context/AppContext";
import { invalidateCache } from "../utils/requestCache";

const NavBar = () => {
  const navigate = useNavigate();
  const { token, setToken, userData } = useContext(AppContext);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);

  /* ---------- SCROLL EFFECT ---------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------- CLOSE DROPDOWN ON OUTSIDE CLICK ---------- */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    invalidateCache("user:");
    invalidateCache("public:doctors-list");
    setToken(false);
    setShowDropdown(false);
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    isActive
      ? "text-blue-600 border-b-2 border-blue-600 pb-1"
      : "hover:text-blue-600";

  const mobileNavLinkClass = ({ isActive }) =>
    isActive ? "text-blue-600" : "";

  return (
    <>
      {/* NAVBAR */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-md border-b" : "bg-white"
        }`}
      >
        <div className="flex items-center justify-between px-6 h-20 max-w-7xl mx-auto">
          {/* LOGO */}
          <img
            src={assets.logo}
            alt="Logo"
            className="w-44 cursor-pointer"
            onClick={() => navigate("/")}
          />

          {/* DESKTOP LINKS */}
          <nav className="hidden md:flex gap-8 font-medium text-gray-800">
            <NavLink to="/" className={navLinkClass}>
              HOME
            </NavLink>
            <NavLink to="/doctors" className={navLinkClass}>
              ALL DOCTORS
            </NavLink>
            <NavLink to="/medical-copilot" className={navLinkClass}>
              MEDICAL ASSISTANT
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              ABOUT
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              CONTACT
            </NavLink>
          </nav>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4 relative">
            {!token ? (
              <button
                onClick={() => navigate("/login")}
                className="hidden md:block bg-blue-600 text-white px-8 py-2.5 rounded-full font-semibold"
              >
                Create Account
              </button>
            ) : (
              <div
                ref={dropdownRef}
                className="hidden md:flex items-center gap-2 relative cursor-pointer"
                onClick={() => setShowDropdown((p) => !p)}
              >
                <img
                  src={userData?.image}
                  alt="user"
                  className="w-10 h-10 rounded-full border object-cover"
                />

                <img
                  src={assets.dropdown_icon}
                  alt="menu"
                  className={`w-4 transition-transform ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                />

                {showDropdown && (
                  <div className="absolute right-0 top-14 w-56 bg-white rounded-xl shadow-xl border overflow-hidden z-50">
                    <div className="bg-blue-600 text-white p-4">
                      <p className="font-bold text-sm">{userData?.name}</p>
                      <p className="text-xs">{userData?.email}</p>
                    </div>

                    <div className="p-2 text-gray-700">
                      <p
                        onClick={() => {
                          navigate("/my-profile");
                          setShowDropdown(false);
                        }}
                        className="px-4 py-3 hover:bg-blue-50 rounded cursor-pointer"
                      >
                        My Profile
                      </p>
                      <p
                        onClick={() => {
                          navigate("/medical-copilot");
                          setShowDropdown(false);
                        }}
                        className="px-4 py-3 hover:bg-blue-50 rounded cursor-pointer"
                      >
                        Medical Assistant
                      </p>
                      <p
                        onClick={() => {
                          navigate("/my-appointments");
                          setShowDropdown(false);
                        }}
                        className="px-4 py-3 hover:bg-blue-50 rounded cursor-pointer"
                      >
                        My Appointments
                      </p>
                      <hr className="my-2" />
                      <p
                        onClick={logout}
                        className="px-4 py-3 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                      >
                        Logout
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MOBILE MENU BUTTON */}
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center"
              onClick={() => setMobileOpen((p) => !p)}
            >
              <img src={assets.menu_icon} className="w-6" alt="menu" />
            </button>
          </div>
        </div>
      </header>

      {/* SPACER */}
      <div className="h-20" />

      {/* MOBILE FULLSCREEN MENU */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white md:hidden">
          <div className="flex flex-col items-center justify-center h-full gap-8 text-xl font-bold">
            <NavLink
              to="/"
              onClick={() => setMobileOpen(false)}
              className={mobileNavLinkClass}
            >
              Home
            </NavLink>
            <NavLink
              to="/doctors"
              onClick={() => setMobileOpen(false)}
              className={mobileNavLinkClass}
            >
              All Doctors
            </NavLink>
            <NavLink
              to="/medical-copilot"
              onClick={() => setMobileOpen(false)}
              className={mobileNavLinkClass}
            >
              Medical Assistant
            </NavLink>
            <NavLink
              to="/about"
              onClick={() => setMobileOpen(false)}
              className={mobileNavLinkClass}
            >
              About
            </NavLink>
            <NavLink
              to="/contact"
              onClick={() => setMobileOpen(false)}
              className={mobileNavLinkClass}
            >
              Contact
            </NavLink>

            <hr className="w-1/2 border-gray-300" />

            {!token ? (
              <NavLink
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="bg-blue-600 text-white px-12 py-4 rounded-full"
              >
                Create Account
              </NavLink>
            ) : (
              <>
                <NavLink
                  to="/my-profile"
                  onClick={() => setMobileOpen(false)}
                  className={mobileNavLinkClass}
                >
                  My Profile
                </NavLink>
                <NavLink
                  to="/medical-copilot"
                  onClick={() => setMobileOpen(false)}
                  className={mobileNavLinkClass}
                >
                  Medical Assistant
                </NavLink>
                <NavLink
                  to="/my-appointments"
                  onClick={() => setMobileOpen(false)}
                  className={mobileNavLinkClass}
                >
                  My Appointments
                </NavLink>
                <button onClick={logout} className="text-red-600">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default NavBar;
