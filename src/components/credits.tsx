const SFX_CREDITS = [
  {
    url: "https://opengameart.org/content/ui-and-item-sound-effect-jingles-sample-2",
    name: "UI and item sounds",
    author: "ViRiX",
  },
  {
    url: "https://opengameart.org/content/8-bit-sound-fx",
    name: "8-bit sound FX",
    author: "Dizzy Crow",
  },
  {
    url: "https://opengameart.org/content/rpg-sound-pack",
    name: "RPG sound pack",
    author: "artisticdude",
  },
  {
    url: "https://opengameart.org/content/different-steps-on-wood-stone-leaves-gravel-and-mud",
    name: "Different steps",
    author: "TinyWorlds",
  },
];

export function Credits() {
  return (
    <div className="fade-in fixed inset-0 flex flex-col items-start justify-start">
      <div className="bg-black/50 p-8 text-white pointer-events-auto">
        <h1 className="text-4xl font-light mb-4">Credits</h1>
        <p className="text-xl">
          Game design:{" "}
          <Link to="https://zachary-s-bergman.squarespace.com/">
            Zachary Bergman
          </Link>
        </p>
        <p className="text-xl mb-4">
          Programming:{" "}
          <Link to="https://linktr.ee/andybarron">Andy Barron</Link>
        </p>
        <p>
          Game engine: <Link to="https://excaliburjs.com/">Excalibur.js</Link>
        </p>
        <p>
          Graphics: <Link to="https://kenney.nl/">Kenney</Link>
        </p>
        <p>
          Music:{" "}
          <Link to="https://opengameart.org/content/10-free-chiptune-tracks-a-bag-of-chips">
            Zane Little Music
          </Link>
        </p>
        <div className="mb-4">
          Sound effects:
          <ul className="list-disc list-inside">
            {SFX_CREDITS.map(({ name, url, author }) => (
              <li key={url}>
                <Link to={url}>{name}</Link> by {author}
              </li>
            ))}
          </ul>
        </div>
        <p className="mb-8">
          Made with ❤️ for the{" "}
          <Link to="https://itch.io/jam/kenney-jam-2024">Kenney Jam 2024</Link>!
        </p>
        <h1 className="text-4xl font-light mb-4">Special thanks</h1>
        <p>😍 Al & Alfie</p>
        <p>⚡️ Monster Zero Ultra</p>
        <p>👩‍🍼 Our moms</p>
      </div>
    </div>
  );
}

type LinkProps = { to: string; children?: any };
function Link({ to, children }: LinkProps) {
  return (
    <a
      className="underline text-cyan-400 hover:text-cyan-300 transition"
      href={to}
      target="_blank"
    >
      {children}
    </a>
  );
}
