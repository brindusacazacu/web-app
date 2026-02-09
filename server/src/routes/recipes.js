import express from "express";
import { Recipe } from "../models/Recipe.js";
import { requireAuth } from "../middleware/auth.js";

export const recipesRouter = express.Router();

// public: list recipes
recipesRouter.get("/", async (req, res) => {
  const recipes = await Recipe.find()
    .sort({ createdAt: -1 })
    .populate("createdBy", "email name");
  res.json(recipes);
});

// public: get one
recipesRouter.get("/:id", async (req, res) => {
  const recipe = await Recipe.findById(req.params.id).populate("createdBy", "email name");
  if (!recipe) return res.status(404).json({ error: "Not found" });
  res.json(recipe);
});

// auth: create
recipesRouter.post("/", requireAuth, async (req, res) => {
  const data = req.body || {};
  const created = await Recipe.create({
    ...data,
    createdBy: req.user.userId
  });
  const populated = await created.populate("createdBy", "email name");
  res.status(201).json(populated);
});

// auth: update (only owner)
recipesRouter.put("/:id", requireAuth, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ error: "Not found" });

  if (recipe.createdBy.toString() !== req.user.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  Object.assign(recipe, req.body || {}, { updatedAt: new Date() });
  await recipe.save();
  const populated = await recipe.populate("createdBy", "email name");
  res.json(populated);
});

// auth: delete (only owner)
recipesRouter.delete("/:id", requireAuth, async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ error: "Not found" });

  if (recipe.createdBy.toString() !== req.user.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await Recipe.deleteOne({ _id: recipe._id });
  res.json({ ok: true });
});
