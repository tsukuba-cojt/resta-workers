import { Hono } from "hono";
import { cors } from "hono/cors";

import { Bindings } from "./bindings";
import commentRouter from "./routes/comment";
import formatRouter from "./routes/format";
import thumbnailRouter from "./routes/thumbnail";
import userRouter from "./routes/user";

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

app.route("/api/comments", commentRouter);
app.route("/api/formats", formatRouter);
app.route("/api/thumbnail", thumbnailRouter);
app.route("/api/users", userRouter);

export default app;
