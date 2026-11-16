import type { Card } from "../game/cards/catalog";
export const cardBackFamilies = [
  "White Mirror",
  "Black Mirror",
  "Item",
  "Spell",
  "Companion",
  "Secret",
];
export function CardBack({ card }: { card: Card }) {
  return (
    <article
      className={
        "game-card card-back card-" +
        card.family.toLowerCase().replaceAll(" ", "-")
      }
      aria-label={card.family + " card back"}
    >
      <div
        className="card-back-art"
        role="img"
        aria-label={card.family + " decorative back"}
        style={{
          backgroundImage: cardBackImage(card.family),
        }}
      />
    </article>
  );
}

export const cardBackImage = (family: string) =>
  `url("/art/back-${family.toLowerCase().replaceAll(" ", "-")}.svg")`;
