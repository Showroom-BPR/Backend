import { downloadS3Object, listObjects } from "./S3Service.js";
import { readFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

dotenv.config();

type BackgroundInfo = {
  name: string;
  dataStream: string;
};

const bucket = process.env.BUCKET_BACKGROUNDS;

export async function getBackgrounds(
  tempFolderPath: string
): Promise<BackgroundInfo[]> {
  const backgroundItems = await listObjects(bucket, "");

  let backgroundsResult: BackgroundInfo[] = [];

  for (let index = 0; index < backgroundItems["Contents"].length; index++) {
    const key = backgroundItems["Contents"][index].Key;
    await downloadS3Object(bucket, key, join(tempFolderPath, key));
    const animStream = readFileSync(join(tempFolderPath, key));
    const item: BackgroundInfo = {
      name: key,
      dataStream: Buffer.from(animStream).toString("base64"),
    };
    backgroundsResult.push(item);
  }

  return backgroundsResult;
}
