/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

declare module "*.svg" {
  const url: string;
  export const ReactComponent: import("react").ComponentType<
    import("react").ComponentProps<"svg">
  >;
  export default url;
}

declare module "*.scss" {
  const content: { [className: string]: string; };
  export = content;
}
