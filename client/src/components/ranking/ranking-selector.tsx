import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Ranking } from "@shared/schema";

interface RankingSelectorProps {
  selectedRanking: number | null;
  onSelectRanking: (rankingId: number) => void;
}

const RankingSelector = ({ selectedRanking, onSelectRanking }: RankingSelectorProps) => {
  const { data: rankings, isLoading } = useQuery<Ranking[]>({
    queryKey: ['/api/rankings'],
  });

  const handleValueChange = (value: string) => {
    onSelectRanking(parseInt(value));
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <Label className="block text-sm font-medium text-gray-700 mb-1">Select Ranking:</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // If no rankings available
  if (!rankings || rankings.length === 0) {
    return (
      <div className="mb-6">
        <Label className="block text-sm font-medium text-gray-700 mb-1">Select Ranking:</Label>
        <div className="p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 text-sm">
          No rankings available
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <Label htmlFor="ranking-selector" className="block text-sm font-medium text-gray-700 mb-1">
        Select Ranking:
      </Label>
      <Select value={selectedRanking?.toString()} onValueChange={handleValueChange}>
        <SelectTrigger id="ranking-selector" className="w-full">
          <SelectValue placeholder="Select a ranking" />
        </SelectTrigger>
        <SelectContent>
          {rankings.map((ranking) => (
            <SelectItem key={ranking.id} value={ranking.id.toString()}>
              {ranking.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RankingSelector;
