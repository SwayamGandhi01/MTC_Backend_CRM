import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET() {
  const context = await getCurrentSession();
  if (!context) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "No active authenticated session.",
        },
      },
      { status: 401 }
    );
  }

  const { user, permissions } = context;

  return NextResponse.json({
    success: true,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      mfaEnabled: user.mfaEnabled,
      lastLoginAt: user.lastLoginAt,
    },
    permissions,
  });
}
