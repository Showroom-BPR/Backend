import * as fs from "fs";

export async function SaveBufferToFile(buffer: Buffer, path: string) {
    fs.writeFile(path, buffer, (err)=>{
        if (err) {
            console.log(err);
        }
    })
}