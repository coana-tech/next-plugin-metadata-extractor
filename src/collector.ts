import fg from "fast-glob";
import fs from "node:fs";
import path from "node:path";
import hash from "object-hash";

import * as parser from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

import type { PageMetadata, MetadataFields } from "./types.ts";

let previousChecksum = "";

const defaultFiles = ["**/page.tsx", "**/page.ts", "**/page.jsx", "**/page.js"];
const defaultKeys = ["title", "description", "keywords", "category"];

function parseMetadata(
  fileContent: string,
  keys: string[]
): MetadataFields | null {
  const metadata = new Map();

  const ast = parser.parse(fileContent, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  let metadataObjectFound = false;

  traverse(ast, {
    enter(path: NodePath<t.ObjectProperty>) {
      if (t.isIdentifier(path.node, { name: "metadata" })) {
        metadataObjectFound = true;
      }
      if (
        metadataObjectFound &&
        t.isIdentifier(path.node.key) &&
        keys.includes(path.node.key.name)
      ) {
        if (t.isStringLiteral(path.node.value)) {
          metadata.set(path.node.key.name, path.node.value.value);
        }
        if (t.isArrayExpression(path.node.value)) {
          metadata.set(
            path.node.key.name,
            path.node.value.elements
              .map((el) => (t.isStringLiteral(el) ? el.value : null))
              .filter((el) => el !== null)
          );
        }
      }
    },
  });

  if (!metadataObjectFound) {
    return null;
  }

  // Convert single string keywords to array
  if (typeof metadata.get("keywords") === "string") {
    metadata.set("keywords", [metadata.get("keywords")]);
  }

  return Object.fromEntries(metadata.entries());
}

function isUnchanged(metadataCollection: PageMetadata[]) {
  const checksum = hash(metadataCollection, { unorderedArrays: true });

  if (checksum === previousChecksum) {
    return true;
  }

  previousChecksum = checksum;
  return false;
}

export async function collectMetadata(
  options: {
    dir?: string;
    keys?: string[];
    outputPath?: string;
    files?: string[];
  } = {}
): Promise<PageMetadata[] | []> {
  const dir = options.dir || "app";
  const keys = options.keys || defaultKeys;
  const files = options.files || defaultFiles;
  const outputPath =
    options.outputPath || path.join(process.cwd(), "public/metadata.json");

  if (options.outputPath && !options.outputPath.endsWith(".json")) {
    throw new Error("outputPath must end with .json");
  }

  const pagesDirectory = path.join(process.cwd(), dir);
  const pageFiles = await fg(files, {
    cwd: pagesDirectory,
  });

  const metadataCollection: PageMetadata[] = [];

  for (const pageFile of pageFiles) {
    try {
      const fullPath = path.join(pagesDirectory, pageFile);
      const fileContent = await fs.promises.readFile(fullPath, "utf-8");

      if (!fileContent) {
        console.warn(`File ${fullPath} is empty`);
        continue;
      }

      const metadata = parseMetadata(fileContent, keys);
      if (!metadata) {
        continue;
      }

      const dirname = path.dirname(pageFile).replace(/\/\[\[.*\]\]/, "");
      const pathname = dirname === "." ? "/" : `/${dirname}`;

      const item = { pathname, metadata };
      metadataCollection.push(item);
    } catch (error) {
      console.warn(`Failed to parse metadata for ${pageFile}:`, error);
    }
  }

  if (isUnchanged(metadataCollection)) {
    return [];
  }

  try {
    const outputDir = path.relative(process.cwd(), path.parse(outputPath).dir);
    await fs.promises.mkdir(outputDir, { recursive: true });
  } catch (error) {
    console.warn(`Failed to create output directory:`, error);
  }

  try {
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(metadataCollection, null, 2),
      { flag: "w+" }
    );
  } catch (error) {
    console.warn(`Failed to write output file:`, error);
  }

  return metadataCollection;
}
