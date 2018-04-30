import { DOMParser } from 'xmldom';
import { domToSvg } from './dom-to-svg';
import { bundle, browser } from './utils';

declare global {
  interface Window {
    DomToSvg: {
      domToSvg: typeof domToSvg;
    };
  }
}

beforeAll(async () => {
  page.on('console', msg => console.log(msg.text()));

  await page.addScriptTag({
    content: await bundle()
  });
});

test('produces svg element for basic dom', async () => {
  const result = await browser<string>(async el => {
    const {domToSvg: toSvg} = window.DomToSvg;
    el.innerHTML = '<h1>Hello World</h1>';
    return toSvg(el, {document, window}).outerHTML;
  });

  const svg = new DOMParser().parseFromString(result, 'image/svg');
  expect(svg.documentElement.tagName).toBe('svg');
});

test('contains expected text for html input', async () => {
  const result = await browser<string>(async el => {
    const {domToSvg: toSvg} = window.DomToSvg;
    el.innerHTML = `
      <h1>Hello World</h1>
      <p>Lorem ipsum <span>dolor si amnet</span></p>
    `;
    return toSvg(el, {document, window}).outerHTML;
  });

  const svg = new DOMParser().parseFromString(result, 'image/svg');
  const texts = Array.from(svg.getElementsByTagName('text')).map(node => node.textContent);

  expect(texts).toEqual(expect.arrayContaining(['Hello World', 'Lorem ipsum ', 'dolor si amnet']));
});

test('renders svg in default size of 800x600', async () => {
  const result = await browser<string>(async el => {
    const {domToSvg: toSvg} = window.DomToSvg;
    el.innerHTML = '<h1>Hello World</h1>';
    return toSvg(el, {document, window}).outerHTML;
  });

  const svg = new DOMParser().parseFromString(result, 'image/svg');

  expect(svg.documentElement).not.toBe(null);
  expect(svg.documentElement.getAttribute("width")).toBe("800");
  expect(svg.documentElement.getAttribute("height")).toBe("600");
});

test('renders document with white background', async () => {
  const background = await browser<string>(async el => {
    const {domToSvg: toSvg} = window.DomToSvg;

    const svg = toSvg(el, {document, window});
    const background = svg.querySelector("[data-background=\"document\"]");

    const bg = background as HTMLElement;
    return bg.getAttribute("fill") || "";
  });

  expect(background).toBe('rgb(255, 255, 255)');
});

test('renders set body background color', async () => {
  const background = await browser<string>(async el => {
    const {domToSvg: toSvg} = window.DomToSvg;
    const style = document.createElement('style');
    style.textContent = `#${el.getAttribute("id")} { background: palevioletred; }`;
    document.head.appendChild(style);

    el.innerHTML = '<h1>Hello World</h1>';
    const svg = toSvg(el, {document, window});
    const background = svg.querySelector("[data-background=\"div\"]");
    const bg = background as HTMLElement;

    return bg.getAttribute("fill") || "";
  });


  expect(background).toBe('rgb(219, 112, 147)');
});
