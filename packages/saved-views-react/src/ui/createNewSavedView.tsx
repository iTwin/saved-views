/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { UiFramework } from "@itwin/appui-react";
import { Logger } from "@itwin/core-bentley";
import { IModelApp, type IModelConnection, type ScreenViewport } from "@itwin/core-frontend";

import { IModelConnectionCache } from "../api/caches/IModelConnectionCache";
import { SavedViewsCache } from "../api/caches/SavedViewsCache";
import { isSpatialSavedView } from "../api/clients/ISavedViewsClient";
import { SavedViewBase } from "../api/utilities/SavedViewTypes";
import { SavedViewUtil } from "../api/utilities/SavedViewUtil";
import { isSavedViewTooLarge, isTooManyEmphasizedElements } from "../api/utilities/sizeOfSavedView";
import OversizedViewsDialog from "./OversizedViewDialog";

const LOGGERCATEGORY = "ITwinSavedViews";

export interface CreateNewSavedViewProps {
  iModel: IModelConnection;
  cache: SavedViewsCache;
  vp: ScreenViewport;
  shared: boolean;
  name: string;
  userId: string;
  want2dViews: boolean;
  handleTooManyEmphasizedElements: boolean;
  onSuccess?: (savedViewData: SavedViewBase) => void;
  onError?: (savedViewData: SavedViewBase, ex: Error) => void;
  onTooLarge?: (savedViewData: SavedViewBase) => void;
  onCancel?: () => void;
  groupId?: string;
  includeHiddenModelsAndCategories?: boolean;
}

// this is a refactor of the previous logic which overly relied on the definitely assigned operation (!)
// therefore (although its not ideal), this routine wraps the actual create saved view logic with some handling for unexpectedly undefined properties
export const createNewSavedView = async (props: Partial<CreateNewSavedViewProps>) => {
  if (props.iModel) {
    if (props.userId) {
      const vp = props.vp ?? IModelApp.viewManager.selectedView;
      if (vp) {
        const cache =
          props.cache ?? IModelConnectionCache.getSavedViewCache(props.iModel);
        if (cache) {
          const name = props.name ?? cache.getNewSavedViewName();
          if (name) {
            await _createNewSavedView({
              iModel: props.iModel,
              cache,
              vp,
              shared: props.shared ?? false,
              name,
              userId: props.userId,
              want2dViews: props.want2dViews ?? false,
              onSuccess: props.onSuccess,
              onError: props.onError,
              onTooLarge: props.onTooLarge,
              onCancel: props.onCancel,
              groupId: props.groupId,
              handleTooManyEmphasizedElements:
                props.handleTooManyEmphasizedElements ?? false,
            });
          } else {
            Logger.logError(LOGGERCATEGORY, "Failed to create saved view name");
          }
        } else {
          Logger.logError(LOGGERCATEGORY, "Failed to create saved view cache");
        }
      } else {
        Logger.logError(LOGGERCATEGORY, "Unable to create saved view without valid viewport");
      }
    } else {
      Logger.logError(LOGGERCATEGORY, "Unable to create saved view without userId");
    }
  } else {
    Logger.logError(LOGGERCATEGORY, "Unable to create saved view without iModel Connection");
  }
};

// refactored from code being more or less duplicated between Banner.tsx and GrouptItemContextMenu.tsx
// this ensures consistency with the handling of new view creation from the saved view widget
const _createNewSavedView = async (props: CreateNewSavedViewProps) => {
  const savedViewData = await SavedViewUtil.createSavedViewObject(props.vp, props.name, props.userId, props.shared);
  if (props.groupId) {
    savedViewData.groupId = props.groupId;
  }

  if (!isSpatialSavedView(savedViewData) && !props.want2dViews) {
    throw new Error("No support for 2D views yet");
  }

  const save = (omitEmphasizedElements = false) => {
    if (omitEmphasizedElements) {
      savedViewData.emphasizeElementsProps = undefined;
    }

    props.cache
      .createSavedView(props.iModel, savedViewData)
      .then(() => {
        if (props.onSuccess) {
          props.onSuccess(savedViewData);
        }
      })
      .catch((ex: Error) => {
        Logger.logError(LOGGERCATEGORY, `Failed saving view named: ${savedViewData.name}`, () => ({ ...ex }));
        if (props.onError) {
          props.onError(savedViewData, ex);
        }
      });
  };

  // handleTooManyEmphasizedElements is used here to gate the following behavior:
  //  - showing a dialogue if the saved view is too large because of emphasized elements to allow the user to save the view without them (instead of just experiencing an unexpected failure)
  //  - showing an error toast if the view is too large to save for some reason other than the emphasized elements
  if (
    props.handleTooManyEmphasizedElements &&
    isSavedViewTooLarge(savedViewData)
  ) {
    if (isTooManyEmphasizedElements(savedViewData)) {
      const onContinue = () => save(true);
      const onCancel = () => props.onCancel?.();
      UiFramework.dialogs.modal.open(<OversizedViewsDialog onContinue={onContinue} onCancel={onCancel} />);
    } else {
      Logger.logError(LOGGERCATEGORY, "Save View too large to save");
      if (props.onTooLarge) {
        props.onTooLarge(savedViewData);
      }
    }
  } else {
    save(false);
  }
};
