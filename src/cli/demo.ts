import path from "path";
import { ContentDataTypes, Paths } from "../base";
import { Tileset } from "../structure";
import { TileFormats, TilesetEntry, TilesetSource } from "../tilesets";
import { BasicTilesetProcessor, GltfUtilities } from "../tools";

const tilesetDir = "D:\\test111";
// const tilesetSource = "http://10.32.216.67:8082/hcity/HCity.hcx/ecp/longfenglu/yh3lp53rwg6phpowge_6.hcd/1_9_0.json";
const tilesetSource =
  "http://10.32.216.67:8082/hcity/HCity.hcx/ecp/longfenglu/yh3lp53rwg6phpowge_6.hcd/1_14_0.json";
const tilesetTarget = Paths.join(tilesetDir, path.basename(tilesetSource));

async function processEntryUnchecked(
  sourceEntry: TilesetEntry,
  type: string | undefined,
  tilesetSource: TilesetSource
): Promise<string[]> {
  if (type === ContentDataTypes.CONTENT_TYPE_PNTS) {
    return processEntryPnts(sourceEntry);
  }
  if (type === ContentDataTypes.CONTENT_TYPE_B3DM) {
    return await processEntryB3dm(sourceEntry);
  } else if (type === ContentDataTypes.CONTENT_TYPE_I3DM) {
    return await processEntryI3dm(sourceEntry, tilesetSource);
  }
  return [];
}

async function processEntryPnts(sourceEntry: TilesetEntry): Promise<string[]> {
  const sourceKey = sourceEntry.key;
  const sourceValue = sourceEntry.value;
  return [];
}

async function processEntryB3dm(sourceEntry: TilesetEntry): Promise<string[]> {
  const sourceKey = sourceEntry.key;
  const sourceValue = sourceEntry.value;

  const inputTileData = TileFormats.readTileData(sourceValue);
  const inputGlb = inputTileData.payload;

  return processGlbImage(inputGlb, sourceKey);
}

async function processEntryI3dm(
  sourceEntry: TilesetEntry,
  tilesetSource: TilesetSource
): Promise<string[]> {
  const sourceKey = sourceEntry.key;
  const sourceValue = sourceEntry.value;
  const inputTileData = TileFormats.readTileData(sourceValue);
  if (inputTileData.header.gltfFormat === 1) {
    return processGlbImage(inputTileData.payload, sourceKey);
  }
  let glbUrl = inputTileData.payload.toString();
  glbUrl = Paths.join(sourceKey, glbUrl);
  const glb = await tilesetSource.getAsyncValue(glbUrl);
  let result: string[] = [];
  result.push(glbUrl);
  if (glb) {
    result = result.concat(processGlbImage(glb, glbUrl));
  }
  return result;
}

function processGlbImage(glb: Buffer, basePath: string): string[] {
  try {
    const gltf = JSON.parse(GltfUtilities.extractJsonFromGlb(glb).toString());
    const images = gltf["images"];
    const result: string[] = [];
    if (images) {
      Object.keys(images).forEach((key) => {
        const item = images[key];
        if (item.uri) {
          result.push(Paths.join(basePath, item.uri));
        }
      });
    }
    return result;
  } catch (err) {
    console.log(err);
    return [];
  }
}

async function main() {
  const tilesetProcessor = new BasicTilesetProcessor(true);
  await tilesetProcessor.begin(tilesetSource, tilesetTarget, true);

  await tilesetProcessor.forTileset(
    // eslint-disable-next-line
    async (tileset: Tileset) => {
      return tileset;
    }
  );

  await tilesetProcessor.processTileContentEntries(
    (uri: string) => {
      return uri;
    },
    async (
      sourceEntry: TilesetEntry,
      type: string | undefined
    ): Promise<TilesetEntry> => {
      const resourceKeys = await processEntryUnchecked(
        sourceEntry,
        type,
        tilesetProcessor.getContext().tilesetSource
      );
      for (let i = 0; i < resourceKeys.length; i++) {
        await tilesetProcessor.processEntry(
          resourceKeys[i],
          async (sourceEntry: TilesetEntry, type: string | undefined) => {
            return sourceEntry;
          }
        );
      }
      const targetKey = {
        key: sourceEntry.key,
        value: sourceEntry.value,
      };
      return targetKey;
    }
  );

  await tilesetProcessor.end();
}

main();
