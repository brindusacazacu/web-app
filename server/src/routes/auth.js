import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    if (String(password).length < 6) return res.status(400).json({ error: "Password min 6 chars" });

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name?.trim(), email, passwordHash });

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});
