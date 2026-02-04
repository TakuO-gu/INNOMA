/* eslint-disable @next/next/no-img-element */
import React from "react";

const _img = "https://www.figma.com/api/mcp/asset/defebdf3-1d9f-4a50-bcc7-d2bff09ab04e";
const img1 = "https://www.figma.com/api/mcp/asset/48d61337-d6bf-4f4c-b322-c4671772c2c3";
const _img2 = "https://www.figma.com/api/mcp/asset/9a5d604a-bd28-4afe-84e6-3ab559337a6e";
const img3 = "https://www.figma.com/api/mcp/asset/fe875d52-f3cf-4c83-83b4-cf0011681292";
const img4 = "https://www.figma.com/api/mcp/asset/9847c7a7-8d6e-4e5b-95e6-98bc8942a116";
const img5 = "https://www.figma.com/api/mcp/asset/235f7836-37d6-42c8-b48f-ef4f56c84019";

type Props = {
  label?: boolean;
  contents?: boolean;
  showEndIcon?: boolean;
  state?: "Default" | "Hover" | "Focus";
  link?: boolean;
  propFunction?: boolean;
};

export default function BuildingBlocksMainArea({
  label = true,
  contents = true,
  showEndIcon = true,
  state = "Default",
  link: _link = false,
  propFunction = false,
}: Props) {
  const base = "border border-neutral-400 border-solid flex flex-col relative w-[352px]";

  const bgClass =
    state === "Default"
      ? "bg-white"
      : state === "Hover"
      ? "bg-neutral-50"
      : "bg-white";

  const containerClass = `${base} ${bgClass} gap-4 items-start p-4`;

  return (
    <div className={containerClass}>
      <div className="flex items-start justify-between w-full">
        <div className="flex-1 flex flex-col gap-1">
          {label && (
            <p className="text-sm text-neutral-700">ラベル</p>
          )}
          <div className="pt-1">
            <p className="font-bold text-lg text-neutral-900">タイトル</p>
          </div>
        </div>

        {showEndIcon && (
          <div className="flex items-center justify-center shrink-0 w-11 h-11">
            <div className="w-6 h-6 relative">
              <img src={img1} alt="more" className="block w-full h-full object-contain" />
            </div>
          </div>
        )}
      </div>

      {contents && (
        <div className="w-full px-0">
          <p className="text-base text-neutral-800">コンテンツ</p>
        </div>
      )}

      {(state === "Hover" || state === "Focus" || propFunction) && (
        <div className="absolute right-4 top-12 w-11 h-11">
          {state === "Focus" ? (
            <div className="bg-yellow-300 border-4 border-black rounded p-1 flex items-center justify-center w-full h-full">
              <div className="bg-white rounded w-8 h-8 flex items-center justify-center">
                <img src={img4} alt="checkbox-focus" className="w-full h-full" />
              </div>
            </div>
          ) : state === "Hover" ? (
            <div className="bg-neutral-400 rounded-md w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 relative">
                <img src={img5} alt="checkbox-hover" className="w-full h-full" />
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <div className="absolute inset-4">
                <img src={img3} alt="checkbox-default" className="w-full h-full" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
