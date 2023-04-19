import express from "express";
import dotenv from "dotenv";
import { get3DAsset } from "./services/3dAssetsService.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 82;

app.get("/", (_, res) => {
  res.send("Hello World!");
});

app.get("/3DAsset", async (req, res) => {
  const username = req.query.username.toString();
  const productId = req.query.productId.toString();

  const asset3D = await get3DAsset(username, productId);

  res.send(asset3D);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
