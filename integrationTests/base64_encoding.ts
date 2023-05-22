var fs = require("fs");

export default function base64_encode(file: string): string {
  var bitmap = fs.readFileSync(file);
  return new Buffer(bitmap).toString("base64");
}
