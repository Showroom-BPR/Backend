import express from "express";
import dotenv from "dotenv";
import { get3DAsset } from "./services/3dAssetsService.js";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as os from "os";
import cors from "cors";
import * as swaggerUi from "swagger-ui-express";
import swaggerJSDocs from "swagger-jsdoc";

dotenv.config();

const app = express();
const port = process.env.PORT || 80;

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
  },
  apis: ["./src/index.ts"],
};

const specs = swaggerJSDocs(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use(
  cors({
    origin: "*",
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST"],
  })
);
/**
 * @openapi
 * /:
 *   get:
 *     description: Hello World! Default health-check endpoint.
 *     responses:
 *       200:
 *         description: Healthy and friendly server.
 */
app.get("/", (_, res) => {
  res.send("Hello World!");
});

/**
 * @openapi
 * /3DAsset:
 *   get:
 *     description: Get a watermarked 3D asset.
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         description: Username used in the watermarking process.
 *         schema:
 *           type: string
 *       - in: query
 *         name: productId
 *         required: true
 *         description: Product identification
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns a Buffer of the 3D asset.
 *       500:
 *         description: Something went wrong.
 */
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
