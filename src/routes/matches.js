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
  const parsedResult = listMatchesQuerySchema.safeParse(req.query);
  if (!parsedResult.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: parsedResult.error.issues,
    });
  }

  const limit = Math.min(parsedResult.data.limit ?? 20, MAX_LIMIT);

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
      details: error.message.issues,
    });
  }
});

matchRouter.post("/", async (req, res) => {
  const parseResult = createMatchSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: parseResult.error.issues,
    });
  }

  const {
    data: { startTime, endTime, homeScore, awayScore },
  } = parseResult;

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

      if(res.app.locals.broadcastMatchCreated){
        res.app.locals.broadcastMatchCreated(event);
      }

    res.status(201).json({
      data: event,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create match",
      details: error.message.issues,
    });
  }
});
