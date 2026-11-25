import { NextResponse } from "next/server";
import { destroyCurrentSession } from "@/lib/auth/session";

export async function POST() {
  await destroyCurrentSession("USER_LOGOUT");
  return NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
}
