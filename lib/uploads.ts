import crypto from "crypto";
import { Readable } from "stream";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

type SavedUpload = {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
};

function requireCloudinaryEnv() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function sanitizePublicId(fileName: string) {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  return baseName
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getFileExtension(fileName: string) {
  const match = fileName.match(/\.[^/.]+$/);
  return match?.[0]?.toLowerCase() ?? "";
}

function getResourceType(fileType: string) {
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("video/")) return "video";

  return "raw";
}

async function uploadBufferToCloudinary(
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<UploadApiResponse> {
  requireCloudinaryEnv();

  const folder =
    process.env.CLOUDINARY_UPLOAD_FOLDER || "clientforge/deliverables";
  const resourceType = getResourceType(fileType);
  const fileExtension = resourceType === "raw" ? getFileExtension(fileName) : "";
  const publicId = `${crypto.randomUUID()}-${
    sanitizePublicId(fileName) || "file"
  }${fileExtension}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        use_filename: false,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload did not return a result."));
          return;
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

export async function saveDeliverableFile(file: File): Promise<SavedUpload> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileType = file.type || "application/octet-stream";
  const uploadedFile = await uploadBufferToCloudinary(
    buffer,
    file.name,
    fileType
  );

  return {
    fileUrl: uploadedFile.secure_url,
    fileName: file.name,
    fileSize: file.size,
    fileType,
  };
}