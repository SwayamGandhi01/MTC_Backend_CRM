import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Customer } from "@/models/Customer";
import { requirePermission } from "@/lib/auth/roles";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    await requirePermission("customers.view");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");

    await connectToDatabase();

    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { fullName: searchRegex },
        { phoneNumber: searchRegex },
        { normalizedPhone: searchRegex },
        { email: searchRegex },
        { postcode: searchRegex },
        { vehicleReg: searchRegex },
        { vehicles: searchRegex },
      ];
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ lastActivityAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return apiSuccess(customers, {
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch customers", "SERVER_ERROR", 500);
  }
}
