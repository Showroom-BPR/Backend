import { downloadS3Object, listObjects } from "./S3Service.js";
import { readFileSync, mkdirSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

dotenv.config();

type AnimationInfo = {
  name: string;
  dataStream: Buffer;
};

const bucket = process.env.BUCKET_ANIMATIONS;

export async function getAnimations(
  productId: string,
  tempFolderPath: string
): Promise<AnimationInfo[]> {
  const animationItems = await listObjects(bucket, productId);

  let animationsResult: AnimationInfo[] = [];

  mkdirSync(join(tempFolderPath, productId), { recursive: true });

  for (let index = 1; index < animationItems["Contents"].length; index++) {
    const key = animationItems["Contents"][index].Key;
    await downloadS3Object(bucket, key, join(tempFolderPath, key));
    const animStream = await readFileSync(join(tempFolderPath, key));
    const item: AnimationInfo = {
      name: key,
      dataStream: animStream,
    };
    animationsResult.push(item);
  }

  return animationsResult;
}
