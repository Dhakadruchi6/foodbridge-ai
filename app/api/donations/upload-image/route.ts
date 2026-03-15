import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `food_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

        // Save to public/uploads/donations
        const uploadDir = path.join(process.cwd(), 'public/uploads/donations');
        await mkdir(uploadDir, { recursive: true });

        const filepath = path.join(uploadDir, filename);

        await writeFile(filepath, buffer);

        // Return public URL path
        const imageUrl = `/uploads/donations/${filename}`;

        return successResponse({ imageUrl }, 'Image uploaded successfully', 201);
    } catch (error) {
        console.error("Image upload error:", error);
        return errorResponse('Failed to upload image', 500);
    }
});
