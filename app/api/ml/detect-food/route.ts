import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

// --- Feature 5: Valid Food Keywords ---
// Expanded to include broader categories found in real-world food images
const FOOD_KEYWORDS = [
    'food', 'meal', 'dish', 'rice', 'bread', 'fruit', 'vegetable',
    'produce', 'cuisine', 'ingredient', 'snack', 'dessert', 'recipe',
    'meat', 'dairy', 'packaged food', 'drink', 'beverage', 'produce',
    'supermarket', 'market', 'nutrition', 'natural foods', 'plant',
    'fast food', 'junk food', 'cooking', 'bakery', 'confectionery',
    'plate', 'tableware', 'cup', 'bottle', 'can', 'container'
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
        console.log(`[AI-VISION-REST] Fetching & Scanning: ${imageUrl} | Claimed: ${claimedCategory}`);

        // 1. Fetch image bits to send as base64 (more robust than imageUri)
        const imageRes = await fetch(imageUrl);
        if (!imageRes.ok) throw new Error(`Failed to fetch image from URL: ${imageRes.statusText}`);
        const imageBuffer = await imageRes.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');

        // 2. Call Google Vision REST API with CONTENT instead of imageUri
        const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;
        const response = await fetch(visionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [
                    {
                        image: { content: base64Image },
                        features: [{ type: 'LABEL_DETECTION', maxResults: 15 }]
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
            const detectedStr = labels.slice(0, 3).map((l: any) => l.description).join(', ') || 'unknown';
            return errorResponse(
                `AI Guard: This image does not appear to be food. Detected: ${detectedStr}. Please upload a clearer food image.`,
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
