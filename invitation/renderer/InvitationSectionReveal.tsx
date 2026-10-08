"use client";

import { useEffect, useRef, type ReactNode } from "react";

type InvitationSectionRevealProps = {
  children: ReactNode;
};

export function InvitationSectionReveal({
  children,
}: InvitationSectionRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const items = Array.from(
      root.querySelectorAll<HTMLElement>(".invitation-reveal-item"),
    );

    if (!items.length) {
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    root.classList.add("is-reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.16,
      },
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const particleLayers = Array.from(
      root.querySelectorAll<HTMLElement>(".invitation-particles"),
    );

    if (!particleLayers.length) {
      return;
    }

    const setDocumentState = () => {
      root.classList.toggle("is-document-hidden", document.hidden);
    };

    setDocumentState();
    document.addEventListener("visibilitychange", setDocumentState);

    if (!("IntersectionObserver" in window)) {
      return () => {
        document.removeEventListener("visibilitychange", setDocumentState);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle(
            "is-particle-layer-paused",
            !entry.isIntersecting,
          );
        });
      },
      {
        rootMargin: "18% 0px 18% 0px",
        threshold: 0,
      },
    );

    particleLayers.forEach((layer) => observer.observe(layer));

    return () => {
      document.removeEventListener("visibilitychange", setDocumentState);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="invitation-reveal-root" ref={rootRef}>
      {children}
    </div>
  );
}
