import { NodeIO, Document } from '@gltf-transform/core';
import * as fs from "fs/promises";
import express from "express";

import dotenv from 'dotenv'

dotenv.config();

import { getBucketList, getObjectLsit } from "./services/aws.js"

const app = express()
const port = 3000

getBucketList();

getObjectLsit();

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/3dmodel', async (req, res) => {
    const io = new NodeIO();

    var gltfmodel = new Document();
    
    gltfmodel = await io.read("./3dmodel/mario.gltf");
    
    gltfmodel.getRoot().listTextures()[0].setImage(await fs.readFile('./greenTexture.png'));
    gltfmodel.getRoot().listTextures()[0].setURI("greenTexture.png");
    
    var jsonModel = await io.writeBinary(gltfmodel).then((json)=> {
        console.log(json)
        return json;
    });
    
    res.send(Buffer.from(jsonModel));
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})