// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

// TODO: reimplement when the extension API is finished

// import { UiItemsManager } from "@itwin/appui-abstract";
// import { Extension, IModelApp } from "@itwin/core-frontend";

// import { SavedViewsManager } from "./api/SavedViewsManager";
// import { SavedViewsUiItemsProvider } from "./ui/SavedViewsUiItemsProvider";

// /** Extension class that will be loaded on runtime */
// class SavedViewsExtension extends Extension {
//   // Must match name of I18n locale json file
//   protected _defaultNs = "ITwinSavedViews";
//   private _i18NNamespace?: I18NNamespace;

//   public constructor(name: string) {
//     super(name);
//   }

//   public async onExecute(_args: string[]): Promise<void> {
//     // No-op
//   }

//   public async onLoad(_args: string[]): Promise<void> {
//     // Register namespace
//     this._i18NNamespace = this.localization.getNamespace(
//       SavedViewsManager.i18nNamespace
//     );
//     if (this._i18NNamespace === undefined) {
//       throw new Error("Saved views extension could not find locale");
//     }
//     await this._i18NNamespace.readFinished;
//     // TODO: Any options from args?
//     await SavedViewsManager.initialize(this.i18n, {});
//     // Register item provider that will provide widget in status bar
//     UiItemsManager.register(new SavedViewsUiItemsProvider());
//   }
// }

// // extensionAdmin is undefined if an application is using it as a package and it is loaded prior to IModelApp defining extensionAdmin
// // if (IModelApp.extensionAdmin) {
// //   // Register the extension with the extensionAdmin.
// //   IModelApp.extensionAdmin.register(new SavedViewsExtension("savedViews"));
// // }
export {};
