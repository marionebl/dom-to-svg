// import { matchText } from './match-text';
import { NodeType } from "./node";

export interface BrowserContext {
  document: Document;
  window: Window;
}

export interface Context {
  document: Document;
  element?: HTMLElement;
  svg?: HTMLElement;
  window: Window;
}

export function domToSvg(node: Node, context: Context): HTMLElement {
  const { document, window } = context;

  if (!context.svg) {
    const element = node as HTMLElement;
    const svg = document.createElement("svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttributeNS("xmlns", "xlink", "http://www.w3.org/1999/xlink");

    const width = element.clientWidth;
    const height = element.clientHeight;

    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const bg = document.createElement("rect");

    bg.setAttribute("width", String(width));
    bg.setAttribute("height", String(height));

    bg.setAttribute("x", String(0));
    bg.setAttribute("y", String(0));

    bg.setAttribute("fill", "rgb(255, 255, 255)");

    bg.setAttribute("id", "document-background");
    bg.setAttribute("data-background", "document");

    svg.appendChild(bg);
    context.svg = svg;
  }

  context.element = context.element || context.svg;

  switch (node.nodeType) {
    case NodeType.ELEMENT_NODE: {
      const inputElement = node as HTMLElement;
      const rect = inputElement.getBoundingClientRect();
      const styles = window.getComputedStyle(inputElement);
      const tagName = inputElement.tagName.toLowerCase();

      if (
        styles.getPropertyValue("display") === "none" ||
        styles.getPropertyValue("opacity") === "0" ||
        styles.getPropertyPriority("visibility") === "hidden"
      ) {
        break;
      }

      if (tagName === "img") {
        const inputImage = inputElement as HTMLImageElement;
        const image = document.createElement("image");

        const canvas = document.createElement("canvas");
        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.drawImage(inputImage, 0, 0, rect.width, rect.height);

        image.setAttribute("id", "img");
        image.setAttribute("x", String(rect.left));
        image.setAttribute("y", String(rect.top));
        image.setAttribute("width", String(rect.width));
        image.setAttribute("height", String(rect.height));
        image.setAttributeNS("xlink", "href", canvas.toDataURL());

        context.element.appendChild(image);
        break;
      }

      const group = document.createElement("g");
      const name = inputElement.tagName.toLowerCase();

      group.setAttribute("id", name);
      group.setAttribute("data-id", name);

      context.element.appendChild(group);
      context.element = group;

      if (rect.width > 0 && rect.height > 0) {
        const background = document.createElement("rect");

        background.setAttribute("width", String(rect.width));
        background.setAttribute("height", String(rect.height));

        background.setAttribute("x", String(rect.left));
        background.setAttribute("y", String(rect.top));

        const backgroundColor = styles.backgroundColor || "rgba(0, 0, 0, 0)";

        background.setAttribute("fill", backgroundColor);

        background.setAttribute("id", `${name}-background`);
        background.setAttribute("data-background", name);

        if (styles.getPropertyValue("border-top-color") !== "transparent" && styles.getPropertyValue("border-top-width") !== "0px") {
          const borderTop = document.createElement("line");
          borderTop.setAttribute("stroke", styles.getPropertyValue("border-top-color"));
          borderTop.setAttribute("stroke-width", styles.getPropertyValue("border-top-width"));
          borderTop.setAttribute("x1", String(rect.left));
          borderTop.setAttribute("x2", String(rect.left + rect.width));
          borderTop.setAttribute("y1", String(rect.top));
          borderTop.setAttribute("y2", String(rect.top));
          group.appendChild(borderTop);
        }

        if (styles.getPropertyValue("border-right-color") !== "transparent" && styles.getPropertyValue("border-right-width") !== "0px") {
          const borderRight = document.createElement("line");
          borderRight.setAttribute("stroke", styles.getPropertyValue("border-right-color"));
          borderRight.setAttribute("stroke-width", styles.getPropertyValue("border-right-width"));
          borderRight.setAttribute("x1", String(rect.left + rect.width));
          borderRight.setAttribute("x2", String(rect.left + rect.width));
          borderRight.setAttribute("y1", String(rect.top));
          borderRight.setAttribute("y2", String(rect.top + rect.height));
          group.appendChild(borderRight);
        }

        if (styles.getPropertyValue("border-bottom-color") !== "transparent" && styles.getPropertyValue("border-bottom-width") !== "0px") {
          const borderBottom = document.createElement("line");
          borderBottom.setAttribute("stroke", styles.getPropertyValue("border-bottom-color"));
          borderBottom.setAttribute("stroke-width", styles.getPropertyValue("border-bottom-width"));
          borderBottom.setAttribute("x1", String(rect.left + rect.width));
          borderBottom.setAttribute("x2", String(rect.left));
          borderBottom.setAttribute("y1", String(rect.top + rect.height));
          borderBottom.setAttribute("y2", String(rect.top + rect.height));
          group.appendChild(borderBottom);
        }

        if (styles.getPropertyValue("border-left-color") !== "transparent" && styles.getPropertyValue("border-left-width") !== "0px") {
          const borderLeft = document.createElement("line");
          borderLeft.setAttribute("stroke", styles.getPropertyValue("border-left-color"));
          borderLeft.setAttribute("stroke-width", styles.getPropertyValue("border-left-width"));
          borderLeft.setAttribute("x1", String(rect.left));
          borderLeft.setAttribute("x2", String(rect.left));
          borderLeft.setAttribute("y1", String(rect.top + rect.height));
          borderLeft.setAttribute("y2", String(rect.top));
          group.appendChild(borderLeft);
        }

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

      const styles = window.getComputedStyle(parent);
      const lineHeight = getLineHeight(styles, context);

      const container = document.createElement("text");
      container.setAttribute("x", String(parent.offsetLeft));
      container.setAttribute("y", String(parent.offsetTop));

      container.style.fill = styles.getPropertyValue("color");
      container.style.fontFamily = styles.getPropertyValue("font-family");
      container.style.fontSize = styles.getPropertyValue("font-size");
      container.style.fontWeight = styles.getPropertyValue("font-weight");

      getLines(node).forEach(line => {
        const span = document.createElement("tspan");
        span.textContent = line.text;
        span.setAttribute("x", String(line.rect.left));
        span.setAttribute("y", String(line.rect.top + lineHeight / 2));
        container.appendChild(span);
      });

      context.element.appendChild(container);
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

function getLineHeight(styles: CSSStyleDeclaration, context: BrowserContext): number {
  const raw = styles.getPropertyValue("line-height");

  if (raw === "normal") {
    const fontSize = styles.getPropertyValue("font-size");
    return cssValueToNumber(fontSize) * 1.61;
  }

  return cssValueToNumber(raw);
}

interface Line {
  text: string;
  rect: ClientRect;
}

function getLines(node: Node): Line[] {
  let index = 0;

  const range: Range = document.createRange();
  range.selectNodeContents(node);

  const lines: Line[] = [];

  range.toString().split(" ").forEach(word => {
    const wordRange = document.createRange();
    wordRange.setStart(node, index);
    wordRange.setEnd(node, index + word.length);
    index += word.length;
    const rect = wordRange.getBoundingClientRect();

    const line = lines[lines.length - 1];

    if (!line || rect.top > line.rect.top) {
      lines.push({ text: word, rect });
    } else {
      line.text += ` ${word}`;
    }
  });

  return lines;
}

function cssValueToNumber(raw: string): number {
  return parseFloat(raw.replace(/px$/, ''));
}
