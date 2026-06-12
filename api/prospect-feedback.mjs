import { saveProspectFeedbackAsync } from "../lib/dashboard-data.mjs";

function parseBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  if (typeof request.body === "string" && request.body.trim()) {
    return JSON.parse(request.body);
  }

  return {};
}

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
    const payload = parseBody(request);
    const snapshot = await saveProspectFeedbackAsync(id, payload);
    response.setHeader("Cache-Control", "no-store");
    response.status(200).json(snapshot);
  } catch (error) {
    response.status(error?.statusCode ?? 500).json({
      error: "server_error",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}
