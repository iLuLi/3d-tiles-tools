import fs from "fs";
import path from "path";
import { URL } from 'url';
import { Resource } from 'cesium';

import { TilesetSource } from "./TilesetSource";
import { TilesetError } from "./TilesetError";

/**
 * Implementation of a TilesetSource based on a directory
 * in a file system
 *
 * @internal
 */
export class TilesetSourceHttp implements TilesetSource {
  /**
   * The full name of the directory that contains the tileset.json file
   */
  private baseURL: string | undefined;

  /**
   * Default constructor
   */
  constructor() {
    this.baseURL = undefined;
  }
  

  /** {@inheritDoc TilesetSource.open} */
  open(baseURL: string) {
    if (this.baseURL) {
      throw new TilesetError("Source already opened");
    }
    this.baseURL = baseURL;
  }

  /** {@inheritDoc TilesetSource.getKeys} */
  getKeys() {
    return [];
  }

  /** {@inheritDoc TilesetSource.getValue} */
  async getAsyncValue(key: string): Promise<Buffer | undefined> {
    if (!this.baseURL) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    const url = new URL(key, this.baseURL).toString();
    try {
      const fetchArrayBuffer = await Resource.fetchArrayBuffer({url: url});
      if (fetchArrayBuffer) {
        return Buffer.from(fetchArrayBuffer);
      } else {
        return undefined;
      }
    } catch (error) {
      return undefined;
    }
  }
  
  getValue(key: string): Buffer | undefined {
    throw new Error("Method not implemented.");
  }

  getFullKey(key: string) {
    if (!this.baseURL) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    const fullFileName = new URL(key, this.baseURL).toString();
    return fullFileName;
  }

  /** {@inheritDoc TilesetSource.close} */
  close() {
    if (!this.baseURL) {
      throw new TilesetError("Source is not opened. Call 'open' first.");
    }
    this.baseURL = undefined;
  }
}
