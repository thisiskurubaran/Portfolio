import { json } from "@/lib/guard";
import { summarizeThreats } from "@/lib/threats";

// F39: blocked attempts as counts by type and country, for the Settings panel.
export async function GET() {
  return json(await summarizeThreats());
}
