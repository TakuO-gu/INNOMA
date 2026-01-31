"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Label } from "@/components/dads/Label/Label";
import { SupportText } from "@/components/dads/SupportText/SupportText";
import { useMunicipality } from "../MunicipalityContext";

interface District {
  id: string;
  name: string;
  value: string;
  areas: string[];
}

interface DistrictVariable {
  variableName: string;
  districts: District[];
  defaultValue?: string;
}

interface DistrictSelectorProps {
  props: Record<string, unknown>;
}

// 地区選択のlocalStorageキー
const DISTRICT_STORAGE_KEY = "innoma_selected_districts";

// ごみの種類ごとのラベル定義
const GOMI_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  moeru_gomi_shushuhi: {
    label: "燃やせるごみ",
    icon: "🔥",
    color: "bg-orange-50 border-orange-200 text-orange-800",
  },
  moenai_gomi_shushuhi: {
    label: "燃やせないごみ",
    icon: "🗑️",
    color: "bg-gray-50 border-gray-300 text-gray-800",
  },
  shigen_gomi_shushuhi: {
    label: "資源ごみ",
    icon: "♻️",
    color: "bg-green-50 border-green-200 text-green-800",
  },
};

/**
 * 地区セレクター コンポーネント
 * 地区依存変数の値を選択するためのセレクトボックス（検索機能付き）
 */
