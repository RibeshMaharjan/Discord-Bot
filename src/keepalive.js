import express from "express";

const app = express();

app.get("/health", (req, res) => res.send("Bot is running"));

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

export default { app };
