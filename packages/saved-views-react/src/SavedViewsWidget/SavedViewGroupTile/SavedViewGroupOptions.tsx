/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { MenuItem } from "@itwin/itwinui-react";
import type { ReactElement } from "react";

import { useSavedViewGroupTileContext } from "./SavedViewGroupTileContext.js";

export const SavedViewGroupOptions = {
  Rename,
};

interface RenameProps {
  icon?: ReactElement | undefined;
}

function Rename(props: RenameProps): ReactElement {
  const { setEditingName } = useSavedViewGroupTileContext();
  return <MenuItem startIcon={props.icon} onClick={() => setEditingName(true)}>Rename</MenuItem>;
}
