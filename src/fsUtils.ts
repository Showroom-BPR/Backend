import { writeFile } from "fs";

export async function SaveBufferToFile(
  buffer: Buffer,
  path: string
): Promise<void> {
  writeFile(path, buffer, (err) => {
    if (err) {
      console.log(err);
    }
  });
}