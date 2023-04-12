import { NodeIO, Document } from '@gltf-transform/core';
import * as fs from "fs/promises";

export async function replaceTexture(texture) {
    const io = new NodeIO();

    var gltfmodel = new Document();
    
    gltfmodel = await io.read("./3dmodel/mario.gltf");

    gltfmodel.getRoot().listTextures()[0].setImage(await fs.readFile('./greenTexture.png'));
    gltfmodel.getRoot().listTextures()[0].setURI("greenTexture.png");

    var jsonModel = await io.writeBinary(gltfmodel).then((json)=> {
        console.log(json)
        return json;
    });

    return jsonModel;
}