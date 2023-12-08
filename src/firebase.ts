import { Context, MiddlewareHandler, Next } from "hono";
import { Auth, WorkersKVStoreSingle } from "firebase-auth-cloudflare-workers";
import { Bindings } from "./bindings";
import { D1QB } from "workers-qb";

const verifyJWT = async (authorization: string | undefined, env: Bindings) => {
  if (!authorization) {
    return null;
  }
  const jwt = authorization.replace(/Bearer\s+/i, "");
  const auth = Auth.getOrInitialize(
    env.FIREBASE_PROJECT_ID,
    WorkersKVStoreSingle.getOrInitialize(env.FIREBASE_JWK_CACHE_KEY, env.KV)
  );
  return await auth.verifyIdToken(jwt, {
    FIREBASE_AUTH_EMULATOR_HOST: undefined,
  });
};

export const authorize = (async (c: Context, next: Next) => {
  const verified = await verifyJWT(c.req.header("Authorization"), c.env);
  if (verified === null) {
    return c.text("Unauthorized", 401);
  }
  (c as any).firebaseUid = verified.uid;
  await next();
}) satisfies MiddlewareHandler;

export const getUidFromFirebaseUid = async (
  firebaseUid: string,
  db: D1Database
): Promise<string | null> => {
  const qb = new D1QB(db);
  const query = qb.fetchOne({
    tableName: "user",
    fields: "id",
    where: {
      conditions: `firebase_uid = ${firebaseUid}`,
      params: [true],
    },
  });

  try {
    const result: { id: string } = await query.execute();
    return result ? result["id"] : null;
  } catch (e) {
    console.log(e);
    return null;
  }
};
