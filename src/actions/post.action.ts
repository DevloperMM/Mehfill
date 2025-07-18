"use server";

import { prisma } from "@/lib/prisma";
import { getDBuserId } from "./user.action";
import { revalidatePath } from "next/cache";

export async function createPost(content: string, image: string) {
  try {
    const userId = await getDBuserId();
    if (!userId) return;

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

export async function getPosts() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, username: true, image: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, username: true, image: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: {
          select: { userId: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    return posts;
  } catch (error) {
    console.error("Error getting posts: ", error);
    return [];
  }
}

export async function toggleLike(postId: string) {
  try {
    const userId = await getDBuserId();
    if (!userId) return;

    // check if like exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("No such post found");

    if (existingLike) {
      // unlike
      await prisma.like.delete({
        where: {
          userId_postId: { userId, postId },
        },
      });
    } else {
      // like and create notification (only if liking someone else's post)
      await prisma.$transaction([
        prisma.like.create({
          data: { userId, postId },
        }),

        ...(post.authorId !== userId
          ? [
              prisma.notification.create({
                data: {
                  type: "LIKE",
                  userId: post.authorId, // recipient (post author)
                  creatorId: userId, // person who like
                  postId,
                },
              }),
            ]
          : []),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error toggling like: ", error);
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function createComment(postId: string, content: string) {
  try {
    const userId = await getDBuserId();

    if (!userId) return;
    if (!content) throw new Error("Comment can not be empty");

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("No such post found");

    // Create comment and notification in a transaction
    const [comment] = await prisma.$transaction(async (tx) => {
      // Create comment first
      const newComment = await tx.comment.create({
        data: {
          content,
          authorId: userId,
          postId,
        },
      });

      // Create notification if commenting on someone else's post
      if (post.authorId !== userId) {
        await tx.notification.create({
          data: {
            type: "COMMENT",
            userId: post.authorId,
            creatorId: userId,
            postId,
            commentId: newComment.id,
          },
        });
      }

      return [newComment];
    });

    revalidatePath(`/`);
    return { success: true, comment };
  } catch (error) {
    console.error("Error creating the comment: ", error);
    return { success: false, error: "Failed to create comment" };
  }
}

export async function deletePost(postId: string) {
  try {
    const userId = await getDBuserId();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");
    if (post.authorId !== userId)
      throw new Error("Unauthorized - no delete permission");

    // we can also delete all likes and comments with this post
    await prisma.post.delete({
      where: { id: postId },
    });

    // Delete uploaded image before deleting post

    revalidatePath("/"); // purge the cache
    return { success: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}
