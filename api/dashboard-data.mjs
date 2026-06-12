import { collectDashboardDataAsync } from "../lib/dashboard-data.mjs";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const payload = await collectDashboardDataAsync();
    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(payload);
  } catch (error) {
    response.status(error?.statusCode ?? 500).json({
      error: "server_error",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}
