import { NodeType } from './node';

export interface MatcherContext {
    svg: Node;
    document: Document;
    window: Window;
}

export function matchElement(node: Node, context: MatcherContext): boolean {
    const {document} = context;

    if (node.nodeType === NodeType.ELEMENT_NODE) {
        const el = document.createElement('rect');
        el.textContent = node.textContent;

        context.svg.appendChild(el);

        return true;
    }

    return false;
}
