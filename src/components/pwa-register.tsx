"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker after window load to avoid delaying initial page load
      const handleLoad = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("ChequeManager PWA ServiceWorker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.error("ChequeManager PWA ServiceWorker registration failed:", error);
          });
      };

      if (document.readyState === "complete") {
        handleLoad();
      } else {
        window.addEventListener("load", handleLoad);
        return () => window.removeEventListener("load", handleLoad);
      }
    }
  }, []);

  return null;
}
