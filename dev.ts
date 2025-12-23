const server = Bun.serve({
  async fetch(req) {
    const url = new URL(req.url);
    
    if (url.pathname === "/") {
      return new Response(Bun.file("./index.html"));
    }
    
    if (url.pathname === "/styles.css") {
      return new Response(Bun.file("./styles.css"));
    }
    
    if (url.pathname === "/main.js") {
      const result = await Bun.build({
        entrypoints: ["./src/main.ts"],
        sourcemap: "inline",
      });
      
      if (!result.success) {
        console.error(result.logs);
        return new Response("Build failed", { status: 500 });
      }
      
      const code = await result.outputs[0].text();
      return new Response(code, {
        headers: { "Content-Type": "application/javascript" },
      });
    }
    
    // Handle shader files
    if (url.pathname.startsWith("/src/shaders/")) {
      return new Response(Bun.file("." + url.pathname));
    }
    
    return new Response("Not found", { status: 404 });
  },
  port: 3000,
});

console.log(`Server running at ${server.url}`);
