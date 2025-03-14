import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Category = "All" | "C" | "B" | "A" | "S" | "SS";

interface RankingFiltersProps {
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
}

const categoryStyles = {
  All: "bg-gray-200 text-gray-700 hover:bg-gray-300",
  C: "bg-gray-500 text-white hover:bg-gray-600",
  B: "bg-blue-500 text-white hover:bg-blue-600",
  A: "bg-green-500 text-white hover:bg-green-600",
  S: "bg-amber-500 text-white hover:bg-amber-600",
  SS: "bg-red-500 text-white hover:bg-red-600",
};

const RankingFilters = ({ selectedCategory, onSelectCategory }: RankingFiltersProps) => {
  const categories: Category[] = ["All", "C", "B", "A", "S", "SS"];

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center">
      <div className="text-sm font-medium text-gray-700 mb-2 sm:mb-0 sm:mr-4">
        Filter by Category:
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant="ghost"
            className={cn(
              "px-3 py-1 h-8 rounded-full text-sm font-medium",
              category === selectedCategory
                ? categoryStyles[category]
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default RankingFilters;
