import { NextResponse } from "next/server";
import { getAvailableSlots, isCalendarConfigured } from "@/lib/google-calendar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  if (!isCalendarConfigured()) {
    return NextResponse.json({ slots: [], configured: false });
  }

  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 14);
  end.setHours(23, 59, 59, 999);

  const slots = await getAvailableSlots(
    start.toISOString(),
    end.toISOString(),
    30
  );

  return NextResponse.json({ slots, configured: true });
}
