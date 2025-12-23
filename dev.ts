import index from "./index.html";

const server = Bun.serve({
  routes: {
    "/": index,
    "/styles.css": Bun.file("./styles.css"),
    "/main.js": Bun.file("./src/main.ts"),
  },
  development: true,
});

console.log(`Server running at ${server.url}`);
