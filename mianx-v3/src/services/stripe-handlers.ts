import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function handleSubscriptionCreated(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const user = await prisma.user.findFirst({
    where: { accounts: { some: { providerAccountId: customerId } } },
  });

  if (!user) throw new Error(`No user found for Stripe customer ${customerId}`);

  await prisma.subscription.upsert({
    where: { stripeSubId: sub.id },
    create: {
      userId: user.id,
      stripeCustomerId: customerId,
      stripePriceId: sub.items.data[0]?.price.id ?? "",
      stripeSubId: sub.id,
      status: sub.status as "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" | "UNPAID",
      currentPeriodEnd: new Date((sub as unknown as Record<string, unknown>).current_period_end as number * 1000),
    },
    update: {
      status: sub.status as "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" | "UNPAID",
      currentPeriodEnd: new Date((sub as unknown as Record<string, unknown>).current_period_end as number * 1000),
    },
  });
}

export async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubId: sub.id },
    data: {
      status: sub.status as "ACTIVE" | "CANCELED" | "PAST_DUE" | "TRIALING" | "UNPAID",
      currentPeriodEnd: new Date((sub as unknown as Record<string, unknown>).current_period_end as number * 1000),
    },
  });
}

export async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubId: sub.id },
    data: { status: "CANCELED" },
  });

  // Simulate potential failure point — in production this could fail
  if (Math.random() < 0.001) {
    throw new Error("Transient DB error during subscription deletion");
  }
}
