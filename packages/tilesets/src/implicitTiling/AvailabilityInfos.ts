import { defined } from "@3d-tiles-tools/base";

import { Availability } from "@3d-tiles-tools/structure";
import { TileImplicitTiling } from "@3d-tiles-tools/structure";

import { AvailabilityInfo } from "./AvailabilityInfo.js";
import { BufferAvailabilityInfo } from "./BufferAvailabilityInfo.js";
import { ConstantAvailabilityInfo } from "./ConstantAvailabilityInfo.js";
import { ImplicitTilings } from "./ImplicitTilings.js";
import { ImplicitTilingError } from "./ImplicitTilingError.js";

/**
 * Methods for creating `AvailabilityInfo` instances
 *
 * @internal
 */
export class AvailabilityInfos {
  /**
   * Creates a new `AvailabilityInfo` for the given availability
   * information, for tile- or content availability.
   *
   * @param availability - The `Availability` object
   * @param bufferViewDatas - The `BufferView` data chunks
   * @param implicitTiling - The `TileImplicitTiling` object
   * @returns The `AvailabilityInfo` object
   * @throws ImplicitTilingError If the given data is structurally
   * invalid.
   */
  static createTileOrContent(
    availability: Availability,
    bufferViewDatas: Buffer[],
    implicitTiling: TileImplicitTiling
  ): AvailabilityInfo {
    const length =
      ImplicitTilings.computeNumberOfNodesPerSubtree(implicitTiling);
    return AvailabilityInfos.create(availability, bufferViewDatas, length);
  }

  /**
   * Creates a new `AvailabilityInfo` for the given availability
   * information, for child subtree availability
   *
   * @param availability - The `Availability` object
   * @param bufferViewDatas - The `BufferView` data chunks
   * @param implicitTiling - The `TileImplicitTiling` object
   * @returns The `AvailabilityInfo` object
   * @throws ImplicitTilingError If the given data is structurally
   * invalid.
   */
  static createChildSubtree(
    availability: Availability,
    bufferViewDatas: Buffer[],
    implicitTiling: TileImplicitTiling
  ): AvailabilityInfo {
    const length = ImplicitTilings.computeNumberOfNodesInLevel(
      implicitTiling,
      implicitTiling.subtreeLevels
    );
    return AvailabilityInfos.create(availability, bufferViewDatas, length);
  }

  /**
   * Creates a new `AvailabilityInfo` for the given availability
   * information, for child subtree availability
   *
   * @param availability - The `Availability` object
   * @param bufferViewDatas - The `BufferView` data chunks
   * @param length - The length of the availability info
   * @returns The `AvailabilityInfo` object
   * @throws ImplicitTilingError If the data is structurally invalid
   */
  private static create(
    availability: Availability,
    bufferViewDatas: Buffer[],
    length: number
  ): AvailabilityInfo {
    const constant = availability.constant;
    if (defined(constant)) {
      const available = constant === 1;
      return new ConstantAvailabilityInfo(available, length);
    }
    // The bitstream MUST be defined when constant is undefined
    const bitstream = availability.bitstream;
    if (!defined(bitstream)) {
      throw new ImplicitTilingError(
        "The availability neither defines a constant nor a bitstream"
      );
    }
    const bufferViewData = bufferViewDatas[bitstream];
    return new BufferAvailabilityInfo(bufferViewData, length);
  }
}
