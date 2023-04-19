import { NodeIO, Document } from "@gltf-transform/core";
import * as fs from "fs/promises";

export async function replaceTexture(textureFilePath, asset3dFilePath) {
  const io = new NodeIO();

  var gltfmodel = new Document();

  gltfmodel = await io.read(asset3dFilePath);

  gltfmodel
    .getRoot()
    .listTextures()[0]
    .setImage(await fs.readFile(textureFilePath));

  gltfmodel.getRoot().listTextures()[0].setURI(textureFilePath);

  var jsonModel = await io.writeBinary(gltfmodel).then((json) => {
    return json;
  });

  return jsonModel;
}
