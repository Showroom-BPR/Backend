import { existsInS3, downloadS3Object } from "./S3Service.js";
import { createWatermarkedTexture } from "./LambdaService.js";
import { replaceTexture } from "./gltfService.js";
import dotenv from "dotenv";

dotenv.config();

const textures_bucket = process.env.BUCKET_TEXTURES;
const models_bucket = process.env.BUCKET_MODELS;
const textureFileType = ".png";

export async function get3DAsset(
  username: string,
  productId: string,
  processTempFolderName: string
): Promise<Uint8Array> {
  const result_texture_name = `${username}-${productId}${textureFileType}`;

  const asset3dName = `${productId}.glb`;

  await downloadS3Object(
    models_bucket,
    asset3dName,
    `${processTempFolderName}/${asset3dName}`
  );

  if (await existsInS3(textures_bucket, result_texture_name)) {
    await downloadS3Object(
      textures_bucket,
      result_texture_name,
      `${processTempFolderName}/${result_texture_name}`
    );
  } else {
    await createWatermarkedTexture(username, productId);
    await downloadS3Object(
      textures_bucket,
      result_texture_name,
      `${processTempFolderName}/${result_texture_name}`
    );
  }

  return await replaceTexture(
    `${processTempFolderName}/${result_texture_name}`,
    `${processTempFolderName}/${asset3dName}`
  );
}
