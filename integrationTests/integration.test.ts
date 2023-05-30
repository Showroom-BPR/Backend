import base64_encode from "./base64_encoding.js";
import { createWatermarkedTexture } from "../src/services/LambdaService.js";
import { downloadS3Object } from "../src/services/S3Service.js";
import { SaveBufferToFile } from "../src/utils.js";
import { describe, expect, it } from "@jest/globals";
import { writeFileSync, unlinkSync } from "fs";
import dotenv from "dotenv";

dotenv.config();

const textures_bucket = process.env.BUCKET_TEXTURES;

describe("watermarked image", () => {
  it("matches the expected image", async () => {
    var expectedBase64 = base64_encode("integrationTests/expected.png");

    const username: string = "Jane Doe";
    const productId: string = "lego_mario";
    const textureFileType = ".png";
    const clean_username = username.replace(" ", "_");
    const result_texture_name = `${clean_username}-${productId}${textureFileType}`;
    const resultFilePath = `integrationTests/${result_texture_name}`;

    await createWatermarkedTexture(username, productId);

    await downloadS3Object(
      textures_bucket,
      result_texture_name,
      resultFilePath
    );

    var resultedBase64 = base64_encode(resultFilePath);
    unlinkSync(resultFilePath);

    expect(resultedBase64).toBe(expectedBase64);
  }, 10000);

  it("does not match the default image", async () => {
    var defaultBase64 = base64_encode("integrationTests/default.png");

    const username: string = "Jane Doe";
    const productId: string = "lego_mario";
    const textureFileType = ".png";
    const clean_username = username.replace(" ", "_");
    const result_texture_name = `${clean_username}-${productId}${textureFileType}`;
    const resultFilePath = `integrationTests/${result_texture_name}`;

    await createWatermarkedTexture(username, productId);
    await downloadS3Object(
      textures_bucket,
      result_texture_name,
      resultFilePath
    );

    var resultedBase64 = base64_encode(resultFilePath);
    unlinkSync(resultFilePath);

    expect(resultedBase64).not.toBe(defaultBase64);
  }, 10000);
});
