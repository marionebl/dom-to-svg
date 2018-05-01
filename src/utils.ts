import { JSDOM } from "jsdom";
import * as uuid from "uuid";
import webpack from "webpack";

const DOM_TO_SVG = require.resolve("./dom-to-svg.ts");
const MemoryFs = require("memory-fs");

export function createDom(html?: string): { window: Window; document: Document } {
  const dom = new JSDOM(html);

  return {
    window: dom.window,
    document: dom.window.document
  };
}

export function createSvg(context: { document: Document }): Node {
  return context.document.createElement("svg");
}

export async function browser<T>(cb: (el: HTMLElement) => Promise<T>): Promise<T> {
  const id = `id-${uuid.v4()}`;

  await page.evaluate((id) => {
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.top = "0";
    div.style.left = "0";
    div.style.width = "100%"
    div.style.height = "100%";
    div.setAttribute("id", id);
    document.body.appendChild(div);
  }, id);

  const el = await page.$(`#${id}`);
  const result = await page.evaluate(cb, el);

  if (el) {
    await el.dispose();
  }

  return result;
}

export function bundle(): Promise<string> {
  return new Promise((resolve, reject) => {
    const compiler = webpack({
      entry: {
        domToSvg: DOM_TO_SVG
      },
      resolve: {
        extensions: [".ts", ".js"]
      },
      module: {
        rules: [
          {
            test: /\.ts?$/,
            use: {
              loader: "ts-loader",
              options: {
                transpileOnly: true
              }
            }
          }
        ]
      },
      output: {
        filename: "dom-to-svg.js",
        path: "/",
        libraryTarget: "global",
        library: "DomToSvg"
      }
      // tslint:disable-next-line:no-any
    } as any);

    compiler.outputFileSystem = new MemoryFs();

    compiler.run((err: Error, stats: webpack.Stats) => {
      if (err) {
        reject(err);

        return;
      }

      if (stats.hasErrors()) {
        reject(stats.toString("errors-only"));

        return;
      }

      const result = compiler.outputFileSystem.readFileSync("/dom-to-svg.js");
      resolve(result.toString());
    });
  });
}
