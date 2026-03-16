import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

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

const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user, account }: any) {
            console.log("[AUTH] SignIn Attempt:", { email: user.email, provider: account?.provider });
            if (account?.provider === "google") {
                try {
                    await dbConnect();
                    const User = mongoose.models.User || (await import("@/models/User")).default;

                    const existingUser = await User.findOne({ email: user.email });

                    if (!existingUser) {
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
                            existingUser.googleId = user.id;
                            await existingUser.save();
                        }
                        user.id = existingUser._id.toString();
                        user.role = existingUser.role;
                    }
                    return true;
                } catch (err) {
                    console.error("[AUTH] SignIn Error:", err);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user }: any) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                try {
                    await dbConnect();
                    const User = mongoose.models.User || (await import("@/models/User")).default;
                    const query = token?.id ? { _id: token.id } : { email: session.user.email };
                    const dbUser = await User.findOne(query);

                    if (dbUser) {
                        session.user.id = dbUser._id.toString();
                        session.user.role = dbUser.role;
                        session.user.isProfileComplete = !!(dbUser.phone && dbUser.address && dbUser.city);
                    }
                } catch (err) {
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
