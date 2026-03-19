export interface User {
    _id: string;
    name: string;
    email: string;
    role: "donor" | "ngo" | "admin";
    createdAt: string;
    isActive: boolean;
    phone?: string;
    isFirstLogin?: boolean;
    latitude?: number;
    longitude?: number;
    verificationStatus?: string; // For NGO user profiles
}

export interface NGOProfile {
    _id: string;
    ngoName: string;
    city: string;
    verificationStatus: "pending" | "approved" | "rejected";
    userId: { _id?: any; name: string; email: string };
    address?: string;
    contactPhone?: string;
    registrationNumber?: string;
    isVerified?: boolean;
    latitude?: number;
    longitude?: number;
    createdAt?: string;
}

export interface Donation {
    _id: string;
    foodType: string;
    quantity: any; // Flexible to accommodate string from backend/form and number in UI
    status: "pending" | "pending_request" | "request_sent" | "accepted" | "on_the_way" | "arrived" | "collected" | "delivered" | "completed" | "flagged";
    city: string;
    createdAt: string;
    prioritizationRank?: number;
    donorId: { _id?: any; name: string; email: string } | null;
    latitude?: number | null;
    longitude?: number | null;
    foodImage?: string;
    preparedTime?: string;
    expiryTime?: string;
    pickupAddress?: string;
    acceptedAt?: string;
    deliveredAt?: string;
}

export interface Delivery {
    _id: string;
    donationId: string | Donation;
    ngoId: string | User;
    status: "pending" | "accepted" | "on_the_way" | "arrived" | "collected" | "delivered" | "completed" | "rejected";
    pickupTime?: string;
    deliveryTime?: string;
    liveLatitude?: number;
    liveLongitude?: number;
    isLive?: boolean;
}

export interface AnalyticsSummary {
    totalRecovered: number;
    successRate: number;
    activeMissions: number;
    [key: string]: any; // Allow for dynamic trend data safely
}

export interface AdminMetrics {
    totalDonations: number;
    activeNGOs: number;
    totalRecovered: number;
    totalReports: number;
    [key: string]: any;
}
