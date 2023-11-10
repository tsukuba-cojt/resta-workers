import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { D1QB } from "workers-qb";
import { Bindings } from "./bindings";

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000", "https://resta-frontend.pages.dev"],
  })
);

app.get("/api/formatdatas", (c) => {
  // TODO
  return c.text("TODO");
});

app.get("/api/formatdatas/:id", (c) => {
  // TODO
  return c.text("TODO");
});

const postFormatDatasSchema = z.object({
  userId: z.string(),
  title: z.string(),
  images: z.array(z.string()),
  description: z.string(),
  tags: z.array(z.string()),
  formatBlocks: z.array(z.unknown()),
});

app.post("/api/formatdatas", zValidator("json", postFormatDatasSchema), (c) => {
  // TODO
  return c.text("TODO");
});

export default app;
