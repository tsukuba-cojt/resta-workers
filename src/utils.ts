import { Hook } from "@hono/zod-validator";
import { Env } from "hono";

export const processBadRequest: Hook<Record<string, any>, Env, string> = (
  result,
  c
) => {
  if (!result.success) {
    return c.text("Bad Request", 400);
  }
};
