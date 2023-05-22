import { Prefix } from "aws-sdk/clients/firehose.js";
import {
  downloadS3Object,
  existsPrefixInS3,
  getS3Object,
} from "./S3Service.js";
import { returnAnimation } from "./gltfService.js";

export async function getAnimation(
  productId: string,
  key: string,
  region: string
): Promise<Uint8Array[]> {
  await downloadS3Object("showroom-animations", "gif1.gif", "eu-north-1");

  const animationArray: Uint8Array[] = [];
  animationArray.push(await returnAnimation(productId));
  //Method to download all the animations , then transform
  //into json for example for sending the entire array for
  //informations.
  //array cu buffer.

  return animationArray;
}
