import { NodeIO, Document } from "@gltf-transform/core";
import * as fs from "fs/promises";

export async function replaceTexture(
  textureFilePath: string,
  asset3dFilePath: string
): Promise<Uint8Array> {
  const io = new NodeIO();

  let gltfmodel = new Document();

  gltfmodel = await io.read(asset3dFilePath);

  gltfmodel
    .getRoot()
    .listTextures()[0]
    .setImage(await fs.readFile(textureFilePath));

  gltfmodel.getRoot().listTextures()[0].setURI(textureFilePath);

  const binaryBuffer = await io.writeBinary(gltfmodel).then((json) => {
    return json;
  });

  return binaryBuffer;
}
