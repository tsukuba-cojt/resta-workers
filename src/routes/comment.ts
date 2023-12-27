import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { v4 as uuidV4 } from "uuid";
import { D1QB } from "workers-qb";
import { z } from "zod";

import { Bindings } from "../bindings";
import { insertComment } from "../d1/comment";
import { authorize, getUidFromFirebaseUid } from "../firebase";
import { processBadRequest } from "../utils";

const app = new Hono<{ Bindings: Bindings }>();

// コメントを投稿する
const commentSchema = z.object({
  formatId: z.string().uuid(),
  comment: z.string(),
  star: z.number().int().min(1).max(5),
});

app.post(
  "/",
  zValidator("json", commentSchema, processBadRequest),
  authorize,
  async (c) => {
    const { formatId, comment, star } = c.req.valid("json");

    const firebaseUid = (c as any).firebaseUid;
    const uid = await getUidFromFirebaseUid(firebaseUid, c.env.DB);
    if (!uid) {
      return c.text("Internal Server Error", 500);
    }

    const id = uuidV4();
    const qb = new D1QB(c.env.DB);

    try {
      await insertComment(id, formatId, comment, star, uid, qb);
    } catch (e) {
      console.log(e);
      return c.text("Internal Server Error", 500);
    }
    return c.json({ id }, 201);
  }
);

export default app;
