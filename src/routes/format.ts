import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { v4 as uuidV4 } from "uuid";
import { D1QB } from "workers-qb";
import { z } from "zod";

import { Bindings } from "../bindings";
import { authorize } from "../firebase";
import { processBadRequest } from "../utils";

const app = new Hono<{ Bindings: Bindings }>();

// get a format list
const getFormatListSchema = z.object({
  range: z.string(),
  keyword: z.string().optional(),
  type: z.union([z.literal("keyword"), z.literal("url")]).optional(),
});

app.post(
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
                  conditions: `title LIKE '${keyword}'`,
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
      console.log(fetched);
    } catch (e) {
      console.log(e);
      return c.text("Internal Server Error", 500);
    }

    const result: any[] = []; // TODO
    return c.json([]);
  }
);

// get a single format
const getFormatSchema = z.object({
  id: z.string(),
});

app.get(
  "/:id",
  zValidator("param", getFormatSchema, processBadRequest),
  async (c) => {
    const { id } = c.req.valid("param");
    const qb = new D1QB(c.env.DB);

    interface FetchResult {
      id: string;
      title: string;
      description: string;
      tags: string;
      download: number;
      user_id: string;
      created_at: string;
      updated_at: string;
    }

    try {
      const fetched: FetchResult[] = await qb
        .fetchAll({
          tableName: "format",
          fields: "",
          where: {
            conditions: `id = ${id}`,
          },
        })
        .execute();

      return c.json({ result: {} });
    } catch (e) {
      return c.text("Internal Server Error", 500);
    }
  }
);

// post a format
const postFormatsSchema = z.object({
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  block: z.unknown(),
  images: z.array(z.string()),
});

app.post(
  "/",
  zValidator("json", postFormatsSchema, processBadRequest),
  authorize,
  async (c) => {
    const { title, images, description, tags, block } = c.req.valid("json");
    const userId = (c as any).uid;

    const qb = new D1QB(c.env.DB);
    const formatId = uuidV4();

    // add images
    qb.insert({
      tableName: "format_thumbnail",
      data: images.map((src, index) => ({
        format_id: formatId,
        order_no: index,
        src,
      })),
    });

    // add a format
    qb.insert({
      tableName: "format",
      data: {
        id: formatId,
        title,
        description,
        tags: JSON.stringify(tags),
        block: JSON.stringify(block),
        user_id: userId,
      },
    });

    return c.text("Created", 201);
  }
);

export default app;
