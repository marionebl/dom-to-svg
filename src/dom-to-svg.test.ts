import { DOMParser } from 'xmldom';
import { domToSvg } from './dom-to-svg';
import { bundle, createDom } from './utils';

declare global {
  interface Window {
    DomToSvg: {
      domToSvg: typeof domToSvg;
    };
  }
}

beforeAll(async () => {
  page.on('console', msg => console.log(msg));

  await page.addScriptTag({
    content: await bundle()
  });
});

test('produces svg element for basic dom', () => {
  const { window, document } = createDom('<h1>Hello World</h1>');
  const result = domToSvg(document.documentElement, { window, document });

  expect(result.tagName).toBe('SVG');
});

test('contains same text as basic input dom', () => {
  const { window, document } = createDom('<h1>Hello World</h1>');
  const result = domToSvg(document.documentElement, { window, document });

  const textElement = result.querySelector('text');
  expect(textElement).not.toBe(null);

  const text = textElement as SVGTextElement;
  expect(text.textContent).toBe('Hello World');
});

test('contains expected text for html input', () => {
  const { window, document } = createDom(`
        <h1>Hello World</h1>
        <p>Lorem ipsum <span>dolor si amnet</span></p>
    `);

  const result = domToSvg(document.documentElement, { window, document });
  const textElements = Array.from(result.querySelectorAll('text')).map(node => node.textContent);

  expect(textElements).toEqual(expect.arrayContaining(['Hello World', 'Lorem ipsum ', 'dolor si amnet']));
});

test('renders ', async () => {
  const result = await page.evaluate(async () => {
    const {domToSvg: toSvg} = window.DomToSvg;
    document.body.innerHTML = '<h1>Hello World</h1>';
    return toSvg(document.body, {document, window}).outerHTML;
  });

  const svg = new DOMParser().parseFromString(result, 'image/svg');

  expect(svg.documentElement).not.toBe(null);
  expect(svg.documentElement.getAttribute("width")).toBe("800");
  expect(svg.documentElement.getAttribute("height")).toBe("600");
});


