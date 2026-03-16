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
                        const newUser = await User.create({
                            name: user.name,
                            email: user.email,
                            googleId: user.id,
                            role: "donor",
                            phoneVerified: false,
                            isActive: true, // Default to true for Google users
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
                } catch (err) {
                    console.error("[AUTH] SignIn Error:", err);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }: any) {
            // When user first signs in, 'user' is available
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                await dbConnect();
                // Use token.id if available, fallback to email query
                const query = token?.id ? { _id: token.id } : { email: session.user.email };
                const dbUser = await User.findOne(query);

                if (dbUser) {
                    session.user.id = dbUser._id.toString();
                    session.user.role = dbUser.role;
                    session.user.isProfileComplete = !!(dbUser.phone && dbUser.address && dbUser.city);

                    console.log("[AUTH] Session Computed:", {
                        email: session.user.email,
                        id: session.user.id,
                        role: session.user.role
                    });
                } else {
                    console.error("[AUTH] Session Error: User not found in DB for email:", session.user.email);
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
