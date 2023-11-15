import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { v4 as uuidV4 } from "uuid";
import { D1QB } from "workers-qb";
import { z } from "zod";

import { processBadRequest } from "..";
import { Bindings } from "../bindings";
import { verifyJWT } from "../firebase";

const app = new Hono<{ Bindings: Bindings }>();

// get a format list
const getFormatListSchema = z.object({
  keyword: z.string(),
  type: z.union([z.literal("keyword"), z.literal("url")]),
});

app.get(
  "/",
  zValidator("param", getFormatListSchema, processBadRequest),
  async (c) => {
    const { keyword, type } = c.req.valid("param");

    const qb = new D1QB(c.env.DB);

    interface FetchResult {
      id: string;
      title: string;
    }

    try {
      if (type === "keyword") {
        const fetched: FetchResult[] = await qb
          .fetchAll({
            tableName: "format",
            fields: "",
            where: {
              conditions: `keyword LIKE ${keyword}`,
            },
          })
          .execute();
        // TODO
      } else {
        // TODO
      }
    } catch (e) {
      return c.text("Internal Server Error", 500);
    }

    const result: any[] = []; // TODO
    return c.json({ result });
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
  userId: z.string(),
});

app.post(
  "/",
  zValidator("json", postFormatsSchema, (result, c) => {
    if (!result.success) {
    }
  }),
  async (c) => {
    const { userId, title, images, description, tags, block } =
      c.req.valid("json");

    // authorization
    const verified = await verifyJWT(c.req.header("Authorization"), c.env);
    if (verified === null) {
      return c.text("Unauthorized", 401);
    }
    if (verified.uid !== userId) {
      return c.text("Bad Request", 400);
    }

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