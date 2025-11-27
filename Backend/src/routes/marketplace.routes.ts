import { Router } from "express";
import { getListings, getPropertyDetails } from "../controllers/marketplace.controller";

const router = Router();

router.get("/", getListings);
router.get("/:id", getPropertyDetails);

export default router;
