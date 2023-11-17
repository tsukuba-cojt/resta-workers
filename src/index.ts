import { Hono } from "hono";
import { cors } from "hono/cors";

import { Bindings } from "./bindings";
import formatRouter from "./routes/format";

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000", "https://resta-frontend.pages.dev"],
  })
);

app.get("/", (c) => {
  return c.text("Hello! This is Resta endpoint.");
});

app.route("/api/formats", formatRouter);

export default app;
