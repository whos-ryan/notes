import { expect, test } from "@playwright/test";

test("sign up and login redirect to workspace", async ({ browser, page }) => {
  const email = `ui_test_${Date.now()}@example.com`;
  const password = "Password123!";

  await page.goto("/login");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByLabel("Username").fill("UITestUser");
  await page.getByLabel("Email").fill(email);
  await page.getByPlaceholder("Enter password").fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/workspace$/, { timeout: 20000 });

  const loginContext = await browser.newContext();
  const loginPage = await loginContext.newPage();
  await loginPage.goto("/login");
  await loginPage.getByLabel("Email").fill(email);
  await loginPage.getByLabel("Password").fill(password);
  await loginPage.getByRole("button", { name: "Login" }).click();
  await expect(loginPage).toHaveURL(/\/workspace$/, { timeout: 20000 });
  await loginContext.close();
});
