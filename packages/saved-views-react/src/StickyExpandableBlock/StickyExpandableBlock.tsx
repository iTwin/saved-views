/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ExpandableBlock } from "@itwin/itwinui-react";
import {
  useLayoutEffect, useRef, useState, type MouseEvent, type ReactElement, type ReactNode, type RefObject,
} from "react";

import "./StickyExpandableBlock.css";

interface StikyExpandableBlockProps {
  /** Expandable block title. */
  title: ReactNode;

  /** Icon that goes after the expandable block title. */
  endIcon?: ReactNode | undefined;

  /** Forwarded to iTwinUI `<ExpandableBlock />`. */
  isExpanded?: boolean | undefined;

  /** Forwarded to iTwinUI `<ExpandableBlock />`. */
  onToggle?: ((expanded: boolean) => void) | undefined;

  /** `className` of the wrapping container. */
  className?: string | undefined;

  /** `className` of the title container. */
  titleClassName?: string | undefined;

  /** Expandable block content. */
  children?: ReactNode | undefined;
}

/**
 * Alternative to <ExpandableBlock /> component from iTwinUI. Its label sticks to the top of scroll container when user
 * scrolls down.
 *
 * @example
 * <StickyExpandableBlock title="Block">
 *   Content
 * </StickyExpandableBlock>
 */
export function StickyExpandableBlock(props: StikyExpandableBlockProps): ReactElement {
  // Prevent clicks on the end icon toggling expansion state
  const handleGroupMenuClick = (event: MouseEvent) => {
    event.stopPropagation();
  };

  // When clicking the label while it's stuck at the top, we want the label to remain visible after the expandable block
  // collapses
  const scrollbackRef = useRef<HTMLDivElement>(null);
  const handleExpandToggle = (expanded: boolean) => {
    props.onToggle?.(expanded);
    if (!expanded) {
      scrollbackRef.current?.scrollIntoView({ block: "nearest" });
    }
  };

  const stickyRef = useRef<HTMLDivElement>(null);
  const stuck = useSticky(stickyRef);

  return (
    <ExpandableBlock.Wrapper
      className={props.className}
      styleType="borderless"
      isExpanded={props.isExpanded}
      onToggle={handleExpandToggle}
    >
      <div ref={scrollbackRef} />
      <ExpandableBlock.Trigger
        ref={stickyRef}
        as="div"
        className="svr-expandable-block-header"
        data-stuck={stuck}
        role="button"
      >
        <ExpandableBlock.ExpandIcon />
        <ExpandableBlock.LabelArea>
          <ExpandableBlock.Title className={props.titleClassName}>
            {props.title}
          </ExpandableBlock.Title>
        </ExpandableBlock.LabelArea>
        {
          props.endIcon &&
          <ExpandableBlock.EndIcon onClick={handleGroupMenuClick}>
            {props.endIcon}
          </ExpandableBlock.EndIcon>
        }
      </ExpandableBlock.Trigger>
      <ExpandableBlock.Content>
        {props.children}
      </ExpandableBlock.Content>
    </ExpandableBlock.Wrapper>
  );
}

function useSticky(ref: RefObject<HTMLElement>): boolean {
  const [stuck, setStuck] = useState(false);

  useLayoutEffect(
    () => {
      const stuckElement = ref.current;
      if (!stuckElement) {
        return;
      }

      const scrollableParent = findScrollableParent(stuckElement.parentElement);
      const handleScroll = () => {
        const parentOffset = stuckElement.parentElement?.offsetTop ?? stuckElement.offsetTop;
        setStuck(parentOffset < stuckElement.offsetTop);
      };
      scrollableParent?.addEventListener("scroll", handleScroll);
      return () => scrollableParent?.removeEventListener("scroll", handleScroll);
    },
    [ref],
  );

  return stuck;
}

function findScrollableParent(element: HTMLElement | null | undefined): HTMLElement | undefined {
  if (!element) {
    return undefined;
  }

  const style = getComputedStyle(element);
  if (style.overflowY !== "visible" && style.overflowY !== "hidden") {
    return element;
  }

  return findScrollableParent(element.parentElement);
}
