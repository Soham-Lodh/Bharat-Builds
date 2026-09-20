import React from "react";
import { ImagePlus, X } from "lucide-react";

const ImageUploadZone = ({ file, setFile }) => (
  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-3">
    {file ? (
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
          <p className="text-xs text-gray-500">Medical image/document selected</p>
        </div>
        <button
          type="button"
          onClick={() => setFile(null)}
          className="flex h-9 w-9 items-center justify-center rounded-md border text-gray-600 hover:bg-gray-50"
          aria-label="Remove image"
        >
          <X size={16} />
        </button>
      </div>
    ) : (
      <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <ImagePlus size={18} />
        </span>
        <span>
          Upload prescription, lab report, clinical photo, or certificate
          <span className="block text-xs text-gray-500">Information only, not diagnosis</span>
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
      </label>
    )}
  </div>
);

export default ImageUploadZone;
