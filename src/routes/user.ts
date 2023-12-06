import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { v4 as uuidV4 } from "uuid";
import { D1QB } from "workers-qb";
import { z } from "zod";

import { Bindings } from "../bindings";
import { authorize } from "../firebase";
import { processBadRequest } from "../utils";

const app = new Hono<{ Bindings: Bindings }>();

// 自分自身のユーザ情報を取得する
const postSchema = z.object({
  uid: z.string(),
});

interface UserResult {
  user?: {
    id: string;
    firebaseUid: string;
    name: string;
  };
}

app.post(
  "/me",
  zValidator("json", postSchema, processBadRequest),
  authorize,
  async (c) => {
    const { uid } = c.req.valid("json");
    const authorizedUid = (c as any).uid;

    if (uid !== authorizedUid) {
      return c.text("Bad Request", 400);
    }

    const qb = new D1QB(c.env.DB);
    const fetched = await qb
      .fetchAll({
        tableName: "user",
        fields: "id, name",
        where: {
          conditions: `firebase_uid = '${uid}'`,
        },
      })
      .execute();

    // ユーザが存在しない場合
    if (fetched.results.length === 0) {
      return c.json({}, 404);
    }

    // ユーザが存在する場合
    const fetchedResult: {
      id: string;
      name: string;
    } = fetched.results[0];
    const result: UserResult = {
      user: {
        ...fetchedResult,
        firebaseUid: uid,
      },
    };
    return c.json(result);
  }
);

// ユーザ情報を登録する
const postRegisterSchema = z.object({
  uid: z.string(),
  name: z.string(),
});

app.post(
  "/register",
  zValidator("json", postRegisterSchema, processBadRequest),
  authorize,
  async (c) => {
    const { name, uid } = c.req.valid("json");
    const authorizedUid = (c as any).uid;

    if (uid !== authorizedUid) {
      return c.text("Bad Request", 400);
    }

    const id = uuidV4();
    const qb = new D1QB(c.env.DB);
    await qb
      .insert({
        tableName: "user",
        data: {
          id,
          name,
          firebase_uid: uid,
        },
      })
      .execute();

    const result: UserResult = {
      user: {
        id,
        name,
        firebaseUid: uid,
      },
    };
    return c.json(result, 201);
  }
);

export default app;
