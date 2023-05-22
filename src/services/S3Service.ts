import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandInput,
  HeadObjectCommandOutput,
  GetObjectCommandOutput,
  InventoryS3BucketDestinationFilterSensitiveLog,
  S3,
} from "@aws-sdk/client-s3";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import dotenv from "dotenv";
import { Prefix } from "aws-sdk/clients/firehose.js";
import AWS, { S3Control } from "aws-sdk";
import { stringify } from "querystring";

dotenv.config();

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
    console.error(error);
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

export async function existsPrefixInS3(prefix) {
  return new Promise((resolve, reject) => {
    const s3 = new AWS.S3();
    try {
      let params = {
        Bucket: "virtual-showroom-animations",
        prefix: prefix,
        delimiter: prefix,
      };

      const allKeys = [];

      listAllKeys();
      function listAllKeys() {
        s3.listObjects(params, function (err, data) {
          if (err) {
            reject(err);
          } else {
            var contents = data.Contents;
            contents.forEach(function (content) {
              allKeys.push(content.Key);
            });
          }
        });
      }
    } catch (e) {
      reject(e);
    }
  });
}

export async function getS3ObjectAnimation(
  bucket: string,
  key: string,
  region: string
): Promise<any> {
  const AWS = require("aws-sdk");
  const s3 = new AWS.S3({ region });

  const params = {
    Bucket: bucket,
    Key: key,
  };

  return s3.getObject(params).promise();
}
