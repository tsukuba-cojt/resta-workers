import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { v4 as uuidV4 } from "uuid";
import { D1QB } from "workers-qb";
import { z } from "zod";

import { Bindings } from "../bindings";
import { verifyJWT } from "../firebase";

const app = new Hono<{ Bindings: Bindings }>();

//
app.get("/", (c) => {
  // TODO
  return c.text("TODO");
});

app.get("/:id", (c) => {
  // TODO
  return c.text("TODO");
});

const postFormatDatasSchema = z.object({
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  block: z.unknown(),
  images: z.array(z.string()),
  userId: z.string(),
});

app.post("/", zValidator("json", postFormatDatasSchema), async (c) => {
  const { userId, title, images, description, tags, block } =
    c.req.valid("json");

  // authorization
  const verified = await verifyJWT(c.req.header("Authorization"), c.env);
  if (verified === null) {
    return c.text("Unauthorized", 401);
  }
  if (verified.uid !== userId) {
    return c.text("Bad request", 400);
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

  return c.text(userId ?? "hoge");
});

export default app;
