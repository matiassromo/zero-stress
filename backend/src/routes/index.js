import { Router } from "express";
const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "zero-stress-api", time: new Date().toISOString() });
});

export default router;
