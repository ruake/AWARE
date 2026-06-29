import { Router, type IRouter } from "express";
import { generateSeedData } from "../lib/generateData";

const router: IRouter = Router();

router.get("/data.json", (_req, res) => {
  const data = generateSeedData();
  res.json(data);
});

export default router;
