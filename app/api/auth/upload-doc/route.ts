import { errorResponse, successResponse } from '@/lib/apiResponse';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('document') as File | null;
        const type = formData.get('type') as string;

        if (!file) {
            return errorResponse('No document uploaded', 400);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: `foodbridge/verification/${type || 'docs'}`,
            transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
        });

        return successResponse({
            documentUrl: uploadResult.secure_url,
        }, 'Document uploaded successfully', 201);
    } catch (error) {
        console.error("Document upload error:", error);
        return errorResponse('Failed to upload document', 500);
    }
}
