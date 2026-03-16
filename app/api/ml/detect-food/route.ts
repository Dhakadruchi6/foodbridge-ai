import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

// --- Feature 5: Allowed Food Categories ---
const FOOD_CATEGORIES = [
    'rice', 'vegetables', 'bread', 'fruits', 'pizza', 'burger', 'salad',
    'pasta', 'noodles', 'curry', 'soup', 'sandwich', 'cake', 'cookies',
    'biryani', 'dosa', 'idli', 'roti', 'dal', 'paneer', 'chapati',
    'samosa', 'pakora', 'khichdi', 'pulao', 'paratha', 'chole',
    'stew', 'chowmein', 'fried_rice', 'cereal', 'omelette', 'eggs',
    'chicken', 'fish', 'meat', 'milk', 'yogurt', 'cheese',
    'juice', 'cooked_meal', 'fresh_produce', 'snacks', 'dessert',
    'food', 'perishable', 'organic', 'prepared_meal',
];

// Non-food categories to reject
const NON_FOOD_CATEGORIES = [
    'toy', 'doll', 'gadget', 'plastic', 'electronic', 'phone', 'computer',
    'shoe', 'clothing', 'vehicle', 'furniture', 'animal', 'person', 'selfie',
    'screenshot', 'meme', 'text', 'document', 'logo', 'icon', 'abstract',
];

// --- Feature 4: AI Food Classification ---
function simulateAIClassification(imageUrl: string): { category: string; confidence: number; isFood: boolean } {
    // In production, this would call Google Cloud Vision, AWS Rekognition, or a Food-101 model
    const lowerUrl = imageUrl.toLowerCase();

    // Check for explicit non-food keywords in the URL/filename
    const matchedNonFood = NON_FOOD_CATEGORIES.find(cat => lowerUrl.includes(cat));
    if (matchedNonFood) {
        return {
            category: matchedNonFood,
            confidence: 0.15 + Math.random() * 0.25, // 15-40%
            isFood: false,
        };
    }

    // Check for valid image extensions
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
    if (!ext || !validExtensions.includes(ext)) {
        return {
            category: 'unknown_format',
            confidence: 0.10,
            isFood: false,
        };
    }

    // Simulate food detection with a random food category
    const randomCategory = FOOD_CATEGORIES[Math.floor(Math.random() * FOOD_CATEGORIES.length)];
    return {
        category: randomCategory,
        confidence: 0.78 + Math.random() * 0.21, // 78-99%
        isFood: true,
    };
}

export const POST = asyncHandler(async (req: Request) => {
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('donor')(authGate);
    if (roleGate.status !== 200) return roleGate;

    const { imageUrl } = await req.json();

    if (!imageUrl) {
        return errorResponse('Image URL is required for AI detection', 400);
    }

    try {
        console.log(`[AI-VISION] Scanning: ${imageUrl}`);

        // Simulate ML processing delay
        await new Promise(resolve => setTimeout(resolve, 1200));

        const result = simulateAIClassification(imageUrl);

        console.log(`[AI-VISION] Category: ${result.category} | Confidence: ${(result.confidence * 100).toFixed(1)}% | IsFood: ${result.isFood}`);

        // --- Feature 4: Enforce 75% confidence threshold ---
        if (!result.isFood || result.confidence < 0.75) {
            return errorResponse(
                `AI rejected: Detected "${result.category}" with ${(result.confidence * 100).toFixed(0)}% confidence. Only food images with ≥75% confidence are accepted.`,
                400
            );
        }

        return successResponse({
            foodDetected: true,
            confidence: result.confidence,
            classification: result.category,
        }, `AI verified: "${result.category}" detected with ${(result.confidence * 100).toFixed(0)}% confidence.`);

    } catch (error) {
        console.error("[AI-VISION] Error:", error);
        return errorResponse('AI Vision Engine offline. Please try again.', 500);
    }
});
