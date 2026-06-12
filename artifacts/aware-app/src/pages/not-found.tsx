import { AppLayout } from "@/components/aware/AppLayout";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <AppLayout activeHref="">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 12,
        }}
      >
        <AlertCircle size={40} style={{ color: "var(--proof-red)" }} />
        <h1
          style={{ fontSize: 22, fontWeight: 700, color: "var(--proof-text-primary)", margin: 0 }}
        >
          404 Page Not Found
        </h1>
        <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", margin: 0 }}>
          Did you forget to add the page to the router?
        </p>
      </div>
    </AppLayout>
  );
}
