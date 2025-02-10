import type { Compiler } from "webpack";
import { collectMetadata } from "./collector.js";
import type { MetadataCollectorOptions, PageMetadata } from "./types.ts";

export type { MetadataCollectorOptions, PageMetadata };

const configKeys = [
  "debounceTime",
  "dev",
  "dir",
  "files",
  "keys",
  "outputPath",
] satisfies (keyof MetadataCollectorOptions)[];

export class MetadataCollectorPlugin {
  private dev: boolean;
  private lastUpdate: number;
  private debounceTime: number;
  private outputPath?: string;
  private dir?: string;
  private keys?: string[];
  private files?: string[];

  constructor(options: MetadataCollectorOptions = {}) {
    Object.keys(options).forEach((key) => {
      // @ts-expect-error
      if (!configKeys.includes(key)) {
        throw new Error(`Invalid option: ${key}`);
      }
    });

    this.outputPath = options.outputPath;
    this.dir = options.dir;
    this.keys = options.keys;
    this.files = options.files;
    this.dev = options.dev || false;
    this.lastUpdate = 0;
    this.debounceTime = options.debounceTime || 1000;
  }

  apply(compiler: Compiler) {
    const pluginName = "MetadataCollectorPlugin";

    compiler.hooks.afterEmit.tapPromise(pluginName, async () => {
      if (this.dev) {
        const now = Date.now();
        if (now - this.lastUpdate < this.debounceTime) {
          return;
        }
        this.lastUpdate = now;
      }

      try {
        await collectMetadata({
          dir: this.dir,
          keys: this.keys,
          outputPath: this.outputPath,
          files: this.files,
        });
        console.log("📄 Updated metadata");
      } catch (error) {
        console.error("Error updating metadata:", error);
      }
    });
  }
}
