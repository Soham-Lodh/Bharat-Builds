import React, { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet-async";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets_frontend/assets";
import RelatedDoctors from "../components/RelatedDoctors";
import PremiumConfirmModal from "../components/PremiumConfirmModal";

const Appointments = () => {
  const navigate = useNavigate();
  const { docId } = useParams();
  const { doctors, currency, backendURL, token, getDoctorsData } = useContext(AppContext);
  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingPreview, setBookingPreview] = useState(null);
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const isBookingModalOpen = Boolean(bookingPreview);

  const fetchDocInfo = () => {
    const info = doctors.find((doc) => String(doc._id) === String(docId));
    setDocInfo(info || null);
  };

  const generateSlots = () => {
    const customNow = new Date();
    const allSlots = [];
    const startHour = 10;
    const endHour = 20;

    for (let i = 0; i < 7; i++) {
      const curDate = new Date(customNow);
      curDate.setDate(customNow.getDate() + i);
      const slots = [];

      if (i === 0) {
        let startHours, startMinutes;
        if (customNow.getHours() < startHour) {
          startHours = startHour;
          startMinutes = 0;
        } else if (customNow.getHours() >= endHour) {
          allSlots.push([]);
          continue;
        } else {
          startMinutes = customNow.getMinutes() < 30 ? 30 : 0;
          startHours = startMinutes === 0 ? customNow.getHours() + 1 : customNow.getHours();
          if (startHours >= endHour) {
            allSlots.push([]);
            continue;
          }
        }
        curDate.setHours(startHours, startMinutes, 0, 0);
      } else {
        curDate.setHours(startHour, 0, 0, 0);
      }

      let slotTime = new Date(curDate);
      const day = slotTime.getDate().toString().padStart(2, "0");
      const month = (slotTime.getMonth() + 1).toString().padStart(2, "0");
      const year = slotTime.getFullYear();
      const slotDateStr = `${day}-${month}-${year}`;
      const bookedSlots = docInfo.slots_booked?.[slotDateStr] || [];

      while (slotTime.getHours() < endHour) {
        const timeStr = slotTime.toLocaleTimeString([], {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        });
        if (!bookedSlots.includes(timeStr)) {
          slots.push({ dateTime: new Date(slotTime), time: timeStr });
        }
        slotTime.setMinutes(slotTime.getMinutes() + 30);
      }
      allSlots.push(slots);
    }

    setDocSlots(allSlots);
    const firstAvailableDay = allSlots.findIndex((day) => day.length > 0);
    setSlotIndex(firstAvailableDay >= 0 ? firstAvailableDay : 0);
  };

  const openBookingConfirm = () => {
    if (!token) {
      toast.warn("Please login to book an appointment");
      navigate("/login");
      return;
    }
    if (!selectedTime) {
      toast.warn("Please select a time slot");
      return;
    }
    const slotObj = docSlots[slotIndex].find((slot) => slot.time === selectedTime);
    if (!slotObj) {
      toast.error("Selected slot not found");
      return;
    }

    const date = slotObj.dateTime;
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const slotDate = `${day}-${month}-${year}`;

    setBookingPreview({
      slotDate,
      slotTime: selectedTime,
      slotDateLabel: date.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    });
  };

  const confirmBooking = async () => {
    if (!bookingPreview) return;

    try {
      setLoading(true);
      const { data } = await axios.post(
        `${backendURL}/api/user/book-appointment`,
        {
          docId,
          slotDate: bookingPreview.slotDate,
          slotTime: bookingPreview.slotTime,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setBookingPreview(null);
        await getDoctorsData({ force: true });
        navigate("/my-appointments");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error.response && error.response.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error booking appointment");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocInfo();
  }, [doctors, docId]);

  useEffect(() => {
    if (docInfo) generateSlots();
  }, [docInfo]);

  if (!docInfo)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg font-medium">Doctor not found.</p>
        </div>
      </div>
    );

  return (
    <div className={`relative isolate px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-8 sm:mt-12 pb-16 transition-all duration-300 ${
      isBookingModalOpen ? "blur-[2px] brightness-75 scale-[0.995] pointer-events-none select-none" : ""
    }`}>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl"></div>
        <div className="absolute right-0 top-56 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl"></div>
      </div>
      <Helmet>
        <title>{`Book ${docInfo.name} | Prescripto`}</title>
        <meta name="description" content={`Book an appointment with ${docInfo.name}, a specialist in ${docInfo.speciality}.`} />
      </Helmet>

      {/* ── DOCTOR PROFILE CARD ── */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl shadow-2xl overflow-hidden mb-8">
        <div className="flex flex-col md:flex-row gap-0">

          {/* Doctor Image */}
          <div className="md:w-64 lg:w-72 flex-shrink-0 relative">
            <div className="absolute inset-0 bg-white/5"></div>
            <img
              className="w-full h-56 md:h-full object-cover object-top"
              src={docInfo.image}
              alt={`${docInfo.name}`}
            />
            {/* Availability Badge */}
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-white text-xs font-semibold">Available</span>
            </div>
          </div>

          {/* Doctor Info */}
          <div className="flex-1 p-6 sm:p-8 lg:p-10 relative">
            {/* Decorative blurs */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-400/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-blue-300/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              {/* Name & Verified */}
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{docInfo.name}</h1>
                <img className="w-5 h-5" src={assets.verified_icon} alt="Verified" />
              </div>

              {/* Degree & Speciality */}
              <p className="text-blue-200 text-sm sm:text-base mb-3">
                {docInfo.degree} &bull; {docInfo.speciality}
              </p>

              {/* Experience Pill */}
              <span className="inline-block bg-white/15 border border-white/25 text-white text-xs font-semibold px-3 py-1 rounded-full mb-5">
                {docInfo.experience} Years Experience
              </span>

              {/* About */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <img src={assets.info_icon} alt="Info" className="w-4 h-4 opacity-80" />
                  <span className="text-white/80 text-xs font-semibold uppercase tracking-widest">About</span>
                </div>
                <p className="text-blue-100 text-sm leading-relaxed max-w-2xl">{docInfo.about}</p>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-4">
                {/* Fee */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-blue-200 text-xs">Consultation Fee</p>
                    <p className="text-white font-bold text-base">{currency}{docInfo.fees}</p>
                  </div>
                </div>

                {[
                  { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", label: "Verified", sub: "100% Certified" },
                  { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Quick Booking", sub: "In 2 mins" },
                ].map((f, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-blue-200 text-xs">{f.sub}</p>
                      <p className="text-white font-bold text-sm">{f.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOOKING SECTION ── */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 sm:px-8 lg:px-10 py-5 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Select Appointment Slot</h2>
              <p className="text-gray-500 text-xs">Choose a convenient date and time</p>
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 lg:px-10 py-7">

          {/* Day Picker */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Available Days</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {docSlots.map((daySlots, index) =>
              daySlots.length > 0 ? (
                <button
                  key={index}
                  onClick={() => { setSlotIndex(index); setSelectedTime(null); }}
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-2xl border-2 transition-all duration-200 font-semibold
                    ${slotIndex === index
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 border-blue-600 text-white shadow-lg shadow-blue-200 scale-105"
                      : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                >
                  <span className="text-xs tracking-widest">{daysOfWeek[daySlots[0].dateTime.getDay()]}</span>
                  <span className="text-xl mt-0.5">{daySlots[0].dateTime.getDate()}</span>
                </button>
              ) : null
            )}
          </div>

          {/* Time Picker */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-7 mb-4">Available Times</p>
          <div className="flex flex-wrap gap-3">
            {docSlots[slotIndex] && docSlots[slotIndex].length > 0 ? (
              docSlots[slotIndex].map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedTime(item.time)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200
                    ${selectedTime === item.time
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 border-blue-600 text-white shadow-md shadow-blue-200 scale-105"
                      : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                >
                  {item.time}
                </button>
              ))
            ) : (
              <div className="flex items-center gap-3 py-4 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">No slots available for this day</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mt-8 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

              {/* Selected Summary */}
              <div className="flex items-center gap-4">
                {selectedTime ? (
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-semibold">Selected Slot</p>
                      <p className="text-sm font-bold text-gray-800">
                        {docSlots[slotIndex]?.[0]?.dateTime.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })} &bull; {selectedTime}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No slot selected yet</p>
                )}
              </div>

              {/* Book Button */}
              <button
                onClick={openBookingConfirm}
                disabled={loading}
                className="group inline-flex items-center gap-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Booking...
                  </>
                ) : (
                  <>
                    Review Booking
                    <span className="bg-white/20 p-1.5 rounded-full group-hover:translate-x-1 transition-transform duration-300">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Prepare for this appointment</h3>
            <p className="mt-1 text-sm text-gray-700">
              Use the medical assistant to organize symptoms, reports, medicines, and questions before meeting a {docInfo.speciality}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/medical-copilot")}
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Open Medical Assistant
          </button>
        </div>
      </div>

      {/* ── RELATED DOCTORS ── */}
      <div className="mt-12">
        <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
      </div>

      <PremiumConfirmModal
        open={Boolean(bookingPreview)}
        title="Confirm Appointment"
        subtitle="Review the doctor and slot before we reserve it."
        tone="primary"
        confirmLabel="Confirm Booking"
        cancelLabel="Back"
        loading={loading}
        onConfirm={confirmBooking}
        onCancel={() => setBookingPreview(null)}
        meta={
          <div className="flex items-center gap-4">
            <img
              src={docInfo.image}
              alt={docInfo.name}
              className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white shadow-md"
            />
            <div>
              <p className="text-base font-bold">{docInfo.name}</p>
              <p className="text-sm opacity-90">{docInfo.speciality}</p>
              <p className="text-sm opacity-90">{docInfo.degree}</p>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Appointment Date
            </p>
            <p className="mt-1 text-base font-bold text-slate-900">
              {bookingPreview?.slotDateLabel}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Appointment Time
            </p>
            <p className="mt-1 text-base font-bold text-slate-900">
              {bookingPreview?.slotTime}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-800">
            The appointment will be reserved immediately after confirmation and the selected slot will be locked for others.
          </p>
        </div>
      </PremiumConfirmModal>
    </div>
  );
};

export default Appointments;
