/**
 * Chat Container Component
 * Auto-scrolling container for chat messages
 */

'use client'

import { useRef, useEffect } from "react";

interface ChatContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ChatContainer({ children, className }: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  });

  return (
    <div
      ref={scrollRef}
      className={`flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin ${className || ''}`}
    >
      {children}
    </div>
  );
}