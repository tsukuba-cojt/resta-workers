const fs = require("fs");

(async () => {
  const file = fs.readFileSync("./test/test.jpg");
  const base64 = "data:image/jpeg;base64," + file.toString("base64");

  const res = await fetch("http://0.0.0.0:8787/api/thumbnail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      formatId: "f95a12c5-a59c-4382-b48d-8e0d7e0bfe91",
      base64,
    }),
  });
  console.log(await res.text());
})();
