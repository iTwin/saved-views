// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { Icon } from "@itwin/core-react";

import "./Pill.scss";

export interface PillProps {
  /** The text to display inside the pill. */
  text: string;
  /** The icon to display to the right of the text. If undefined, no icon is displayed. */
  rightIconSpec?: string;
  /** Called when the icon to the right of the text is clicked */
  onRightIconClick?: (text: string) => void;
}

/**
 * Pill-shaped text container, used for tags
 */
export function Pill({ text, rightIconSpec, onRightIconClick }: PillProps) {
  const handleRightIconClick = () => {
    if (onRightIconClick) {
      onRightIconClick(text);
    }
  };

  return (
    <div className="pill">
      <div className="pill-content">
        {text}
        {rightIconSpec && (
          <span onClick={handleRightIconClick} className="pill-icon">
            <Icon iconSpec={rightIconSpec} />
          </span>
        )}
      </div>
    </div>
  );
}
