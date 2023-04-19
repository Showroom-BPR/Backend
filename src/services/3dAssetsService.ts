import { existsInS3, downloadS3Object } from "./S3Service.js";
import { createWatermarkedTexture } from "./LambdaService.js";
import { replaceTexture } from "./gltfService.js";
import { SaveBufferToFile } from "../fsUtils.js";

const textures_bucket = "virtual-showroom-textures";
const models_bucket = "virtual-showroom-3dmodels";

export async function get3DAsset(
  username: string,
  productId: string
): Promise<Uint8Array> {
  const result_texture_name = `${username}-${productId}.png`;
  const asset3dName = `${productId}.glb`;

  await downloadS3Object(models_bucket, asset3dName, asset3dName);

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
    const buffer = Buffer.from(result, "binary");
    await SaveBufferToFile(buffer, result_texture_name);
  }

  return await replaceTexture(result_texture_name, asset3dName);
}
