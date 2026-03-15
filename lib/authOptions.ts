import { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import User from "@/models/User";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            isProfileComplete: boolean;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: string;
        isProfileComplete: boolean;
    }
}

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }: any) {
            console.log("[AUTH] SignIn Attempt:", { email: user.email, provider: account?.provider });
            if (account?.provider === "google") {
                try {
                    await dbConnect();
                    const existingUser = await User.findOne({ email: user.email });

                    if (!existingUser) {
                        console.log("[AUTH] Creating new Google user:", user.email);
                        await User.create({
                            name: user.name,
                            email: user.email,
                            googleId: user.id,
                            role: "donor",
                            phoneVerified: false,
                            isActive: false,
                        });
                    } else if (!existingUser.googleId) {
                        console.log("[AUTH] Linking Google ID to existing user:", user.email);
                        existingUser.googleId = user.id;
                        await existingUser.save();
                    }
                    console.log("[AUTH] SignIn Success for:", user.email);
                    return true;
                } catch (err) {
                    console.error("[AUTH] SignIn Error:", err);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }: any) {
            if (session.user) {
                await dbConnect();
                const dbUser = await User.findOne({ email: session.user.email });

                if (dbUser) {
                    session.user.id = dbUser._id.toString();
                    session.user.role = dbUser.role;
                    // Improved check: requires phone, address, and city
                    session.user.isProfileComplete = !!(dbUser.phone && dbUser.address && dbUser.city);
                    console.log("[AUTH] Session computed for:", {
                        email: session.user.email,
                        isProfileComplete: session.user.isProfileComplete,
                        role: session.user.role
                    });
                }
            }
            return session;
        },
        async redirect({ url, baseUrl }: any) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
    pages: {
        signIn: "/login",
        error: "/auth/error",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
