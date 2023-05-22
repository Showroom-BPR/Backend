import express from "express";
import { getS3Object } from "./services/S3Service.js";
import dotenv from "dotenv";
import { get3DAsset } from "./services/3dAssetsService.js";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as os from "os";
import cors from "cors";
import { getAnimation } from "./services/AnimationService.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 80;

app.use(
  cors({
    origin: "*",
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST"],
  })
);

app.get("/", (_, res) => {
  res.send("Hello World!");
});

app.get("/3DAsset", async (req, res) => {
  const processId: string = uuidv4();
  console.log(processId);

  const username = req.query.username.toString();
  const productId = req.query.productId.toString();

  const processTempFolderName: string = `${os.tmpdir()}/LEGO_SHOWROOM/${processId}`;

  try {
    fs.mkdirSync(processTempFolderName, { recursive: true });
    const asset3D = await get3DAsset(
      username,
      productId,
      processTempFolderName
    );
    res.send(asset3D);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  } finally {
    try {
      if (processTempFolderName) {
        fs.rmSync(processTempFolderName, { recursive: true });
      }
    } catch (e) {
      console.error(
        `An error has occurred while removing the temp folder at ${processTempFolderName}. Please remove it manually. Error: ${e}`
      );
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

//1st see which animations exist on s3 with the certain id.
//for each id download from s3 with getS3Object, then put
//it into an object array. Then return the list.
app.get("/Animation", async (req, res) => {
  const processId: string = uuidv4();
  console.log(processId);

  const prefix = req.query.Prefix?.toString();
  const delimiter = req.query.Delimiter?.toString();
  const productId = req.query.productId?.toString();

  if (!prefix || !delimiter || !productId) {
    res.sendStatus(400);
    return;
  }

  try {
    const animation = await getAnimation(productId, prefix, delimiter);
    res.send(animation);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});
