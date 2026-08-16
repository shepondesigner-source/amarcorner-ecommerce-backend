import cloudinary from "../../config/cloudinary";
import { Readable } from "stream";
import { BadRequestError } from "../errors/HttpError";
import sharp from "sharp";

/**
 * Upload buffer to Cloudinary with file type rules:
 * - icon: must be SVG
 * - other images: convert to WebP
 */
const WATERMARK_LABEL = "amarcorner.com";

function buildWatermarkSvg(imageWidth: number) {
  const badgeWidth = Math.round(
    Math.min(260, Math.max(120, imageWidth * 0.26)),
  );
  const badgeHeight = Math.round(badgeWidth * 0.22);
  const fontSize = Math.round(badgeHeight * 0.42);
  const pointerSize = Math.round(badgeHeight * 0.5);
  const paddingX = Math.round(badgeHeight * 0.32);
  const pointerY = (badgeHeight - pointerSize) / 2;
  const textX = paddingX + pointerSize + Math.round(badgeHeight * 0.22);

  const svg = `
<svg width="${badgeWidth}" height="${badgeHeight}" viewBox="0 0 ${badgeWidth} ${badgeHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect x="1.5" y="1.5" width="${badgeWidth - 3}" height="${badgeHeight - 3}" rx="${badgeHeight / 2}"
    fill="#000000" fill-opacity="0.42" filter="url(#shadow)" />
  <g transform="translate(${paddingX}, ${pointerY}) scale(${pointerSize / 24})">
    <path fill="#ffffff" d="M4 4l7.07 17 2.51-7.39L21 11.07z"/>
  </g>
  <text x="${textX}" y="${badgeHeight / 2}" dominant-baseline="central" text-anchor="start"
    font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="600" fill="#ffffff">${WATERMARK_LABEL}</text>
</svg>`.trim();

  return { svg, width: badgeWidth, height: badgeHeight };
}

export async function applyWatermark(buffer: Buffer) {
  const { width, height } = await sharp(buffer).metadata();
  if (!width || !height) return buffer;

  const badge = buildWatermarkSvg(width);
  const margin = Math.round(Math.min(width, height) * 0.025) + 6;

  return sharp(buffer)
    .composite([
      {
        input: Buffer.from(badge.svg),
        left: margin,
        top: Math.max(0, height - badge.height - margin),
      },
    ])
    .toBuffer();
}
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
              gravity: "south_west",
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
