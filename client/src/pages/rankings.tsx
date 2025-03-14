import { useState } from "react";
import TabNavigation from "@/components/layout/tab-navigation";
import RankingSelector from "@/components/ranking/ranking-selector";
import RankingFilters from "@/components/ranking/ranking-filters";
import RankingTable from "@/components/ranking/ranking-table";
import MatchForm from "@/components/matches/match-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Rankings() {
  const [selectedRankingId, setSelectedRankingId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"All" | "C" | "B" | "A" | "S" | "SS">("All");
  const [isMatchFormOpen, setIsMatchFormOpen] = useState(false);

  const handleSelectRanking = (rankingId: number) => {
    setSelectedRankingId(rankingId);
  };

  const handleSelectCategory = (category: "All" | "C" | "B" | "A" | "S" | "SS") => {
    setSelectedCategory(category);
  };

  return (
    <>
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <RankingSelector 
          selectedRanking={selectedRankingId} 
          onSelectRanking={handleSelectRanking} 
        />
        
        <RankingFilters 
          selectedCategory={selectedCategory} 
          onSelectCategory={handleSelectCategory} 
        />
        
        <RankingTable 
          rankingId={selectedRankingId}
          category={selectedCategory === "All" ? null : selectedCategory}
        />
        
        {/* New Match Button */}
        <div className="fixed bottom-24 right-6 sm:bottom-20 sm:right-10 z-10">
          <Button 
            size="icon"
            className="h-14 w-14 rounded-full bg-amber-500 hover:bg-amber-600 shadow-lg"
            onClick={() => setIsMatchFormOpen(true)}
          >
            <Plus size={24} />
          </Button>
        </div>
        
        {/* Match Form Dialog */}
        <MatchForm 
          isOpen={isMatchFormOpen} 
          onClose={() => setIsMatchFormOpen(false)}
          selectedRankingId={selectedRankingId || undefined}
        />
      </div>
    </>
  );
}
