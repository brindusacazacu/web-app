import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    qty: { type: String, trim: true }
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true, trim: true },
    timeMinutes: { type: Number, required: true, min: 1 },
    servings: { type: Number, required: true, min: 1 },
    category: { type: String, trim: true },
    mainIngredients: { type: [ingredientSchema], required: true },
    secondaryIngredients: { type: [String], default: [] },
    description: { type: String, required: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const Recipe = mongoose.model("Recipe", recipeSchema);
