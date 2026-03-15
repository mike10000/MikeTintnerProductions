import { NextResponse } from "next/server";
import { squareClient } from "@/lib/square";

/**
 * GET /api/square/locations
 * Returns your Square locations - use this to find the correct SQUARE_LOCATION_ID.
 * Only call when debugging - you can remove or protect this in production.
 */
export async function GET() {
  try {
    const response = await squareClient.locations.list();
    const locations = response.locations ?? [];
    return NextResponse.json({
      ok: true,
      locations: locations.map((l) => ({
        id: l.id,
        name: l.name,
        address: l.address,
      })),
      hint: "Use the 'id' of your sandbox location as SQUARE_LOCATION_ID in .env.local",
    });
  } catch (error: unknown) {
    console.error("Square locations error:", error);
    const e = error as { message?: string; body?: unknown };
    return NextResponse.json(
      {
        ok: false,
        error: e.message ?? "Failed to fetch locations",
        details: e.body,
      },
      { status: 500 }
    );
  }
}
