import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { D1QB } from "workers-qb";
import { z } from "zod";

import { Bindings } from "../bindings";
import { fetchComments } from "../d1/comment";
import {
  fetchFormatBlocks,
  fetchFormatList,
  fetchFormatsById,
  fetchFormatThumbnails,
  groupFormat,
  insertFormat,
  insertFormatBlock,
  insertFormatThumbnails,
} from "../d1/format";
import { fetchUsers } from "../d1/user";
import { authorize, getUidFromFirebaseUid } from "../firebase";
import { processBadRequest } from "../utils";

const app = new Hono<{ Bindings: Bindings }>();

// Format 一覧を取得する
const getFormatListSchema = z.object({
  keyword: z.string().optional(),
  url: z.string().optional(),
  limit: z.string().optional(),
  offset: z.string().optional(),
});

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;

app.get(
  "/",
  zValidator("query", getFormatListSchema, processBadRequest),
  async (c) => {
    const {
      keyword,
      url,
      limit: limitStr,
      offset: offsetStr,
    } = c.req.valid("query");
    const qb = new D1QB(c.env.DB);

    const [limit, offset] = (() => {
      if (limitStr !== undefined && !Number.isNaN(limitStr)) {
        const offset =
          offsetStr !== undefined && !Number.isNaN(offsetStr)
            ? parseInt(offsetStr)
            : null;
        return [Math.min(parseInt(limitStr), MAX_LIMIT), offset];
      }
      return [DEFAULT_LIMIT, null];
    })();

    try {
      const formats = await fetchFormatList(
        keyword ?? null,
        url ?? null,
        limit,
        offset,
        qb
      );
      if (formats.length === 0) {
        return c.json([]);
      }
      const ids = formats.map(({ id }) => id);
      const uids = formats.map(({ user_id }) => user_id);
      const blocks = await fetchFormatBlocks(ids, qb);
      const thumbnails = await fetchFormatThumbnails(ids, qb);
      const comments = await fetchComments(ids, qb);
      const users = await fetchUsers(uids, qb);
      const result = formats.map((format) =>
        groupFormat(
          format,
          blocks.filter(({ format_id }) => format_id === format.id),
          thumbnails.filter(({ format_id }) => format_id === format.id),
          comments.filter(({ format_id }) => format_id === format.id),
          users.find(({ id }) => id === format.user_id)!
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
      const comments = await fetchComments([id], qb);
      const users = await fetchUsers([format[0].user_id], qb);
      const result = groupFormat(
        format[0],
        blocks,
        thumbnails,
        comments,
        users[0]
      );
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
  formatId: z.string().uuid(),
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
    const { formatId, title, thumbnails, description, tags, blocks } =
      c.req.valid("json");

    const firebaseUid = (c as any).firebaseUid;
    const uid = await getUidFromFirebaseUid(firebaseUid, c.env.DB);
    if (!uid) {
      return c.text("Internal Server Error", 500);
    }

    const qb = new D1QB(c.env.DB);

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
