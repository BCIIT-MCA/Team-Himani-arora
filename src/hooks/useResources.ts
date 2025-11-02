import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Resource = Database["public"]["Tables"]["resources"]["Row"];

interface UseResourcesState {
  resources: Resource[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
  selectedType: string | null;
}

interface ResourcesByType {
  articles: Resource[];
  worksheets: Resource[];
  audio: Resource[];
  video: Resource[];
  external: Resource[];
}

export const useResources = () => {
  const [state, setState] = useState<UseResourcesState>({
    resources: [],
    loading: true,
    error: null,
    searchQuery: "",
    selectedCategory: null,
    selectedType: null,
  });

  const { toast } = useToast();

  const fetchResources = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      let query = supabase
        .from("resources")
        .select("*")
        .eq("is_active", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });

      // Apply type filter
      if (state.selectedType) {
        query = query.eq("type", state.selectedType);
      }

      // Apply category filter
      if (state.selectedCategory) {
        query = query.eq("category", state.selectedCategory);
      }

      // Apply search filter
      if (state.searchQuery) {
        query = query.or(
          `title.ilike.%${state.searchQuery}%,description.ilike.%${state.searchQuery}%,category.ilike.%${state.searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setState((prev) => ({
        ...prev,
        resources: data || [],
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching resources:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to fetch resources",
        loading: false,
      }));

      toast({
        title: "Error Loading Resources",
        description: "Failed to load resources. Please try again.",
        variant: "destructive",
      });
    }
  }, [state.selectedType, state.selectedCategory, state.searchQuery, toast]);

  const getResourcesByType = useCallback((): ResourcesByType => {
    return {
      articles: state.resources.filter((r) => r.type === "article"),
      worksheets: state.resources.filter((r) => r.type === "worksheet"),
      audio: state.resources.filter((r) => r.type === "audio"),
      video: state.resources.filter((r) => r.type === "video"),
      external: state.resources.filter((r) => r.type === "external"),
    };
  }, [state.resources]);

  const getFeaturedResources = useCallback((): Resource[] => {
    return state.resources.filter((r) => r.featured);
  }, [state.resources]);

  const getResourcesByCategory = useCallback(
    (category: string): Resource[] => {
      return state.resources.filter((r) => r.category === category);
    },
    [state.resources]
  );

  const getAllCategories = useCallback((): string[] => {
    const categories = [...new Set(state.resources.map((r) => r.category))];
    return categories.sort();
  }, [state.resources]);

  const searchResources = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setTypeFilter = useCallback((type: string | null) => {
    setState((prev) => ({ ...prev, selectedType: type }));
  }, []);

  const setCategoryFilter = useCallback((category: string | null) => {
    setState((prev) => ({ ...prev, selectedCategory: category }));
  }, []);

  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      searchQuery: "",
      selectedCategory: null,
      selectedType: null,
    }));
  }, []);

  const refreshResources = useCallback(() => {
    fetchResources();
  }, [fetchResources]);

  const trackResourceView = useCallback(async (resourceId: string) => {
    try {
      // This could be expanded to track analytics
      console.log("Resource viewed:", resourceId);
    } catch (error) {
      console.error("Error tracking resource view:", error);
    }
  }, []);

  const trackResourceDownload = useCallback(async (resourceId: string) => {
    try {
      // This could be expanded to track analytics
      console.log("Resource downloaded:", resourceId);
    } catch (error) {
      console.error("Error tracking resource download:", error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return {
    // State
    resources: state.resources,
    loading: state.loading,
    error: state.error,
    searchQuery: state.searchQuery,
    selectedCategory: state.selectedCategory,
    selectedType: state.selectedType,

    // Computed values
    resourcesByType: getResourcesByType(),
    featuredResources: getFeaturedResources(),
    categories: getAllCategories(),

    // Actions
    searchResources,
    setTypeFilter,
    setCategoryFilter,
    clearFilters,
    refreshResources,
    getResourcesByCategory,
    trackResourceView,
    trackResourceDownload,
  };
};
