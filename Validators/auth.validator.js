import { z } from "zod";

export const signupSchema = z.object({
    userName: z.string().trim().min(3, "Username must be at least 3 characters long"),
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const loginSchema = z.object({
    email: z.string().trim().email("Invalid email address"),
    password: z.string().trim().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
    userName: z.string().trim().min(3, "Username must be at least 3 characters long").optional(),
    email: z.string().trim().email("Invalid email address").optional(),
    bio: z.string().optional(),
    link: z.string().optional(),
    // profilePic and coverPic are handled via cloudinary before validation in controller usually, or passed as strings
    // but in current controller they are passed in body.
    profilePic: z.string().optional(),
    coverPic: z.string().optional(),
});
