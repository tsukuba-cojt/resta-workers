import { Env, Hono } from "hono";
import { cors } from "hono/cors";
import { Hook } from "@hono/zod-validator";

import { Bindings } from "./bindings";
import formatRouter from "./routes/format";

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000", "https://resta-frontend.pages.dev"],
  })
);

app.route("/api/format", formatRouter);

app.get("/", (c) => {
  return c.text("Resta endpoint");
});

export const processBadRequest: Hook<Record<string, any>, Env, string> = async (
  result,
  c
) => {
  if (!result.success) {
    return c.text("Bad Request", 400);
  }
};

export default app;
