import { collectDashboardDataAsync } from "../lib/dashboard-data.mjs";
import { pushProspectToOdoo } from "../lib/odoo-push.mjs";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const id = typeof request.query?.id === "string" ? request.query.id : "";
  if (!id) {
    response.status(400).json({ error: "missing_id" });
    return;
  }

  try {
    let body = {};
    if (request.body && typeof request.body === "object") body = request.body;
    else if (typeof request.body === "string" && request.body.trim()) body = JSON.parse(request.body);

    const data = await collectDashboardDataAsync();
    const prospect = data.prospects.find((p) => p.id === id);
    if (!prospect) {
      response.status(404).json({ error: "prospect_not_found" });
      return;
    }

    const { leadId } = await pushProspectToOdoo(prospect, body);
    response.setHeader("Cache-Control", "no-store");
    response.status(200).json({ success: true, leadId, name: prospect.name });
  } catch (error) {
    const statusCode = error?.statusCode ?? 500;
    response.status(statusCode).json({
      error: "odoo_error",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
