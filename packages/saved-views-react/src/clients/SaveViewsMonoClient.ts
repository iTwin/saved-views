// Copyright (c) Bentley Systems, Incorporated. All rights reserved.

import { SavedViewsExtensionsClient } from "./baseClients/extensionsClient";
import { GroupClient } from "./baseClients/groupClient";
import { SaveViewsClient } from './baseClients/savedViewsClient';
import { TagsClient } from "./baseClients/tagsClient";
import { ImageClient } from './baseClients/imageClient';
import { commonClientArgs, isValidBaseUrl } from "./models/clientModels/CommonClientInterfaces";

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

  constructor(args: commonClientArgs) {
    if (!isValidBaseUrl(args.baseURL)) {
      throw new Error("Base URL does not conform to pattern: https://{...}api.bentley.com/savedviews");
    }
    this._savedViewsClient = new SaveViewsClient(args);
    this._tagClient = new TagsClient(args);
    this._extensionClient = new SavedViewsExtensionsClient(args);
    this._groupClient = new GroupClient(args);
    this._imageClient = new ImageClient(args);
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
