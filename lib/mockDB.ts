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

    insert: async (name: keyof typeof mockStore, item: any) => {
        await delay(500);
        const newItem = { ...item, _id: Math.random().toString(36).substr(2, 9), createdAt: new Date() };
        (mockStore[name] as any[]).push(newItem);
        return newItem;
    },

    update: async (name: keyof typeof mockStore, id: string, updates: any) => {
        await delay(400);
        const index = (mockStore[name] as any[]).findIndex(i => i._id === id);
        if (index !== -1) {
            mockStore[name][index] = { ...mockStore[name][index], ...updates };
            return mockStore[name][index];
        }
        return null;
    }
};
