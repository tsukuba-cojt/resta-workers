import { D1QB } from "workers-qb";

import { CommentResult } from "./comment";
import { User } from "./user";

export interface Format {
  id: string;
  title: string;
  description: string;
  tags: string[];
  blocks: {
    url: string;
    block: string;
  }[];
  comments: {
    star: number | null;
    comment: string | null;
  }[];
  stars: number;
  thumbnails: string[];
  download: number;
  user: User;
  createdAt: string;
  updatedAt: string;
}

interface FormatResult {
  id: string;
  title: string;
  description: string;
  tags: string;
  download: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  ft: {
    order_no: number;
    src: string;
  };
}

interface FormatBlock {
  format_id: string;
  order_no: number;
  url: string;
  block: string;
}

interface FormatThumbnail {
  format_id: string;
  order_no: number;
  src: string;
  block: string;
}

export const fetchFormatsById = async (ids: string[], qb: D1QB) => {
  if (ids.length === 0) {
    return [];
  }
  const result = await qb
    .fetchAll({
      tableName: "format",
      fields: "*",
      where: {
        conditions: `id in (${ids.map(() => "?").join(",")})`,
        params: ids,
      },
    })
    .execute();
  return result.results as FormatResult[];
};

export const fetchFormatList = async (
  keyword: string | null,
  url: string | null,
  limit: number,
  offset: number | null,
  qb: D1QB
) => {
  const conditions: string[] = [];
  const params: string[] = [];
  if (keyword) {
    conditions.push("title like ?");
    params.push(`%${keyword}%`);
  }
  if (url) {
    const blocks = (
      await qb
        .fetchAll({
          tableName: "format_block",
          fields: "*",
          where: {
            conditions: `url like ?`,
            params: [`%${url}%`],
          },
        })
        .execute()
    ).results as FormatBlock[];

    const ids = blocks.map(({ format_id }) => format_id);
    if (ids.length === 0) {
      return [];
    }
    conditions.push(`id in (${ids.map(() => "?").join(",")})`);
    params.push(...ids);
  }

  const result = await qb
    .fetchAll({
      tableName: "format",
      fields: "*",
      where: conditions.length > 0 ? { conditions, params } : undefined,
      limit,
      offset: offset ?? undefined,
    })
    .execute();
  return result.results as FormatResult[];
};

export const fetchFormatBlocks = async (formatIds: string[], qb: D1QB) => {
  if (formatIds.length === 0) {
    return [];
  }
  const result = await qb
    .fetchAll({
      tableName: "format_block",
      fields: "*",
      where: {
        conditions: `format_id in (${formatIds.map(() => "?").join(",")})`,
        params: formatIds,
      },
    })
    .execute();
  return result.results as FormatBlock[];
};

export const fetchFormatThumbnails = async (formatIds: string[], qb: D1QB) => {
  if (formatIds.length === 0) {
    return [];
  }
  const result = await qb
    .fetchAll({
      tableName: "format_thumbnail",
      fields: "*",
      where: {
        conditions: `format_id in (${formatIds.map(() => "?").join(",")})`,
        params: formatIds,
      },
    })
    .execute();
  return result.results as FormatThumbnail[];
};

export const insertFormat = async (
  formatId: string,
  title: string,
  description: string,
  tags: string[],
  uid: string,
  qb: D1QB
) => {
  await qb
    .insert({
      tableName: "format",
      data: {
        id: formatId,
        title,
        description,
        tags: JSON.stringify(tags),
        user_id: uid,
      },
    })
    .execute();
};

export const insertFormatBlock = async (
  formatId: string,
  blocks: { url: string; block: string }[],
  qb: D1QB
) => {
  if (blocks.length === 0) {
    return;
  }
  const data = blocks.map(({ block, url }, index) => ({
    format_id: formatId,
    order_no: index,
    block: block,
    url,
  }));
  await qb
    .insert({
      tableName: "format_block",
      data,
    })
    .execute();
};

export const insertFormatThumbnails = async (
  formatId: string,
  thumbnails: string[],
  qb: D1QB
) => {
  if (thumbnails.length === 0) {
    return;
  }
  const data = thumbnails.map((src, index) => ({
    format_id: formatId,
    order_no: index,
    src,
  }));
  await qb
    .insert({
      tableName: "format_thumbnail",
      data,
    })
    .execute();
};

export const groupFormat = (
  format: FormatResult,
  blocks: FormatBlock[],
  thumbnails: FormatThumbnail[],
  comments: CommentResult[],
  user: User
): Format => {
  const stars =
    comments.length > 0
      ? comments.reduce((prev, { star }) => prev + star, 0) / comments.length
      : 0;
  return {
    id: format.id,
    title: format.title,
    description: format.description,
    tags: JSON.parse(format.tags),
    comments: comments.map(({ star, comment }) => ({ star, comment })),
    stars,
    blocks: blocks
      .sort((a, b) => a.order_no - b.order_no)
      .map(({ url, block }) => ({ url, block })),
    thumbnails: thumbnails
      .sort(({ order_no }) => order_no)
      .map(({ src }) => src),
    download: format.download,
    user,
    createdAt: format.created_at,
    updatedAt: format.updated_at,
  };
};
