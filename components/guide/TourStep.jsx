"use client";

export default function TourStep({ index, total }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
      Step {index + 1} of {total}
    </p>
  );
}
