export const parseSlotDateTime = (slotDate, slotTime = "00:00") => {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(String(slotDate || ""))) {
    return null;
  }
  if (!/^\d{2}:\d{2}$/.test(String(slotTime || ""))) {
    return null;
  }

  const [day, month, year] = slotDate.split("-").map(Number);
  const [hours, minutes] = slotTime.split(":").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes
  ) {
    return null;
  }

  return date;
};

export const isFutureSlot = (slotDate, slotTime) => {
  const parsed = parseSlotDateTime(slotDate, slotTime);
  return Boolean(parsed && parsed > new Date());
};

export const assertFutureSlot = (slotDate, slotTime) => {
  if (!parseSlotDateTime(slotDate, slotTime)) {
    throw new Error("Invalid appointment date or time");
  }
  if (!isFutureSlot(slotDate, slotTime)) {
    throw new Error("Appointment date and time must be in the future");
  }
};

export const reserveDoctorSlot = (doctor, slotDate, slotTime) => {
  const slotsBooked = doctor.slots_booked || {};
  const bookedForDate = slotsBooked[slotDate] || [];

  if (bookedForDate.includes(slotTime)) {
    throw new Error("Slot already booked");
  }

  slotsBooked[slotDate] = [...bookedForDate, slotTime];
  doctor.slots_booked = slotsBooked;
  doctor.markModified("slots_booked");
};

export const releaseDoctorSlot = (doctor, slotDate, slotTime) => {
  const slotsBooked = doctor.slots_booked || {};
  if (slotsBooked[slotDate]) {
    slotsBooked[slotDate] = slotsBooked[slotDate].filter((time) => time !== slotTime);
    doctor.slots_booked = slotsBooked;
    doctor.markModified("slots_booked");
  }
};
