import axios from "axios";
const LAMBDA_FUNC_URL =
  "https://pfe6dxe7ee77bzc6jktkbe5yje0rkmxb.lambda-url.eu-north-1.on.aws/";

export function createWatermarkedTexture(username, productId) {
  let data = JSON.stringify({
    fileNameWithExtension: `${productId}.png`,
    imageBucket: "virtual-showroom-textures",
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
