import { writeFile } from "fs";

export async function SaveBufferToFile(
  buffer: Buffer,
  path: string
): Promise<void> {
  await writeFile(path, buffer, (err) => {
    if (err) {
      console.log(err);
    }
  });
}

export function GetAccessTokenFromRequest(request: any): string {
  let headerValue: string = request.headers["authorization"];
  return headerValue.split(" ")[1];
}

export async function GetUsernameForAccessToken(token: string) {
  return await fetch("https://cognito-idp.eu-north-1.amazonaws.com/", {
    method: "POST",
    headers: {
      "X-Amz-Target": "AWSCognitoIdentityProviderService.GetUser",
      "Content-Type": "application/x-amz-json-1.1",
    },
    body: JSON.stringify({
      AccessToken: token,
    }),
    redirect: "follow",
  })
    .then(async (response) => await response.json())
    .then((json) => {
      return json.UserAttributes.filter((item: any) => item.Name === "name")[0]
        .Value;
    });
}
