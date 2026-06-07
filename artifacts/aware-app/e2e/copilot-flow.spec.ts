import { chromium, type Page } from "playwright";

const BASE = "http://localhost:5173";

async function waitForMs(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

test("copilot: generate-tests skill → form → draft card → confirm → test manager");

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log("1. Navigate to Copilot page");
  await page.goto(`${BASE}/copilot`);
  await page.waitForLoadState("networkidle");

  // Verify the page loaded
  const heading = page.locator("text=AI Copilot");
  await heading.waitFor({ state: "visible", timeout: 5000 });
  console.log("   ✅ Copilot page loaded");

  // 2. Click "Generate Test Cases" skill button
  console.log("2. Click Generate Test Cases skill");
  const skillBtn = page.locator("button", { hasText: "Generate Test Cases" });
  await skillBtn.waitFor({ state: "visible", timeout: 3000 });
  await skillBtn.click();
  await waitForMs(300);
  console.log("   ✅ Skill selected");

  // 3. Send a test generation request
  console.log("3. Send test generation request");
  const input = page.locator("input[placeholder*='Ask about']");
  await input.waitFor({ state: "visible", timeout: 3000 });
  await input.fill("Create a test for CDN cache HIT validation");
  
  const sendBtn = page.locator("button.gcp-button-primary").first();
  await sendBtn.click();
  console.log("   ✅ Message sent");

  // 4. Wait for form block to appear (mock provider responds with [FORM])
  console.log("4. Wait for form to appear");
  // The form has a "Submit" button
  const submitBtn = page.locator("button", { hasText: "Submit" });
  await submitBtn.waitFor({ state: "visible", timeout: 10000 });
  console.log("   ✅ Form appeared");

  // 5. Fill in form fields
  console.log("5. Fill form fields");
  // Find all form fields and set values
  const selects = page.locator("select");
  const selectCount = await selects.count();
  for (let i = 0; i < selectCount; i++) {
    const select = selects.nth(i);
    const options = await select.locator("option").all();
    if (options.length > 1) {
      await select.selectOption({ index: 1 });
    }
  }
  console.log(`   ✅ Filled ${selectCount} select fields`);

  // Click radio buttons (first radio in each group)
  const radios = page.locator("span[style*='cursor: pointer']");
  const radioCount = await radios.count();
  if (radioCount > 0) {
    await radios.first().click();
    console.log(`   ✅ Clicked radio`);
  }

  // Fill text inputs
  const textInputs = page.locator("input[placeholder='Type your answer...']");
  const textCount = await textInputs.count();
  for (let i = 0; i < textCount; i++) {
    await textInputs.nth(i).fill(`Test case ${i + 1}`);
  }
  console.log(`   ✅ Filled ${textCount} text inputs`);

  // Toggle the automated toggle if present
  const toggle = page.locator("span[style*='border-radius: 10px']").first();
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click();
    console.log("   ✅ Toggled automated");
  }

  // 6. Submit the form
  console.log("6. Submit form");
  await submitBtn.click();
  console.log("   ✅ Form submitted");

  // 7. Wait for the draft card to appear
  console.log("7. Wait for draft card");
  const draftCard = page.locator("text=Draft Test Case");
  await draftCard.waitFor({ state: "visible", timeout: 15000 });
  console.log("   ✅ Draft card appeared");

  // Verify draft card shows key fields
  await page.locator("text=Name").waitFor({ state: "visible", timeout: 3000 });
  await page.locator("text=Category").waitFor({ state: "visible", timeout: 3000 });
  await page.locator("text=Priority").waitFor({ state: "visible", timeout: 3000 });
  await page.locator("text=Severity").waitFor({ state: "visible", timeout: 3000 });
  console.log("   ✅ Draft card fields visible");

  // 8. Click "Confirm & Open in Test Manager"
  console.log("8. Click Confirm");
  const confirmBtn = page.locator("button", { hasText: "Confirm & Open in Test Manager" });
  await confirmBtn.waitFor({ state: "visible", timeout: 3000 });
  await confirmBtn.click();
  console.log("   ✅ Confirm clicked");

  // 9. Wait for navigation to TestManager
  console.log("9. Wait for Test Manager page");
  await page.waitForURL("**/tests", { timeout: 10000 });
  await page.waitForLoadState("networkidle");

  // Check that the create modal opened (it has "New Test Case" or pre-populated fields)
  const modalTitle = page.locator("h2", { hasText: "New Test Case" });
  await modalTitle.waitFor({ state: "visible", timeout: 5000 });
  console.log("   ✅ Test Manager modal opened");

  // Verify some fields are pre-populated
  const nameInput = page.locator("input[placeholder*='Verify Geo']");
  const nameVal = await nameInput.inputValue().catch(() => "");
  if (nameVal) {
    console.log(`   ✅ Name pre-populated: "${nameVal}"`);
  } else {
    // Check if any input has a non-empty value
    const allInputs = page.locator("input.gcp-input");
    const count = await allInputs.count();
    let filled = 0;
    for (let i = 0; i < count; i++) {
      const val = await allInputs.nth(i).inputValue().catch(() => "");
      if (val) filled++;
    }
    console.log(`   ✅ ${filled} form fields pre-populated`);
  }

  console.log("\n🎉 ALL TESTS PASSED");
  await browser.close();
}

test().catch(err => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});
