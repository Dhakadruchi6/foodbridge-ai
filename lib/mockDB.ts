"use client";

// Simple in-memory storage for development fallback
const mockStore = {
    users: [
        { _id: "u1", name: "Guest Donor", email: "donor@example.com", role: "donor" },
        { _id: "u2", name: "Guest NGO", email: "ngo@example.com", role: "ngo" }
    ],
    donations: [],
    deliveries: []
};

// Simulated latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockDB = {
    getCollection: async (name: keyof typeof mockStore) => {
        await delay(300);
        return mockStore[name];
    },

    insert: async (name: keyof typeof mockStore, item: Record<string, unknown>) => {
        await delay(500);
        const newItem = { ...item, _id: Math.random().toString(36).substring(2, 9), createdAt: new Date() };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mockStore[name] as any[]).push(newItem);
        return newItem;
    },

    update: async (name: keyof typeof mockStore, id: string, updates: Record<string, unknown>) => {
        await delay(400);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const index = (mockStore[name] as any[]).findIndex(i => i._id === id);
        if (index !== -1) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockStore[name][index] = { ...(mockStore[name][index] as any), ...updates };
            return mockStore[name][index];
        }
        return null;
    }
};
