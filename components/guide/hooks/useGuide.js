"use client";

import { useMemo, useState } from "react";
import { GUIDE_CATEGORIES } from "@/components/guide/tour-config";

const normalize = (value) => String(value || "").trim().toLowerCase();

export function useGuide(progress) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    const query = normalize(searchQuery);

    return GUIDE_CATEGORIES.map((category) => {
      const guides = category.guides
        .map((guide) => ({
          ...guide,
          completed: Boolean(progress?.[guide.id]?.completed),
        }))
        .filter((guide) => {
          if (!query) return true;
          return [
            guide.title,
            guide.description,
            guide.difficulty,
            category.title,
          ].some((value) => normalize(value).includes(query));
        });

      return {
        ...category,
        guides,
      };
    }).filter((category) => category.guides.length > 0);
  }, [progress, searchQuery]);

  const hasResults = filteredCategories.length > 0;

  return {
    searchQuery,
    setSearchQuery,
    filteredCategories,
    hasResults,
  };
}
