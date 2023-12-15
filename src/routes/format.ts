import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { v4 as uuidV4 } from "uuid";
import { D1QB } from "workers-qb";
import { z } from "zod";

import { Bindings } from "../bindings";
import { authorize, getUidFromFirebaseUid } from "../firebase";
import {
  fetchFormatBlocks,
  fetchFormatThumbnails,
  fetchFormatsById,
} from "../format";
import { processBadRequest } from "../utils";

const app = new Hono<{ Bindings: Bindings }>();

// Format 一覧を取得する
const getFormatListSchema = z.object({
  range: z.string(),
  keyword: z.string().optional(),
  type: z.union([z.literal("keyword"), z.literal("url")]).optional(),
});

app.get(
  "/",
  zValidator("json", getFormatListSchema, processBadRequest),
  async (c) => {
    const { range: rangeStr, keyword, type } = c.req.valid("json");

    // range
    const range = parseInt(rangeStr, 10);
    if (Number.isNaN(range)) {
      return c.text("Bad Request", 400);
    }

    const qb = new D1QB(c.env.DB);

    interface FetchResult {
      id: string;
      title: string;
    }

    try {
      let fetched: FetchResult[];
      if (keyword) {
        if (type === "keyword") {
          fetched = (
            await qb
              .fetchAll({
                tableName: "format",
                fields: "*",
                where: {
                  conditions: `title LIKE ?`,
                  params: [keyword],
                },
                limit: range,
              })
              .execute()
          ).results;
          // TODO
        } else {
          // TODO
          fetched = [];
        }
      } else {
        fetched = (
          await qb
            .fetchAll({
              tableName: "format",
              fields: "*",
              limit: range,
            })
            .execute()
        ).results;
      }
    } catch (e) {
      console.log(e);
      return c.text("Internal Server Error", 500);
    }

    return c.json([]);
  }
);

// get a single format
const getFormatSchema = z.object({
  id: z.string().uuid(),
});

interface FormatResult {
  id: string;
  title: string;
  description: string;
  tags: string[];
  blocks: { url: string; block: string }[];
  thumbnails: string[];
  download: number;
  uid: string;
  createdAt: string;
  updatedAt: string;
}

app.get(
  "/:id",
  zValidator("param", getFormatSchema, processBadRequest),
  async (c) => {
    const { id } = c.req.valid("param");
    const qb = new D1QB(c.env.DB);

    try {
      const format = await fetchFormatsById([id], qb);
      if (format.length === 0) {
        c.text("Not Found", 404);
      }
      const blocks = await fetchFormatBlocks([id], qb);
      const thumbnails = await fetchFormatThumbnails([id], qb);

      const result: FormatResult = {
        id: format[0].id,
        title: format[0].title,
        description: format[0].description,
        tags: JSON.parse(format[0].tags),
        blocks: blocks
          .sort((a, b) => a.order_no - b.order_no)
          .map(({ url, block }) => ({ url, block })),
        thumbnails: thumbnails
          .sort(({ order_no }) => order_no)
          .map(({ src }) => src),
        download: format[0].download,
        uid: format[0].user_id,
        createdAt: format[0].created_at,
        updatedAt: format[0].updated_at,
      };
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
      await qb
        .insert({
          tableName: "format",
          data: {
            id: formatId,
            title,
            description,
            tags: JSON.stringify(tags),
            user_id: uid,
          },
        })
        .execute();

      // ブロックを追加
      const blocksData = blocks.map(({ block, url }, index) => ({
        format_id: formatId,
        order_no: index,
        block: block,
        url,
      }));
      if (blocksData.length > 0) {
        await qb
          .insert({
            tableName: "format_block",
            data: blocksData,
          })
          .execute();
      }

      // サムネイルを追加
      const thumbnailsData = thumbnails.map((src, index) => ({
        format_id: formatId,
        order_no: index,
        src,
      }));
      if (thumbnailsData.length > 0) {
        await qb
          .insert({
            tableName: "format_thumbnail",
            data: thumbnailsData,
          })
          .execute();
      }
    } catch (e) {
      console.log(e);
      return c.text("Internal Server Error", 500);
    }
    return c.json({ id: formatId }, 201);
  }
);

export default app;
