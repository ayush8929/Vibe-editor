"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const getCurrentUserWithAccounts = async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: true },
  });

  return user;
};

export const updateProfile = async (data: {
  name?: string;
  image?: string;
}) => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const name = data.name?.trim();
  const image = data.image?.trim();

  if (!name) {
    throw new Error("Name cannot be empty");
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: {
      name,
      image: image ? image : undefined,
    },
  });

  revalidatePath("/dashboard/settings");

  return updated;
};
