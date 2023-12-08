import { Hono } from "hono";
import { z } from "zod";

import { Bindings } from "../bindings";
import { zValidator } from "@hono/zod-validator";
import { base64ToArrayBuffer, processBadRequest } from "../utils";
import { v4 as uuidV4 } from "uuid";

const app = new Hono<{ Bindings: Bindings }>();

// サムネイル画像を登録する
const postThumbnailSchema = z.object({
  base64: z.string(),
});

app.post(
  "/",
  zValidator("json", postThumbnailSchema, processBadRequest),
  async (c) => {
    const { base64 } = c.req.valid("json");
    const id = uuidV4();
    try {
      const buffer = base64ToArrayBuffer(base64);
      await c.env.R2.put(id, buffer);
      return c.json({ id }, 201);
    } catch (e) {
      console.log(e);
      return c.text("Internal Server Error", 500);
    }
  }
);
