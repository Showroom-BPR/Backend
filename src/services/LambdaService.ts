import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const LAMBDA_FUNC_URL = process.env.LAMBDA_URL;
const textures_bucket = process.env.BUCKET_TEXTURES;

export async function createWatermarkedTexture(
  username: string,
  productId: string
): Promise<any> {
  let data = JSON.stringify({
    fileNameWithExtension: `${productId}.png`,
    imageBucket: textures_bucket,
    username: username,
  });

  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: LAMBDA_FUNC_URL,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  return axios
    .request(config)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.log(error);
    });
}
