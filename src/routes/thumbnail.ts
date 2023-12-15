import { Buffer } from "buffer";

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { v4 as uuidV4 } from "uuid";
import { z } from "zod";

import { Bindings } from "../bindings";
import { processBadRequest } from "../utils";

interface FormatResult {
  id: string;
  formatId: string;
}

const app = new Hono<{ Bindings: Bindings }>();

// サムネイル画像を登録する
const postThumbnailSchema = z.object({
  formatId: z.string().uuid(),
  base64: z.string(),
});

app.post(
  "/",
  zValidator("json", postThumbnailSchema, processBadRequest),
  async (c) => {
    const { formatId, base64 } = c.req.valid("json");
    const id = uuidV4();

    try {
      const matched = /^data:image\/(.+)?;base64,/.exec(base64);
      if (!matched) {
        return c.text("Invalid image", 400);
      }
      const extention = matched[1];
      const buffer = new Buffer(
        base64.replace(/data:image\/.+?;base64,/, ""),
        "base64"
      );
      await c.env.R2.put(`thumbnails/${formatId}/${id}.${extention}`, buffer);
    } catch (e) {
      console.log(e);
      return c.text("Internal Server Error", 500);
    }
    const result: FormatResult = { id, formatId };
    return c.json(result, 201);
  }
);

export default app;
