import { describe, expect, it, vi } from "vitest";

import { MetadataCollectorPlugin } from "./plugin.ts";

import type { Compiler } from "webpack";

describe("MetadataCollectorPlugin", () => {
  it("registers afterEmit hook", () => {
    const plugin = new MetadataCollectorPlugin();
    const compiler = {
      hooks: {
        afterEmit: {
          tapPromise: vi.fn(),
        },
      },
    } as unknown as Compiler;

    plugin.apply(compiler);
    expect(compiler.hooks.afterEmit.tapPromise).toHaveBeenCalled();
  });

  it("should throw an error if provided an unknown option", async () => {
    await expect(
      // @ts-expect-error
      async () => new MetadataCollectorPlugin({ output: "test" })
    ).rejects.toThrowError("Invalid option: output");
  });
});
