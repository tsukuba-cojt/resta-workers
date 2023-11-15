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

app.route("/api/format", formatRouter);

export default app;
