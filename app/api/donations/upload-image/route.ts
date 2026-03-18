import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { v2 as cloudinary } from 'cloudinary';
import * as ExifParser from 'exif-parser';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// --- Feature 6: EXIF Metadata Extraction ---
function extractExifData(buffer: Buffer) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parser = (ExifParser as any).create(buffer);
        const result = parser.parse();

        const tags = result.tags || {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const exifData: any = {};
        let exifPresent = false;

        if (tags.Model || tags.Make) {
            exifData.cameraModel = `${tags.Make || ''} ${tags.Model || ''}`.trim();
            exifPresent = true;
        }
        if (tags.DateTimeOriginal) {
            exifData.captureDate = new Date(tags.DateTimeOriginal * 1000).toISOString();
            exifPresent = true;
        }
        if (tags.Software || tags.HostComputer) {
            exifData.deviceName = tags.HostComputer || tags.Software || '';
            exifPresent = true;
        }
        if (tags.GPSLatitude && tags.GPSLongitude) {
            exifData.gpsLatitude = tags.GPSLatitude;
            exifData.gpsLongitude = tags.GPSLongitude;
            exifPresent = true;
        }

        return { exifPresent, exifData, isSuspicious: !exifPresent };
    } catch (err) {
        console.warn('[EXIF] Could not parse EXIF data:', (err as Error).message);
        return { exifPresent: false, exifData: {}, isSuspicious: true };
    }
}

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('donor')(authGate);
    if (roleGate.status !== 200) return roleGate;

    try {
        const formData = await req.formData();
        const file = formData.get('image') as globalThis.File | null;

        if (!file) {
            return errorResponse('No image uploaded', 400);
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Extract EXIF metadata before uploading
        const exifResult = extractExifData(buffer);
        console.log(`[UPLOAD] EXIF Present: ${exifResult.exifPresent}, Suspicious: ${exifResult.isSuspicious}`);

        // Upload to Cloudinary
        const base64 = buffer.toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: 'foodbridge/donations',
            transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
        });

        const imageUrl = uploadResult.secure_url;

        return successResponse({
            imageUrl,
            exifPresent: exifResult.exifPresent,
            exifData: exifResult.exifData,
            isSuspicious: exifResult.isSuspicious,
        }, 'Image uploaded successfully', 201);
    } catch (error) {
        console.error("Image upload error:", error);
        return errorResponse('Failed to upload image', 500);
    }
});
