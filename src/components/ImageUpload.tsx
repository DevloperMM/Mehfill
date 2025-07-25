"use client";

interface ImgUploadProps {
  onChange: (url: string) => void;
  value: string;
  endpoint: "postImage";
}

import { UploadDropzone } from "@/lib/uploadthing";
import { XIcon } from "lucide-react";
import React from "react";

function ImageUpload({ endpoint, onChange, value }: ImgUploadProps) {
  if (value) {
    return (
      <div className="relative size-40">
        <img
          src={value}
          alt="Upload"
          className="rounded-md size-40 object-cover"
        />
        <button
          onClick={() => onChange("")}
          className="absolute top-0 right-0 p-1 bg-red-500 rounded-full shadow-sm"
          type="button"
        >
          {/* Delete Uploaded image on clicking the button */}
          <XIcon className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <UploadDropzone
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        onChange(res?.[0].ufsUrl);
      }}
      onUploadError={(error: Error) => {
        console.error(error);
      }}
    />
  );
}

export default ImageUpload;
