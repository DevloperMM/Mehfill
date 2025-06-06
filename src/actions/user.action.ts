"use server";

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function syncUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return;

    // check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    let dbUser;
    if (existingUser) {
      // if (
      //   existingUser.name ===
      //     `${user.firstName || ""} ${user.lastName || ""}` &&
      //   existingUser.image === user.imageUrl
      // )
      dbUser = existingUser;

      // dbUser = await prisma.user.update({
      //   where: { clerkId: userId },
      //   data: {
      //     name: `${user.firstName || ""} ${user.lastName || ""}`,
      //     image: user.imageUrl,
      //   },
      // });
    } else {
      dbUser = await prisma.user.create({
        data: {
          clerkId: userId,
          name: `${user.firstName || ""} ${user.lastName || ""}`,
          username:
            user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
          email: user.emailAddresses[0].emailAddress,
          image: user.imageUrl,
        },
      });
    }

    revalidatePath("/");
    return dbUser;
  } catch (error) {
    console.log("Error in syncUser", error);
    return { success: false, error: "Failed to sync user" };
  }
}

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
}

export async function getDBuserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("No such user found");

  return user.id;
}

export async function getRandomUsers() {
  try {
    const userId = await getDBuserId();

    if (!userId) return [];

    // Get 3 random users excluding the current user and those already followed
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } },
          {
            NOT: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
          },
        ],
      },

      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },

      take: 3,
    });

    return users;
  } catch (error) {
    console.error("Error fetching random users:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function toggleFollow(targetUserId: string) {
  try {
    const userId = await getDBuserId();

    if (!userId) return;

    if (userId === targetUserId) throw new Error("You cannot follow yourself");

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });

    console.log("Existing follow:", existingFollow);

    if (existingFollow) {
      // Unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });
    } else {
      // Follow
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId,
          },
        }),

        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId, // user being followed
            creatorId: userId, // user who is following
          },
        }),
      ]);
    }

    return { success: true };
  } catch (error) {
    console.error("Error toggling follow: ", error);
    return { success: false, error: "Failed to toggle follow" };
  }
}
