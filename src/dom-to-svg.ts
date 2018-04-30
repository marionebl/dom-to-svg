// import { matchText } from './match-text';
import { NodeType } from "./node";

export interface Context {
  document: Document;
  element?: HTMLElement;
  svg?: HTMLElement;
  window: Window;
}

export function domToSvg(node: Node, context: Context): HTMLElement {
  const { document, window } = context;

  if (!context.svg) {
    const svg = document.createElement("svg");
    const width = document.body.clientWidth;
    const height = document.body.clientHeight;

    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    context.svg = svg;
  }

  context.element = context.element || context.svg;

  switch (node.nodeType) {
    case NodeType.ELEMENT_NODE: {
      const inputElement = node as HTMLElement;
      const rect = inputElement.getBoundingClientRect();
      const styles = window.getComputedStyle(inputElement);

      const group = document.createElement("g");
      context.element.appendChild(group);
      context.element = group;

      if (rect.width > 0 && rect.height > 0) {
        const background = document.createElement("rect");

        background.setAttribute("width", String(rect.width));
        background.setAttribute("height", String(rect.height));

        background.setAttribute("x", String(inputElement.offsetLeft));
        background.setAttribute("y", String(inputElement.offsetTop));

        const defaultBackground = inputElement.tagName === "BODY"
          ? "#fffff"
          : "transparent";

        background.setAttribute("fill", styles.backgroundColor || defaultBackground);

        group.appendChild(background);
      }

      walk(node, n => domToSvg(n, context));
      break;
    }
    case NodeType.TEXT_NODE: {
      const parent = node.parentElement;

      if (!parent) {
        break;
      }

      const text = document.createElement("text");
      text.setAttribute("x", String(parent.offsetLeft));
      text.setAttribute("y", String(parent.offsetTop));
      text.setAttribute("alignment-baseline", "hanging");

      context.element.appendChild(text);
      text.textContent = node.textContent;
    }
  }

  return context.svg;
}

function walk(node: Node, predicate: (node: Node) => void): void {
  // tslint:disable-next-line:prefer-for-of
  for (let i = 0; i < node.childNodes.length; ++i) {
    predicate(node.childNodes[i]);
  }
}
