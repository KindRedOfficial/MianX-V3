"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        margin: 0,
        backgroundColor: "#09090b",
        color: "#a1a1aa",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
          <h2 style={{ color: "#f4f4f5", marginBottom: 8, fontSize: 20 }}>Something went wrong!</h2>
          <p style={{ marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>{error.message || "An unexpected error occurred."}</p>
          <button
            onClick={reset}
            style={{ padding: "10px 24px", borderRadius: 8, border: "none", backgroundColor: "#6366f1", color: "#fff", fontSize: 14, cursor: "pointer" }}
          >Try again</button>
        </div>
      </body>
    </html>
  );
}
