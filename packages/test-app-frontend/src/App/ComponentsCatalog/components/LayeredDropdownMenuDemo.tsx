/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Button, MenuDivider, MenuItem } from "@itwin/itwinui-react";
import { LayeredDropdownMenu, LayeredMenuItem } from "@itwin/saved-views-react";
import { useState, type ReactElement } from "react";

export function LayeredDropdownMenuDemo(): ReactElement {
  const [counter, setCounter] = useState(0);
  const handleClick = () => setCounter((prev) => prev + 1);

  return (
    <div style={{ display: "grid", placeItems: "center" }}>
      <LayeredDropdownMenu
        menuItems={(close) => [
          <LayeredMenuItem key="increment" content={<Button onClick={handleClick}>Count: {counter}</Button>}>
            Increment
          </LayeredMenuItem>,
          <LayeredMenuItem key="self-close" content={<Button onClick={close}>Close menu</Button>}>
            Self-close
          </LayeredMenuItem>,
          <MenuDivider key="divider" />,
          <MenuItem key="regular" onClick={handleClick}>
            Count: {counter}
          </MenuItem>,
          <MenuItem
            key="more"
            subMenuItems={[<MenuItem key="reset" onClick={() => setCounter(0)}>Reset counter</MenuItem>]}
          >
            More actions
          </MenuItem>,
        ]}
      >
        <Button>Open menu</Button>
      </LayeredDropdownMenu>
    </div>
  );
}
