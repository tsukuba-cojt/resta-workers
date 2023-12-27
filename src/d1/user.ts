import { D1QB } from "workers-qb";

export interface User {
  id: string;
  firebaseUid: string;
  name: string;
}

export interface UserResult {
  id: string;
  firebase_uid: string;
  name: string;
}

export const fetchUsers = async (uids: string[], qb: D1QB) => {
  if (uids.length === 0) {
    return [];
  }
  const results = (
    await qb
      .fetchAll({
        tableName: "user",
        fields: "id, firebase_uid, name",
        where: {
          conditions: `id in (${uids.map(() => "?").join(",")})`,
          params: uids,
        },
      })
      .execute()
  ).results as UserResult[];
  return results.map((result) => convertUser(result));
};

export const fetchUsersByFirebaseUid = async (
  firebaseUid: string,
  qb: D1QB
) => {
  if (firebaseUid.length === 0) {
    return [];
  }
  const results = (
    await qb
      .fetchAll({
        tableName: "user",
        fields: "id, firebase_uid, name",
        where: {
          conditions: "firebase_uid = ?",
          params: [firebaseUid],
        },
      })
      .execute()
  ).results as UserResult[];
  return results.map((result) => convertUser(result));
};

const convertUser = (user: UserResult) => {
  return {
    id: user.id,
    firebaseUid: user.firebase_uid,
    name: user.name,
  };
};
