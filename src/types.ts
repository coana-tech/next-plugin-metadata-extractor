export interface MetadataCollectorOptions {
  /** Set output path for the search index file, defaults to "public/search-index.json" */
  outputPath?: string;
  /** Set directory to search for page files, defaults to "app" */
  dir?: string;
  /** Set files to collect from metadata files, defaults to ['**\/page.tsx', '**\/page.ts', '**\/page.jsx'] */
  files?: string[];
  /** Set keys to collect from metadata files, defaults to 'title', 'description', 'keywords', 'category' */
  keys?: string[];
  /** Enable development mode with debouncing */
  dev?: boolean;
  /** Debounce time in milliseconds for dev mode updates */
  debounceTime?: number;
}

export interface PageMetadata {
  pathname: string;
  metadata: MetadataFields;
}

export interface MetadataFields {
  // Required fields
  title: string;
  description: string;

  // Optional fields
  keywords?: string[];
  category?: string;

  // Optional fields for dev mode
  [key: string]: string | string[] | undefined;
}
