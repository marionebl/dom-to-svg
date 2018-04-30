import { NodeType } from './node';

export interface MatcherContext {
    svg: Node;
    document: Document;
    window: Window;
}

export function matchText(node: Node, context: MatcherContext): boolean {
    const {document} = context;

    if (node.nodeType === NodeType.TEXT_NODE && node.textContent && node.textContent.trim() !== '') {
        const el = document.createElement('text');
        el.textContent = node.textContent;

        context.svg.appendChild(el);

        return true;
    }

    return false;
}
