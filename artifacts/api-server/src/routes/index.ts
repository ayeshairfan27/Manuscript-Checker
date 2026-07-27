import { Router, type IRouter } from "express";
import healthRouter from "./health";
import manuscriptRouter from "./manuscript";

const router: IRouter = Router();

router.use(healthRouter);
router.use(manuscriptRouter);

export default router;
