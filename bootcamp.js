// Currency Squad (AJ) bootcamp notes, shown on the Beginner Bootcamp and
// Edge Bootcamp tabs. Written up from the course material, one module at a
// time. Each module: num, title, tagline, lessons [{code, title, html}],
// mistakes [html], task (html), vsRulebook [html] (where AJ's material
// differs from or adds to the Rulebook). Notes typed in the app are saved
// with your settings, not here.
window.BOOTCAMPS = {
  beginner: {
    title: "Beginner Bootcamp",
    intro: "Currency Squad's beginner course. One job: by the end you can take an AJ signal and execute it correctly on your own account, at a size that fits the balance, without putting the account in danger. Do the modules in order — Module 10 (following a signal) only makes sense after 1 to 9.",
    roadmap: [
      { num: 1, title: "The Basics" },
      { num: 2, title: "Brokers" },
      { num: 3, title: "The trading platform", tentative: true },
      { num: 4, title: "Position sizing — the most important module", tentative: true },
      { num: 8, title: "News — why beginners stay flat", tentative: true },
      { num: 10, title: "Following a signal properly", tentative: true },
      { num: 13, title: "The longer road to trading without signals", tentative: true }
    ],
    modules: [
      {
        num: 1,
        title: "The Basics",
        tagline: "Before you touch a chart. Everything later builds on this — skip it and the rest becomes memorised steps that fall apart the first time the market does something unexpected.",
        lessons: [
          {
            code: "L1.1",
            title: "What the bootcamp is for",
            html:
              "<p>Goal: receive a Currency Squad signal and execute it correctly — right instrument, right size for your balance, account never in danger.</p>" +
              "<p>That needs five pieces, one per module, in order: what you're buying and selling, how the broker works, how to operate the platform, how big each trade should be, and how to manage risk when things go wrong.</p>" +
              "<p>Every module ends with a short quiz and a practical task. <strong>Do the tasks</strong> — reading about trading and doing it are different skills, and only doing protects your money.</p>"
          },
          {
            code: "L1.2",
            title: "What trading is, and what a market is",
            html:
              "<ul>" +
              "<li><strong>Market</strong> — anywhere buyers and sellers agree on prices. A vegetable stall, the stock exchange and forex are all markets; only the thing traded changes.</li>" +
              "<li><strong>Price</strong> — just the last level a buyer and seller agreed on. Not an official number; an agreement updated thousands of times a second.</li>" +
              "<li><strong>Long</strong> — buy first, sell later higher. You want price up.</li>" +
              "<li><strong>Short</strong> — sell first, buy back later lower. You want price down.</li>" +
              "<li><strong>Trader vs investor</strong> — an investor holds for years; a trader holds for minutes, hours or days to catch shorter moves either way. The bootcamp teaches trading.</li>" +
              "</ul>"
          },
          {
            code: "L1.3",
            title: "Why prices move",
            html:
              "<p>One reason only: an <strong>imbalance between buyers and sellers</strong>. More money wanting to buy → sellers can ask more → price rises until enough sellers appear. More wanting to sell → price falls until enough buyers appear. Every move, from a flicker to a crash, is this.</p>" +
              "<p>The imbalance comes from information and expectation, e.g.:</p>" +
              "<ul>" +
              "<li>US data stronger than expected → USD expected to be worth more → dollar pairs move within seconds.</li>" +
              "<li>A central bank raises rates → holding that currency pays more → demand rises.</li>" +
              "<li>A big fund filling a huge position pushes price as it fills.</li>" +
              "<li>Fear → people sell risky things and buy safe ones — one reason gold often rises in a crisis.</li>" +
              "</ul>" +
              "<p>Price moves on <strong>expectation versus outcome</strong>, not on the news itself. Good news that was already expected may do nothing — or price can fall on good news that wasn't as good as what was priced in.</p>" +
              '<div class="rb-box"><p><strong>Keep this.</strong> You don\'t need to predict news. You need to know news creates violent moves — and (Module 8) beginners should be <strong>flat</strong>, holding no positions, when major news is released.</p></div>'
          },
          {
            code: "L1.4",
            title: "Forex, indices and commodities",
            html:
              "<ul>" +
              "<li><strong>Forex</strong> — currencies traded against each other; the largest market in the world, trillions a day. Always in <strong>pairs</strong>, because a currency only has value relative to another. EURUSD 1.0850 = one euro costs 1.0850 dollars. Buy EURUSD = betting the euro strengthens against the dollar; sell = it weakens. Both sides of the pair always matter.</li>" +
              "<li><strong>Index</strong> — one number tracking a basket of stocks, showing how a slice of the market is doing. It's only a calculation, so you trade a broker product that tracks it.</li>" +
              "<li><strong>Commodity</strong> — a raw material (oil, wheat, copper…). The two that matter here: gold and silver, which move on supply and demand plus fear, inflation expectations and the US dollar.</li>" +
              "</ul>"
          },
          {
            code: "L1.5",
            title: "The five instruments",
            html:
              "<p>Currency Squad trades five instruments and <strong>only five</strong>. Focus is a feature — professionals specialise.</p>" +
              '<div class="table-wrap"><table class="bc-table"><thead><tr><th>Instrument</th><th>Ticker</th><th>What it is</th></tr></thead><tbody>' +
              "<tr><td>Euro / US dollar</td><td>EURUSD</td><td>Price of 1 euro in dollars. Most traded pair in the world → usually smooth movement and low costs.</td></tr>" +
              "<tr><td>Pound / US dollar</td><td>GBPUSD</td><td>Price of 1 pound in dollars (\"Cable\"). Moves further and faster than EURUSD on a typical day.</td></tr>" +
              "<tr><td>Gold</td><td>XAUUSD</td><td>Price of 1 troy ounce in dollars. Reacts to fear, inflation and the dollar. Capable of very large, very fast moves.</td></tr>" +
              "<tr><td>Silver</td><td>XAGUSD</td><td>Price of 1 troy ounce in dollars. Same drivers as gold, smaller market → sharper, less orderly moves.</td></tr>" +
              "<tr><td>Nasdaq 100</td><td>NAS100</td><td>Index of the 100 largest non-financial Nasdaq companies, dominated by US tech. \"Tech is up/down\" usually means this.</td></tr>" +
              "</tbody></table></div>" +
              "<ul>" +
              "<li>You never own the euros, gold or shares. Retail traders use <strong>CFDs</strong> (contracts for difference): an agreement with the broker to settle the price difference between open and close. You get the movement without the physical thing. (Module 2: the broker side.)</li>" +
              "<li>The five behave very differently — a huge day on EURUSD is a quiet hour on gold. That's why the <strong>same lot size on two instruments can mean wildly different risk</strong>, and why Module 4 (position sizing) is the most important module.</li>" +
              "</ul>"
          },
          {
            code: "L1.6",
            title: "Realistic expectations — read twice",
            html:
              "<p>Most people who try trading lose. UK and EU regulators make brokers publish the share of retail clients who lose: typically <strong>60–80%</strong>. Anyone calling it easy money is lying or about to learn.</p>" +
              "<p>People rarely lose because their predictions were bad. The three killers, in order:</p>" +
              "<ol>" +
              "<li><strong>Position sizing</strong> — trading too big, so a normal losing run (it happens to everyone) wipes them out.</li>" +
              "<li><strong>No risk control</strong> — no stop loss, or moving it, so one bad trade does the damage of twenty.</li>" +
              "<li><strong>Psychology</strong> — losing, feeling the sting and sizing up to win it back, turning a bad day into a destroyed account.</li>" +
              "</ol>" +
              "<p>All three are in your control. You can't control the market; you can control how much any one trade is allowed to hurt you.</p>" +
              "<p><strong>Think in months, not weeks.</strong> Executing signals correctly: weeks, if you do the work. Real skill without anyone's signals: a much longer road (Module 13). Treat the first months as tuition — the beginner's goal isn't profit, it's <strong>still having an account, with better habits, six months from now</strong>.</p>"
          }
        ],
        mistakes: [
          "<strong>Rushing to place a trade.</strong> The urge to skip ahead and click buttons is strong. Money moves fast here, both ways.",
          "<strong>Confusing familiarity with understanding.</strong> Having heard \"forex\" and \"Nasdaq\" for years feels like knowing. Assume you know nothing.",
          "<strong>Believing screenshots.</strong> One winning trade says nothing about the hundred around it. Judge education by what it teaches, not what it flexes.",
          "<strong>Starting with money you can't lose.</strong> If losing the balance would hit rent, family or peace of mind, you're not ready to fund an account."
        ],
        task: "Write one paragraph for each of the five instruments, in your own words: what it represents and one reason its price might move. No charts, no platforms — if you can't explain an instrument in plain language you're not ready to risk money on it. Keep what you write; reread it in three months.",
        vsRulebook: [
          "<strong>News:</strong> AJ says beginners should be <strong>flat</strong> (no open positions) when major news is released — details in Module 8. The Rulebook's news chapter only says to check Forex Factory and expect spikes; it has no stay-flat rule.",
          "<strong>Instruments:</strong> AJ trades EURUSD, GBPUSD, XAUUSD, XAGUSD and NAS100 only. The journal has XAUUSD set up; add the others in Position Sizing → Settings when you take an AJ signal on them (Module 4 should give the pip values).",
          "<strong>Risk:</strong> no numbers yet — Module 4 sets them. Compare then with the Rulebook's current scaling phase (20% max per idea on Callisto, AJ at 5% in the journal)."
        ]
      }
    ]
  },
  edge: {
    title: "Edge Bootcamp",
    intro: "Currency Squad's Edge course — text lessons plus private videos. Notes go in here as the scripts come through.",
    roadmap: [],
    modules: []
  }
};
