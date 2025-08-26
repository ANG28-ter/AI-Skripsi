import React from "react";

export default function LoadingDots() {
  return (
    <div className="flex items-center justify-start pl-3 h-10">
      <div className="flex space-x-1">
        <span className="w-2.5 h-2.5 bg-gradient-to-r from-primary to-cyan-400 rounded-full animate-bounce [animation-delay:0s]" />
        <span className="w-2.5 h-2.5 bg-gradient-to-r from-primary to-cyan-400 rounded-full animate-bounce [animation-delay:0.1s]" />
        <span className="w-2.5 h-2.5 bg-gradient-to-r from-primary to-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
      </div>
    </div>
  );
}
