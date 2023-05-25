import { existsInS3, downloadS3Object } from "./S3Service.js";
import { createWatermarkedTexture } from "./LambdaService.js";
import { readFileSync } from "fs";

import dotenv from "dotenv";

dotenv.config();

const textures_bucket = process.env.BUCKET_TEXTURES;
const textureFileType = ".png";

export async function getWatermark(
  username: string,
  processTempFolderName: string
): Promise<any> {
  const result_texture_name = `${username}-default${textureFileType}`;

  if (await existsInS3(textures_bucket, result_texture_name)) {
    await downloadS3Object(
      textures_bucket,
      result_texture_name,
      `${processTempFolderName}/${result_texture_name}`
    );
    return readFileSync(`${processTempFolderName}/${result_texture_name}`);
  } else {
    const result = await createWatermarkedTexture(username, "default");
    const buffer = Buffer.from(result, "binary");
    return buffer;
  }
}
