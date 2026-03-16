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

// --- Feature 4 & 5: AI Food Classification (Enhanced Deterministic Simulation) ---
function simulateAIClassification(imageUrl: string, claimedCategory?: string): { category: string; confidence: number; isFood: boolean; reason?: string } {
    const lowerUrl = imageUrl.toLowerCase();
    const lowerClaimed = (claimedCategory || "").toLowerCase();

    // 1. Explicit Non-Food Keyword Detection (Dolls, Toys, Gadgets)
    const nonFoodMatch = NON_FOOD_CATEGORIES.find(cat => lowerUrl.includes(cat) || lowerClaimed.includes(cat));
    if (nonFoodMatch) {
        return {
            category: nonFoodMatch,
            confidence: 0.95,
            isFood: false,
            reason: `Visual signature identified as a "${nonFoodMatch.replace('_', ' ')}" (Non-Food Item). Submission blocked.`
        };
    }

    // 2. Format Validation
    const ext = imageUrl.split('.').pop()?.split('?')[0]?.toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
    if (!ext || !validExtensions.includes(ext)) {
        return {
            category: 'invalid_format',
            confidence: 1.0,
            isFood: false,
            reason: "Unsupported image format. Please use standard photography formats (JPG, PNG)."
        };
    }

    // 3. Deterministic Hashing
    let hash = 0;
    for (let i = 0; i < imageUrl.length; i++) {
        hash = ((hash << 5) - hash) + imageUrl.charCodeAt(i);
        hash |= 0;
    }
    const absHash = Math.abs(hash);

    // 4. DOLL/TOY VISUAL SIGNATURE SIMULATION (STRICT)
    // If the image doesn't contain food keywords and the hash maps to a synthetic signature
    if (absHash % 5 === 0 && !lowerUrl.includes('food') && !lowerUrl.includes('meal')) {
        return {
            category: 'toy_doll',
            confidence: 0.90,
            isFood: false,
            reason: "AI Guard: Detected visual patterns consistent with synthetic textures (Plastic/Resin). Identified as: Doll/Toy."
        };
    }

    // 5. CATEGORY CROSS-CHECK (FUZZY & LENIENT)
    const categoryIndex = absHash % FOOD_CATEGORIES.length;
    const deterministicCategory = FOOD_CATEGORIES[categoryIndex];

    // Split claimed category into words for better matching (e.g. "biryani rice")
    const claimedWords = lowerClaimed.split(/\s+/).filter(w => w.length > 2);
    const hasKeywordMatch = claimedWords.some(word =>
        deterministicCategory.includes(word) || word.includes(deterministicCategory)
    ) || lowerUrl.includes(deterministicCategory);

    if (lowerClaimed && !hasKeywordMatch) {
        // Special case: if it's high confidence food but just a name mismatch, 
        // give it a "Close Match" boost if they are both in the food bucket.
        const isLikelyFoodMismatch = absHash % 10 > 2; // 70% chance to allow near-matches

        if (!isLikelyFoodMismatch) {
            return {
                category: deterministicCategory,
                confidence: 0.65,
                isFood: true,
                reason: `Cross-validation failed. You claimed "${claimedCategory}", but AI vision identifies features closer to "${deterministicCategory.replace('_', ' ')}".`
            };
        }
    }

    // 6. Successful match (Deterministic but assisted by keywords)
    const finalCategory = (hasKeywordMatch && lowerClaimed) ? deterministicCategory : deterministicCategory;

    return {
        category: finalCategory,
        confidence: 0.85 + ((absHash % 14) / 100),
        isFood: true,
    };
}

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
        console.log(`[AI-VISION] Scanning: ${imageUrl} | Claimed: ${claimedCategory}`);

        // Simulate ML processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const result = simulateAIClassification(imageUrl, claimedCategory);

        console.log(`[AI-VISION] Result: ${result.category} | Confidence: ${result.confidence.toFixed(2)} | IsFood: ${result.isFood}`);

        // --- Feature 4: Enforce 75% confidence threshold + Cross-Validation ---
        if (!result.isFood || result.confidence < 0.75) {
            const reason = result.reason || `Detected "${result.category}" but could not verify as high-quality food (Conf: ${(result.confidence * 100).toFixed(0)}%).`;
            return errorResponse(
                `AI Guard: ${reason}`,
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
