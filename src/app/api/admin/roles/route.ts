import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/roles";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Role } from "@/models/Role";
import { AdminUser } from "@/models/AdminUser";
import { PERMISSION_REGISTRY, DEFAULT_SYSTEM_ROLES } from "@/lib/auth/permissions";

const createRoleSchema = z.object({
  name: z.string().min(2, "Role name is required"),
  slug: z.string().min(2, "Role slug is required").regex(/^[a-z0-9_-]+$/, "Slug must be lowercase alphanumeric"),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "At least one permission must be assigned"),
});

export async function GET() {
  try {
    await requirePermission("roles.view");
    await connectToDatabase();

    const roles = await Role.find().sort({ isSystemRole: -1, name: 1 }).lean();

    // Attach active user count per role
    const rolesWithCounts = await Promise.all(
      roles.map(async (r: any) => {
        const userCount = await AdminUser.countDocuments({
          $or: [{ roleId: r._id }, { role: r.slug }],
          status: "ACTIVE",
        });
        return {
          id: r._id.toString(),
          name: r.name,
          slug: r.slug,
          description: r.description,
          permissions: r.permissions,
          isSystemRole: r.isSystemRole,
          isActive: r.isActive,
          userCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      roles: rolesWithCounts,
      availablePermissions: Object.values(PERMISSION_REGISTRY),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await requirePermission("roles.manage");
    const body = await req.json();

    const parsed = createRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 422 }
      );
    }

    const { name, slug, description, permissions } = parsed.data;

    await connectToDatabase();

    const existing = await Role.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ROLE_EXISTS",
            message: `A role with slug '${slug}' already exists.`,
          },
        },
        { status: 409 }
      );
    }

    const newRole = await Role.create({
      name,
      slug,
      description: description || "",
      permissions,
      isSystemRole: false,
      isActive: true,
      createdBy: authContext.user._id,
    });

    return NextResponse.json({
      success: true,
      message: `Role '${name}' created successfully`,
      role: {
        id: newRole._id.toString(),
        name: newRole.name,
        slug: newRole.slug,
        description: newRole.description,
        permissions: newRole.permissions,
        isSystemRole: false,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
