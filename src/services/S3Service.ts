import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandInput,
  HeadObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { createWriteStream } from "fs";
import { Readable } from "stream";

export async function existsInS3(
  bucket: string,
  key: string,
  region: string = "eu-north-1"
): Promise<boolean> {
  try {
    const client = new S3Client({ region });

    const bucketParams: HeadObjectCommandInput = {
      Bucket: bucket,
      Key: key,
    };
    const cmd = new HeadObjectCommand(bucketParams);
    const data: HeadObjectCommandOutput = await client.send(cmd);
    console.log("data", data);

    // I always get 200 for my testing if the object exists
    const exists = data.$metadata.httpStatusCode === 200;
    return exists;
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 404) {
      // doesn't exist and permission policy includes s3:ListBucket
      return false;
    } else if (error.$metadata?.httpStatusCode === 403) {
      // doesn't exist, permission policy WITHOUT s3:ListBucket
      return false;
    } else {
      // some other error
      return false;
    }
  }
}

const getS3Object = async (
  bucket: string,
  key: string,
  region = "eu-north-1"
) => {
  const s3Client = new S3Client({ region });
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  const object = await s3Client.send(command);
  return object;
};

const writeStreamToFile = async (body: Readable, path: string) =>
  new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(path);
    body.pipe(stream);
    stream
      .on("finish", () => resolve())
      .on("disconnect", (...params) => reject(params))
      .on("error", (e) => reject(e));
  });

export const downloadS3Object = async (
  bucket: string,
  key: string,
  outputPath: string,
  region: string = "eu-north-1"
) => {
  const object = await getS3Object(bucket, key, region);
  if (object.Body instanceof Readable) {
    await writeStreamToFile(object.Body, outputPath);
  }
};
