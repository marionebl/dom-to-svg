import { JSDOM } from "jsdom";
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
        rules: [{ test: /\.ts?$/, loader: "ts-loader" }]
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
