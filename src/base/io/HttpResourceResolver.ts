import path from "path";
import { URL } from 'url';
import { Resource } from 'cesium';

import { Uris } from "../base/Uris";

import { ResourceResolver } from "./ResourceResolver";

/**
 * Implementation of a `ResourceResolver` based on a file system.
 *
 * @internal (Instantiated by the `ResourceResolvers` class)
 */
export class HttpResourceResolver implements ResourceResolver {
  private readonly _baseUrl: string;

  constructor(baseUrl: string) {
    this._baseUrl = baseUrl;
  }

  private resolveUri(uri: string): string {
    const resolved = new URL(uri, this._baseUrl);
    return resolved.toString();
  }

  /** {@inheritDoc ResourceResolver.resolveDataPartial} */
  async resolveDataPartial(
    uri: string
  ): Promise<Buffer | null> {
    if (Uris.isDataUri(uri)) {
      const data = Buffer.from(uri.split(",")[1], "base64");
      return data;
    }
    if (!Uris.isAbsoluteUri(uri)) {
      return null;
    }
    const resolved = this.resolveUri(uri);
    try {
      const fetchArrayBuffer = await Resource.fetchArrayBuffer({url: resolved});
      if (fetchArrayBuffer) {
        return Buffer.from(fetchArrayBuffer);
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  /** {@inheritDoc ResourceResolver.resolveData} */
  async resolveData(uri: string): Promise<Buffer | null> {
    if (Uris.isDataUri(uri)) {
      const data = Buffer.from(uri.split(",")[1], "base64");
      return data;
    }
    if (!Uris.isAbsoluteUri(uri)) {
      return null;
    }
    const resolved = this.resolveUri(uri);
    try {
      const fetchArrayBuffer = await Resource.fetchArrayBuffer({url: resolved});
      if (fetchArrayBuffer) {
        return Buffer.from(fetchArrayBuffer);
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  /** {@inheritDoc ResourceResolver.derive} */
  derive(uri: string): ResourceResolver {
    const resolved = path.join(this._baseUrl, decodeURIComponent(uri));
    return new HttpResourceResolver(resolved);
  }
}
