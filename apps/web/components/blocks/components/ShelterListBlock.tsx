"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Label } from "@/components/dads/Label/Label";
import { SupportText } from "@/components/dads/SupportText/SupportText";
import { useMunicipality } from "../MunicipalityContext";

interface Shelter {
  id: string;
  name: string;
  address: string;
  type: "kinkyu" | "shitei" | "fukushi";
  capacity?: number;
  hazardTypes?: string[];
  phone?: string;
  note?: string;
}

interface District {
  id: string;
  name: string;
  areas: string[];
  shelters: Shelter[];
}

interface ShelterData {
  municipalityId: string;
  districts: District[];
}

interface ShelterListProps {
  props: Record<string, unknown>;
}

// 避難所タイプのラベル定義
const SHELTER_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  kinkyu: {
    label: "指定緊急避難場所",
    icon: "🚨",
    color: "bg-yellow-50 border-yellow-400 text-yellow-800",
  },
  shitei: {
    label: "指定避難所",
    icon: "🏠",
    color: "bg-blue-50 border-blue-400 text-blue-800",
  },
  fukushi: {
    label: "福祉避難所",
    icon: "♿",
    color: "bg-green-50 border-green-400 text-green-800",
  },
};

// 災害種別のラベル
const HAZARD_TYPE_LABELS: Record<string, string> = {
  flood: "洪水",
  landslide: "土砂災害",
  earthquake: "地震",
  tsunami: "津波",
  fire: "大規模火災",
  volcano: "火山",
  storm: "暴風",
};

// 地区選択のlocalStorageキー
const DISTRICT_STORAGE_KEY = "innoma_selected_shelter_district";

/**
 * 避難所リスト コンポーネント
 * 地区を選択すると、その地区の避難所一覧を表示
 */
export function ShelterListBlock({ props }: ShelterListProps) {
  const label = (props.label as string) || "地区を選択してください";
  const placeholder = props.placeholder as string | undefined;
  const helpText = props.helpText as string | undefined;
  const { municipalityId } = useMunicipality();

  const [shelterData, setShelterData] = useState<ShelterData | null>(null);
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
    if (!shelterData) return [];
    const areas: { area: string; districtId: string; districtName: string }[] = [];
    for (const district of shelterData.districts) {
      for (const area of district.areas) {
        areas.push({
          area,
          districtId: district.id,
          districtName: district.name,
        });
      }
    }
    return areas;
  }, [shelterData]);

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

  // 避難所データを取得
  useEffect(() => {
    async function loadShelters() {
      try {
        setLoading(true);
        setError(null);

        // shelters.json からデータを取得
        const response = await fetch(`/api/districts/${municipalityId}/shelters`);

        if (!response.ok) {
          if (response.status === 404) {
            setShelterData(null);
            return;
          }
          throw new Error("避難所データの取得に失敗しました");
        }

        const data = await response.json();
        setShelterData(data);

        // localStorageから選択済みの地区を復元
        const stored = localStorage.getItem(DISTRICT_STORAGE_KEY);
        if (stored) {
          try {
            const storedDistricts = JSON.parse(stored);
            if (storedDistricts[municipalityId]) {
              setSelectedDistrictId(storedDistricts[municipalityId]);
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
      loadShelters();
    }
  }, [municipalityId]);

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
    const stored = localStorage.getItem(DISTRICT_STORAGE_KEY);
    let storedDistricts: Record<string, string> = {};

    if (stored) {
      try {
        storedDistricts = JSON.parse(stored);
      } catch {
        // パース失敗は初期化
      }
    }

    storedDistricts[municipalityId] = districtId;
    localStorage.setItem(DISTRICT_STORAGE_KEY, JSON.stringify(storedDistricts));
  };

  // 選択された地区の情報を取得
  const selectedDistrict = shelterData?.districts.find((d) => d.id === selectedDistrictId);

  // タイプ別に避難所をグループ化
  const sheltersByType = useMemo(() => {
    if (!selectedDistrict) return {};
    const grouped: Record<string, Shelter[]> = {};
    for (const shelter of selectedDistrict.shelters) {
      if (!grouped[shelter.type]) {
        grouped[shelter.type] = [];
      }
      grouped[shelter.type].push(shelter);
    }
    return grouped;
  }, [selectedDistrict]);

  return (
    <div className="shelter-list mt-12 mb-6">
      <div className="mb-2">
        <Label htmlFor="shelter-district-search">{label}</Label>
      </div>

      {helpText && <SupportText className="mb-2">{helpText}</SupportText>}

      {loading ? (
        <div className="animate-pulse bg-gray-200 h-14 rounded-lg" />
      ) : error ? (
        <p className="text-error-1 text-sm">{error}</p>
      ) : !shelterData || shelterData.districts.length === 0 ? (
        <div className="bg-solid-gray-50 border border-solid-gray-200 rounded-lg p-4">
          <p className="text-sm text-solid-gray-600">
            この自治体の避難所データはまだ設定されていません。
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
                id="shelter-district-search"
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
                  shelterData.districts.map((district) => (
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
                        {district.areas.length > 5 && ` 他${district.areas.length - 5}地区`}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 選択された地区の避難所一覧 */}
          {selectedDistrict && (
            <div className="space-y-4">
              <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg">
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
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="font-medium">
                    {selectedDistrict.name}の避難所（{selectedDistrict.shelters.length}か所）
                  </span>
                </div>
              </div>

              {/* タイプ別の避難所リスト */}
              {(["kinkyu", "shitei", "fukushi"] as const).map((type) => {
                const shelters = sheltersByType[type];
                if (!shelters || shelters.length === 0) return null;

                const typeConfig = SHELTER_TYPE_LABELS[type];

                return (
                  <div key={type} className="border border-solid-gray-200 rounded-lg overflow-hidden">
                    <div className={`px-4 py-2 border-l-4 ${typeConfig.color}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{typeConfig.icon}</span>
                        <span className="font-medium">{typeConfig.label}</span>
                        <span className="text-sm">（{shelters.length}か所）</span>
                      </div>
                    </div>
                    <div className="divide-y divide-solid-gray-100">
                      {shelters.map((shelter) => (
                        <div key={shelter.id} className="px-4 py-3">
                          <div className="font-medium text-solid-gray-900">{shelter.name}</div>
                          <div className="text-sm text-solid-gray-600 mt-1">{shelter.address}</div>
                          {shelter.capacity && (
                            <div className="text-sm text-solid-gray-500 mt-1">
                              収容人数: 約{shelter.capacity}人
                            </div>
                          )}
                          {shelter.hazardTypes && shelter.hazardTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {shelter.hazardTypes.map((hazard) => (
                                <span
                                  key={hazard}
                                  className="px-2 py-0.5 bg-solid-gray-100 text-solid-gray-700 text-xs rounded"
                                >
                                  {HAZARD_TYPE_LABELS[hazard] || hazard}
                                </span>
                              ))}
                            </div>
                          )}
                          {shelter.phone && (
                            <div className="text-sm text-solid-gray-500 mt-1">
                              TEL: {shelter.phone}
                            </div>
                          )}
                          {shelter.note && (
                            <div className="text-sm text-solid-gray-500 mt-1 italic">
                              {shelter.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 地区未選択時のメッセージ */}
          {!selectedDistrict && (
            <div className="bg-solid-gray-50 border border-solid-gray-200 rounded-lg p-6 text-center">
              <svg
                className="w-12 h-12 mx-auto text-solid-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-solid-gray-600">
                上の検索ボックスからお住まいの地区を選択すると、
                <br />
                近くの避難所が表示されます。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ShelterListBlock;
