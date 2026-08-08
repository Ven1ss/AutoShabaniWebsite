import { NextResponse } from "next/server";
import { normalizeAdminProduct, requireAdmin } from "@/lib/admin";
import type { AdminProductInput } from "@/lib/admin";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export async function POST(request: Request) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!supabase || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  let csvText = "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    csvText = await file.text();
  } else {
    csvText = await request.text();
  }

  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows found" }, { status: 400 });
  }

  const products: AdminProductInput[] = rows.map((row) => ({
    name: row.name || row.emri || "",
    name_en: row.name_en || row.name || "",
    sku: row.sku || "",
    code: row.code || row.kodi || "",
    brand: row.brand || row.marka || "",
    description: row.description || row.pershkrimi || "",
    description_en: row.description_en || row.description || "",
    category: row.category || row.kategoria || "other",
    image_url: row.image_url || row.image || "",
    selling_price: Number(row.selling_price || row.price || 0),
    purchase_price: Number(row.purchase_price || 0),
    featured: ["1", "true", "yes"].includes(
      (row.featured || "").toLowerCase()
    ),
    stock_status: (row.stock_status || "on_request") as AdminProductInput["stock_status"],
    hidden_references: row.hidden_references || "",
  }));

  const valid = products.filter((p) => p.name && p.sku && p.category);
  if (valid.length === 0) {
    return NextResponse.json(
      { error: "No valid rows (need name, sku, category)" },
      { status: 400 }
    );
  }

  const payload = valid.map((p) => normalizeAdminProduct(p));
  const { data, error } = await supabase
    .from("products")
    .upsert(payload, { onConflict: "sku" })
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    imported: data?.length ?? valid.length,
  });
}
