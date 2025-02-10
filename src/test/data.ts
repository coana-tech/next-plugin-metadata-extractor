export const jsxPage = `
import React from "react";

export const metadata = {
  title: "Hello World",
  description: "Hello World",
  keywords: ["hello", "world"],
  category: "test",
  applicationName: "Hello World",
  generator: "Next.js",
};

export default async function Page() {
  return (
    <div>
      <h1>Hello</h1>
      <p>World</p>
    </div>
  );
}
`;

export const tsxPage = `
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hello World",
  description: "Hello World",
  keywords: ["hello", "world"],
  category: "test",
  applicationName: "Hello World",
  generator: "Next.js",
};

export default async function Page({
  props,
}: {
  props: { name: string };
}) {
  return (
    <div>
      <h1>Hello</h1>
      <p>{props.name}</p>
    </div>
  );
}
`;

export const jsPage = `
export const metadata = {
  title: "Test Page",
  description: "Test Description",
  keywords: ["test", "page"],
  category: "test",
};

export default async function Page() {
  return "Hello World";
}
`;

export const tsPage = `
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test Page",
  description: "Test Description",
  keywords: ["test", "page"],
  category: "test",
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;

  return slug;
}
`;

export const tsxPageDynamic = `
import { Metadata } from "next";
import React from "react";
import { z } from "zod";

type Props = {
  params: {
    id: string;
  };
};

function fetchPage(id: string): Promise<{ name: string; description: string }> {
  throw new Error("Function not implemented.");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const validId = z.string().uuid("Invalid id").safeParse(params.id).success;

  if (!validId) {
    return {
      title: "Invalid Page",
      description: "Invalid page id",
    };
  }

  const data = await fetchPage(params.id);
  return {
    title: data?.name ?? "Page",
    description: data?.description ?? "Page description",
  };
}

export default async function Page() {
  return <div>Hello World</div>;
}
`;
