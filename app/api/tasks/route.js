import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "data", "tasks.json");

async function ensureFile() {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch (e) {
    await fs.writeFile(filePath, "[]");
  }
}

export async function GET() {
  await ensureFile();
  const raw = await fs.readFile(filePath, "utf8");
  try {
    const data = JSON.parse(raw || "[]");
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function PUT(request) {
  await ensureFile();
  try {
    const body = await request.json();
    await fs.writeFile(filePath, JSON.stringify(body || [], null, 2));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
