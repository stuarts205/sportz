import { Router } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches.js";
import { matches } from "../db/schema.js";
import { db } from "../db/db.js";
import { getMatchStatus } from "../utils/match-status.js";
import { desc } from "drizzle-orm";
import { de } from "zod/locales";

const MAX_LIMIT = 100;

export const matchRouter = Router();

matchRouter.get("/", async (req, res) => {
  const paredResult = listMatchesQuerySchema.safeParse(req.query);
  if (!paredResult.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: JSON.stringify(paredResult.error),
    });
  }

  const limit = Math.min(paredResult.data.limit ?? 20, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);

    res.status(200).json({
      data,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch matches",
      details: JSON.stringify(error),
    });
  } 
});

matchRouter.post("/", async (req, res) => {
  const parseResult = createMatchSchema.safeParse(req.body);
  const {
    data: { startTime, endTime, homeScore, awayScore },
  } = parseResult;
  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: JSON.stringify(parseResult.error),
    });
  }

  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...parseResult.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime),
      })
      .returning();

    res.status(201).json({
      data: event,
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        error: "Failed to create match",
        details: JSON.stringify(error),
      });
  }
});
