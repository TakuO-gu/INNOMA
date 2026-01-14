'use client';

import React from 'react';

export type BuildingBlocksMainAreaProps = {
  label?: string;
  title: string;
  content?: string;
  showEndIcon?: boolean;
  showLabel?: boolean;
  showContent?: boolean;
  onIconClick?: () => void;
  className?: string;
};

/**
 * BuildingBlocksMainArea
 * 
 * タイトルとコンテンツを表示する汎用的なメインエリアコンポーネント。
 * DADS準拠で、ラベル、タイトル、コンテンツ、アクションアイコンを備えています。
 */
export const BuildingBlocksMainArea = React.forwardRef<
  HTMLDivElement,
  BuildingBlocksMainAreaProps
>(
  (
    {
      label,
      title,
      content,
      showEndIcon = true,
      showLabel = true,
      showContent = true,
      onIconClick,
      className = '',
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`bg-white border border-solid-gray-300 ${className}`}
        data-node-id="4146:9009"
      >
        {/* Title Container */}
        <div
          className="flex items-start justify-between pl-6 pr-0 py-0 w-full"
          data-node-id="11403:4813"
          data-name="Title Container"
        >
          {/* Label & Title Section */}
          <div
            className="flex flex-col gap-1 items-start flex-1"
            data-node-id="4146:9010"
            data-name="Label & Title"
          >
            {showLabel && label && (
              <p
                className="text-sm font-normal leading-[1.7] text-solid-gray-800"
                data-node-id="4146:9012"
              >
                {label}
              </p>
            )}

            {/* Title Padding Container */}
            <div
              className="w-full pt-1 px-0 pb-0"
              data-node-id="11403:4992"
              data-name="Title Padding"
            >
              <h3
                className="text-lg font-bold leading-[1.5] text-solid-gray-900"
                data-node-id="4146:9015"
              >
                {title}
              </h3>
            </div>
          </div>

          {/* End Icon Area */}
          {showEndIcon && (
            <div
              className="flex items-center justify-center w-11 h-11"
              data-name="End-icon Area"
              data-node-id="11403:4889"
            >
              <button
                onClick={onIconClick}
                className="w-6 h-6 flex items-center justify-center text-solid-gray-900 hover:bg-solid-gray-100 rounded focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                aria-label="More options"
                data-name="more_vert"
                data-node-id="11403:4849"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 8c1.1 0 2-0.9 2-2s-0.9-2-2-2-2 0.9-2 2 0.9 2 2 2zm0 2c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2zm0 6c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Contents Section */}
        {showContent && content && (
          <div
            className="flex items-start px-6 py-0 w-full"
            data-name="Contents"
            data-node-id="4146:9018"
          >
            <p
              className="flex-1 text-base font-normal leading-[1.7] text-solid-gray-800 whitespace-pre-wrap"
              data-node-id="4146:9019"
            >
              {content}
            </p>
          </div>
        )}
      </div>
    );
  }
);

BuildingBlocksMainArea.displayName = 'BuildingBlocksMainArea';
