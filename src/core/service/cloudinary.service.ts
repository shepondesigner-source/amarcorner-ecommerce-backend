import cloudinary from "../../config/cloudinary";
import { Readable } from "stream";
import { BadRequestError } from "../errors/HttpError";
import sharp from "sharp";

/**
 * Upload buffer to Cloudinary with file type rules:
 * - icon: must be SVG
 * - other images: convert to WebP
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
): Promise<string> => {
  try {
    let bufferToUpload: Buffer;

    try {
      // Try converting to WebP
      bufferToUpload = await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();
    } catch {
      // If sharp fails (SVG or unsupported), upload original
      bufferToUpload = fileBuffer;
    }

    return await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            {
              overlay: {
                font_family: "Arial",
                font_size: 48,
                font_weight: "bold",
                text: "Amar Corner",
              },
              gravity: "south_east",
              x: 20,
              y: 20,
              color: "#ffffff",
              opacity: 13, // 👈 LOWER = more transparent
            },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(new BadRequestError("Cloudinary upload failed"));
          } else {
            resolve(result.public_id);
          }
        },
      );

      Readable.from(bufferToUpload).pipe(stream);
    });
  } catch {
    throw new BadRequestError("Cloudinary upload failed");
  }
};

/**
 * Delete file using PUBLIC URL
 */
export const deleteFromCloudinaryByUrl = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.log(error);
    throw new BadRequestError("Cloudinary delete failed");
  }
};
