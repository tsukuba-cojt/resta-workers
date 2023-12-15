import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { v4 as uuidV4 } from "uuid";
import { D1QB } from "workers-qb";
import { z } from "zod";

import { Bindings } from "../bindings";
import { authorize } from "../firebase";
import { processBadRequest } from "../utils";

interface UserResult {
  user?: {
    uid: string;
    firebaseUid: string;
    name: string;
  };
}

const app = new Hono<{ Bindings: Bindings }>();

// 自分自身のユーザ情報を取得する
app.get("/me", authorize, async (c) => {
  const firebaseUid = (c as any).firebaseUid;
  const qb = new D1QB(c.env.DB);

  interface FetchResult {
    id: string;
    firebase_uid: string;
    name: string;
  }
  const fetched: FetchResult[] = (
    await qb
      .fetchAll({
        tableName: "user",
        fields: "id, firebase_uid, name",
        where: {
          conditions: `firebase_uid = '${firebaseUid}'`,
        },
      })
      .execute()
  ).results;

  // ユーザが存在しない場合
  if (fetched.length === 0) {
    return c.json({}, 404);
  }

  // ユーザが存在する場合
  const result: UserResult = {
    user: {
      uid: fetched[0].id,
      firebaseUid: fetched[0].firebase_uid,
      name: fetched[0].name,
    },
  };
  return c.json(result);
});

// ユーザ情報を登録する
const postRegisterSchema = z.object({
  firebaseUid: z.string(),
  name: z.string(),
});

app.post(
  "/register",
  zValidator("json", postRegisterSchema, processBadRequest),
  authorize,
  async (c) => {
    const { name, firebaseUid } = c.req.valid("json");
    const authorizedFirebaseUid = (c as any).firebaseUid;

    if (firebaseUid !== authorizedFirebaseUid) {
      return c.text("Bad Request", 400);
    }

    const uid = uuidV4();
    const qb = new D1QB(c.env.DB);

    await qb
      .insert({
        tableName: "user",
        data: {
          uid,
          name,
          firebase_uid: firebaseUid,
        },
      })
      .execute();

    const result: UserResult = {
      user: {
        uid,
        firebaseUid,
        name,
      },
    };
    return c.json(result, 201);
  }
);

export default app;
