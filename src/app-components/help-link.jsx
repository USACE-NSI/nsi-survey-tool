import React, { useState } from "react";

/**
 * HelpLink component for USACE applications.
 *
 * Renders a help-circle icon that links to documentation and shows a styled,
 * instant-appearing tooltip on hover/focus. Visibility is driven by component
 * state with inline styles so it does not depend on which Tailwind utilities
 * happen to be present in the prebuilt groundwork stylesheet.
 *
 * @param {string} id - The specific link ID for the HEC fwlink service.
 * @param {string} title - The tooltip text that appears on hover.
 * @param {"top"|"bottom"} placement - Which side of the icon the tooltip opens
 *   on. Use "bottom" when the icon sits in an overflow-hidden container that
 *   would clip an upward tooltip.
 * @returns {JSX.Element}
 */
export default function HelpLink({
  id,
  title = "Click for documentation",
  placement = "top",
}) {
  const fwLinkBase = "https://army.mil";
  const [open, setOpen] = useState(false);
  const isBottom = placement === "bottom";

  const tooltipStyle = {
    position: "absolute",
    ...(isBottom
      ? { top: "100%", marginTop: "8px" }
      : { bottom: "100%", marginBottom: "8px" }),
    left: "50%",
    transform: "translateX(-50%)",
    width: "16rem",
    maxWidth: "80vw",
    padding: "6px 10px",
    borderRadius: "6px",
    backgroundColor: "#1e293b", // slate-800
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: "normal",
    textTransform: "none",
    textAlign: "left",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3)",
    zIndex: 50,
    pointerEvents: "none",
    whiteSpace: "normal",
  };

  const arrowStyle = {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    border: "4px solid transparent",
    ...(isBottom
      ? { bottom: "100%", borderBottomColor: "#1e293b" }
      : { top: "100%", borderTopColor: "#1e293b" }), // slate-800
  };

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: "0.25rem" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <a
        href={`${fwLinkBase}${id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="gw-inline-flex gw-items-center gw-text-slate-400 hover:gw-text-blue-600 gw-transition-colors"
        aria-label={title}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <i className="mdi mdi-help-circle-outline gw-text-base" />
      </a>
      {open && (
        <span role="tooltip" style={tooltipStyle}>
          {title}
          <span style={arrowStyle} />
        </span>
      )}
    </span>
  );
}
