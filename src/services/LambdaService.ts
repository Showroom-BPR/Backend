import axios from "axios";
const LAMBDA_FUNC_URL =
  "https://miahnujg4htrmim3beb67hyj6e0pqzdz.lambda-url.eu-north-1.on.aws/";
const textures_bucket = "showroom-textures";

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
