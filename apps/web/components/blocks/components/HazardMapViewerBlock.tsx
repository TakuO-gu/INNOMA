"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Label } from "@/components/dads/Label/Label";
import { SupportText } from "@/components/dads/SupportText/SupportText";
import { useMunicipality } from "../MunicipalityContext";

interface PdfItem {
  type: string;
  label: string;
  url: string;
}

interface District {
  id: string;
  name: string;
  note?: string;
  pdfs?: PdfItem[];
}

interface EducationalMaterial {
  id: string;
  label: string;
  url: string;
}

interface HazardMapCategory {
  title: string;
  description: string;
  source_url?: string;
  districts?: District[];
  educational_materials?: EducationalMaterial[];
}

interface HazardMapData {
  municipality_id: string;
  updated_at: string;
  source_url: string;
  hazard_maps: {
    flood?: HazardMapCategory;
    landslide?: HazardMapCategory;
    earthquake?: HazardMapCategory;
    tsunami?: HazardMapCategory;
  };
}

interface HazardMapViewerProps {
  props: {
    mapType?: "flood" | "landslide" | "earthquake" | "tsunami";
    label?: string;
    helpText?: string;
    showEducationalMaterials?: boolean;
  };
}

// 地区選択のlocalStorageキー
const DISTRICT_STORAGE_KEY = "innoma_selected_hazardmap_district";

/**
 * ハザードマップビューア コンポーネント
 * 地区を選択すると、その地区のハザードマップPDFを表示・ダウンロード可能
 */
