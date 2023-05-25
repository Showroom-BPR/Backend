import { downloadS3Object, listObjects } from "./S3Service.js";
import { readFileSync, mkdirSync } from "fs";
import { join } from "path";

type AnimationInfo = {
  name: string;
  dataStream: Buffer;
};

const bucket = "showroom-animations";

export async function getAnimations(
  productId: string,
  tempFolderPath: string
): Promise<AnimationInfo[]> {
  const animationItems = await listObjects(bucket, productId);
  console.log(animationItems);

  let animationsResult: AnimationInfo[] = [];

  mkdirSync(join(tempFolderPath, productId), { recursive: true });

  for (let index = 1; index < animationItems["Contents"].length; index++) {
    const key = animationItems["Contents"][index].Key;
    await downloadS3Object(
      "showroom-animations",
      key,
      join(tempFolderPath, key)
    );
    const animStream = await readFileSync(join(tempFolderPath, key));
    const item: AnimationInfo = {
      name: key,
      dataStream: animStream,
    };
    console.log(item);
    animationsResult.push(item);
  }

  return animationsResult;
}
