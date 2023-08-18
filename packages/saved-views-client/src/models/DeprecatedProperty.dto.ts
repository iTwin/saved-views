// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

/**
 * DTO with deprecated properties, such as projectId.
 */
export interface DeprecatedProperty {
  /**
   *@deprecated Please start using iTwinId instead.
   */
  deprecated?: true;
  projectId?: string;
}
