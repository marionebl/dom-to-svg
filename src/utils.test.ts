import { createDom } from "./utils";

test("helper produces document for basic dom", () => {
  const { document } = createDom("<h1>Hello World</h1>");
  const element = document.querySelector("h1");

  expect(element).not.toBe(null);

  const el = element as HTMLElement;
  expect(el.textContent).toBe("Hello World");
});
