import React, { useState, useEffect } from "react";
import MapComponent from "../../app-components/map";
import SurveyTray from "../../app-components/survey-tray";

export default function Survey() {
  const [trayWidth, setTrayWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const minWidth = 300;
      const maxWidth = window.innerWidth / 3;
      // Clamp the width between 300 and 1/3 of the screen
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);

      setTrayWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="gw-flex gw-h-screen">
      <div
        style={{ width: `${trayWidth}px`, position: "relative" }}
        className="gw-flex-none gw-border-r"
      >
        <SurveyTray />

        {/* The clickable grabber */}
        <div
          onMouseDown={() => setIsResizing(true)}
          style={{
            position: "absolute",
            top: 0,
            right: "-4px",
            width: "8px",
            height: "100%",
            cursor: "col-resize",
            zIndex: 10,
            backgroundColor: isResizing ? "#2d96ff" : "transparent",
          }}
        />
      </div>

      <div className="gw-flex-1">
        <MapComponent />
      </div>
    </div>
  );
}
