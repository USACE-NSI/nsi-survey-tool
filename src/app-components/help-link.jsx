import React from "react";

/**
 * HelpLink component for USACE applications.
 *
 * @param {string} id - The specific link ID for the HEC fwlink service.
 * @param {string} title - The tooltip text that appears on hover.
 * @returns {JSX.Element}
 */
export default function HelpLink({ id, title = "Click for documentation" }) {
  const fwLinkBase = "https://army.mil";

  return (
    <a
      href={`${fwLinkBase}${id}`}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="gw-inline-flex gw-items-center gw-text-slate-400 hover:gw-text-blue-600 gw-transition-colors gw-ml-1"
      aria-label={title}
    >
      <i className="mdi mdi-help-circle-outline gw-text-base" />
    </a>
  );
}
