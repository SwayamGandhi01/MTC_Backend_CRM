import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/roles";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Role } from "@/models/Role";
import { AdminUser } from "@/models/AdminUser";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await requirePermission("roles.manage");
    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();
    const role = await Role.findById(id);

    if (!role) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Role not found" } },
        { status: 404 }
      );
    }

    if (body.name) role.name = body.name.trim();
    if (body.description !== undefined) role.description = body.description;
    if (body.permissions && Array.isArray(body.permissions)) {
      role.permissions = body.permissions;
    }
    role.updatedBy = authContext.user._id;

    await role.save();

    return NextResponse.json({
      success: true,
      message: "Role updated successfully",
      role: {
        id: role._id.toString(),
        name: role.name,
        slug: role.slug,
        permissions: role.permissions,
        isSystemRole: role.isSystemRole,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("roles.manage");
    const { id } = await params;

    await connectToDatabase();
    const role = await Role.findById(id);

    if (!role) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Role not found" } },
        { status: 404 }
      );
    }

    // Protection 1: System role
    if (role.isSystemRole) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SYSTEM_ROLE_PROTECTED",
            message: "System roles cannot be deleted.",
          },
        },
        { status: 400 }
      );
    }

    // Protection 2: Assigned active users
    const assignedUsers = await AdminUser.countDocuments({
      $or: [{ roleId: role._id }, { role: role.slug }],
    });

    if (assignedUsers > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ROLE_IN_USE",
            message: `Cannot delete role '${role.name}' because ${assignedUsers} employee account(s) are assigned to it. Reassign them first.`,
          },
        },
        { status: 400 }
      );
    }

    await Role.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Role '${role.name}' deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.statusCode || 500 }
    );
  }
}
