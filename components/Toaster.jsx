"use client";

import React from "react";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

export default function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={`
            min-w-[320px] max-w-md p-4 rounded-lg shadow-2xl 
            bg-white border border-gray-200
            transform transition-all duration-300 ease-out
            animate-in slide-in-from-top-5
            ${t.variant === 'destructive' ? 'border-l-4 border-l-red-500' : ''}
            ${t.variant === 'default' ? 'border-l-4 border-l-[#03234b]' : ''}
            hover:shadow-xl cursor-pointer
          `}
          onClick={() => {
            if (t.action?.onClick) {
              t.action.onClick();
            }
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {t.title && (
                <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  {t.title}
                </div>
              )}
              {t.description && (
                <div className="text-sm text-gray-600 leading-relaxed">
                  {t.description}
                </div>
              )}
              {t.action && (
                <div className="mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (t.action.onClick) t.action.onClick();
                      dismiss(t.id);
                    }}
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-[#03234b] rounded-md hover:bg-[#03234b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#03234b] focus:ring-offset-2"
                  >
                    {t.action.label || "View"}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismiss(t.id);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}