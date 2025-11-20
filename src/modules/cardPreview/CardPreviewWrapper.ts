/**
 * TEMPORARY WRAPPER: Imperative bridge to CardPreview React component.
 *
 * This wrapper provides backward-compatible API for vanilla JS classes
 * (Whiteboard.ts, GameResourcesDock.ts) that haven't been migrated to React yet.
 *
 * TODO: Remove this wrapper when all consuming classes are rewritten in React.
 * When Whiteboard and GameResourcesDock become React components, they should:
 * 1. Import CardPreview directly from './CardPreview'
 * 2. Manage hover state with useState
 * 3. Render <CardPreview card={hoveredCard} isVisible={!!hoveredCard} />
 */

import {Card} from "@/modules/deck";
import {CardPreview} from "@/modules/cardPreview/CardPreview";
import React from "react";

export const CardPreviewWrapper: React.FC<{
  card: Card | null;
  isVisible: boolean;
}> = ({ card, isVisible }) => {
  const previewRef = React.useRef<CardPreview | null>(null);

  React.useEffect(() => {
    if (!previewRef.current) {
      previewRef.current = new CardPreview();
    }

    if (card && isVisible) previewRef.current.show(card);
    else previewRef.current.hide();
  }, [card, isVisible]);

  return null; // your class handles the DOM
};