import { expect, test, type Page } from "@playwright/test";

type Ev = { event: string; props: Record<string, unknown> };
const events = (page: Page) => page.evaluate(() => (window as unknown as { __events: Ev[] }).__events);

async function walk(page: Page, variant: string) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto(`/?qa=1&nosend=1&variant=${variant}&utm_source=e2e`);
  await page.getByTestId("cta").click();

  await page.getByRole("button", { name: /Flirty and light/ }).click();
  await page.getByRole("button", { name: "25–34" }).click();
  // Back on a question screen returns to the previous question.
  await page.getByRole("button", { name: "← Back" }).click();
  await expect(page.getByRole("heading", { name: "How old are you?" })).toBeVisible();
  await page.getByRole("button", { name: "25–34" }).click();
  await page.getByRole("button", { name: "A woman" }).click();

  await page.getByRole("button", { name: /Witty/ }).click();
  await page.getByRole("button", { name: /Calm/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Short and playful/ }).click();
  await page.getByRole("button", { name: /Late at night/ }).click();

  await expect(page.getByRole("heading", { name: "Here's how Mia might text you" })).toBeVisible();
  await page.getByRole("button", { name: "I like it" }).click();
  await page.getByRole("button", { name: "4 of 5" }).click();
  await page.getByRole("button", { name: "5 of 5" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /However it goes naturally/ }).click();

  await page.getByRole("button", { name: "Yes, remember" }).click({ timeout: 10_000 });
  await expect(page.getByText("Your match")).toBeVisible({ timeout: 10_000 });
  if (variant === "chat_preview") {
    await expect(page.getByTestId("first-message")).toContainText("Still up? Me too.", { timeout: 5_000 });
  } else {
    await expect(page.getByText("% match with your answers")).toBeVisible();
  }
  await page.getByRole("button", { name: "Reply to Mia" }).click();

  await page.getByRole("button", { name: "Save my companion" }).click();
  await expect(page.getByRole("alert")).toContainText("doesn't look like an email");
  await page.getByLabel("Email").fill("tester@example.com");
  await page.getByRole("button", { name: "Save my companion" }).click();

  await expect(page.getByRole("heading", { name: "Mia is waiting for your reply" })).toBeVisible();
  await page.getByRole("radio", { name: /1 week/ }).click();
  await page.getByTestId("start").click();

  await expect(page.getByRole("heading", { name: "This was a demo" })).toBeVisible();
  await page.getByRole("button", { name: "The price" }).click();
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("status")).toBeVisible();

  // No horizontal scroll at any width.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  return events(page);
}

for (const variant of ["chat_preview", "match_score"]) {
  test(`full walkthrough, ${variant}`, async ({ page }) => {
    const ev = await walk(page, variant);
    const names = ev.map((e) => e.event);

    // Every screen fires Step Viewed exactly once, even after Back.
    const viewed = ev.filter((e) => e.event === "Step Viewed").map((e) => e.props.step_id);
    expect(viewed.length).toBe(17);
    expect(new Set(viewed).size).toBe(viewed.length);

    for (const name of ["Landing Viewed", "Quiz Started", "Back Clicked", "Micro Commitment Answered", "Email Error",
      "Email Submitted", "Paywall Viewed", "Plan Selected", "Trial Intent Clicked", "Feedback Submitted"]) {
      expect(names, name).toContain(name);
    }
    expect(ev.find((e) => e.event === "Result Viewed")?.props.result_variant).toBe(variant);
    expect(ev.find((e) => e.event === "Email Submitted")?.props.email_domain).toBe("example.com");
    expect(ev.find((e) => e.event === "Trial Intent Clicked")?.props.plan).toBe("week");

    // No email address ever reaches analytics.
    expect(JSON.stringify(ev)).not.toContain("@");
  });
}
