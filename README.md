# @coana-tech/next-plugin-metadata-extractor

A Next.js plugin that automatically extracts page metadata to a JSON file for site-wide search functionality.

## Features

- Automatically collects static metadata from Next.js pages during development and build
- Updates metadata in real-time during development
- TypeScript support
- Zero configuration required

## Example Metadata Output

```json
// metadata.json
[
  {
    "pathname": "/home",
    "metadata": {
      "title": "Home Page",
      "description": "Home Page Description"
    }
  },
  {
    "pathname": "/about",
    "metadata": {
      "title": "About Page",
      "description": "About Page Description",
      "keywords": ["about", "page", "description"]
    }
  }
]
```

## Installation

```bash
npm install @coana-tech/next-plugin-metadata-extractor
# or
pnpm add @coana-tech/next-plugin-metadata-extractor
# or
yarn add @coana-tech/next-plugin-metadata-extractor
```

## Usage

1. Add the plugin to your `next.config.js`:

```js
// next.config.js
const { MetadataCollectorPlugin } = require('@coana-tech/next-plugin-metadata-extractor');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      config.plugins.push(new MetadataCollectorPlugin({ dev }));
    }
    return config;
  }
};

module.exports = nextConfig;
```

2. Define static metadata in your pages:

```tsx
// app/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "My Page",
  description: "My Page Description",
};
```

See the [Next.js documentation](https://nextjs.org/docs/app/building-your-application/optimizing/metadata) for more information about defining metadata.

**NOTE:** The plugin does not support dynamically computed metadata.


3. Start the development server:

```bash
npm run dev
```

4. Fetch the `metadata.json` file from the `public` directory:

```tsx
// app/components/Metadata.tsx
import { useState, useEffect } from 'react';
import type { PageMetadata } from '@coana-tech/next-plugin-metadata-extractor';

function Component() {
  const [metadata, setMetadata] = useState<PageMetadata[]>([]);

  useEffect(() => {
    fetch('/metadata.json')
      .then(res => res.json())
      .then(setMetadata);
  }, []);

  return (
    <div>
      {metadata.map(item => (
        <div key={item.pathname}>{item.metadata.title}</div>
      ))}
    </div>
  );
}
```

## Configuration

The MetadataCollectorPlugin accepts the following configuration options:


| Option | Description | Default |
|--------|-------------|---------|
| `outputPath` | Set output path for the metadata file, must end with `.json` | `public/metadata.json` |
| `dir` | Set directory to search for page files | `app` |
| `files` | Set files to collect from metadata, supports glob patterns | `["**/page.tsx", "**/page.ts", "**/page.jsx", "**/page.js"]` |
| `keys` | Set keys to collect from metadata | `['title', 'description', 'keywords', 'category']` |
| `dev` | Enable development mode with debouncing | `false` |
| `debounceTime` | Debounce time in milliseconds for dev mode updates | `1000` |


## Advanced Usage

### Server-side usage

If you don't want the metadata file to be public, set the `outputPath` to a server directory and create a server action to fetch the metadata.

Here's an example:

```tsx
// next.config.js
const nextConfig = {
  webpack: (config, { isServer, dev }) => {
    isServer && config.plugins.push(new MetadataCollectorPlugin(
      { 
        dev, 
        outputPath: 'src/actions/metadata.json', // <-- output path
      }
    ));
    return config;
  }
};

// src/actions/metadata.ts
import metadata from './metadata.json';
export async function getMetadata() {
  const { userId } = auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return metadata;
} 

```

### Adding Fuzzy Search

You can enhance the search functionality with fuzzy matching using libraries like Fuse.js. Here's an example:

```typescript
import Fuse from 'fuse.js';
import type { PageMetadata } from '@coana-tech/next-plugin-metadata-extractor';

function FuzzySearch() {
  const [fuse, setFuse] = useState<Fuse<PageMetadata> | null>(null);
  const [results, setResults] = useState<PageMetadata[]>([]);

  useEffect(() => {
    // Load metadata and initialize Fuse.js
    fetch('/metadata.json')
      .then(res => res.json())
      .then(data => {
        setFuse(new Fuse(data, {
          keys: ['metadata.title', 'metadata.description'],
          threshold: 0.3,
          distance: 100
        }));
      });
  }, []);

  const handleSearch = useCallback((term: string) => {
    if (!fuse || !term.trim()) {
      setResults([]);
      return;
    }
    setResults(fuse.search(term).map(result => result.item));
  }, [fuse]);

  return (
    <div>
      <input type="text" onChange={e => handleSearch(e.target.value)} />
      <ul>
        {results.map(result => (
          <li key={result.pathname}>{result.metadata.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

See [Fuse.js documentation](https://fusejs.io/) for more configuration options.

## Compatibility

This plugin is tested with Next.js 14.

## License

MIT