// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

/** Describes the properties with which ambient occlusion should be drawn. These properties correspond to a horizon-based ambient occlusion approach. */
export interface AmbientOcclusionProps {
  bias?: number;
  zLengthCap?: number;
  maxDistance?: number;
  intensity?: number;
  texelStepSize?: number;
  blurDelta?: number;
  blurSigma?: number;
  blurTexelStepSize?: number;
}
