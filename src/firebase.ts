import { Auth, WorkersKVStoreSingle } from "firebase-auth-cloudflare-workers";
import { Bindings } from "./bindings";

export const verifyJWT = async (
  authorization: string | undefined,
  env: Bindings
) => {
  if (!authorization) {
    return null;
  }
  const jwt = authorization.replace(/Bearer\s+/i, "");
  const auth = Auth.getOrInitialize(
    env.FIREBASE_PROJECT_ID,
    WorkersKVStoreSingle.getOrInitialize(
      env.PUBLIC_JWK_CACHE_KEY,
      env.PUBLIC_JWK_CACHE_KV
    )
  );
  return await auth.verifyIdToken(jwt, env);
};

/*export const getUserIdFromFirebaseToken = async (
  token: FirebaseIdToken,
  db: D1Database
): Promise<string | null> => {
  const qb = new D1QB(db);
  const query = qb.fetchOne({
    tableName: "user",
    fields: "",
    where: {
      conditions: `firebase_uid = ${token.uid}`,
      params: [true],
    },
  });

  try {
    const result = await query.execute();
    return result ? result["id"] : null;
  } catch (e) {
    console.log(e);
    return null;
  }
};*/