export function DistrictSelectorBlock({ props }: DistrictSelectorProps) {
  const label = (props.label as string) || "地区を選択";
  const placeholder = props.placeholder as string | undefined;
  const helpText = props.helpText as string | undefined;
  const variableGroup = props.variableGroup as string | undefined;
  const variableName = props.variableName as string | undefined;
  const { municipalityId } = useMunicipality();

  const [allVariables, setAllVariables] = useState<Record<string, DistrictVariable>>({});
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 検索機能用
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 全地区名のフラットリスト（検索用）
  const allAreas = useMemo(() => {
    const areas: { area: string; districtId: string; districtName: string }[] = [];
    for (const district of districts) {
      for (const area of district.areas) {
        areas.push({
          area,
          districtId: district.id,
          districtName: district.name,
        });
      }
    }
    return areas;
  }, [districts]);

  // 検索結果
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allAreas.filter(
      (item) =>
        item.area.toLowerCase().includes(query) ||
        item.districtName.toLowerCase().includes(query)
    );
  }, [searchQuery, allAreas]);

  // 地区データを取得
  useEffect(() => {
    async function loadDistricts() {
      try {
        setLoading(true);
        setError(null);

        // APIから地区データを取得（全変数データ含む）
        const varName = variableName || `${variableGroup}_area`;
        const response = await fetch(
          `/api/districts/${municipalityId}/${varName}?includeAll=true`
        );

        if (!response.ok) {
          if (response.status === 404) {
            setDistricts([]);
            return;
          }
          throw new Error("地区データの取得に失敗しました");
        }

        const data = await response.json();
        setDistricts(data.districts || []);

        // 全変数データがある場合は保存
        if (data.allVariables) {
          setAllVariables(data.allVariables);
        }

        // localStorageから選択済みの地区を復元
        const stored = localStorage.getItem(DISTRICT_STORAGE_KEY);
        if (stored) {
          try {
            const storedDistricts = JSON.parse(stored);
            const key = variableGroup || variableName || "";
            if (storedDistricts[municipalityId]?.[key]) {
              setSelectedDistrictId(storedDistricts[municipalityId][key]);
            }
          } catch {
            // パース失敗は無視
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    }

    if (municipalityId) {
      loadDistricts();
    }
  }, [municipalityId, variableGroup, variableName]);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 地区選択時の処理
  const handleSelectDistrict = (districtId: string) => {
    setSelectedDistrictId(districtId);
    setSearchQuery("");
    setIsDropdownOpen(false);

    // localStorageに保存
    const key = variableGroup || variableName || "";
    const stored = localStorage.getItem(DISTRICT_STORAGE_KEY);
    let storedDistricts: Record<string, Record<string, string>> = {};

    if (stored) {
      try {
        storedDistricts = JSON.parse(stored);
      } catch {
        // パース失敗は初期化
      }
    }

    if (!storedDistricts[municipalityId]) {
      storedDistricts[municipalityId] = {};
    }
    storedDistricts[municipalityId][key] = districtId;

    localStorage.setItem(DISTRICT_STORAGE_KEY, JSON.stringify(storedDistricts));

    // カスタムイベントを発火して、同じページ内の他のコンポーネントに通知
    window.dispatchEvent(
      new CustomEvent("districtChanged", {
        detail: {
          municipalityId,
          variableGroup,
          variableName,
          districtId,
        },
      })
    );
  };

  // 選択された地区の情報を取得
  const selectedDistrict = districts.find((d) => d.id === selectedDistrictId);

  // 選択された地区の各変数の値を取得
  const getVariableValue = (varName: string): string | null => {
    if (!selectedDistrictId || !allVariables[varName]) return null;
    const variable = allVariables[varName];
    const district = variable.districts.find((d) => d.id === selectedDistrictId);
    return district?.value || variable.defaultValue || null;
  };

  return (
    <div className="district-selector my-6">
      <div className="mb-2">
        <Label htmlFor={`district-search-${variableGroup || variableName}`}>
          {label}
        </Label>
      </div>

      {helpText && (
        <SupportText className="mb-2">{helpText}</SupportText>
      )}

      {loading ? (
        <div className="animate-pulse bg-gray-200 h-14 rounded-lg" />
      ) : error ? (
        <p className="text-error-1 text-sm">{error}</p>
      ) : districts.length === 0 ? (
        <div className="bg-solid-gray-50 border border-solid-gray-200 rounded-lg p-4">
          <p className="text-sm text-solid-gray-600">
            この自治体の地区データはまだ設定されていません。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 検索可能なセレクトボックス */}
          <div ref={dropdownRef} className="relative">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                id={`district-search-${variableGroup || variableName}`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder={
                  selectedDistrict
                    ? selectedDistrict.name
                    : placeholder || "町名を入力して検索..."
                }
                className={`w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  selectedDistrict
                    ? "border-blue-500 bg-blue-50"
                    : "border-solid-gray-300"
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* ドロップダウン */}
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-solid-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {searchQuery.trim() ? (
                  // 検索結果
                  searchResults.length > 0 ? (
                    <>
                      <div className="px-3 py-2 text-xs text-solid-gray-500 bg-solid-gray-50">
                        {searchResults.length}件の地区が見つかりました
                      </div>
                      {searchResults.map((result, index) => (
                        <button
                          key={`${result.districtId}-${index}`}
                          type="button"
                          onClick={() => handleSelectDistrict(result.districtId)}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                        >
                          <span className="font-medium">{result.area}</span>
                          <span className="ml-2 text-sm text-solid-gray-500">
                            （{result.districtName}）
                          </span>
                        </button>
                      ))}
                    </>
                  ) : (
                    <div className="px-4 py-3 text-sm text-solid-gray-500">
                      「{searchQuery}」に該当する地区が見つかりません
                    </div>
                  )
                ) : (
                  // 地区一覧
                  districts.map((district) => (
                    <button
                      key={district.id}
                      type="button"
                      onClick={() => handleSelectDistrict(district.id)}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-solid-gray-100 last:border-b-0 ${
                        selectedDistrictId === district.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="font-medium">{district.name}</div>
                      <div className="text-sm text-solid-gray-500 mt-1">
                        {district.areas.slice(0, 5).join("、")}
                        {district.areas.length > 5 &&
                          `、他${district.areas.length - 5}地区`}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 選択された地区の収集日情報 */}
          {selectedDistrictId && Object.keys(allVariables).length > 0 && (
            <div className="bg-white border border-solid-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium">
                    {selectedDistrict?.name}の収集日
                  </span>
                </div>
              </div>

              <div className="divide-y divide-solid-gray-100">
                {Object.entries(GOMI_LABELS).map(([varName, config]) => {
                  const value = getVariableValue(varName);
                  if (!value) return null;

                  return (
                    <div
                      key={varName}
                      className={`px-4 py-3 flex items-center justify-between ${config.color} border-l-4`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{config.icon}</span>
                        <span className="font-medium">{config.label}</span>
                      </div>
                      <div className="text-lg font-bold">{value}</div>
                    </div>
                  );
                })}
              </div>

              {/* 朝出す時間 */}
              <div className="px-4 py-3 bg-solid-gray-50 text-sm text-solid-gray-600">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>収集日の朝8時30分までに出してください</span>
                </div>
              </div>
            </div>
          )}

          {/* 地区の詳細情報 */}
          {selectedDistrict && selectedDistrict.areas.length > 0 && (
            <details className="text-sm text-solid-gray-600">
              <summary className="cursor-pointer hover:text-solid-gray-800 py-2">
                {selectedDistrict.name}の対象地区一覧を表示
              </summary>
              <div className="mt-2 p-3 bg-solid-gray-50 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {selectedDistrict.areas.map((area) => (
                    <span
                      key={area}
                      className="px-2 py-1 bg-white border border-solid-gray-200 rounded text-xs"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default DistrictSelectorBlock;
