import express from "express";
import multer from "multer";
import dotnev from "dotenv";
import crypto from "crypto";
import sharp from "sharp";
import { MulterRequest } from "multer";

//using prisma to interact with the databasae.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import AWS from "aws-sdk";

dotnev.config();

//for having secure image names.
const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const aws_access_key = process.env.AWS_ACCESS_KEY;
const aws_bucket_name = process.env.AWS_BUCKET_NAME;
const aws_bucket_region = process.env.AWS_BUCKET_REGION;
const aws_secret_access_key = process.env.AWS_SECRET_ACCESS_KEY;
const aws_database_url = process.env.AWS_DATABASE_URL;

const s3 = new S3Client({
  credentials: {
    accessKeyId: aws_access_key,
    secretAccessKey: aws_secret_access_key,
  },
  region: aws_bucket_region,
});

const app = express();

//create a memoryStorage obj and upload function with multer
//that is going to make sure it always stores the image in memory.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get("/api/posts", async (req, res) => {
  const posts = await prisma.posts.findMany({ orderBy: [{ created: "desc" }] });

  for (const post of posts) {
    const getObjectParamas = {
      Bucket: aws_bucket_name,
      Key: post.imageName,
    };
    const command = new GetObjectCommand(getObjectParamas);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    post.imageUrl = url;
  }

  res.send(posts);
});

//the string passed here is the name of the image to be stored
//upload.single('image')
app.post("api/posts", upload.single("image"), async (req, res) => {
  console.log("req.body", req.body); //see what kind of info we get from this post req.
  console.log("req.file", (req as MulterRequest).file);

  const buffer = await sharp((req as MulterRequest).file.buffer)
    .resize({ height: 1920, width: 1080, fit: "contain" })
    .toBuffer();

  const imageName = randomImageName();
  const params = {
    Bucket: aws_bucket_name,
    Key: imageName,
    Body: buffer,
    ContentType: (req as MulterRequest).file.mimetype,
  };
  const command = new PutObjectCommand(params);

  await s3.send(command);

  const post = await prisma.posts.create({
    data: {
      caption: req.body.caption,
      imageName: imageName,
    },
  });

  res.send(post);
});

app.delete("api/posts/:id", async (req, res) => {
  const id = +req.params.id;

  const post = await prisma.posts.findUnique({ where: { id } });

  if (!post) {
    res.status(404).send("Post not found");
    return;
  }

  const params = {
    Bucket: aws_bucket_name,
    Key: post.imageName,
  };

  const command = new DeleteObjectCommand(params);
  //delete from s3
  await s3.send(command);

  //delete from the database
  await prisma.posts.delete({ where: { id } });

  res.send({});
});

app.listen(8080, () => console.log("listening on port 8080"));
