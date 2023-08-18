/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { BeUiEvent } from "@itwin/core-bentley";
import { type IModelConnection } from "@itwin/core-frontend";

import { IGroupClient } from "../clients/IGroupClient";
import { type Group, type GroupUpdate } from "../utilities/SavedViewTypes";

/** Event types to delineate what kind of change occurred when the group cache is modified */
export enum GroupCacheEventType {
  GroupAdded,
  GroupRemoved,
  GroupShared,
  GroupUpdated,
  CacheSync,
}

export interface GroupCacheEventArgs {
  group?: Group;
  eventType: GroupCacheEventType;
}

/** Group cache event */
export class GroupCacheEvent extends BeUiEvent<GroupCacheEventArgs> {}

export class GroupCache {
  private _client: IGroupClient;
  private _cache: Group[] | undefined;
  private _timerId: ReturnType<typeof setInterval> | undefined;
  private _interval: number;

  constructor(client: IGroupClient) {
    this._client = client;
    this._interval = 0;
  }

  /** Event for whenever a group in the cache is modified, updated, delete or created OR if the cache is synced */
  public static readonly ON_CACHE_EVENT = new GroupCacheEvent();

  public getNewGroupName(): string | undefined {
    if (!this._cache) {
      return undefined;
    }

    const allNumbersInUse = this._cache
      .filter((value) => value.name.match(/(New Group)( )(\d+)/))
      .map((value) => +value.name.split(" ")[2]);
    const set = new Set(allNumbersInUse);

    for (let i = 1; ; i++) {
      if (!set.has(i)) {
        return `New Group ${i}`;
      }
    }
  }

  public async createGroup(iModelConnection: IModelConnection, data: Group) {
    const group: Group = await this._client.createGroup(iModelConnection, data);

    // Update cache
    if (this._cache) {
      const ungrouped = this._cache.shift();
      this._cache.unshift(group);
      ungrouped && this._cache.unshift(ungrouped);
    }

    GroupCache.ON_CACHE_EVENT.emit({
      group,
      eventType: GroupCacheEventType.GroupAdded,
    });
    return group;
  }

  public hasGroup(group: Group) {
    if (!this._cache) {
      return false;
    }

    return (
      this._cache.filter((value) => group.id === value.id).length !== 0
    );
  }

  public async updateGroup(iModelConnection: IModelConnection, data: GroupUpdate, group: Group) {
    const updatedGroup: Group = await this._client.updateGroup(iModelConnection, data, group);

    // Update cache
    if (this._cache) {
      this._cache = this._cache.map((value: Group) => {
        if (value.id === group.id) {
          return updatedGroup;
        }

        return value;
      });

      GroupCache.ON_CACHE_EVENT.emit({
        group: updatedGroup,
        eventType: GroupCacheEventType.GroupUpdated,
      });
    }
  }

  public async deleteGroup(iModelConnection: IModelConnection, group: Group) {
    const id = group.id;
    await this._client.deleteGroup(iModelConnection, group);

    // Update cache
    if (this._cache) {
      this._cache = this._cache.filter((value: Group) => value.id !== id);
    }

    GroupCache.ON_CACHE_EVENT.emit({
      group,
      eventType: GroupCacheEventType.GroupRemoved,
    });
  }

  public async shareGroup(iModelConnection: IModelConnection, group: Group, share: boolean) {
    const sharedGroup = await this._client.shareGroup(iModelConnection, group, share);

    // Update cache
    if (this._cache) {
      this._cache = this._cache.map((g: Group) => {
        if (g.id === sharedGroup.id) {
          return sharedGroup;
        }

        return g;
      });
    }

    GroupCache.ON_CACHE_EVENT.emit({
      group: sharedGroup,
      eventType: GroupCacheEventType.GroupShared,
    });
  }

  public async syncCache(iModelConnection: IModelConnection) {
    try {
      await this.getGroups(iModelConnection, true);

      GroupCache.ON_CACHE_EVENT.emit({
        eventType: GroupCacheEventType.CacheSync,
      });
    } catch (e) {
      // Stop automatic syncing if requests are failing
      this.clearAutomaticSync(iModelConnection);
    }
  }

  public setupAutomaticSync(iModelConnection: IModelConnection, interval: number) {
    // Initialize timer Id
    this._timerId = setInterval(async () => {
      await this.syncCache(iModelConnection);
    }, interval);
    this._interval = interval;
  }

  public clearAutomaticSync(iModelConnection: IModelConnection, reset?: boolean) {
    clearInterval(this._timerId);

    if (reset) {
      this.setupAutomaticSync(iModelConnection, this._interval);
    }
  }

  public async getGroups(iModelConnection: IModelConnection, refresh?: boolean) {
    if (!this._cache || refresh) {
      this._cache = await this._client.getGroups(iModelConnection);
    }

    return this._cache;
  }
}
