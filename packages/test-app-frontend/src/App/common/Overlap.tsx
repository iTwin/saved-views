/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { CSSProperties, ReactElement, ReactNode } from "react";

import "./Overlap.css";

interface OverlapProps {
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export function Overlap(props: OverlapProps): ReactElement {
  return (
    <div className="overlap" style={props.style}>
      {props.children}
    </div>
  );
}
