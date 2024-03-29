import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandInput,
  HeadObjectCommandOutput,
  GetObjectCommandOutput,
  ListObjectsCommand,
  ListObjectsCommandInput,
  ListObjectsCommandOutput,
} from "@aws-sdk/client-s3";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import dotenv from "dotenv";

dotenv.config();

export async function listObjects(
  bucket: string,
  prefix: string,
  region: string = "eu-north-1"
): Promise<ListObjectsCommandOutput> {
  const client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  const input: ListObjectsCommandInput = {
    Bucket: bucket,
    Prefix: prefix,
  };

  const command = new ListObjectsCommand(input);
  const output = client.send(command);
  return output;
}

export async function existsInS3(
  bucket: string,
  key: string,
  region: string = "eu-north-1"
): Promise<boolean> {
  try {
    const client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const bucketParams: HeadObjectCommandInput = {
      Bucket: bucket,
      Key: key,
    };
    const cmd = new HeadObjectCommand(bucketParams);
    const data: HeadObjectCommandOutput = await client.send(cmd);

    return data.$metadata.httpStatusCode === 200;
  } catch (error) {
    return false;
  }
}

export const getS3Object = async (
  bucket: string,
  key: string,
  region: string = "eu-north-1"
): Promise<GetObjectCommandOutput> => {
  const client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  const object = await client.send(command);
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
): Promise<void> => {
  const object = await getS3Object(bucket, key, region);
  if (object.Body instanceof Readable) {
    await writeStreamToFile(object.Body, outputPath);
  }
};
