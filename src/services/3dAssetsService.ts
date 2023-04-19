import { existsInS3, downloadS3Object } from "./S3Service.js";
import { createWatermarkedTexture } from "./LambdaService.js";
import { replaceTexture } from "./gltfService.js";
import { SaveBufferToFile } from "../fsUtils.js";

export async function get3DAsset(username, productId) {
  const result_texture_name = `${username}-${productId}.png`;
  const asset3dName = `${productId}.glb`;

  const textures_bucket = "virtual-showroom-textures";

  await downloadS3Object("virtual-showroom-3dmodels", asset3dName, asset3dName);

  if (await existsInS3(textures_bucket, result_texture_name)) {
    console.log("Watermarked texture exists.");

    await downloadS3Object(
      textures_bucket,
      result_texture_name,
      result_texture_name
    );
  } else {
    console.log("Watermarked texture does not exist. Will be created now");

    const result = await createWatermarkedTexture(username, productId);
    const buffer = new Buffer(result, "binary");
    await SaveBufferToFile(buffer, result_texture_name);
  }

  return await replaceTexture(result_texture_name, asset3dName);
}
