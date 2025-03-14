import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CategoryBadgeProps = {
  category: "C" | "B" | "A" | "S" | "SS";
  className?: string;
};

const categoryColors = {
  C: "bg-gray-500 hover:bg-gray-600",
  B: "bg-blue-500 hover:bg-blue-600",
  A: "bg-green-500 hover:bg-green-600",
  S: "bg-amber-500 hover:bg-amber-600",
  SS: "bg-red-500 hover:bg-red-600",
};

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className }) => {
  return (
    <Badge
      className={cn(
        "text-white font-medium",
        categoryColors[category],
        className
      )}
    >
      {category}
    </Badge>
  );
};

export default CategoryBadge;
