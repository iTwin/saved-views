/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";

export type AllOrNone<T> = { [K in keyof T]-?: T[K] } | { [K in keyof T]?: never };

export function trimInputString(string: string): string {
  return string.replace(/\s+/g, " ");
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function useControlledState<T>(
  initialValue: T,
  controlledState: T | undefined,
  setControlledState?: Dispatch<SetStateAction<T>>,
): [state: T, setState: Dispatch<SetStateAction<T>>] {
  const [uncontrolledState, setUncontrolledState] = useState<T>(initialValue);

  const state = useMemo(
    () => (controlledState !== undefined ? controlledState : uncontrolledState),
    [controlledState, uncontrolledState],
  );

  const setState: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      setUncontrolledState(value);
      setControlledState?.(value);
    },
    [setControlledState, setUncontrolledState],
  );

  return [state, setState];
}
