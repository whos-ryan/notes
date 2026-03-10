import { expect, test } from "@playwright/test";

test("code snippet hover shows edit and delete controls", async ({ page }) => {
  const email = `snippet_ui_${Date.now()}@example.com`;
  const password = "Password123!";

  await page.goto("/login");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByLabel("Username").fill("SnippetUser");
  await page.getByLabel("Email").fill(email);
  await page.getByPlaceholder("Enter password").fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/workspace$/, { timeout: 20000 });
  await expect(page.getByLabel("Note title")).toHaveValue("Untitled");

  await page.getByRole("button", { name: "Code" }).click();
  await page.locator("#code-snippet-language").selectOption("typescript");
  await page.getByPlaceholder("Paste code").fill("const name = 'Ryan';");
  const insertButton = page.getByRole("button", { name: "Insert snippet" });
  await expect(insertButton).toBeEnabled();
  const highlightResponsePromise = page.waitForResponse("**/api/highlight");
  await insertButton.click();
  const highlightResponse = await highlightResponsePromise;
  expect(highlightResponse.status()).toBe(201);

  const snippet = page.locator("[data-code-snippet='true']").first();
  await expect(snippet).toBeVisible();
  await snippet.hover();

  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Del" })).toBeVisible();
});
