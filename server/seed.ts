import { storage } from "./storage";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  const workers = [
    { username: "john.mason", fullName: "John Mason" },
    { username: "maria.silva", fullName: "Maria Silva" },
    { username: "tom.builder", fullName: "Tom Builder" },
  ];

  for (const w of workers) {
    const existing = await storage.getUserByUsername(w.username);
    if (!existing) {
      const hashedPassword = await bcrypt.hash("worker123", 10);
      await storage.createUser({
        username: w.username,
        password: hashedPassword,
        fullName: w.fullName,
        role: "worker",
      });
    }
  }

  console.log("Database seeded successfully");
}
