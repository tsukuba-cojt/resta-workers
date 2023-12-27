import { D1QB } from "workers-qb";

export interface CommentResult {
  id: string;
  user_id: string;
  format_id: string;
  star: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export const fetchComments = async (formatIds: string[], qb: D1QB) => {
  if (formatIds.length === 0) {
    return [];
  }
  const result = (
    await qb
      .fetchAll({
        tableName: "comment",
        fields: "*",
        where: {
          conditions: `format_id in (${formatIds.map(() => "?").join(",")})`,
          params: formatIds,
        },
      })
      .execute()
  ).results as CommentResult[];
  return result;
};

export const insertComment = async (
  id: string,
  formatId: string,
  comment: string,
  star: number,
  uid: string,
  qb: D1QB
) => {
  await qb
    .insert({
      tableName: "comment",
      data: {
        id,
        user_id: uid,
        format_id: formatId,
        star,
        comment,
      },
    })
    .execute();
};
