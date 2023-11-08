import { Hono } from "hono";
import { D1QB } from "workers-qb";
import { Bindings } from "./bindings";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => c.text("Hello World!!!"));

export default app;
