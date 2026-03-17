import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import vision from '@google-cloud/vision';

// Initialize Google Vision client using the API Key
const client = new vision.ImageAnnotatorClient({
    apiKey: process.env.GOOGLE_VISION_API_KEY
});

// --- Feature 5: Valid Food Keywords ---
const FOOD_KEYWORDS = [
    'food', 'meal', 'dish', 'rice', 'bread', 'fruit', 'vegetable',
    'produce', 'cuisine', 'ingredient', 'snack', 'dessert', 'recipe',
    'meat', 'dairy', 'packaged food', 'drink', 'beverage'
];

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('donor')(authGate);
    if (roleGate.status !== 200) return roleGate;

    const { imageUrl, claimedCategory } = await req.json();

    if (!imageUrl) {
        return errorResponse('Image URL is required for AI detection', 400);
    }

    try {
        console.log(`[AI-VISION-REAL] Scanning: ${imageUrl} | Claimed: ${claimedCategory}`);

        // Perform Label Detection
        const [result] = await client.labelDetection(imageUrl);
        const labels = result.labelAnnotations || [];

        console.log('[AI-VISION-REAL] Detected Labels:', labels.map(l => l.description).join(', '));

        // Validation Logic: Check if any labels match food keywords
        const foundFoodLabels = labels.filter(label => {
            const description = (label.description || "").toLowerCase();
            return FOOD_KEYWORDS.some(keyword => description.includes(keyword));
        });

        const isFood = foundFoodLabels.length > 0;
        const topLabel = labels[0]?.description || 'unknown';
        const topConfidence = labels[0]?.score || 0;

        // If no food labels found, reject
        if (!isFood) {
            return errorResponse(
                `AI Guard: This image does not appear to be food. Detected: ${topLabel}. Please upload a valid food image.`,
                400
            );
        }

        // Return success with detected classification
        return successResponse({
            foodDetected: true,
            confidence: topConfidence,
            classification: topLabel,
            labels: labels.map(l => l.description)
        }, `AI verified: "${topLabel}" detected.`);

    } catch (error: any) {
        console.error("[AI-VISION-REAL] Error:", error);

        // Detailed error for API Key/Credential issues if possible
        const errorMessage = error.message || 'AI Vision Engine offline';
        return errorResponse(`AI Vision Error: ${errorMessage}. Please check your Google Cloud credentials.`, 500);
    }
});
