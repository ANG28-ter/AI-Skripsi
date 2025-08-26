import React from "react";

const LoadingParagraphs = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="h-5 bg-zinc-700/50 animate-pulse rounded w-full" />
      ))}
    </div>
  );
};

export default LoadingParagraphs;
