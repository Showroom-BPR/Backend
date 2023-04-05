import { spawn } from "child_process";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { join } from "path";

process.env["PATH"] =
  process.env["PATH"] + ":" + process.env["LAMBDA_TASK_ROOT"];

type ImageInfo = {
  imageBucket: string;
  fileNameWithExtension: string;
};

function parseError(e: unknown) {
  if (e) {
    if (e instanceof Error) return `${e.message}\n${e.stack}`;
    if (typeof e === "string") return e;
    if (typeof e === "object" && "toString" in e) return e.toString();
  }
  return undefined;
}

const runCli = async (
  inputPath: string,
  outputPath: string,
  text: string,
  binPath: string = "./watermark"
) =>
  new Promise<void>((resolve, reject) => {
    const error: any[] = [];
    const joinError = () => error.join(",\n");
    const process = spawn(
      binPath,
      [
        "--input",
        inputPath,
        "--output",
        outputPath,
        "--lines",
        text,
        "--prefix",
        "LEGO",
      ],
      { shell: true }
    );

    process.on("error", (e) => {
      const parsedError = parseError(e);
      if (error) error.push(parsedError);

      reject(joinError());
    });

    process.stderr.on("data", (data) => error.push(data));

    process.on("close", (code) => {
      if (code !== 0) {
        reject(joinError());
      }

      resolve();
    });
  });

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

const downloadS3Object = async (
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

const watermarkImage = async (imageInfo: ImageInfo, text: string) => {
  const tempImgPath = join("/tmp", imageInfo.fileNameWithExtension);
  const tempWatermarkedImagePath = join(
    "/tmp",
    `result-${imageInfo.fileNameWithExtension}`
  );

  await downloadS3Object(
    imageInfo.imageBucket,
    imageInfo.fileNameWithExtension,
    tempImgPath
  );

  await runCli(tempImgPath, tempWatermarkedImagePath, text);

  return {
    watermarkedPath: tempWatermarkedImagePath,
    imagePath: tempImgPath,
  };
};

export default async function handler(event: any, context: any) {
  console.log(event);
  console.log(context);

  await watermarkImage(event.imageInfo, "hey");
}
