"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function GuideSearch({ value, onChange }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        aria-label="Search guides"
        type="search"
        placeholder="Search guides..."
        className="h-11 rounded-lg border-slate-200 bg-white pl-10"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
