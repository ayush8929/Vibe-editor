import { NextRequest, NextResponse } from "next/server";

interface TemplateFile {
  filename: string;
  fileExtension: string;
  content: string;
}
interface TemplateFolder {
  folderName: string;
  items: (TemplateFile | TemplateFolder)[];
}

const IGNORE_FOLDERS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".vscode",
  ".idea",
];
const IGNORE_FILES = ["package-lock.json", "yarn.lock", ".DS_Store", ".env"];

function parseFilename(fullName: string): {
  filename: string;
  fileExtension: string;
} {
  const lastDot = fullName.lastIndexOf(".");
  if (lastDot === -1) return { filename: fullName, fileExtension: "" };
  return {
    filename: fullName.slice(0, lastDot),
    fileExtension: fullName.slice(lastDot + 1),
  };
}

// Turns GitHub's flat "path/to/file.ts" list into a nested TemplateFolder tree
function buildTree(
  rootName: string,
  paths: { path: string; content: string }[],
): TemplateFolder {
  const root: TemplateFolder = { folderName: rootName, items: [] };

  for (const file of paths) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      if (IGNORE_FOLDERS.includes(folderName)) {
        current = null as unknown as TemplateFolder;
        break;
      }
      let next = current.items.find(
        (item): item is TemplateFolder =>
          "folderName" in item && item.folderName === folderName,
      );
      if (!next) {
        next = { folderName, items: [] };
        current.items.push(next);
      }
      current = next;
    }

    if (!current) continue; // skipped due to ignored folder

    const fileName = parts[parts.length - 1];
    if (IGNORE_FILES.includes(fileName)) continue;

    const { filename, fileExtension } = parseFilename(fileName);
    current.items.push({ filename, fileExtension, content: file.content });
  }

  return root;
}

export async function POST(req: NextRequest) {
  const { repoUrl } = await req.json();

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
  }
  const [, owner, repoRaw] = match;
  const repo = repoRaw.replace(/\.git$/, "");

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!repoRes.ok) {
    return NextResponse.json(
      { error: "Repository not found" },
      { status: 404 },
    );
  }
  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch;

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
  );
  const treeData = await treeRes.json();

  const blobs = treeData.tree.filter(
    (item: any) =>
      item.type === "blob" &&
      !IGNORE_FOLDERS.some((f) => item.path.includes(`${f}/`)) &&
      item.size < 1024 * 1024, // skip files over 1MB, matches your scanTemplateDirectory default
  );

  if (blobs.length > 200) {
    return NextResponse.json(
      { error: "Repository too large (200 file limit for now)" },
      { status: 413 },
    );
  }

  const files = await Promise.all(
    blobs.map(async (file: any) => {
      const blobRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${defaultBranch}`,
      );
      const blobData = await blobRes.json();
      const content = blobData.content
        ? Buffer.from(blobData.content, "base64").toString("utf-8")
        : "";
      return { path: file.path, content };
    }),
  );

  const templateJson = buildTree(repo, files);

  return NextResponse.json({ repoName: repo, templateJson });
}
