import { cards, Card } from "../game/cards/catalog";
import { GameIcon } from "./GameIcon";

const families = ["All", "White Mirror", "Black Mirror", "Item", "Spell", "Companion", "Secret"];
export function CardCatalog({ family, onFamily, search, onSearch, onInspect }: {
  family: string; onFamily: (family: string) => void;
  search: string; onSearch: (value: string) => void; onInspect: (card: Card) => void;
}) {
  const visible = cards.filter((card) => (family === "All" || card.family === family) &&
    `${card.id} ${card.name} ${card.family} ${card.subtype}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <section className="card-archive">
      <p className="eyebrow">The Mirror Castle collection</p>
      <h2>155 original cards</h2>
      <p>Discover the gifts, curses and hidden knowledge behind the glass.</p>
      <div className="catalog-tabs" role="tablist" aria-label="Card types">
        {families.map((name, i) => (
          <button key={name} role="tab" id={`catalog-tab-${i}`} aria-controls="catalog-cards"
            aria-selected={family === name} tabIndex={family === name ? 0 : -1}
            onClick={() => onFamily(name)}
            onKeyDown={(event) => {
              const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
              if (!offset && !["Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? 0 : event.key === "End" ? families.length - 1 : (i + offset + families.length) % families.length;
              onFamily(families[next]);
              document.getElementById(`catalog-tab-${next}`)?.focus();
            }}>
            {name !== "All" && <GameIcon name={name} />}
            {name}<small>{name === "All" ? 155 : cards.filter((c) => c.family === name).length}</small>
          </button>
        ))}
      </div>
      <label className="catalog-search">Find a card
        <input aria-label="Search cards" placeholder="Search by name, type or card ID" value={search} onChange={(e) => onSearch(e.target.value)} />
      </label>
      <p className="catalog-count" role="status">{visible.length} cards in this collection</p>
      <div id="catalog-cards" role="tabpanel" aria-labelledby={`catalog-tab-${families.indexOf(family)}`} className="catalog-cards">
        {visible.map((card) => (
          <button key={card.id} className={`catalog-card catalog-${card.family.toLowerCase().replaceAll(" ", "-")}`}
            aria-label={`Inspect ${card.id} ${card.name}`} onClick={() => onInspect(card)}>
            <span className="catalog-card-id">{card.id}<span>{card.family === "Secret" ? "Achievement" : card.subtype || card.family}</span></span>
            <div className="catalog-card-art"><GameIcon name={card.family === "Item" ? card.subtype : card.family} /></div>
            <strong>{card.name}</strong>
            <span className="catalog-card-family">{card.family}</span>
            <div className="catalog-card-symbols" aria-hidden="true">
              {(card.learn_elements ?? card.slots?.filter((slot) => slot !== "Empty") ?? []).map((name, i) => <GameIcon key={i} name={name} />)}
            </div>
          </button>
        ))}
      </div>
      {!visible.length && <p className="empty">No cards match. Try another name or choose a different tab.</p>}
    </section>
  );
}
