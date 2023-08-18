/* eslint-disable no-useless-escape */
// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { parse, stringify } from "uuid";
import { encode, decode } from "base64-arraybuffer";
import { ContextIds } from "../models/ContextIds.dto";
import { isBase64 } from "class-validator";

const UUID_BYTE_COUNT = 16;
const BASE64_BYTE_LENGTH = 4;
const discriminatorIsSourceValue = (value: string | number): value is number =>
  typeof value === "number";

/**
 * Class allowing quick transformation between public/internal id for a resource
 */
export class CombinedId implements ContextIds {
  public readonly combinedIdString!: string;
  public readonly source!: number;
  public readonly resourceId!: string;
  public readonly iTwinId!: string;
  public readonly iModelId?: string;

  constructor(
    source: number,
    resourceId: string,
    iTwinId: string,
    iModelId?: string
  );
  constructor(combinedId: string);
  constructor(
    discriminator: string | number,
    resourceId?: string,
    iTwinId?: string,
    iModelId?: string,
  ) {
    if (discriminatorIsSourceValue(discriminator)) {
      const source = discriminator;
      const combinedId = CombinedId.combine(
        source,
        resourceId ?? "",
        iTwinId ?? "",
        iModelId,
      );
      if (combinedId) {
        this.combinedIdString = combinedId;
        this.source = source;
        this.resourceId = resourceId ?? "";
        this.iTwinId = iTwinId ?? "";
        this.iModelId = iModelId;
      }
    } else {
      const combinedId = discriminator;
      const ids = CombinedId.separate(combinedId);
      if (ids) {
        this.source = ids.source;
        this.resourceId = ids.resourceId;
        this.iTwinId = ids.iTwinId;
        this.iModelId = ids.iModelId;
        this.combinedIdString = combinedId;
      }
    }
  }
  /**
   * Reorder default uuid.parse and uuid.stringify byte order so they conform to RFC (so it work like C# ToByteArray)
   * @param id
   */
  private static reorderByteGroupsToRFCinPlace(id: Uint8Array) {
    id.set(id.subarray(0, 4).reverse());
    id.set(id.subarray(4, 6).reverse(), 4);
    id.set(id.subarray(6, 8).reverse(), 6);
  }

  /**
   * Combine multiple UUID into a single URL parsable string,
   * Following https://dev.azure.com/bentleycs/beconnect/_wiki/wikis/API%20Management/9754/Standards-and-Conventions
   * (APIM Policies must be able to handle these)
   * @param resourceId Resource id
   * @param iTwinId name of iTwin ID.
   * @param iModelId name of iModel ID.
   */
  public static combine(
    source: number,
    resourceId?: string,
    iTwinId?: string,
    iModelId?: string
  ): string;
  public static combine(source: number, ...args: string[]): string {
    try {
      if (source < 0 || source > 255 || !args[0] || !args[1]) {
        return "";
      }
      const ids = args.filter((a) => !!a);
      const combinedBytes = new Uint8Array(1 + ids.length * UUID_BYTE_COUNT);
      combinedBytes.set([source]);
      ids.forEach((id, index) => {
        combinedBytes.set(parse(id), 1 + index * UUID_BYTE_COUNT);
        CombinedId.reorderByteGroupsToRFCinPlace(
          combinedBytes.subarray(
            1 + index * UUID_BYTE_COUNT,
            1 + (index + 1) * UUID_BYTE_COUNT,
          ),
        );
      });
      return encode(combinedBytes).replace(/[=+\/]/g, (c: string) =>
        c === "=" ? "" : c === "+" ? "-" : "_",
      );
    } catch (error) {
      return "";
    }
  }

  /**
   * Decode and split a combinedId into individual UUID strings.
   * @param combinedId Previously combined single URL parsable string
   * @returns object containing the decoded fields, or undefined if an error occurs
   */
  public static separate(combinedId = "") {
    const base64 = combinedId
      .replace(/[-_]/g, (c) => (c === "-" ? "+" : "/"))
      .padEnd(
        Math.ceil(combinedId.length / BASE64_BYTE_LENGTH) * BASE64_BYTE_LENGTH,
        "=",
      );
    if (!isBase64(base64)) {
      return undefined;
    }
    const combinedBytes = decode(base64);
    if ((combinedBytes.byteLength - 1) % UUID_BYTE_COUNT !== 0) {
      return undefined;
    }
    const source = new Uint8Array(combinedBytes.slice(0, 1))[0];
    const idsBytes = combinedBytes.slice(1);
    const ids = [];
    for (let i = 0; i < idsBytes.byteLength / UUID_BYTE_COUNT; i++) {
      const id = new Uint8Array(
        idsBytes.slice(i * UUID_BYTE_COUNT, (i + 1) * UUID_BYTE_COUNT),
      );
      CombinedId.reorderByteGroupsToRFCinPlace(id);
      try {
        ids.push(stringify(id));
      } catch (error) {
        return undefined;
      }
    }
    if (ids.length < 2) {
      return undefined;
    }
    return {
      source,
      resourceId: ids[0],
      iTwinId: ids[1],
      iModelId: ids[2],
    };
  }
}
