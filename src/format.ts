import { D1QB } from "workers-qb";

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
        conditions: `id in (?)`,
        params: [ids.join(",")],
      },
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
        conditions: `format_id in (?)`,
        params: [formatIds.join(",")],
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
        conditions: `format_id in (?)`,
        params: [formatIds.join(",")],
      },
    })
    .execute();
  return result.results as FormatThumbnail[];
};
