/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { StickyExpandableBlock } from "@itwin/saved-views-react";
import { type ReactElement } from "react";

export function StickyExpandableBlockDemo(): ReactElement {
  return (
    <div>
      <StickyExpandableBlock title="Block 1">
        <BlockContent />
      </StickyExpandableBlock>
      <StickyExpandableBlock title="Block 2">
        <BlockContent />
      </StickyExpandableBlock>
      <StickyExpandableBlock title="Block 3">
        <BlockContent />
      </StickyExpandableBlock>
    </div>
  );
}

function BlockContent(): ReactElement {
  const style = { height: "200px", background: "var(--iui-color-border-subtle)", borderRadius: 20 };

  return (
    <div style={{ display: "grid", gap: 24, margin: "0px 24px" }}>
      {Array.from({ length: 6 }).map((_, i) => <div key={i} style={style} />)}
    </div>
  );
}
