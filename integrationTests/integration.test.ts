import base64_encode from "./base64_encoding.js";
import { createWatermarkedTexture } from "../src/services/LambdaService.js";
import { SaveBufferToFile } from "../src/utils.js";
import { describe, expect, it } from "@jest/globals";
import { writeFileSync, unlinkSync } from "fs";

describe("watermarked image", () => {
  it("matches the expected image", async () => {
    var expectedBase64 = base64_encode("integrationTests/expected.png");

    const username: string = "Jane Doe";
    const productId: string = "lego_mario";
    const textureFileType = ".png";
    const result_texture_name = `${username}-${productId}${textureFileType}`;

    const result = await createWatermarkedTexture(username, productId);
    const buffer = Buffer.from(result, "binary");
    const resultFilePath = `integrationTests/${result_texture_name}`;
    writeFileSync(resultFilePath, buffer);

    var resultedBase64 = base64_encode(resultFilePath);
    unlinkSync(resultFilePath);

    expect(resultedBase64).toBe(expectedBase64);
  }, 10000);

  it("does not match the default image", async () => {
    var defaultBase64 = base64_encode("integrationTests/default.png");

    const username: string = "Jane Doe";
    const productId: string = "lego_mario";
    const textureFileType = ".png";
    const result_texture_name = `${username}-${productId}${textureFileType}`;

    const result = await createWatermarkedTexture(username, productId);
    const buffer = Buffer.from(result, "binary");
    const resultFilePath = `integrationTests/${result_texture_name}`;
    writeFileSync(resultFilePath, buffer);

    var resultedBase64 = base64_encode(resultFilePath);
    unlinkSync(resultFilePath);

    expect(resultedBase64).not.toBe(defaultBase64);
  }, 10000);
});
