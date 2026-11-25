import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AdminUser } from "@/models/AdminUser";
import { Role } from "@/models/Role";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("users.view");
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role && role !== "all") {
      query.role = role.toLowerCase();
    }

    if (status && status !== "all") {
      query.status = status.toUpperCase();
    }

    const [users, total] = await Promise.all([
      AdminUser.find(query)
        .select("-passwordHash -mfaSecretEncrypted -mfaPendingSecretEncrypted -recoveryCodes")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdminUser.countDocuments(query),
    ]);

    const sanitizedUsers = users.map((u: any) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      isSuperAdmin: u.isSuperAdmin,
      mfaEnabled: u.mfaEnabled,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      success: true,
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.statusCode === 403 ? "FORBIDDEN" : "SERVER_ERROR",
          message: error.message || "Failed to fetch users",
        },
      },
      { status: error.statusCode || 500 }
    );
  }
}
