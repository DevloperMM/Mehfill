// This page will be rendered when an error is thrown in the profile/[username] segment.
// It will catch errors thrown by the ProfilePage component and display an error message.

"use client"; // Error boundaries must be Client Components

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center px-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="flex flex-col items-center">
          <AlertTriangle className="text-destructive w-12 h-12 mb-2" />
          <CardTitle className="text-xl text-center">
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            We encountered an unexpected error. Try refreshing the page or come
            back later.
          </p>
          <Button variant="default" onClick={reset}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
