// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import {
  type StatusBarItem,
  type UiItemsProvider,
  StageUsage,
  StatusBarItemUtilities,
  StatusBarSection,
  useActiveViewport,
} from "@itwin/appui-react";
import { IModelApp } from "@itwin/core-frontend";
import { type ITwinLocalization } from "@itwin/core-i18n";
import * as React from "react";

import { SavedViewsManager } from "../api/SavedViewsManager";
import {
  type SavedViewsWidgetProps,
  SavedViewsWidget,
} from "./SavedViewsWidget";

/** HOC that injects the want2dViews prop
 * @public
 */
export const with2dViewsIncluded = (Component: React.JSXElementConstructor<SavedViewsWidgetProps>) => {
  return function With2dViewsIncluded(props: SavedViewsWidgetProps) {
    const enable2dViews = SavedViewsManager.flags.enable2dViews;
    const [want2dViews, setWant2dViews] = React.useState(false);
    const [show, setShow] = React.useState(true);
    const vp = useActiveViewport();
    React.useEffect(() => {
      if (vp) {
        // ensure this is the main viewport (i.e. not a viewport opened from a tool like civil profile or tendon)
        if (vp === IModelApp.viewManager.getFirstOpenView()) {
          const is2d = vp.view.is2d();
          if (is2d && !enable2dViews) {
            setShow(false);
          } else {
            setShow(true);
            setWant2dViews(is2d);
          }
        }
      }
    }, [vp, enable2dViews]);

    return <>{show && <Component {...props} want2dViews={want2dViews} />}</>;
  };
};

/** Extension's UI provider */
export class SavedViewsUiItemsProvider implements UiItemsProvider {
  public static readonly providerId = "SavedViewsUiitemsProvider";
  public readonly id = SavedViewsUiItemsProvider.providerId;
  public static i18n: ITwinLocalization;

  public constructor(private props: SavedViewsWidgetProps) {}

  public provideStatusBarItems(_stageId: string, stageUsage: string): StatusBarItem[] {
    const statusBarItems: StatusBarItem[] = [];

    const WidgetWithProps = with2dViewsIncluded(SavedViewsWidget);

    // Add the saved views widget to the general stage
    if (stageUsage === StageUsage.General) {
      statusBarItems.push(
        StatusBarItemUtilities.createCustomItem(
          "SavedViewsWidget",
          StatusBarSection.Left,
          40,
          <WidgetWithProps {...this.props} />,
        ),
      );
    }
    return statusBarItems;
  }
}
