"use client";

import { useEffect } from "react";

/** The public navbar is `position: fixed`. Admin / doctor pages measure its real
 *  height (it changes with screen size and scroll) and expose it as --panel-top,
 *  so the panel header, sidebar and content start just below it. */
export function usePanelOffset() {
  useEffect(() => {
    const root = document.documentElement;
    const nav = document.querySelector<HTMLElement>(".hospital-navbar");
    const set = () => root.style.setProperty("--panel-top", `${nav ? nav.offsetHeight : 0}px`);
    root.classList.add("is-panel");
    set();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(set) : null;
    if (nav && ro) ro.observe(nav);
    window.addEventListener("resize", set);
    const timer = window.setTimeout(set, 800); // after the navbar's entrance animation
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", set);
      window.clearTimeout(timer);
      root.style.removeProperty("--panel-top");
      root.classList.remove("is-panel");
    };
  }, []);
}
