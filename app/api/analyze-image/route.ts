import { authMiddleware } from '@/middleware/authMiddleware';
import { allowRoles } from '@/middleware/roleMiddleware';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';

const HF_MODEL_URL = "https://router.huggingface.co/hf-inference/models/google/vit-base-patch16-224";
const FOOD_KEYWORDS = [
    "food", "dish", "meal", "fruit", "vegetable", "meat", "poultry", "fish",
    "bread", "cake", "dessert", "snack", "soup", "salad", "sandwich", "pizza",
    "burger", "pasta", "rice", "noodle", "cheese", "egg", "apple", "banana",
    "orange", "plate", "bowl", "cup", "sauce", "bean", "cookie", "chocolate",
    "pastry", "grocery", "produce", "strawberry", "broccoli", "hotdog",
    "hamburger", "drink", "beverage", "croissant", "donut", "bagel", "pretzel",
    "ice cream", "lemon", "fig", "pineapple", "pomegranate", "corn", "mushroom",
    "cucumber", "bell pepper", "bakery", "restaurant", "menu"
];

export const POST = asyncHandler(async (req: Request) => {
    // 1. Authentication & Authorization
    const authGate = await authMiddleware(req);
    if (authGate.status !== 200) return authGate;

    const roleGate = await allowRoles('donor')(authGate);
    if (roleGate.status !== 200) return roleGate;

    // 2. Parse Request
    const { imageUrl } = await req.json();
    if (!imageUrl) {
        return errorResponse('Image URL is required', 400);
    }

    const HF_API_KEY = process.env.HF_API_KEY;
    if (!HF_API_KEY || HF_API_KEY.startsWith('hf_xxx')) {
        return errorResponse('Hugging Face API Key is missing or invalid. Please configure HF_API_KEY in .env.local', 500);
    }

    try {
        console.log(`[AI-ANALYZE] Fetching & Scanning: ${imageUrl}`);

        // 3. Call Hugging Face Inference API
        const response = await fetch(HF_MODEL_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: imageUrl
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[AI-ANALYZE] Hugging Face API Error:", data);
            throw new Error(data.error || 'Failed to call Hugging Face API');
        }

        // 4. Process Results
        // HF returns array of { label: string, score: number }
        const hfResults = Array.isArray(data) ? data : [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const labels = hfResults.map((item: any) => item.label.toLowerCase());

        // Logic: Check if labels include food-related keywords
        const isFood = labels.some(label =>
            FOOD_KEYWORDS.some(keyword => label.includes(keyword))
        );

        console.log(`[AI-ANALYZE] Detected Labels: ${labels.join(', ')} | isFood: ${isFood}`);

        return successResponse({
            isFood,
            labels: hfResults.map((item: { label: string }) => item.label),
            confidence: hfResults[0]?.score || 0,
            category: hfResults[0]?.label || 'unknown'
        }, isFood ? `AI verified: food detected.` : `AI rejected: this does not appear to be food.`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("[AI-ANALYZE] Error:", error);
        return errorResponse(`AI verification failed: ${error.message}`, 500);
    }
});
