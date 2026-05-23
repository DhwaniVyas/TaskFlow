import React from "react";
import { useLocation } from "react-router-dom";

export default function ComingSoonTab() {
  const location = useLocation();
  const lastSegment = location.pathname.split("/").filter(Boolean).pop() || "module";
  const tabName = lastSegment;

  return (
    <div className="card p-8 text-center">
      <h2 className="text-2xl font-semibold text-[#082F38]">{tabName.charAt(0).toUpperCase() + tabName.slice(1)}</h2>
      <p className="text-[#5B9EA8] mt-2">Coming Soon</p>
      <p className="text-sm text-[#5B9EA8] mt-4">
        This workspace is reserved for future module expansion and is intentionally kept separate for scalable navigation.
      </p>
    </div>
  );
}
