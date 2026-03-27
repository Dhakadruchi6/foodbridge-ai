import { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

// Define the User interface locally or import it if you have a separate type file
// For now, using any for the model since it's lazy-loaded

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            isProfileComplete: boolean;
            ngo_verified: boolean;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: string;
        isProfileComplete: boolean;
        ngo_verified: boolean;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role?: string;
        isProfileComplete?: boolean;
        ngo_verified?: boolean;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user, account }: { user: { email?: string | null; name?: string | null; id?: string; role?: string }; account: { provider: string } | null }) {
            console.log("[AUTH] SignIn Attempt:", { email: user.email, provider: account?.provider });
            if (account?.provider === "google") {
                try {
                    await dbConnect();
                    const User = mongoose.models.User || (await import("@/models/User")).default;

                    const existingUser = await User.findOne({ email: user.email });

                    if (!existingUser) {
                        console.log("[AUTH] Creating new Google user:", user.email);
                        const newUser = await User.create({
                            name: user.name,
                            email: user.email,
                            googleId: user.id,
                            role: "donor",
                            phoneVerified: false,
                            isActive: true,
                        });
                        user.id = newUser._id.toString();
                        user.role = newUser.role;
                    } else {
                        if (!existingUser.googleId) {
                            console.log("[AUTH] Linking Google ID to existing user:", user.email);
                            existingUser.googleId = user.id;
                            await existingUser.save();
                        }
                        user.id = existingUser._id.toString();
                        user.role = existingUser.role;
                    }
                    console.log("[AUTH] SignIn Success for:", user.email);
                    return true;
                } catch (err: unknown) {
                    console.error("[AUTH] SignIn Error:", err);
                    return false;
                }
            }
            return true;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async jwt({ token, user }: { token: any; user?: any }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.isProfileComplete = user.isProfileComplete;
                token.ngo_verified = user.ngo_verified;
            }
            return token;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async session({ session, token }: { session: any; token: any }) {
            if (session.user) {
                try {
                    await dbConnect();
                    const User = mongoose.models.User || (await import("@/models/User")).default;

                    const query = token?.id ? { _id: token.id } : { email: session.user.email };
                    const dbUser = await User.findOne(query);

                    if (dbUser) {
                        session.user.id = dbUser._id.toString();
                        session.user.role = dbUser.role;
                        
                        let ngo_verified = false;
                        if (dbUser.role === 'ngo') {
                            const NGOProfile = mongoose.models.NGOProfile || (await import("@/models/NGOProfile")).default;
                            const profile = await NGOProfile.findOne({ userId: dbUser._id });
                            ngo_verified = profile?.ngo_verified || false;
                        }

                        session.user.isProfileComplete = !!(dbUser.phone && dbUser.address && dbUser.city);
                        session.user.ngo_verified = ngo_verified;

                        console.log("[AUTH] Session Computed:", {
                            email: session.user.email,
                            id: session.user.id,
                            role: session.user.role
                        });
                    }
                } catch (err: unknown) {
                    console.error("[AUTH] Session Error:", err);
                }
            }
            return session;
        },
        async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
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
