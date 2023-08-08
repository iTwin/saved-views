// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { SavedViewsExtensionsClient } from "./extensionsClient";
import { GroupClient } from "./groupClient";
import { SaveViewsClient } from './savedClient';
import { TagsClient } from "./tagsService";
import { ImageClient } from './imageClient';

/**
 * This is a monoClient that is used to access all the other clients associated with savedViews.
 * When an instance is made a user can access all other clients i.e SavedViewsClient GroupClient TagClient ExtensionClient ImageClient
 * Each client may have methods that are not shared with other clients please look at the client interfaces for further docs
 *
 * Usage Example
 * const savedViewsClient = new SavedViewsMonoClient(...)
 * savedViewsClient.savedViewsClient.getSavedView(...)
 * savedViewsClient.tagClient.getTag(..)
 * saveViewsClient.extensionsClient.getExtension(...)
 * saveViewsClient.imageClient.getImage(...)
 * saveViewsClient.groupClient.getGroup(...)
*/
export class SaveViewsMonoClient {

  private readonly _savedViewsClient: SaveViewsClient;
  private readonly _tagClient: TagsClient;
  private readonly _extensionClient: SavedViewsExtensionsClient;
  private readonly _groupClient: GroupClient;
  private readonly _imageClient: ImageClient;

  constructor() {
    this._savedViewsClient = new SaveViewsClient();
    this._tagClient = new TagsClient();
    this._extensionClient = new SavedViewsExtensionsClient();
    this._groupClient = new GroupClient();
    this._imageClient = new ImageClient();
  }


  /**
   * return client
   * @returns client
   */
  get savedViewsClient() {
    return this._savedViewsClient;
  }

  /**
  * return client
  * @returns client
  */
  get tagClient() {
    return this._tagClient;
  }

  /**
  * return client
  * @returns client
  */
  get extensionClient() {
    return this._extensionClient;
  }

  /**
  * return client
  * @returns client
  */
  get groupClient() {
    return this._groupClient;
  }

  /**
  *  return client
  * @returns client
  */
  get imageClient() {
    return this._imageClient;
  }
}
