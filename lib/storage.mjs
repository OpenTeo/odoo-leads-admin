import fs from "node:fs";

const blobOverridesPath = "odoo-leads-admin/prospect-overrides.json";

function hasBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function getBlobModule() {
  return import("@vercel/blob");
}

async function findBlobByPathname(pathname) {
  const { list } = await getBlobModule();
  const { blobs } = await list({
    prefix: pathname,
    token: process.env.BLOB_READ_WRITE_TOKEN
  });

  return blobs.find((blob) => blob.pathname === pathname) ?? null;
}

async function readBlobJson(pathname, fallback) {
  if (!hasBlobToken()) return fallback;

  const blob = await findBlobByPathname(pathname);
  if (!blob) return fallback;

  const response = await fetch(blob.url, { cache: "no-store" });
  if (!response.ok) return fallback;

  return response.json();
}

async function writeBlobJson(pathname, value) {
  const { put } = await getBlobModule();
  await put(pathname, JSON.stringify(value, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
    token: process.env.BLOB_READ_WRITE_TOKEN
  });
}

export async function readOverridesPersistent(filePath, fallback) {
  if (hasBlobToken()) {
    return readBlobJson(blobOverridesPath, fallback);
  }

  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export async function writeOverridesPersistent(filePath, value) {
  if (hasBlobToken()) {
    await writeBlobJson(blobOverridesPath, value);
    return;
  }

  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}
