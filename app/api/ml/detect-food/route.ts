import { NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

// Simulated AI Image Classification Model
// In an enterprise environment, this would call AWS Rekognition, Google Cloud Vision, or a custom PyTorch model.
const MOCK_AI_CONFIDENCE = {
    FOOD_THRESHOLD: 0.85,
    DETERMINISTIC_PASS_PAGES: ['jpg', 'png', 'jpeg', 'webp'],
};

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('donor')(authGate);
    if (roleGate.status !== 200) return roleGate;

    const { imageUrl } = await req.json();

    if (!imageUrl) {
        return errorResponse('Image URL payload is required for AI detection', 400);
    }

    try {
        console.log(`[AI-VISION-ENGINE] Scanning asset from node storage: ${imageUrl}...`);

        // Simulating ML processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Basic fake heuristic for the prototype:
        // We assume valid uploads pass. If the user somehow uploaded a .txt or 
        // the filename contains "fake"/"test_fail", we reject it.
        const ext = imageUrl.split('.').pop()?.toLowerCase();
        const isStandardImageFormat = ext && MOCK_AI_CONFIDENCE.DETERMINISTIC_PASS_PAGES.includes(ext);
        const forbiddenKeywords = ['fake', 'doll', 'toy', 'gadget', 'plastic', 'electronic', 'test_fail'];
        const hasForbiddenKeyword = forbiddenKeywords.some(kw => imageUrl.toLowerCase().includes(kw));

        let foodDetected = isStandardImageFormat && !hasForbiddenKeyword;

        // Simulate a confidence score
        const confidenceScore = foodDetected
            ? 0.88 + (Math.random() * 0.11) // 88% - 99% confident it's food
            : 0.10 + (Math.random() * 0.30); // 10% - 40% confident

        console.log(`[AI-VISION-ENGINE] Scan Complete. Score: ${confidenceScore.toFixed(3)} | Threshold criteria met: ${foodDetected}`);

        if (foodDetected) {
            return successResponse({
                foodDetected: true,
                confidence: confidenceScore,
                classification: "Food/Perishable"
            }, 'AI detected organic food assets successfully.');
        } else {
            return errorResponse('Invalid image detected. Please upload a valid food image.', 400);
        }

    } catch (error) {
        console.error("[AI-VISION-ENGINE] Processing encountered an error:", error);
        return errorResponse('AI Vision Node offline. Please try again.', 500);
    }
});
