import { TileFormats } from "../../tilesets";

import { GltfUtilities } from "./GltfUtilities";

/**
 * Internal class containing functions to upgrade tile content data.
 *
 * For now, this covers the narrow case of B3DM and I3DM data where
 * the contained GLB should be upgraded from glTF 1.0 to glTF 2.0
 * with `gltf-pipeline`. (Specifically: This does not change the
 * type of the data itself)
 *
 * @internal
 */
export class ContentUpgrades {
  /**
   * For the given B3DM data buffer, extract the GLB, upgrade it
   * with `GltfUtilities.upgradeGlb`, create a new B3DM from the
   * result, and return it.
   *
   * @param inputBuffer - The input buffer
   * @param options - Options that will be passed to the
   * `gltf-pipeline` when the GLB is processed.
   * @returns The upgraded buffer
   */
  static async upgradeB3dmGltf1ToGltf2(
    inputBuffer: Buffer,
    options: any
  ): Promise<Buffer> {
    const inputTileData = TileFormats.readTileData(inputBuffer);
    const inputGlb = inputTileData.payload;
    let outputGlb = await GltfUtilities.upgradeGlb(inputGlb, options);
    const setRTCCenterResolver = (rtcTranslation: number[] | undefined) => {
      if (rtcTranslation && inputTileData.featureTable.json) {
        inputTileData.featureTable.json['RTC_CENTER'] = rtcTranslation;
      }
    }
    outputGlb = await GltfUtilities.removeCesiumRtcExtension(outputGlb, setRTCCenterResolver);
    outputGlb = await GltfUtilities.checkGltf2BatchIDBufferView(outputGlb);
    const outputTileData = TileFormats.createB3dmTileDataFromGlb(
      outputGlb,
      inputTileData.featureTable.json,
      inputTileData.featureTable.binary,
      inputTileData.batchTable.json,
      inputTileData.batchTable.binary
    );
    const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
    return outputBuffer;
  }


  /**
   * For the given I3DM data buffer, extract the GLB, upgrade it
   * with `GltfUtilities.upgradeGlb`, create a new B3DM from the
   * result, and return it.
   *
   * @param inputBuffer - The input buffer
   * @param options - Options that will be passed to the
   * `gltf-pipeline` when the GLB is processed.
   * @returns The upgraded buffer
   */
  static async upgradeI3dmGltf1ToGltf2(
    inputBuffer: Buffer,
    options: any,
    externalGlbResolver: (uri: string) => Promise<Buffer | undefined>,
    externalGlbResourceResolver: (uri: string) => string | undefined,
    externalStoreGlbResolver: (buff: Buffer, uri: string) => void
  ): Promise<Buffer> {
    const inputTileData = TileFormats.readTileData(inputBuffer);
    let inputGlb = inputTileData.payload;
    if (options) {
      options.resourceDirectory = undefined;
    }
    if (inputTileData.header.gltfFormat === 0) {
      const glbUri = inputTileData.payload.toString().replace(/\0/g, "");
      const glbBuf = await externalGlbResolver(glbUri);
      inputGlb = glbBuf ? glbBuf : inputGlb;

      options = options || {};
      options.resourceDirectory = externalGlbResourceResolver(glbUri);
    }
    let outputGlb = await GltfUtilities.upgradeGlb(inputGlb, options);
    outputGlb = await GltfUtilities.checkGltf2BatchIDBufferView(outputGlb);
    if (inputTileData.header.gltfFormat === 0) {
      const glbUri = inputTileData.payload.toString().replace(/\0/g, "");
      externalStoreGlbResolver(outputGlb, glbUri);
      // 抛出异常，不再处理i3dm
      throw new Error('内嵌glb，不再处理i3dm');
    }
    const outputTileData = TileFormats.createI3dmTileDataFromGlb(
      outputGlb,
      inputTileData.featureTable.json,
      inputTileData.featureTable.binary,
      inputTileData.batchTable.json,
      inputTileData.batchTable.binary
    );
    const outputBuffer = TileFormats.createTileDataBuffer(outputTileData);
    return outputBuffer;
  }
}
