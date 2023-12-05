/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { forwardRef, useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { components, type OptionTypeBase } from "react-select";
import type { Props } from "react-select/base/index";
import CreatableSelect from "react-select/creatable";
import type { MenuProps } from "react-select/src/components/Menu";

import "./Typeahead.module.scss";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ThemedMenu(props: MenuProps<any, false>) {
  return (
    <div
      className="typeaheadReactSelectWrapper"
      data-testid="TypeaheadThemedMenu"
    >
      <components.Menu {...props} />
    </div>
  );
}

function CreatableTypeaheadComponent<OptionType extends OptionTypeBase = { label: string; value: string; }>(
  props: Props<OptionType>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: Ref<any> | null,
) {
  const noOptionFunction = props.noOptionsMessage ?? (() => "No Options");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectRef = useRef<any>(ref);

  useImperativeHandle(ref, () => ({
    focus: () => {
      selectRef.current.focus();
    },
    blur: () => {
      selectRef.current.blur();
    },
  }));

  useEffect(() => {
    const handler = () => {
      if (selectRef?.current?.state?.menuIsOpen) {
        selectRef.current.onMenuClose();
      }
    };
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("resize", handler);
    };
  }, []);

  return (
    <div
      data-testid="ThemedTypeahead"
      className={`typeaheadReactSelectWrapper ${props.className}`}
      onClick={props.onClick}
    >
      <CreatableSelect
        {...props}
        styles={{
          menuPortal: (provided) => ({
            ...provided,
            zIndex: 15000 /* must be greater than 14000 */,
          }),
        }}
        classNamePrefix="react-select"
        closeMenuOnScroll={(e) => {
          return (
            !!(e?.target as Element)?.classList?.contains &&
            !(e?.target as Element)?.classList?.contains?.("react-select__menu-list")
          );
        }}
        menuPlacement="auto"
        menuPortalTarget={getParentSelector()}
        noOptionsMessage={noOptionFunction}
        escapeClearsValue={true}
        backspaceRemovesValue={true}
        ref={selectRef}
        components={{
          ...props.components,
          Menu: ThemedMenu,
        }}
      />
    </div>
  );
}

export const CreatableTypeahead = forwardRef(CreatableTypeaheadComponent);

function getParentSelector(): HTMLElement {
  let portal = document.querySelector("#portal");
  if (!portal) {
    portal = document.createElement("div");
    portal.id = "portal";
    document.body.appendChild(portal);
  }

  return portal as HTMLElement;
}
