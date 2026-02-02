"use client";

import { useMunicipality } from "../MunicipalityContext";
import { SearchBox } from "@/components/ui/SearchBox";

interface SearchBoxBlockProps {
  props: {
    placeholder?: string;
  };
}

export function SearchBoxBlock({ props }: SearchBoxBlockProps) {
  const { municipalityId } = useMunicipality();
  const placeholder = props.placeholder || "キーワードで検索";

  return (
    <div className="search-box-block mb-8">
      <SearchBox
        municipalityId={municipalityId}
        placeholder={placeholder}
      />
    </div>
  );
}

export default SearchBoxBlock;
