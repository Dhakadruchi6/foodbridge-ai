import { NextResponse } from "next/server";
import connectDB from "@/lib/db";

export async function GET() {
    try {
        await connectDB();
        return NextResponse.json({
            success: true,
            message: "MongoDB connected successfully",
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                message: "Failed to connect to MongoDB",
                error: error.message,
            },
            { status: 500 }
        );
    }
}
