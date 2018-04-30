import { matchText } from './match-text';
import { createDom, createSvg } from './utils';

test('matchText returns true for textNode', () => {
  const { window, document } = createDom();
  const svg = createSvg({document});

  const textNode = document.createTextNode('Hello World');

  expect(matchText(textNode, {document, window, svg})).toBe(true);
});
