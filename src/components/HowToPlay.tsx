export function HowToPlay() {
  return (
    <article className="how-to-play">
      <p className="eyebrow">A field guide to the Mirror Castle</p>
      <h2>How to play</h2>
      <p className="guide-intro">
        Work together to imprison Occuldor. Be the bravest hero when the last
        fragment falls into place.
      </p>
      <div className="guide-loop">
        <span>Explore</span>
        <span>Place mirrors</span>
        <span>Lure Occuldor away</span>
        <span>Collide</span>
        <span>Restore the glass</span>
      </div>
      <section>
        <h3>1. Gather the party</h3>
        <p>
          Choose 2–5 heroes and share one screen. Everyone starts in the central
          Hall with 18 Courage, empty pockets and four locked Spell slots. Each
          new expedition shuffles the castle and card decks. Use Resume to
          continue your saved expedition.
        </p>
        <p>
          The heroes released Occuldor after a reckless evening at the Drunken
          Pony. Restore all 35 fragments of the Kaleidoscope to trap him again.
          You share this goal, but the surviving hero with the highest Courage
          wins personally; restored fragments break ties.
        </p>
      </section>
      <section>
        <h3>2. Take your turn</h3>
        <ol>
          <li>
            Before moving, inspect or use your current room: take or leave
            objects, learn a Spell, Place mirrors or Collide an unguarded pair.
          </li>
          <li>
            Click a highlighted destination, review the path, then choose Move
            here. You must move to a different room once each turn. Only the
            destination is explored; passing through rooms reveals nothing.
          </li>
          <li>
            Use your new room in the same way, then select End turn on your
            character board. Pass the screen and let the next player reveal
            their private board.
          </li>
        </ol>
        <p>
          Your Courage determines movement: Terrified (1–7) and Anxious (8–14)
          allow 1 step, Calm (15–21) allows 2, and Confident (22–28) or Heroic
          (29–35) allows 3. You may use fewer steps. These distances and the
          starting Courage are playtest defaults.
        </p>
      </section>
      <section>
        <h3>3. Share the room, manage your pockets</h3>
        <p>
          Click any object icon to inspect it. Discovered Black Mirrors are
          public: anyone may click their icons to read the cards. Their curses
          activate only through Collide. The up arrow takes an object; the down
          arrow below a carried object leaves it in your room. A disabled take
          arrow means you cannot take it now, including when its carrying slots
          are full.
        </p>
        <p>
          Your board normally holds 2 Mirrors of either color, 3 Elements, 2
          Equipment/Tools and 1 Relic. Some Items expand these limits. Objects
          in your current room are accessible without picking them up: combine
          room and carried Mirrors and pay learning costs from both. Items,
          including required Tools, must be carried to grant their abilities.
          Objects left behind remain public for everyone. Leaving a capacity
          Item removes its bonus immediately; choose any excess objects to leave
          before continuing.
        </p>
      </section>
      <section>
        <h3>4. Place a White and Black Mirror</h3>
        <p>
          In a room with an unrestored Sigil and no installed pair, choose Place
          beside your Mirror slots. You need one White and one Black Mirror,
          from your board, the room, or a mix. Select the exact two cards and
          confirm.
        </p>
        <p>
          Every symbol on the White Mirror reveals a discovery. Items and Spells
          remain in the room. Companions automatically join you and follow your
          figurine. Secrets go privately to your board and can be read by
          clicking them.
        </p>
        <p>
          Occuldor immediately moves onto the new Black Mirror and blocks it.
          His previously guarded mirror becomes free. Every living hero in his
          arrival room loses Courage according to his current Rage; heroes
          elsewhere are unaffected. This arrival does not raise Rage.
        </p>
        <table>
          <caption>Occuldor’s arrival penalty — all Sigil colors</caption>
          <thead>
            <tr>
              <th>Rage</th>
              <th>Courage loss</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["0–6", "−1"],
              ["7–13", "−2"],
              ["14–20", "−3"],
              ["21–27", "−4"],
              ["28+", "−5"],
            ].map(([range, loss]) => (
              <tr key={range}>
                <td>{range}</td>
                <td>{loss}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h3>5. Lure him away, then Collide</h3>
        <p>
          Place another pair elsewhere to move Occuldor away. A hero standing
          with an unguarded pair sees the glowing Collide button. Collide flips
          the Black Mirror and opens its penalty for that hero. All 35 Black
          Mirror curses resolve through the game. Press Resolve curse and choose
          any required objects or targets. The curse resolves before rewards;
          any after-collision movement or turn ending follows fragment
          placement.
        </p>
        <p>
          The pair disappears, the acting hero receives the room’s colored
          Sigil, and Rage increases by 1. The room is restored and cannot
          produce another pair. Finish placing its fragment in the Kaleidoscope
          before continuing other actions.
        </p>
        <p>
          Example: Rowan places a pair in one room. Elara places a pair
          elsewhere, drawing Occuldor to her. Rowan can now Collide the first
          pair.
        </p>
      </section>
      <section>
        <h3>6. Restore the Kaleidoscope</h3>
        <p>
          The puzzle opens after a collision. You can also click the center of
          the Hall to inspect it. The first fragment must go on an outer-edge
          pentagon. Every later fragment must share a full edge with an existing
          piece. Highlighted cells show legal choices; choose one and confirm.
        </p>
        <p>
          Gain exactly 1 base Courage for each restored fragment. Neighbor colors add no Courage. Existing Item and Spell bonuses still apply.
        </p>
        <p>Enclosing one of the ten diamond gaps makes it ready, without granting a reward. Install a carried Diamond Gem there for +3 Courage. Install one available Wild Sigil in the ready central pentagon for +5 Courage. Each gap rewards installation once.</p>
        <p>Each hero starts with one Wild Sigil. It fills one colored Spell socket, returns next turn after Quick use, or remains bound for a Permanent Spell. Wilds do not count toward colored Knowledge achievements.</p>
        <p>Diamond Gems have dedicated storage (one per hero by default). A ready Gem can remove one Paralysis Token, remove one inventory Hexlock, bypass one adjacent blocked corridor for the next movement, or add +1 movement allowance. It then exhausts until its holder's next turn. Exhausted Gems can still be installed. Gems left in rooms remain public and collectible.</p>
      </section>
      <section>
        <h3>7. Unlock Knowledge and learn Spells</h3>
        <p>
          Your collected Sigils appear above your Spell slots. Each achievement
          unlocks its own slot permanently:
        </p>
        <ol>
          <li>Have at least 1 Sigil.</li>
          <li>Have 3 different Sigil colors.</li>
          <li>Have 3 Sigils of the same color.</li>
          <li>Have all 5 different Sigil colors.</li>
        </ol>
        <p>
          A room Spell’s Learn book button becomes available when you have a
          free unlocked slot, its exact Element cost and any valid required
          accessible Tool. Obsolete Tool prerequisites remain blocked pending a
          revised mapping. Elements on your board and in your room both count.
          Learning automatically spends room Elements first, then carried
          Elements, and puts the Spell in your first free unlocked slot. The
          Tool is not consumed in this playtest.
        </p>
        <p>
          The top-left of the Spell card shows its learning cost. The guide
          beneath a learned Spell shows its printed Quick and Permanent Sigil
          requirements; dimmed Sigils are assigned. Open the Spell to click
          matching Sigils on the card; choose targets and confirm in the
          separate action panel below it. Leaving a learned Spell frees the slot
          but does not refund its learning cost.
        </p>
      </section>
      <section>
        <h3>Curse tokens and the changing castle</h3>
        <p>
          Paralysis prevents leaving immediately. At the start of each affected
          turn one token is removed, but you still cannot leave during that
          turn. You may use local objects and End turn without moving.
        </p>
        <p>
          Hexlocks sit over blocked inventory or Knowledge fields. At the start
          of your turn, your oldest Hexlock is removed automatically, at most
          once per round. Sigil Seals block the marked Quick or Permanent
          action; remove one Seal per turn. Stacked Seals keep the action
          blocked until the last is removed. Knowledge achievements remain
          unlocked beneath a temporary Hexlock.
        </p>
        <p>
          Fear Tokens are separate from Courage: finish movement in another
          previously discovered room to remove one, at most once per turn.
          Corridor Blocks permanently close corridors; only placements that
          preserve castle access are offered.
        </p>
        <p>
          Darkness blocks ordinary room actions until you pay 1 Courage per
          token. You may leave without clearing it. Portals blink in matching
          pairs: travel only to the matching-color partner in one movement step,
          bypassing blocked corridors. A lone Portal waits for a partner.
          Neither Darkness nor Portals reveal hidden findings until someone
          enters.
        </p>
        <p>
          A curse can abandon Companions in a room. Use their up-arrow to
          recruit them. Loyal followers stay with their new holder; Strays
          follow the first hero leaving. Followers occupy the free Companion area; Carriers occupy an Item slot. If no slot is free, an automatic Carrier discovery or transfer stays behind (provisional). Eating removes prey before fear is resolved. Frightened Companions flee to a connected explored room, or stay detached when none is available (provisional).
        </p>
      </section>
      <section>
        <h3>The Ghost Twins</h3>
        <p>Madison and Mason begin as separate Loyal Followers. When they meet, their reunion waits for the first departing hero to claim both; if they already share an owner, they reunite immediately under the default policy. Reunited Twins are permanently linked Strays. Both cards travel and transfer together. A single-card sacrifice cannot split them.</p>
      </section>
      <section>
        <h3>Items, Tools and Relics</h3>
        <p>
          Click any Item in your board or current room to inspect its ability.
          Equipment and Relic bonuses apply automatically while carried. Use a
          Tool through the button on its card; each hero can use each Tool once
          per complete round. An available Tool glows on your board. Items in
          the room can be inspected and taken, but grant no abilities until
          carried. Leaving an Item immediately ends its bonus.
        </p>
        <p>
          Boots offer a chosen movement bonus from 0 to 3. The Grimoire lets you
          choose one printed learning requirement to waive. With the Prism or
          Conduits, the learning window shows physical payment tokens: Aether
          can substitute, and eligible Elements count twice without duplicating
          tokens. Learned Spells go into the first free Knowledge slot.
        </p>
        <p>
          Mirror Offering and Farewell Whistle work before movement and prevent
          replacements until departure. The Ring reduces penalties, not
          voluntary costs. The Crown permits any empty Kaleidoscope cell; actual
          neighbor colors do not add base bonuses. The Amulet rewards newly committed
          Permanent Sigils, which cannot be freely recovered.
        </p>
      </section>
      <section>
        <h3>8. Survive and seal the prison</h3>
        <p>
          Fear means losing Courage on the same track. At 0 Courage a hero is
          eliminated and drops carried objects and Companions in their last
          room. If all heroes die before restoration, Occuldor wins. If the last
          Black Mirror is still guarded, the provisional Confront action costs 2
          Courage to free it; that cost can be lethal.
        </p>
        <p>
          After unlocking your fourth Spell slot, the small hand beneath it can
          send Occuldor to the Hall from anywhere. Spend five free Sigils, one
          of each color, to free his guarded Black Mirror. Bound Sigils cannot
          pay this cost. Use it before or after moving; it does not increase
          Rage or trigger an arrival penalty. Your Knowledge stays unlocked. All
          heroes' current Fear/Courage levels appear below the Rage track.
        </p>
        <p>
          Restore all 35 fragments to win together. Highest surviving Courage
          wins personally, with most restored fragments as the tiebreaker;
          remaining ties share the victory.
        </p>
      </section>
      <section>
        <h3>9. Save, privacy and playtest limits</h3>
        <p>
          Secrets are private, one-time achievements. Click a Secret icon to
          read its condition, reward and current eligibility. Use Reveal
          achievement before or after moving when you qualify. It becomes
          public, grants its reward and stays in your completed
          collection. You keep all qualifying objects; several Secrets can use
          the same collection.
        </p>
        <p>
          All conditions use current personal collections, never room resources. Ten Diamond Challenges award one reserved Gem each and no direct Courage. Five Heroic Achievements award +5 Courage each, capped at 35. Keeper of Whispers counts itself among two unrevealed Secrets. Sigil Harmony requires two available actual colors, excluding Wild, Quick-assigned and bound Sigils. Completed Secrets cannot pay Whisper Cipher's cost.
        </p>
        <p>
          Actions autosave in this browser. Save also records the current
          expedition; Resume restores the same rooms, decks and turn. The
          pass-screen overlay protects Secrets between players. White Mirrors
          and Black Mirrors, along with public room objects, can be inspected by
          everyone once discovered.
        </p>
        <p>
          Learning, movement, carrying, placement, collisions, Rage, Sigils and
          victory and all revised Item abilities are playable. Permanent Sigils
          stay committed until the Spell leaves play. Open a learned Spell and
          click its matching Sigils, then activate Quick or Permanent using the
          panel outside the card. Quick Sigils return at the start of their
          owner's next turn, even after abandoning the Spell. Seals suppress the
          affected action. All 35 revised Spells have immediate Quick and
          ongoing Permanent effects. Additional Spell movement does not replace
          mandatory movement. Some Spell learning remains blocked by obsolete
          Tool prerequisites; other Companion powers are not yet automated.
          Secret achievement rewards are playable. Loyal Companions follow their
          holder; Strays follow the first departing hero. Black Mirror choices
          and tokens are saved too. Card text shows the designer’s proposed
          effects, including those still awaiting implementation.
        </p>
      </section>
    </article>
  );
}
