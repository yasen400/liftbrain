"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RequestAdjustmentButtonProps {
  className?: string;
}

type Status = "idle" | "loading" | "success" | "error";

export function RequestAdjustmentButton({ className }: RequestAdjustmentButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleRequest = async () => {
    if (status === "loading") return;

    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/ai/program", {
        method: "POST",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const errorMessage = typeof payload?.error === "string" ? payload.error : "Unable to contact the AI coach.";
        throw new Error(errorMessage);
      }

      setStatus("success");
      setMessage("Coach is preparing a fresh adjustment. The page will refresh once it is ready.");
      router.refresh();
    } catch (error) {
      const fallback = error instanceof Error ? error.message : "Request failed unexpectedly.";
      setStatus("error");
      setMessage(fallback);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleRequest}
        disabled={status === "loading"}
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
      >
        {status === "loading" ? "Requesting..." : "Request fresh adjustment"}
      </button>
      {message && (
        <p className={`mt-2 text-sm ${status === "error" ? "text-red-600" : "text-emerald-800"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
