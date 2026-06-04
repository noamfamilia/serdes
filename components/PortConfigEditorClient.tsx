"use client";

import dynamic from "next/dynamic";
import { EditorSkeleton } from "@/components/EditorSkeleton";

const PortConfigEditor = dynamic(
  () =>
    import("@/components/PortConfigEditor").then(
      (module) => module.PortConfigEditor,
    ),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  },
);

export function PortConfigEditorClient() {
  return <PortConfigEditor />;
}
