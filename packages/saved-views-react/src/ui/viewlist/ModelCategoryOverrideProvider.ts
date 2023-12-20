/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { FeatureAppearance, type FeatureAppearanceProps } from "@itwin/core-common";
import type { FeatureOverrideProvider, FeatureSymbology, Viewport } from "@itwin/core-frontend";

interface AppearanceOverrideProps {
  ids: string[];
  app: FeatureAppearanceProps;
}

/** Overrides given categories to provide emphasize functionality
 *  @public
 */
export interface ModelCategoryOverrideProviderProps {
  subCategoryOverrides?: AppearanceOverrideProps[];
  modelOverrides?: AppearanceOverrideProps[];
  catEmphasizeOverride?: AppearanceOverrideProps;
  modelEmphasizeOverride?: AppearanceOverrideProps;
}

/** Model & Category override provider (override plus emphasize)
 *  @public
 */
export class ModelCategoryOverrideProvider implements FeatureOverrideProvider {
  private readonly _subCategoryOverrides = new Map<
    string[],
    FeatureAppearance
  >();
  private readonly _modelOverrides = new Map<string[], FeatureAppearance>();
  private readonly _emphasizedSubcats: string[] = [];
  private readonly _emphasizedModels: string[] = [];
  private _catDefaultAppearance?: FeatureAppearance;
  private _modelDefaultAppearance?: FeatureAppearance;

  public static get(vp: Viewport): ModelCategoryOverrideProvider | undefined {
    return vp.findFeatureOverrideProviderOfType<ModelCategoryOverrideProvider>(ModelCategoryOverrideProvider);
  }

  public static getOrCreate(vp: Viewport): ModelCategoryOverrideProvider {
    let provider = this.get(vp);
    if (!provider) {
      provider = new ModelCategoryOverrideProvider();
      vp.addFeatureOverrideProvider(provider);
    }

    return provider;
  }

  public addFeatureOverrides(overrides: FeatureSymbology.Overrides, _vp: Viewport): void {
    this._subCategoryOverrides.forEach(
      (appearance: FeatureAppearance, ids: string[], _map) => {
        ids.forEach((id: string) => {
          overrides.override({ subCategoryId: id, appearance });
        });
      },
    );

    this._modelOverrides.forEach(
      (appearance: FeatureAppearance, ids: string[], _map) => {
        ids.forEach((id: string) => {
          overrides.override({ modelId: id, appearance });
        });
      },
    );

    if (0 !== this._emphasizedSubcats.length) {
      if (this._catDefaultAppearance) {
        overrides.setDefaultOverrides(this._catDefaultAppearance, true);
      }
      // Override with nothing so that we keep the category looking normal and override the default appearance of everything else
      const override = FeatureAppearance.fromJSON({});
      this._emphasizedSubcats.forEach((id: string) => {
        overrides.override({
          subCategoryId: id,
          appearance: override,
          onConflict: "replace",
        });
      });
    }

    if (0 !== this._emphasizedModels.length) {
      if (this._modelDefaultAppearance) {
        overrides.setDefaultOverrides(this._modelDefaultAppearance, true);
      }
      // Override with nothing so that we keep the category looking normal and override the default appearance of everything else
      const override = FeatureAppearance.fromJSON({});
      this._emphasizedModels.forEach((id: string) => {
        overrides.override({
          modelId: id,
          appearance: override,
          onConflict: "replace",
        });
      });
    }
  }

  public fromJSON(props: ModelCategoryOverrideProviderProps): boolean {
    if (props.subCategoryOverrides) {
      props.subCategoryOverrides.forEach(
        (appProps: AppearanceOverrideProps) => {
          this._subCategoryOverrides.set(appProps.ids, FeatureAppearance.fromJSON(appProps.app));
        },
      );
    }

    if (props.modelOverrides) {
      props.modelOverrides.forEach((appProps: AppearanceOverrideProps) => {
        this._modelOverrides.set(appProps.ids, FeatureAppearance.fromJSON(appProps.app));
      });
    }

    if (props.catEmphasizeOverride) {
      this._emphasizedSubcats.push(...props.catEmphasizeOverride.ids);
      this._catDefaultAppearance = FeatureAppearance.fromJSON(props.catEmphasizeOverride.app);
    }

    if (props.modelEmphasizeOverride) {
      this._emphasizedModels.push(...props.modelEmphasizeOverride.ids);
      this._modelDefaultAppearance = FeatureAppearance.fromJSON(props.modelEmphasizeOverride.app);
    }

    return true;
  }
}
