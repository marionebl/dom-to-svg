:construction: Work In Progress

> Convert arbitrary DOM trees to SVG

# dom-to-svg

* Recreate HTML styling in SVG faithfully
* Mirror input DOM tree in SVG structure
* Preserve text for scraping and editing

`dom-to-svg` converts DOM trees to SVG images that recreate the exact
style of the input document.

The output is optimized to serve as exchange format for various
vector-based image manipulation tools, such as Sketch or Figma.

## Usage

```ts
import {domToSvg} from "dom-to-svg";

const svg = domToSvg(document.body);
document.appendChild(svg);
```

## Contribute to dom-to-svg

```sh
yarn
yarn start
```

## License

`dom-to-svg` is licensed under the MIT license. Copyright 2018 - present Mario Nebl.
