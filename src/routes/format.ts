import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { v4 as uuidV4 } from "uuid";
import { D1QB } from "workers-qb";
import { z } from "zod";

import { Bindings } from "../bindings";
import {
  fetchFormatBlocks,
  fetchFormatList,
  fetchFormatsById,
  fetchFormatThumbnails,
  Format,
  groupFormat,
  insertFormat,
  insertFormatBlock,
  insertFormatThumbnails,
} from "../d1/format";
import { authorize, getUidFromFirebaseUid } from "../firebase";
import { processBadRequest } from "../utils";

const app = new Hono<{ Bindings: Bindings }>();

// Format 一覧を取得する
const getFormatListSchema = z.object({
  keyword: z.string().optional(),
  url: z.string().optional(),
});

app.get(
  "/",
  zValidator("json", getFormatListSchema, processBadRequest),
  async (c) => {
    // TODO: 範囲選択
    const { keyword, url } = c.req.valid("json");
    const qb = new D1QB(c.env.DB);

    try {
      const formats = await fetchFormatList(keyword ?? null, url ?? null, qb);
      if (formats.length === 0) {
        return c.json([], 404);
      }
      const ids = formats.map(({ id }) => id);
      const blocks = await fetchFormatBlocks(ids, qb);
      const thumbnails = await fetchFormatThumbnails(ids, qb);
      const result: Format[] = formats.map((format) =>
        groupFormat(
          format,
          blocks.filter(({ format_id }) => format_id === format.id),
          thumbnails.filter(({ format_id }) => format_id === format.id)
        )
      );
      return c.json(result);
    } catch (e) {
      console.log(e);
      return c.text("Internal Server Error", 500);
    }
  }
);

// Format 単体を取得する
const getFormatSchema = z.object({
  id: z.string().uuid(),
});

app.get(
  "/:id",
  zValidator("param", getFormatSchema, processBadRequest),
  async (c) => {
    const { id } = c.req.valid("param");
    const qb = new D1QB(c.env.DB);

    try {
      const format = await fetchFormatsById([id], qb);
      if (format.length === 0) {
        return c.text("Not Found", 404);
      }
      const blocks = await fetchFormatBlocks([id], qb);
      const thumbnails = await fetchFormatThumbnails([id], qb);
      const result = groupFormat(format[0], blocks, thumbnails);
      return c.json(result);
    } catch (e) {
      console.log(e);
      return c.text("Internal Server Error", 500);
    }
  }
);

// Format を投稿する
const MAX_TITLE_COUNT = 32;
const MAX_PHOTO_COUNT = 8;

const postFormatsSchema = z.object({
  title: z.string().max(MAX_TITLE_COUNT),
  description: z.string(),
  tags: z.array(z.string()),
  blocks: z.array(
    z.object({
      url: z.string(),
      block: z.string(),
    })
  ),
  thumbnails: z.array(z.string()).max(MAX_PHOTO_COUNT),
});

app.post(
  "/",
  zValidator("json", postFormatsSchema, processBadRequest),
  authorize,
  async (c) => {
    const { title, thumbnails, description, tags, blocks } =
      c.req.valid("json");

    const firebaseUid = (c as any).firebaseUid;
    const uid = await getUidFromFirebaseUid(firebaseUid, c.env.DB);
    if (!uid) {
      return c.text("Internal Server Error", 500);
    }

    const qb = new D1QB(c.env.DB);
    const formatId = uuidV4();

    try {
      await insertFormat(formatId, title, description, tags, uid, qb);
      await insertFormatBlock(formatId, blocks, qb);
      await insertFormatThumbnails(formatId, thumbnails, qb);
    } catch (e) {
      console.log(e);
      return c.text("Internal Server Error", 500);
    }
    return c.json({ id: formatId }, 201);
  }
);

export default app;
