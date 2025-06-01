"use server";

import { prisma } from "@/lib/prisma";
import { getDBuserId } from "./user.action";
import { revalidatePath } from "next/cache";

export async function createPost(content: string, image: string) {
  try {
    const userId = await getDBuserId();
    const post = await prisma.post.create({
      data: {
        content,
        image,
        authorId: userId,
      },
    });

    revalidatePath("/"); // purge the cache for the homepage
    return { success: true, post };
  } catch (error) {
    console.log("Failed to create post: ", error);
    return { success: false, error: "Failed to create post" };
  }
}
