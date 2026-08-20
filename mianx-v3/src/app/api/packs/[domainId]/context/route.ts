import { NextResponse } from "next/server";
import { resolvePackContext } from "@/lib/packs/registry.service";

export async function GET(
  _request: Request,
  { params }: { params: { domainId: string } },
) {
  const { domainId } = params;
  const url = new URL(_request.url);
  const countryId = url.searchParams.get("countryId");

  if (!countryId) {
    return NextResponse.json(
      { error: "Missing required query parameter: countryId" },
      { status: 400 },
    );
  }

  try {
    const context = await resolvePackContext(domainId, countryId);
    return NextResponse.json(context);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Pack resolution failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
