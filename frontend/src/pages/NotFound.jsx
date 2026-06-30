import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
      <div className="text-7xl font-bold text-[#1a2526]">404</div>
      <p className="text-[#7c8d8e] mt-2">Page not found</p>
      <Link to="/" className="mt-4 text-[#2dd4bf] underline">
        Return to Dashboard
      </Link>
    </div>
  );
}
