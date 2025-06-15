// This file is used to display a loading state while the profile data is being fetched

"use client"; // Loading states must be Client Components

import { LoaderCircle } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem) w-full">
      <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
