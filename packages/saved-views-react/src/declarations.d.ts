// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

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
