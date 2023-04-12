import { spawn, exec } from "child_process";
import { createWriteStream, createReadStream, readFileSync } from "fs";
import { Readable } from "stream";
import { S3Client, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3";
import { join } from "path";
import { userInfo } from "os";

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

const putS3Object = async (
  bucket: string,
  key: string,
  body: Buffer,
  region: string = "eu-north-1"
) => {
  const s3Client = new S3Client(region);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
  });
  await s3Client.send(command);
}

const watermarkImage = async (imageInfo: ImageInfo, text: string) => {
  const tempImgPath = join("/tmp", imageInfo.fileNameWithExtension);
  const clean_username = text.replace(" ", "_");
  const resultImageName = `${clean_username}-${imageInfo.fileNameWithExtension}`;
  const tempWatermarkedImagePath = join(
    "/tmp",
    resultImageName
  );

  await downloadS3Object(
    imageInfo.imageBucket,
    imageInfo.fileNameWithExtension,
    tempImgPath
  );

  await runCli(tempImgPath, tempWatermarkedImagePath, text);

  const readableStream = readFileSync(tempWatermarkedImagePath);

  putS3Object(imageInfo.imageBucket, resultImageName, readableStream);
  
  return {
    watermarkedPath: tempWatermarkedImagePath,
    imagePath: tempImgPath,
  };
};

module.exports.watermark = async (event: any, context: any) => {
  console.log(event);
  console.log(context);

  await watermarkImage(event.imageInfo, event.userInfo.username);
}