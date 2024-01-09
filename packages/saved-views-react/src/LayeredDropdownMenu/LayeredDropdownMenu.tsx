/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { SvgChevronLeft, SvgChevronRight } from "@itwin/itwinui-icons-react";
import { DropdownMenu, IconButton, ListItem, MenuDivider, MenuExtraContent } from "@itwin/itwinui-react";
import { createContext, useContext, useMemo, useState, type ReactElement, type ReactNode } from "react";

import "./LayeredDropdownMenu.css";

interface LayeredDropdownMenuProps {
  /**
   * Items to pass to iTwinUI `<DropdownMenu />` component. It is preferable for items to include at least one
   * `<LayeredDropdownMenuItem />`. Otherwise, it is more efficient to use plain `<DropdownMenu />`.
  */
  menuItems: ReactElement[] | ((close: () => void) => ReactElement[]);

  /** Dropdown menu trigger to pass to iTwinUI `<DropdownMenu />` component. */
  children: ReactNode;
}

/**
 * An extended version of iTwinUI `<DropdownMenu />` component with support for layered dropdown menu items.
 *
 * @example
 * <LayeredDropdownMenu
 *   menuItems={[
 *     <LayeredMenuItem key="layered" content={<MyLayeredMenu />}>
 *       Layered menu
 *     </LayeredMenuItem>,
 *     <MenuDivider key="divider" />,
 *     <MenuItem ley="regural">Regular menu item</MenuItem>,
 *   ]}
 * >
 *   <Button>Open dropdown menu</Button>
 * </LayeredDropdownMenu>
 */
export function LayeredDropdownMenu(props: LayeredDropdownMenuProps): ReactElement {
  const [activeMenuItem, setActiveMenuItem] = useState<number | undefined>(undefined);
  const menuItems = useMemo(
    () => {
      const menuItemsCallback = activeMenuItem === undefined
        ? (menuItems: ReactElement[]) => menuItems.map((item, i) => (
          <layeredMenuItemIdentifierContext.Provider key={item.key ?? i} value={i}>
            {item}
          </layeredMenuItemIdentifierContext.Provider>
        ))
        : (menuItems: ReactElement[]) => [
          <layeredMenuItemIdentifierContext.Provider
            key={menuItems[activeMenuItem].key ?? activeMenuItem}
            value={activeMenuItem}
          >
            {menuItems[activeMenuItem]}
          </layeredMenuItemIdentifierContext.Provider>,
        ];

      return getMenuItems(props.menuItems, menuItemsCallback);
    },
    [activeMenuItem, props.menuItems],
  );
  return (
    <layeredDropdownMenuContext.Provider value={{ activeMenuItem, setActiveMenuItem }}>
      <DropdownMenu menuItems={menuItems} onVisibleChange={(visible) => !visible && setActiveMenuItem(undefined)}>
        {props.children}
      </DropdownMenu>
    </layeredDropdownMenuContext.Provider>
  );
}

function getMenuItems(
  menuItems: ReactElement[] | ((close: () => void) => ReactElement[]),
  callback: (menuItems: ReactElement[]) => ReactElement[],
): (close: () => void) => ReactElement[] {
  return (close: () => void) => callback(typeof menuItems === "function" ? menuItems(close) : menuItems);
}

interface LayeredDropdownMenuItemProps {
  /** Content of the nested menu. */
  content: ReactNode;

  /** Menu item icon. */
  icon?: ReactNode | undefined;

  /** Menu item label. */
  children: ReactNode;
}

/** Behaves much like iTwinUI `<MenuItem />` but upon activation advances menu to a nested layer. */
export function LayeredMenuItem(props: LayeredDropdownMenuItemProps): ReactElement {
  const itemIdentifier = useContext(layeredMenuItemIdentifierContext);
  const { activeMenuItem, setActiveMenuItem } = useContext(layeredDropdownMenuContext);

  if (itemIdentifier === activeMenuItem) {
    return (
      <>
        <MenuExtraContent key="header">
          <div>
            <div onClick={() => setActiveMenuItem(undefined)}>
              <IconButton styleType="borderless" iconProps={{ className: "svr-layered-dropdown--back" }}>
                <SvgChevronLeft />
                {props.children}
              </IconButton>
            </div>
          </div>
        </MenuExtraContent >
        <MenuDivider key="separator" />
        <MenuExtraContent key="content">
          {props.content}
        </MenuExtraContent>
      </>
    );
  }

  return (
    <ListItem tabIndex={-1} onClick={() => setActiveMenuItem(itemIdentifier)} actionable>
      {props.icon && <ListItem.Icon>{props.icon}</ListItem.Icon>}
      <ListItem.Content>{props.children}</ListItem.Content>
      <ListItem.Icon><SvgChevronRight /></ListItem.Icon>
    </ListItem>
  );
}

interface LayeredDropdownMenuContext {
  activeMenuItem: number | undefined;
  setActiveMenuItem: (index: number | undefined) => void;
}

const layeredDropdownMenuContext = createContext<LayeredDropdownMenuContext>(
  { activeMenuItem: undefined, setActiveMenuItem: () => { } },
);
layeredDropdownMenuContext.displayName = "LayeredDropdownMenuContext";

const layeredMenuItemIdentifierContext = createContext<number | undefined>(undefined);
layeredMenuItemIdentifierContext.displayName = "LayeredDropdownMenuIdentifier";
