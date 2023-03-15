import { NodeIO, Document } from '@gltf-transform/core';
import fs from "fs/promises";
import express from 'express';

const app = express()
const port = 3000



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/3dmodel', async (req, res) => {
    const io = new NodeIO();

    var gltfmodel = new Document();
    
    gltfmodel = await io.read("./3dmodel/mario.gltf");
    
    gltfmodel.getRoot().listTextures()[0].setImage(await fs.readFile('./greenTexture.png'));
    gltfmodel.getRoot().listTextures()[0].setURI("greenTexture.png");
    
    var jsonModel = await io.writeJSON(gltfmodel).then((json)=> {
        return json;
    })
    
    res.send(jsonModel);
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})