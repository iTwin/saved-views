// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import {
  type FeatureAppearanceProps,
  FeatureAppearance,
} from "@itwin/core-common";
import {
  type FeatureOverrideProvider,
  type FeatureSymbology,
  type Viewport,
} from "@itwin/core-frontend";

/**
 * Note: this file should be included (added) to ui-framework.  It is included
 * here until iT1/iT3 is using core 3.0 packages
 */

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

  public overrideSubcategories(subCategoryIds: string[], appearance: FeatureAppearance) {
    this._subCategoryOverrides.set(subCategoryIds, appearance);
  }

  public overrideModels(modelIds: string[], appearance: FeatureAppearance) {
    this._modelOverrides.set(modelIds, appearance);
  }

  public emphasizeSubcategories(subCategoryIds: string[], defaultAppearance: FeatureAppearance) {
    this._emphasizedSubcats.push(...subCategoryIds);
    this._catDefaultAppearance = defaultAppearance;
  }

  public emphasizeModels(modelIds: string[], defaultAppearance: FeatureAppearance) {
    this._emphasizedModels.push(...modelIds);
    this._modelDefaultAppearance = defaultAppearance;
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

  public toJSON(): ModelCategoryOverrideProviderProps {
    const props: ModelCategoryOverrideProviderProps = {};
    if (0 !== this._subCategoryOverrides.size) {
      const appearanceOverride: AppearanceOverrideProps[] = [];
      this._subCategoryOverrides.forEach(
        (appearance: FeatureAppearance, ids: string[], _map) => {
          const app = appearance.toJSON();
          appearanceOverride.push({ ids: [...ids], app });
        },
      );

      props.subCategoryOverrides = appearanceOverride;
    }

    if (0 !== this._modelOverrides.size) {
      const appearanceOverride: AppearanceOverrideProps[] = [];
      this._modelOverrides.forEach(
        (appearance: FeatureAppearance, ids: string[], _map) => {
          const app = appearance.toJSON();
          appearanceOverride.push({ ids: [...ids], app });
        },
      );

      props.modelOverrides = appearanceOverride;
    }

    if (0 !== this._emphasizedSubcats.length && this._catDefaultAppearance) {
      const appearanceOverride: AppearanceOverrideProps = {
        ids: [...this._emphasizedSubcats],
        app: this._catDefaultAppearance,
      };
      props.catEmphasizeOverride = appearanceOverride;
    }

    if (0 !== this._emphasizedModels.length && this._modelDefaultAppearance) {
      const appearanceOverride: AppearanceOverrideProps = {
        ids: [...this._emphasizedModels],
        app: this._modelDefaultAppearance,
      };
      props.modelEmphasizeOverride = appearanceOverride;
    }

    return props;
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
