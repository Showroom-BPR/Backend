import { existsWatermaredkTexture, getWatermarkedTexture } from "./S3Service.js";
import { createWatermarkedTexture, } from "./LambdaService.js"
import { replaceTexture } from "./gltfService.js";

export async function get3DAsset(username, productId) {
    
    let texture;

    if(existsWatermaredkTexture(username, productId)){
        texture = getWatermarkedTexture(username, productId)
    } else {
        texture = createWatermarkedTexture(username, productId)
    }

    return await replaceTexture(texture);
}