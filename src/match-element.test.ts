import { matchElement } from './match-element';
import { createDom, createSvg } from './utils';

test('matchText returns true for textNode', () => {
  const { window, document } = createDom();
  const svg = createSvg({document});
  const element = document.createElement('h1');

  expect(matchElement(element, {document, window, svg})).toBe(true);
});
