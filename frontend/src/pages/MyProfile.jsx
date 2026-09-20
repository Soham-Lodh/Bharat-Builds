import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { assets } from "../assets/assets_frontend/assets";
import { Link } from "react-router-dom";

const MyProfile = () => {
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const { userData, setUserData, token, backendURL, loadUserProfile } =
    useContext(AppContext);
  const [image, setImage] = useState(false);

  const updateUserProfileData = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", userData.name);
      formData.append("phone", userData.phone);
      formData.append("gender", userData.gender);
      formData.append("dob", userData.dob);
      formData.append("address", JSON.stringify(userData.address));
      if (image) {
        formData.append("image", image);
      }

      const res = await fetch(`${backendURL}/api/user/update-profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message);
        return;
      }

      toast.success(data.message);
      setIsEdit(false);
      await loadUserProfile();
    } catch (error) {
      console.error("Error updating user profile:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    userData && (
      <div className="max-w-3xl flex flex-col gap-3 text-lg w-full">
        {isEdit ? (
          <label
            htmlFor="image"
            className="relative w-40 h-40 overflow-hidden cursor-pointer group border border-gray-300"
          >
            <img
              src={image ? URL.createObjectURL(image) : userData.image}
              alt="profile"
              className="w-full h-full object-cover group-hover:opacity-80 transition"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <img
                src={assets.upload_icon}
                alt="upload"
                className="w-8 h-8 invert"
              />
            </div>
            <input
              type="file"
              className="hidden"
              id="image"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </label>
        ) : (
          <img
            src={userData.image}
            alt="profile"
            className="w-40 h-40 object-cover border border-gray-300"
          />
        )}

        {isEdit ? (
          <input
            type="text"
            className="bg-gray-100 text-3xl font-medium max-w-60 mt-4 border border-gray-300 p-1 focus:outline-none focus:ring-2 focus:ring-[rgb(95,111,255)]"
            value={userData.name}
            onChange={(e) =>
              setUserData((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        ) : (
          <p className="font-medium text-3xl text-neutral-800 mt-4">
            {userData.name}
          </p>
        )}

        <hr className="bg-zinc-300 h-[1px] border-none my-3" />
        <p className="text-neutral-500 underline mt-3 font-semibold">
          CONTACT INFORMATION
        </p>

        <div className="grid grid-cols-[1fr_3fr] gap-y-3 mt-3 text-neutral-700">
          <p className="font-medium text-[rgb(95,111,255)]">Email Id:</p>
          <p>{userData.email}</p>

          <p className="font-medium text-[rgb(95,111,255)]">Phone:</p>
          {isEdit ? (
            <input
              type="text"
              className="bg-gray-100 border border-gray-300 p-1 focus:outline-none focus:ring-2 focus:ring-[rgb(95,111,255)]"
              value={userData.phone}
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
          ) : (
            <p>{userData.phone}</p>
          )}

          <p className="font-medium text-[rgb(95,111,255)]">Address:</p>
          {isEdit ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Address Line 1"
                value={userData.address.line1}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    address: { ...prev.address, line1: e.target.value },
                  }))
                }
                className="bg-gray-100 border border-gray-300 p-1 focus:outline-none focus:ring-2 focus:ring-[rgb(95,111,255)]"
              />
              <input
                type="text"
                placeholder="Address Line 2"
                value={userData.address.line2}
                onChange={(e) =>
                  setUserData((prev) => ({
                    ...prev,
                    address: { ...prev.address, line2: e.target.value },
                  }))
                }
                className="bg-gray-100 border border-gray-300 p-1 focus:outline-none focus:ring-2 focus:ring-[rgb(95,111,255)]"
              />
            </div>
          ) : (
            <p>
              {userData.address.line1}
              <br />
              {userData.address.line2}
            </p>
          )}
        </div>

        <div>
          <p className="text-neutral-500 underline mt-4 font-semibold">
            BASIC INFORMATION
          </p>
          <div className="grid grid-cols-[1fr_3fr] gap-y-3 mt-3 text-neutral-700">
            <p className="font-medium text-[rgb(95,111,255)]">Gender:</p>
            {isEdit ? (
              <select
                className="bg-gray-100 border border-gray-300 p-1 focus:outline-none focus:ring-2 focus:ring-[rgb(95,111,255)]"
                onChange={(e) =>
                  setUserData((prev) => ({ ...prev, gender: e.target.value }))
                }
                value={userData.gender}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            ) : (
              <p>{userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1)}</p>
            )}

            <p className="font-medium text-[rgb(95,111,255)]">D.O.B.:</p>
            {isEdit ? (
              <input
                className="bg-gray-100 border border-gray-300 p-1 focus:outline-none focus:ring-2 focus:ring-[rgb(95,111,255)]"
                type="date"
                value={userData.dob}
                onChange={(e) =>
                  setUserData((prev) => ({ ...prev, dob: e.target.value }))
                }
              />
            ) : (
              <p>{userData.dob}</p>
            )}
          </div>
        </div>

        <div>
          {!isEdit && (
            <Link
              to="/medical-copilot"
              className="mr-3 inline-block bg-blue-50 mt-5 rounded-md text-blue-700 px-7 py-2 hover:bg-blue-100 transition-all duration-300"
            >
              View chat history
            </Link>
          )}
          {isEdit ? (
            <button
              className={`bg-[rgb(95,111,255)] mt-5 rounded-md text-white px-7 py-2 transition-all duration-300 ${loading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:-translate-y-1 hover:shadow-md"
                }`}
              onClick={updateUserProfileData}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                "Save Information"
              )}
            </button>
          ) : (
            <button
              className="bg-[rgb(95,111,255)] mt-5 rounded-md text-white px-7 py-2 hover:-translate-y-1 hover:shadow-md transition-all duration-300"
              onClick={() => setIsEdit(true)}
            >
              Edit
            </button>
          )}
        </div>
      </div>
    )
  );
};

export default MyProfile;
