// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { useSelector } from "react-redux";

import { type TargetViewport } from "../api/TargetViewport";

export const useTargetViewport = (): TargetViewport =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSelector((state: any) => state?.savedViewsState?.targetViewport);
