import React, { useState } from "react";
import { dummyCategories } from "@/lib/data";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Slider } from "./ui/slider";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";

export interface FilterSidebarProps {
  selectedCategories?: string[];
  onCategoryToggle?: (categorySlug: string, checked: boolean) => void;
  priceRange?: [number, number];
  onPriceRangeChange?: (range: [number, number]) => void;
  onApplyFilters?: () => void;
}

export function FilterSidebar({
  selectedCategories,
  onCategoryToggle,
  priceRange: propPriceRange,
  onPriceRangeChange,
  onApplyFilters,
}: FilterSidebarProps = {}) {
  const [internalPriceRange, setInternalPriceRange] = useState<[number, number]>([0, 2000]);
  const [internalCategories, setInternalCategories] = useState<string[]>([]);

  const activePriceRange = propPriceRange !== undefined ? propPriceRange : internalPriceRange;
  const activeCategories = selectedCategories !== undefined ? selectedCategories : internalCategories;

  const handlePriceChange = (val: number[]) => {
    const range: [number, number] = [val[0], val[1]];
    if (onPriceRangeChange) {
      onPriceRangeChange(range);
    } else {
      setInternalPriceRange(range);
    }
  };

  const handleCategoryToggle = (slug: string, checked: boolean) => {
    if (onCategoryToggle) {
      onCategoryToggle(slug, checked);
    } else {
      if (checked) {
        setInternalCategories((prev) => [...prev, slug]);
      } else {
        setInternalCategories((prev) => prev.filter((item) => item.toLowerCase() !== slug.toLowerCase()));
      }
    }
  };

  return (
    <div className="w-full space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Categories</h3>
        <div className="space-y-3">
          {dummyCategories.map((category) => {
            const slug = category.slug.toLowerCase();
            const isChecked = activeCategories.map((c) => c.toLowerCase()).includes(slug);
            return (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${category.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleCategoryToggle(slug, !!checked)}
                />
                <Label
                  htmlFor={`cat-${category.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {category.name}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Price Range</h3>
          <span className="text-sm text-muted-foreground">
            ${activePriceRange[0]} - ${activePriceRange[1]}
          </span>
        </div>
        <Slider
          defaultValue={[0, 2000]}
          max={2000}
          step={10}
          value={activePriceRange}
          onValueChange={handlePriceChange}
          className="mt-6"
        />
      </div>

      <Button className="w-full" onClick={onApplyFilters}>
        Apply Filters
      </Button>
    </div>
  );
}
