import * as Fs from "fs";
import * as Util from "util";
import { DOMParser } from "xmldom";
import { domToSvg } from "./dom-to-svg";
import { bundle, browser } from "./utils";

declare global {
  interface Window {
    DomToSvg: {
      domToSvg: typeof domToSvg;
    };
  }
}

beforeAll(async () => {
  page.on("console", msg => console.log(msg.text()));

  await page.addScriptTag({
    content: await bundle()
  });
});

afterAll(async () => {
  if (process.env.NODE_DEBUG === "dom-to-svg") {
    const html = await page.evaluate(() => new XMLSerializer().serializeToString(document.body));
    console.log(html);
  }
});

test("produces svg element for basic dom", async () => {
  const result = await browser<string>(async el => {
    const { domToSvg: toSvg } = window.DomToSvg;
    el.innerHTML = "<h1>Hello World</h1>";

    const svg = toSvg(el, { document, window });
    el.appendChild(svg);
    return svg.outerHTML;
  });

  const svg = new DOMParser().parseFromString(result, "image/svg");
  expect(svg.documentElement.tagName).toBe("svg");
});

test("contains expected text for html input", async () => {
  const result = await browser<string>(async el => {
    const { domToSvg: toSvg } = window.DomToSvg;
    el.innerHTML = `
      <h1>Hello World</h1>
      <p>Lorem ipsum <span>dolor si amnet</span></p>
    `;

    const svg = toSvg(el, { document, window });
    el.appendChild(svg);
    return svg.outerHTML;
  });

  const svg = new DOMParser().parseFromString(result, "image/svg");
  const texts = Array.from(svg.getElementsByTagName("text")).map(node => node.textContent);

  expect(texts).toEqual(expect.arrayContaining(["Hello World", "Lorem ipsum ", "dolor si amnet"]));
});

test("renders svg in default size of 800x600", async () => {
  const result = await browser<string>(async el => {
    const { domToSvg: toSvg } = window.DomToSvg;
    el.innerHTML = "<h1>Hello World</h1>";

    const svg = toSvg(el, { document, window });
    el.appendChild(svg);
    return svg.outerHTML;
  });

  const svg = new DOMParser().parseFromString(result, "image/svg");

  expect(svg.documentElement).not.toBe(null);
  expect(svg.documentElement.getAttribute("width")).toBe("800");
  expect(svg.documentElement.getAttribute("height")).toBe("600");
});

test("renders document with white background", async () => {
  const background = await browser<string>(async el => {
    const { domToSvg: toSvg } = window.DomToSvg;

    const svg = toSvg(el, { document, window });
    el.appendChild(svg);
    const background = svg.querySelector('[data-background="document"]');

    const bg = background as HTMLElement;
    return bg.getAttribute("fill") || "";
  });

  expect(background).toBe("rgb(255, 255, 255)");
});

test("renders set body background color", async () => {
  const background = await browser<string>(async el => {
    const { domToSvg: toSvg } = window.DomToSvg;
    el.style.backgroundColor = "palevioletred";

    const svg = toSvg(el, { document, window });
    el.appendChild(svg);

    const background = svg.querySelector('[data-background="div"]');
    const bg = background as HTMLElement;

    return bg.getAttribute("fill") || "";
  });

  expect(background).toBe("rgb(219, 112, 147)");
});

test("skips elements with display: none", async () => {
  const result = await browser<string>(async el => {
    const { domToSvg: toSvg } = window.DomToSvg;

    const hidden = document.createElement("div");
    hidden.textContent = "Should be skipped";
    hidden.style.display = "none";

    const element = document.createElement("div");
    element.textContent = "Should not be skipped";

    el.appendChild(hidden);
    el.appendChild(element);

    const svg = toSvg(el, { document, window });
    el.appendChild(svg);

    const skippableElement = svg.querySelector("#div text");
    return skippableElement ? skippableElement.textContent || "" : "";
  });

  expect(result).toBe("Should not be skipped");
});

test("render elements with offset parents correctly", async () => {
  const position = await browser<{ top: number; left: number }>(async el => {
    const { domToSvg: toSvg } = window.DomToSvg;

    const offsetParent = document.createElement("div");
    offsetParent.style.position = "relative";
    offsetParent.style.marginTop = "100px";
    offsetParent.style.marginLeft = "50px";

    const element = document.createElement("main");
    element.style.position = "absolute";
    element.style.top = "50px";
    element.style.left = "100px";
    element.textContent = "Hello World";

    offsetParent.appendChild(element);
    el.appendChild(offsetParent);

    const svg = toSvg(el, { document, window });
    const main = svg.querySelector("#main-background") as HTMLElement;

    return {
      top: parseFloat(main.getAttribute("x") || "0"),
      left: parseFloat(main.getAttribute("y") || "0")
    };
  });

  expect(position.top).toBe(150);
  expect(position.left).toBe(150);
});

test("google.com", async () => {
  await page.goto("https://google.com");
  await page.setViewport({
    width: 1024,
    height: 600
  });

  await page.addScriptTag({
    content: await bundle()
  });

  await page.screenshot({
    path: "screenshots/google.com.png"
  });

  const svg = await page.evaluate(async () => {
    const { domToSvg: toSvg } = window.DomToSvg;
    return toSvg(document.documentElement, { window, document }).outerHTML;
  });

  const writeFile = Util.promisify(Fs.writeFile);
  await writeFile("screenshots/google.com.svg", svg);
});
