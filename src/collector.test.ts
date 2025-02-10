import fg from "fast-glob";
import fs from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { collectMetadata } from "./collector";
import { jsPage, jsxPage, tsPage, tsxPage, tsxPageDynamic } from "./test/data";

const generateRandomString = () => {
  return Math.floor(Math.random() * Date.now()).toString(36);
};

vi.mock("fs", async () => ({
  default: {
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
    },
  },
}));

vi.mock("fast-glob", () => ({
  default: vi.fn(),
}));

vi.mock("path", () => ({
  default: {
    join: vi.fn((...args: string[]) => args.join("/")),
    dirname: vi.fn((path: string) => path.split("/").slice(0, -1).join("/")),
    relative: vi.fn((...args: string[]) => args.join("/").toString()),
    parse: vi.fn((path: string) => ({
      dir: path,
    })),
  },
}));

vi.mock("object-hash", () => ({
  default: vi.fn(() => generateRandomString()),
}));

describe("collectMetadata", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should throw an error if outputPath does not end with .json", async () => {
    await expect(() =>
      collectMetadata({ outputPath: "test" })
    ).rejects.toThrowError("outputPath must end with .json");
  });

  it("should collect basic metadata fields", async () => {
    const mockFiles = ["page.tsx"];
    const mockMetadata = `
      export const metadata = {
        title: "Test Page",
        description: "Test Description",
        applicationName: "My App",
        generator: "Next.js",
        keywords: ["test", "page"],
        category: "test"
      };
    `;

    vi.mocked(fg).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockMetadata);

    const result = await collectMetadata();

    expect(result).toHaveLength(1);
    expect(result?.[0].metadata).toEqual({
      title: "Test Page",
      description: "Test Description",
      keywords: ["test", "page"],
      category: "test",
    });
  });

  it("should handle keywords with single string", async () => {
    const mockFiles = ["page.tsx"];
    const mockMetadata = `
      export const metadata = {
        title: "Test Page",
        description: "Test Description",
        keywords: "single-keyword"
      };
    `;

    vi.mocked(fg).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockMetadata);

    const result = await collectMetadata();

    expect(result[0].metadata.keywords).toEqual(["single-keyword"]);
  });

  it("should handle keywords with array of strings", async () => {
    const mockFiles = ["page.tsx"];
    const mockMetadata = `
      export const metadata = {
        title: "Test Page",
        description: "Test Description",
        keywords: ["single-keyword", "another-keyword"]
      };
    `;

    vi.mocked(fg).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockMetadata);

    const result = await collectMetadata();

    expect(result[0].metadata.keywords).toEqual([
      "single-keyword",
      "another-keyword",
    ]);
  });

  it("should handle type annotation", async () => {
    const mockFiles = ["page.tsx"];
    const mockMetadata = `
      export const metadata: Metadata = {
        title: "Test Page",
        description: "Test Description",
        applicationName: "My App",
        generator: "Next.js",
        keywords: ["test", "page"],
        category: "test"
      };
    `;

    vi.mocked(fg).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockMetadata);

    const result = await collectMetadata();

    expect(result).toHaveLength(1);
    expect(result[0].metadata).toEqual({
      title: "Test Page",
      description: "Test Description",
      keywords: ["test", "page"],
      category: "test",
    });
  });

  it("should handle comments", async () => {
    const mockFiles = ["page.tsx"];
    const mockMetadata = `
      export const metadata = {
        title: "Test Page",
        // comment
        description: "Test Description", // comment
        keywords: [
          "test", // comment
          "page", // comment
        ],
      };
    `;

    vi.mocked(fg).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockMetadata);

    const result = await collectMetadata();

    expect(result).toHaveLength(1);
    expect(result[0].metadata).toEqual({
      title: "Test Page",
      description: "Test Description",
      keywords: ["test", "page"],
    });
  });

  it("should skip pages without required fields", async () => {
    const mockFiles = ["page.tsx"];
    const mockMetadata = `
      export const metadata = {
        applicationName: "My App"
      };
    `;

    vi.mocked(fg).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockMetadata);

    const result = await collectMetadata();

    expect(result).toHaveLength(1);
    expect(result[0].metadata).toEqual({});
  });

  it("should handle custom keys set", async () => {
    const mockFiles = ["page.tsx"];
    const mockMetadata = `
      export const metadata: Metadata = {
        title: "Test Page",
        description: "Test Description",
        applicationName: "My App",
        generator: "Next.js",
        keywords: ["test", "page"],
        category: "test"
      };
    `;

    vi.mocked(fg).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockMetadata);

    const result = await collectMetadata({
      keys: ["title", "description", "generator", "applicationName"],
    });

    expect(result).toHaveLength(1);
    expect(result[0].metadata).toEqual({
      title: "Test Page",
      description: "Test Description",
      applicationName: "My App",
      generator: "Next.js",
    });
  });

  it("should not collect object types", async () => {
    const mockFiles = ["page.tsx"];
    const mockMetadata = `
      export const metadata: Metadata = {
        title: "Test Page",
        description: "Test Description",
        openGraph: {
          title: "Test Page",
          description: "Test Description",
          images: ["https://example.com/image.png"],
        },
      };
    `;

    vi.mocked(fg).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockMetadata);

    const result = await collectMetadata({
      keys: ["title", "description", "openGraph"],
    });

    expect(result).toHaveLength(1);
    expect(result[0].metadata).toEqual({
      title: "Test Page",
      description: "Test Description",
    });
  });

  it("should support .jsx files", async () => {
    const mockFiles = ["test/page.jsx"];
    const mockMetadata = jsxPage;

    vi.mocked(fg).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockMetadata);

    const result = await collectMetadata();

    expect(result).toHaveLength(1);
    expect(result[0].metadata).toEqual({
      title: "Hello World",
      description: "Hello World",
      keywords: ["hello", "world"],
      category: "test",
    });
  });

  it("should support .tsx files", async () => {
    const mockFiles = ["test/page.tsx"];
    const mockMetadata = tsxPage;

    vi.mocked(fg).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockMetadata);

    const result = await collectMetadata();

    expect(result).toHaveLength(1);
    expect(result[0].metadata).toEqual({
      title: "Hello World",
      description: "Hello World",
      keywords: ["hello", "world"],
      category: "test",
    });
  });

  it("should support .js files", async () => {
    const mockFiles = ["test/page.js"];
    const mockMetadata = jsPage;

    vi.mocked(fg).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockMetadata);

    const result = await collectMetadata();

    expect(result).toHaveLength(1);
    expect(result[0].metadata).toEqual({
      title: "Test Page",
      description: "Test Description",
      keywords: ["test", "page"],
      category: "test",
    });
  });

  it("should support .ts files", async () => {
    const mockFiles = ["test/page.ts"];
    const mockMetadata = tsPage;

    vi.mocked(fg).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockMetadata);

    const result = await collectMetadata();

    expect(result).toHaveLength(1);
    expect(result[0].metadata).toEqual({
      title: "Test Page",
      description: "Test Description",
      keywords: ["test", "page"],
      category: "test",
    });
  });

  it("should not collect dynamic metadata from generateMetadata", async () => {
    const mockFiles = ["test/page-dynamic.tsx"];
    const mockMetadata = tsxPageDynamic;

    vi.mocked(fg).mockResolvedValue(mockFiles);
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockMetadata);

    const result = await collectMetadata();

    expect(result).toHaveLength(0);
  });

  // TODO: add tests for changed/unchanged metadata (checksum).
});
