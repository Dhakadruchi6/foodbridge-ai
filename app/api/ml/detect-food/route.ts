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

    const API_KEY = process.env.GOOGLE_VISION_API_KEY;
    if (!API_KEY || API_KEY === 'PLACE_YOUR_API_KEY_HERE') {
        return errorResponse('Google Vision API Key is missing. Please add GOOGLE_VISION_API_KEY to your .env.local', 500);
    }

    try {
        console.log(`[AI-VISION-REST] Scanning: ${imageUrl} | Claimed: ${claimedCategory}`);

        // Call Google Vision REST API instead of using SDK to allow API Key usage
        const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

        const response = await fetch(visionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    {
                        image: { source: { imageUri: imageUrl } },
                        features: [{ type: 'LABEL_DETECTION', maxResults: 10 }]
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[AI-VISION-REST] Google API Error:", data);
            throw new Error(data.error?.message || 'Failed to call Google Vision API');
        }

        const labels = data.responses?.[0]?.labelAnnotations || [];
        console.log('[AI-VISION-REST] Detected Labels:', labels.map((l: any) => l.description).join(', '));

        // Validation Logic: Check if any labels match food keywords
        const foundFoodLabels = labels.filter((label: any) => {
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
            labels: labels.map((l: any) => l.description)
        }, `AI verified: "${topLabel}" detected.`);

    } catch (error: any) {
        console.error("[AI-VISION-REST] Error:", error);
        return errorResponse(`AI Vision Error: ${error.message}`, 500);
    }
});
