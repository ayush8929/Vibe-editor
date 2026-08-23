import { scanTemplateDirectory } from "@/modules/playground/lib/path-to-json";
import { db } from "@/lib/db";
import { templatePaths } from "@/lib/template";
import path from "path";
import { NextRequest } from "next/server";

function validateJsonStructure(data: unknown): boolean {
  try {
    JSON.parse(JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Invalid JSON structure:", error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return Response.json({ error: "Missing playground ID" }, { status: 400 });
  }

  const playground = await db.playground.findUnique({
    where: { id },
    include: { templateFiles: true }, // NEW — needed to read saved GitHub files
  });

  if (!playground) {
    return Response.json({ error: "Playground not found" }, { status: 404 });
  }

  // NEW: GitHub-imported playgrounds don't have a local folder to scan —
  // their files were saved to TemplateFile at import time, so read from there.
  if (playground.template === "GITHUB") {
    const saved = playground.templateFiles[0];

    if (!saved) {
      return Response.json(
        { error: "No files found for this playground" },
        { status: 404 },
      );
    }

    if (!validateJsonStructure(saved.content)) {
      return Response.json(
        { error: "Invalid JSON structure" },
        { status: 500 },
      );
    }

    return Response.json(
      { success: true, templateJson: saved.content },
      { status: 200 },
    );
  }

  // Existing logic — unchanged, still used for REACT/NEXTJS/EXPRESS/VUE/HONO/ANGULAR
  const templateKey = playground.template as keyof typeof templatePaths;
  const templatePath = templatePaths[templateKey];

  if (!templatePath) {
    return Response.json({ error: "Invalid template" }, { status: 404 });
  }

  try {
    const inputPath = path.join(process.cwd(), templatePath);

    const result = await scanTemplateDirectory(inputPath);

    if (!validateJsonStructure(result.items)) {
      return Response.json(
        { error: "Invalid JSON structure" },
        { status: 500 },
      );
    }

    return Response.json(
      { success: true, templateJson: result },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error generating template JSON:", error);
    return Response.json(
      { error: "Failed to generate template" },
      { status: 500 },
    );
  }
}
