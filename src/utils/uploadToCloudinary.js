import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

/**
 * Upload multiple multer memoryStorage files to Cloudinary
 * SERVICE COMPATIBLE – DO NOT CHANGE SERVICE CODE
 */
export const uploadImages = async (files, folder) => {
  if (!files || !Array.isArray(files) || files.length === 0) return [];

  const uploadSingle = (file) =>
    new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);

          resolve({
            url: result.secure_url,
          });
        }
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });

  return Promise.all(files.map(uploadSingle));
};
