"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { blogSearchService } from "../services/blog-search.service";
import type { BlogPost } from "@/lib/types";
import { Search } from "lucide-react";

interface BlogSearchProps {
  onResults: (posts: BlogPost[]) => void;
  onSearching?: (searching: boolean) => void;
}

export function BlogSearch({ onResults, onSearching }: BlogSearchProps) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    onSearching?.(true);

    try {
      const results = await blogSearchService.searchPosts(query);
      onResults(results);
    } catch (error) {
      console.error("Search error:", error);
      onResults([]);
    } finally {
      setSearching(false);
      onSearching?.(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    blogSearchService.searchPosts("").then(onResults);
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher dans le centre d'aide..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button type="submit" disabled={searching}>
        {searching ? "Recherche..." : "Rechercher"}
      </Button>
      {query && (
        <Button type="button" variant="outline" onClick={handleClear}>
          Effacer
        </Button>
      )}
    </form>
  );
}