export function HazardMapViewerBlock({ props }: HazardMapViewerProps) {
  const mapType = props.mapType || "flood";
  const label = props.label || "地区を選択してハザードマップを確認";
  const helpText = props.helpText;
  const showEducationalMaterials = props.showEducationalMaterials ?? true;
  const { municipalityId } = useMunicipality();

  const [hazardMapData, setHazardMapData] = useState<HazardMapData | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 選択中のハザードマップカテゴリ
  const currentCategory = useMemo(() => {
    return hazardMapData?.hazard_maps?.[mapType] || null;
  }, [hazardMapData, mapType]);

  // 地区リスト
  const districts = useMemo(() => {
    return currentCategory?.districts || [];
  }, [currentCategory]);

  // 教育資料
  const educationalMaterials = useMemo(() => {
    return currentCategory?.educational_materials || [];
  }, [currentCategory]);

  // ハザードマップデータを取得
  useEffect(() => {
    async function loadHazardMaps() {
      try {
        setLoading(true);
        setError(null);

        // hazard-maps.json からデータを取得
        const response = await fetch(`/api/districts/${municipalityId}/hazard-maps`);

        if (!response.ok) {
          if (response.status === 404) {
            setHazardMapData(null);
            return;
          }
          throw new Error("ハザードマップデータの取得に失敗しました");
        }

        const data = await response.json();
        setHazardMapData(data);

        // localStorageから選択済みの地区を復元
        const stored = localStorage.getItem(DISTRICT_STORAGE_KEY);
        if (stored) {
          try {
            const storedDistricts = JSON.parse(stored);
            const key = `${municipalityId}_${mapType}`;
            if (storedDistricts[key]) {
              setSelectedDistrictId(storedDistricts[key]);
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
      loadHazardMaps();
    }
  }, [municipalityId, mapType]);

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
    setIsDropdownOpen(false);
    setShowPdfViewer(false);
    setSelectedPdfUrl("");

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

    const key = `${municipalityId}_${mapType}`;
    storedDistricts[key] = districtId;
    localStorage.setItem(DISTRICT_STORAGE_KEY, JSON.stringify(storedDistricts));
  };

  // 選択された地区の情報を取得
  const selectedDistrict = districts.find((d) => d.id === selectedDistrictId);

  // PDF表示
  const handleViewPdf = (url: string) => {
    setSelectedPdfUrl(url);
    setShowPdfViewer(true);
  };

  return (
    <div className="hazard-map-viewer my-6">
      <div className="mb-2">
        <Label htmlFor="hazard-map-district-select">{label}</Label>
      </div>

      {helpText && <SupportText className="mb-2">{helpText}</SupportText>}

      {loading ? (
        <div className="animate-pulse bg-gray-200 h-14 rounded-lg" />
      ) : error ? (
        <p className="text-error-1 text-sm">{error}</p>
      ) : !hazardMapData || districts.length === 0 ? (
        <div className="bg-solid-gray-50 border border-solid-gray-200 rounded-lg p-4">
          <p className="text-sm text-solid-gray-600">
            この自治体のハザードマップデータはまだ設定されていません。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 地区選択ドロップダウン */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              id="hazard-map-district-select"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                selectedDistrict
                  ? "border-blue-500 bg-blue-50"
                  : "border-solid-gray-300 bg-white"
              }`}
            >
              <span className={selectedDistrict ? "text-solid-gray-900" : "text-solid-gray-500"}>
                {selectedDistrict ? selectedDistrict.name : "地区を選択してください"}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* ドロップダウン */}
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-solid-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                {districts.map((district) => (
                  <button
                    key={district.id}
                    type="button"
                    onClick={() => handleSelectDistrict(district.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-solid-gray-100 last:border-b-0 ${
                      selectedDistrictId === district.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="font-medium">{district.name}</div>
                    {district.note && (
                      <div className="text-sm text-solid-gray-500 mt-1">{district.note}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 選択された地区のPDFリスト */}
          {selectedDistrict && (
            <div className="border border-solid-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  <span className="font-medium">{selectedDistrict.name}のハザードマップ</span>
                </div>
              </div>

              {selectedDistrict.pdfs && selectedDistrict.pdfs.length > 0 ? (
                <div className="divide-y divide-solid-gray-100">
                  {selectedDistrict.pdfs.map((pdf, index) => (
                    <div key={index} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-solid-gray-900">{pdf.label}</div>
                        <div className="text-sm text-solid-gray-500">PDF形式</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewPdf(pdf.url)}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          表示
                        </button>
                        <a
                          href={pdf.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm bg-solid-gray-100 text-solid-gray-700 rounded hover:bg-solid-gray-200 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          DL
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-solid-gray-500">
                  {selectedDistrict.note || "この地区のハザードマップはありません"}
                </div>
              )}
            </div>
          )}

          {/* PDFビューア（インラインiframe） */}
          {showPdfViewer && selectedPdfUrl && (
            <div className="border border-solid-gray-200 rounded-lg overflow-hidden">
              <div className="bg-solid-gray-100 px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-solid-gray-700">PDFプレビュー</span>
                <button
                  type="button"
                  onClick={() => setShowPdfViewer(false)}
                  className="text-solid-gray-500 hover:text-solid-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="relative" style={{ paddingBottom: "75%" }}>
                <iframe
                  src={selectedPdfUrl}
                  className="absolute inset-0 w-full h-full"
                  title="ハザードマップPDF"
                />
              </div>
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
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <p className="text-solid-gray-600">
                上のドロップダウンからお住まいの地区を選択すると、
                <br />
                ハザードマップを確認できます。
              </p>
            </div>
          )}

          {/* 情報学習資料 */}
          {showEducationalMaterials && educationalMaterials.length > 0 && (
            <div className="border border-solid-gray-200 rounded-lg overflow-hidden mt-6">
              <div className="bg-solid-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-solid-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <span className="font-medium text-solid-gray-900">防災学習資料</span>
                </div>
              </div>
              <div className="divide-y divide-solid-gray-100">
                {educationalMaterials.map((material) => (
                  <a
                    key={material.id}
                    href={material.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 hover:bg-solid-gray-50 transition-colors"
                  >
                    <span className="text-solid-gray-900">{material.label}</span>
                    <svg className="w-4 h-4 text-solid-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ソースリンク */}
          {currentCategory?.source_url && (
            <div className="text-sm text-solid-gray-500">
              <a
                href={currentCategory.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                公式サイトで詳細を確認
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HazardMapViewerBlock;
