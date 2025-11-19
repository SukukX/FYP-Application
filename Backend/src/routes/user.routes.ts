// user.routes.ts

import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "User routes working" });
});

export default router;
