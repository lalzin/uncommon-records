"use client";

// Lightweight imperative toast — port of static/js/toast.js (no provider needed).
type ToastType = "success" | "error" | "info" | "warning";

const COLORS: Record<ToastType, string> = {
  success: "rgba(100,220,100,.9)",
  error: "#ff8a8a",
  info: "rgba(100,180,255,.9)",
  warning: "var(--color-gold)",
};

function show(message: string, type: ToastType = "info") {
  if (typeof document === "undefined") return;
  let root = document.getElementById("ur-toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "ur-toast-root";
    Object.assign(root.style, {
      position: "fixed",
      bottom: "1.5rem",
      right: "1.5rem",
      zIndex: "9999",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    } as CSSStyleDeclaration);
    document.body.appendChild(root);
  }
  const el = document.createElement("div");
  el.textContent = message;
  Object.assign(el.style, {
    padding: "0.75rem 1.1rem",
    borderRadius: "10px",
    background: "var(--color-surface-2, #141312)",
    border: `1px solid ${COLORS[type]}`,
    color: "var(--color-text, #f0ebe3)",
    fontSize: "0.85rem",
    fontFamily: "var(--font-body, sans-serif)",
    boxShadow: "0 8px 28px rgba(0,0,0,.4)",
    opacity: "0",
    transform: "translateY(8px)",
    transition: "all .2s ease",
  } as CSSStyleDeclaration);
  root.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => el.remove(), 220);
  }, 3200);
}

export const toast = {
  success: (m: string) => show(m, "success"),
  error: (m: string) => show(m, "error"),
  info: (m: string) => show(m, "info"),
  warning: (m: string) => show(m, "warning"),
};

export const showToast = (m: string, type: ToastType = "info") => show(m, type);
