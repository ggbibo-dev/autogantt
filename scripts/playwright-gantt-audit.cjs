const { chromium } = require("playwright");

async function readDesktop(page) {
  return page.evaluate(() => {
    const paragraphs = Array.from(document.querySelectorAll("p"));
    const listTitles = paragraphs
      .filter(
        (node) =>
          String(node.className).includes("truncate") &&
          String(node.className).includes("text-sm"),
      )
      .slice(0, 5)
      .map((node) => ({
        text: node.textContent?.trim(),
        top: Number(node.getBoundingClientRect().top.toFixed(2)),
        width: Number(node.getBoundingClientRect().width.toFixed(2)),
      }));

    const barTitles = paragraphs
      .filter((node) => String(node.className).includes("text-[13px]"))
      .map((node) => ({
        text: node.textContent?.trim(),
        top: Number(node.getBoundingClientRect().top.toFixed(2)),
        width: Number(node.getBoundingClientRect().width.toFixed(2)),
      }));

    const alignment = listTitles.map((row) => {
      const bar = barTitles.find((item) => item.text === row.text);
      return {
        text: row.text,
        delta: bar ? Number((bar.top - row.top).toFixed(2)) : null,
        rowWidth: row.width,
        barWidth: bar?.width ?? null,
      };
    });

    const labels = Array.from(document.querySelectorAll("span"))
      .filter(
        (node) =>
          String(node.className).includes("text-[11px]") &&
          !String(node.className).includes("uppercase"),
      )
      .slice(0, 6)
      .map((node) => ({
        text: node.textContent?.trim(),
        width: Number(node.getBoundingClientRect().width.toFixed(2)),
      }));

    const textSnippets = Array.from(document.querySelectorAll("p, span, div"))
      .map((node) => (node.textContent || "").trim())
      .filter(Boolean);

    return {
      alignment,
      timelineLabels: labels,
      hasTicketHeader: textSnippets.includes("Ticket"),
      hasStatusHeader: textSnippets.includes("Status"),
      scrollWidth: document.body.scrollWidth,
      clientWidth: document.body.clientWidth,
    };
  });
}

async function readOrder(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("p"))
      .filter(
        (node) =>
          String(node.className).includes("truncate") &&
          String(node.className).includes("text-sm"),
      )
      .slice(0, 3)
      .map((node) => node.textContent?.trim()),
  );
}

async function readDragPoints(page) {
  return page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll("p"))
      .filter((node) => String(node.className).includes("text-[13px]"))
      .map((node) => ({
        text: node.textContent?.trim(),
        rect: node.closest(".absolute.cursor-grab")?.getBoundingClientRect() ?? null,
      }));

    const source = titles.find((item) => item.text === "Toolbar polish");
    const target = titles.find((item) => item.text === "Moodboard pass");
    if (!source?.rect || !target?.rect) {
      return null;
    }

    return {
      source: {
        x: source.rect.left + source.rect.width / 2,
        y: source.rect.top + source.rect.height / 2,
      },
      target: {
        x: source.rect.left + source.rect.width / 2,
        y: target.rect.top + 10,
      },
    };
  });
}

async function readMobile(page) {
  return page.evaluate(() => {
    const paragraphs = Array.from(document.querySelectorAll("p"));
    const listTitles = paragraphs
      .filter(
        (node) =>
          String(node.className).includes("truncate") &&
          String(node.className).includes("text-sm"),
      )
      .slice(0, 5)
      .map((node) => ({
        text: node.textContent?.trim(),
        width: Number(node.getBoundingClientRect().width.toFixed(2)),
      }));

    const barTitles = paragraphs
      .filter((node) => String(node.className).includes("text-[13px]"))
      .map((node) => ({
        text: node.textContent?.trim(),
        width: Number(node.getBoundingClientRect().width.toFixed(2)),
      }));

    const panelGroup = document.querySelector("[data-panel-group]");
    const handles = Array.from(
      document.querySelectorAll("[data-panel-resize-handle-enabled]"),
    ).map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2)),
      };
    });

    return {
      scrollWidth: document.body.scrollWidth,
      clientWidth: document.body.clientWidth,
      listTitles,
      barTitles,
      panelDirection: panelGroup?.getAttribute("data-panel-group-direction"),
      handles,
    };
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173/";

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const desktopPageErrors = [];
  const desktopConsoleErrors = [];
  desktop.on("pageerror", (error) => desktopPageErrors.push(String(error)));
  desktop.on("console", (msg) => {
    if (msg.type() === "error") {
      desktopConsoleErrors.push(msg.text());
    }
  });
  await desktop.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await desktop.locator("text=Demo timeline").waitFor();
  const beforeOrder = await readOrder(desktop);
  const desktopMetrics = await readDesktop(desktop);
  const dragPoints = await readDragPoints(desktop);
  if (!dragPoints) {
    throw new Error("Task bars not found for reorder audit");
  }

  await desktop.mouse.move(dragPoints.source.x, dragPoints.source.y);
  await desktop.mouse.down();
  await desktop.mouse.move(dragPoints.source.x, dragPoints.source.y - 20, {
    steps: 4,
  });
  await desktop.mouse.move(dragPoints.target.x, dragPoints.target.y, { steps: 12 });
  await desktop.mouse.up();
  await desktop.waitForTimeout(500);
  const afterOrder = await readOrder(desktop);
  await desktop.reload({ waitUntil: "domcontentloaded" });
  await desktop.locator("text=Demo timeline").waitFor();
  const persistedOrder = await readOrder(desktop);

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePageErrors = [];
  const mobileConsoleErrors = [];
  mobile.on("pageerror", (error) => mobilePageErrors.push(String(error)));
  mobile.on("console", (msg) => {
    if (msg.type() === "error") {
      mobileConsoleErrors.push(msg.text());
    }
  });
  await mobile.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await mobile.locator("text=Demo timeline").waitFor();
  const mobileMetrics = await readMobile(mobile);

  console.log(
    JSON.stringify(
      {
        desktop: {
          pageErrors: desktopPageErrors,
          consoleErrors: desktopConsoleErrors,
          metrics: desktopMetrics,
          beforeOrder,
          afterOrder,
          persistedOrder,
        },
        mobile: {
          pageErrors: mobilePageErrors,
          consoleErrors: mobileConsoleErrors,
          metrics: mobileMetrics,
        },
      },
      null,
      2,
    ),
  );

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
