/**
 * UC-19 필터 메타 — GET /api/v1/meta/search-filters
 * @see docs/BACKEND_API.md §18
 */

export type SearchFiltersRegionsDto = {
  columns: { left: string[]; right: string[] };
  districtsByProvince: Record<string, string[]>;
};

export type SearchFiltersKeywordGroupDto = {
  label: string;
  options: string[];
};

export type SearchFiltersResponseDto = {
  regions: SearchFiltersRegionsDto;
  spaceTypes: string[];
  keywordGroups: SearchFiltersKeywordGroupDto[];
};
