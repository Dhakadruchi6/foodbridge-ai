import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

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
        const base64 = buffer.toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: 'foodbridge/donations',
            transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
        });

        const imageUrl = uploadResult.secure_url;

        return successResponse({ imageUrl }, 'Image uploaded successfully', 201);
    } catch (error) {
        console.error("Image upload error:", error);
        return errorResponse('Failed to upload image', 500);
    }
});
