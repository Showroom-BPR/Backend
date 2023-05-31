import express from "express";
import { getAnimations } from "./services/AnimationService.js";
import dotenv from "dotenv";
import { get3DAsset } from "./services/3dAssetsService.js";
import { getWatermark } from "./services/WatermarkService.js";
import { getBackgrounds } from "./services/BackgroundsService.js";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as os from "os";
import cors from "cors";
import * as swaggerUi from "swagger-ui-express";
import swaggerJSDocs from "swagger-jsdoc";
import { authenticate, authenticationError } from "aws-cognito-express";
import {
  GetAccessTokenFromRequest,
  GetUsernameForAccessToken,
} from "./utils.js";
import { ListObjectsCommandOutput } from "@aws-sdk/client-s3";
import { listObjects } from "./services/S3Service.js";

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

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Showroom Backend API",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:80",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/index.ts"],
};

const specs = swaggerJSDocs(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use(
  authenticate({
    region: process.env.AWS_REGION,
    userPoolId: process.env.AWS_USER_POOL_ID,
    tokenUse: ["access"],
    audience: [process.env.AWS_COGNITO_APP_AUDIENCE],
  })
);

/**
 * @openapi
 * components:
 *   schemas:
 *     AnimationInfo:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the animation.
 *           example: Drive.glb
 *         dataStream:
 *           type: Buffer
 *           description: Buffer containing the animation's data
 *           example: <Buffer 67 6c 54 46 02... >
 *     BackgroundInfo:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the background file.
 *           example: lego_logo.jpg
 *         dataStream:
 *           type: string
 *           description: Base64 string containing the file's data
 */

/**
 * @openapi
 * /:
 *   get:
 *     description: Hello World! Default health-check endpoint.
 *     responses:
 *       200:
 *         description: Healthy and friendly server.
 */
app.get("/", async (req, res) => {
  res.send("Hello World!");
});

/**
 * @openapi
 * /ProductIds:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     description: Get an array of productIds available.
 *     responses:
 *       200:
 *         description: Returns an array of productIds available.
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Something went wrong.
 */
app.get("/ProductIds", async (req, res) => {
  const assetsBucket = process.env.BUCKET_MODELS;
  const productsList: ListObjectsCommandOutput = await listObjects(
    assetsBucket,
    ""
  );
  let productIds: string[] = [];
  productsList.Contents.forEach((obj) => {
    productIds.push(obj.Key.split(".")[0]);
  });
  res.send(productIds);
});

/**
 * @openapi
 * /3DAsset:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     description: Get a watermarked 3D asset.
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         description: Product identification
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns a Buffer of the 3D asset.
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Something went wrong.
 */
app.get("/3DAsset", async (req: any, res) => {
  const processId: string = uuidv4();

  const token = GetAccessTokenFromRequest(req);
  const username = await GetUsernameForAccessToken(token);
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

/**
 * @openapi
 * /Watermark:
 *   get:
 *     description: Get a transparent watermark png.
 *     responses:
 *       200:
 *         description: Returns a Base64 string of the png file.
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Something went wrong.
 */
app.get("/Watermark", async (req, res) => {
  const processId: string = uuidv4();

  const token = GetAccessTokenFromRequest(req);
  const username = await GetUsernameForAccessToken(token);

  const processTempFolderName: string = `${os.tmpdir()}/LEGO_SHOWROOM/${processId}`;

  try {
    fs.mkdirSync(processTempFolderName, { recursive: true });

    const watermarkBuffer = await getWatermark(username, processTempFolderName);
    const watermarkBase64 = Buffer.from(watermarkBuffer).toString("base64");
    res.send(watermarkBase64);
  } catch (error) {
    console.log(error);
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

/**
 * @openapi
 * /Animations:
 *   get:
 *     description: Get all animations for a specific product.
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: Product identification
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns a list of the animations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AnimationInfo'
 *
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Something went wrong.
 */
app.get("/Animations/:productId", async (req, res) => {
  const processId: string = uuidv4();

  const productId = req.params.productId?.toString();

  const processTempFolderName: string = `${os.tmpdir()}/LEGO_SHOWROOM/${processId}`;

  try {
    fs.mkdirSync(processTempFolderName, { recursive: true });
    const animations = await getAnimations(productId, processTempFolderName);
    res.send(animations);
  } catch (error) {
    console.log(error);
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

/**
 * @openapi
 * /Backgrounds:
 *   get:
 *     description: Get all available backgrounds.
 *     responses:
 *       200:
 *         description: Returns a list of the backgrounds.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BackgroundInfo'
 *
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Something went wrong.
 */
app.get("/Backgrounds", async (req, res) => {
  const processId: string = uuidv4();
  const processTempFolderName: string = `${os.tmpdir()}/LEGO_SHOWROOM/${processId}`;

  try {
    fs.mkdirSync(processTempFolderName, { recursive: true });
    const backgrounds = await getBackgrounds(processTempFolderName);
    res.send(backgrounds);
  } catch (error) {
    console.log(error);
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

app.use(authenticationError());

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
