import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  profileImage: text("profile_image"),
  membershipType: text("membership_type").notNull().default("free"),
  isMainAccount: boolean("is_main_account").notNull().default(true),
  parentUserId: integer("parent_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  age: integer("age"),
  gender: text("gender"),
  dailyCalorieGoal: integer("daily_calorie_goal").notNull().default(2000),
  healthGoals: text("health_goals").array().notNull().default([]),
  dietaryRestrictions: text("dietary_restrictions").array().notNull().default([]),
  allergies: text("allergies").array().notNull().default([]),
  dislikes: text("dislikes").array().notNull().default([]),
  favorites: text("favorites").array().notNull().default([]),
  activityLevel: text("activity_level").notNull().default("moderate"),
  medicalConditions: text("medical_conditions").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  lastMessage: text("last_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pantryItems = pgTable("pantry_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  itemName: text("item_name").notNull(),
  category: text("category").notNull(),
  quantity: real("quantity").notNull().default(1),
  unit: text("unit").notNull().default("pieces"),
  expirationDate: timestamp("expiration_date"),
  location: text("location").notNull().default("pantry"),
  addedDate: timestamp("added_date").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  notes: text("notes"),
});

export const nutritionEntries = pgTable("nutrition_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  calories: integer("calories").notNull().default(0),
  protein: real("protein").notNull().default(0),
  carbs: real("carbs").notNull().default(0),
  fat: real("fat").notNull().default(0),
  fiber: real("fiber").notNull().default(0),
  sugar: real("sugar").notNull().default(0),
  sodium: real("sodium").notNull().default(0),
  waterIntake: real("water_intake").notNull().default(0),
  healthScore: real("health_score"),
  notes: text("notes"),
});

// All insert schemas and types...
export type User = typeof users.$inferSelect;
export type PantryItem = typeof pantryItems.$inferSelect;
export type NutritionEntry = typeof nutritionEntries.$inferSelect;
// ... more types
