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
      { num: 3, title: "MetaTrader" },
      { num: 4, title: "Lots, Pips & Sizing" },
      { num: 5, title: "Leverage & Margin" },
      { num: 6, title: "Reading a Chart" },
      { num: 7, title: "TradingView" },
      { num: 8, title: "Sessions & Timing" },
      { num: 9, title: "Risk Management" },
      { num: 10, title: "Following a Signal" },
      { num: 11, title: "Journaling & Review" },
      { num: 12, title: "Psychology" },
      { num: 13, title: "What Comes Next" }
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
          "<strong>Instruments:</strong> AJ trades EURUSD, GBPUSD, XAUUSD, XAGUSD and NAS100 only. The journal has XAUUSD set up; Module 4 gives the pip sizes and values for the others.",
          "<strong>Risk:</strong> no numbers here — Module 4 sets them (see there)."
        ]
      },
      {
        num: 2,
        title: "Brokers",
        tagline: "The company holding your money. Pick badly and nothing else in the course matters — a perfect trader with a broker that won't pay out still loses.",
        lessons: [
          {
            code: "L2.1",
            title: "What a broker does for you",
            html:
              "<p>The real forex market is banks and institutions dealing in millions; a small account can't get in. A broker pools thousands of small clients, connects them to the big players (or takes the other side itself) and passes prices to your platform.</p>" +
              "<p>Four jobs: <strong>streams live prices</strong>, <strong>executes</strong> your orders, <strong>holds your deposit</strong> and tracks the balance, and provides <strong>leverage</strong> (Module 5). It gets paid in ways most beginners don't notice — next lesson.</p>"
          },
          {
            code: "L2.2",
            title: "How brokers make money: spread, commission, swap",
            html:
              "<ul>" +
              "<li><strong>Spread</strong> — every instrument has two prices: <strong>bid</strong> (you sell at) and <strong>ask</strong> (you buy at, always a bit higher). The gap is the spread. A new trade always opens slightly red by the spread — that's normal, it's the broker's fee.</li>" +
              "<li><strong>Commission</strong> — some accounts have a lower spread plus a fixed fee per lot. Neither model is better by default; compare <strong>spread + commission together</strong>.</li>" +
              "<li><strong>Swap</strong> — a small overnight fee (occasionally a credit) from the interest-rate difference between the two sides. Adds up on trades held for weeks; there's a <strong>triple swap midweek</strong> to cover the weekend (Module 8).</li>" +
              "</ul>" +
              '<div class="rb-box"><p><strong>Spreads aren\'t fixed.</strong> They widen sharply around news and in dead hours — one pip at London open can be five times that at rollover.</p></div>'
          },
          {
            code: "L2.3",
            title: "Regulation",
            html:
              "<p>A <strong>regulated broker</strong> is licensed and supervised by a financial authority (e.g. FCA UK, ASIC Australia, CySEC Cyprus, DFSA Dubai — in South Africa the FSCA). Regulation usually means <strong>segregated accounts</strong> (client money kept apart from company money), financial reporting, conduct rules, and sometimes a compensation scheme if the broker collapses.</p>" +
              "<p>Unregulated brokers have none of that. Many pay out fine for years — until they don't, and then there's almost no way to recover. Regulation doesn't guarantee honesty, but without it every safety net is gone.</p>" +
              "<p><strong>How to check:</strong> take the licence number (usually in the website footer) to the <strong>regulator's own public register</strong> and confirm it matches the company name. Scam brokers often show someone else's number.</p>"
          },
          {
            code: "L2.4",
            title: "Market maker vs STP vs ECN",
            html:
              "<ul>" +
              "<li><strong>Market maker</strong> — takes the other side of your trade itself. Abused by dishonest firms, but also how most big regulated brokers partly work; they manage risk across thousands of clients, not by fighting you.</li>" +
              "<li><strong>STP</strong> (straight-through processing) — passes your order to its liquidity providers and earns a markup on the spread.</li>" +
              "<li><strong>ECN</strong> (electronic communication network) — your orders meet many participants in a pool; usually raw spreads plus commission.</li>" +
              "</ul>" +
              "<p>For a beginner the execution differences between reputable brokers are tiny next to the effect of your own position sizing. <strong>Pick regulated, pick reasonable total costs</strong>, and spend the energy on Modules 4 and 9.</p>"
          },
          {
            code: "L2.5",
            title: "Opening an account: KYC",
            html:
              "<p><strong>KYC</strong> (know your customer) is a legal requirement: a regulated broker must verify you before letting you withdraw, usually before you deposit much. Expect:</p>" +
              "<ul>" +
              "<li><strong>Proof of identity</strong> — passport, ID card or licence; in date, all corners visible, no glare.</li>" +
              "<li><strong>Proof of address</strong> — utility bill, bank statement or government letter with name and address, usually under 3 months old. Upload the original document, not a screenshot of a PDF.</li>" +
              "<li>Sometimes <strong>proof of payment method</strong> — e.g. a photo of the card, middle digits covered.</li>" +
              "</ul>" +
              "<p>Takes minutes to a couple of business days. <strong>Finish it fully before depositing.</strong> The most common \"withdrawal problem\" is people who never finished verifying, get asked for documents when they want money out, and think it's a scam.</p>"
          },
          {
            code: "L2.6",
            title: "Deposits and withdrawals",
            html:
              "<p>Cards, bank transfer, often crypto or e-wallets. Deposits are usually instant; withdrawals commonly <strong>1–3 business days</strong> plus your bank's time. Card withdrawals usually go back to the same card (anti-money-laundering: money returns the way it came).</p>" +
              "<p>Common, preventable problems:</p>" +
              "<ul>" +
              "<li>Withdrawing by a different method than you deposited — use the same route where possible.</li>" +
              "<li>Name mismatch — broker account, bank account and card must all be in your name; third-party payments are refused nearly everywhere.</li>" +
              "<li>Withdrawing with trades open — free margin limits what you can take out. Close first or withdraw less.</li>" +
              "<li>Bonus terms — deposit bonuses can carry volume requirements that lock withdrawals. When in doubt, refuse the bonus.</li>" +
              "</ul>" +
              "<p>Times and methods are broker-specific — check your broker's funding page.</p>"
          },
          {
            code: "L2.7",
            title: "Demo vs live, and which account type",
            html:
              "<p><strong>Demo</strong> = fake money, real prices. Essential for learning the platform — every practical task in Modules 3 and 4 is done on demo. But demo can't teach psychology: losing fake money doesn't hurt, so people trade demo well and fall apart live.</p>" +
              "<p><strong>The path:</strong> demo until every mechanical skill in the bootcamp is automatic, then live with a <strong>small amount sized by Module 4</strong>. Small live teaches more than big demo.</p>" +
              "<p><strong>Account type:</strong> as a beginner, a <strong>standard account, no commission, micro lots (0.01)</strong>. Raw/Pro/Cent types solve problems you don't have yet.</p>"
          },
          {
            code: "L2.8",
            title: "Red flags of a bad or scam broker",
            html:
              "<ul>" +
              "<li>No licence number, or one that doesn't check out on the regulator's register.</li>" +
              "<li>They contacted you first — cold calls, Instagram DMs, account managers promising returns.</li>" +
              "<li>An account manager who trades for you or pushes you to deposit more (regulated brokers generally can't give that advice).</li>" +
              "<li>Fees or delays that only appear when you withdraw — or a demand to pay \"tax\" before funds are released (a signature scam; real tax is never paid to your broker).</li>" +
              "<li>Prices that differ meaningfully from TradingView — small feed differences are normal, candles that only exist on their chart are not.</li>" +
              "<li>\"Guaranteed profit\" anywhere on the site — regulators prohibit it.</li>" +
              "</ul>" +
              '<div class="rb-box"><p><strong>One rule covers most of it:</strong> if you found the broker because it found you, walk away.</p></div>'
          }
        ],
        mistakes: [
          "<strong>Choosing a broker for its bonus.</strong> Only costs, regulation and withdrawal reliability matter.",
          "<strong>Depositing before verifying.</strong> Finish KYC first, always.",
          "<strong>Judging a broker by how nice the app looks.</strong> Scam platforms only need a screen, not a business.",
          "<strong>Keeping your whole trading fund at the broker.</strong> The broker account holds what you actively trade — it's not a savings account."
        ],
        quiz: [
          { q: "Why does a new trade always open slightly negative?", a: "You buy at the ask and can only sell back at the lower bid, so you start down by the spread — that's the broker's fee, nothing is wrong." },
          { q: "What is a segregated client account and why does it matter?", a: "Your money is held separately from the broker's own money, so it isn't used to run the company or pay its debts if the broker fails. Regulators require it." },
          { q: "A broker asks for ID and proof of address when you request your first withdrawal. Scam or normal?", a: "Normal — that's KYC, a legal requirement. It means verification wasn't finished; do KYC fully before depositing so it never blocks a withdrawal." },
          { q: "Someone messages you offering to manage your broker account for guaranteed monthly returns. What do you know?", a: "It's a scam: they contacted you first, \"guaranteed\" returns are prohibited, and nobody legitimate trades your account for you. Walk away." }
        ],
        task: "Open an account with a regulated broker and complete verification in full (identity and address approved). Find the licence number on the broker's website and confirm it yourself on the regulator's public register. Open the platform or dashboard and check you can see all five instruments. Depositing isn't required — verified and ready is the goal.",
        vsRulebook: [
          "<strong>Your FSCA checks:</strong> AvaTrade (FSP 45984) is licensed as an intermediary for derivatives and forex. OnsaFX (FSP 53192) showed Category I <em>advice</em> on derivatives only — worth knowing, since the course's own MetaTrader screenshots (Module 3) are on an OnsaFX account. Kudo: you're fully verified (ID, bank statement, face video); confirm its licence on the register as part of this task.",
          "<strong>Same instruments, different names:</strong> once you've checked Kudo and AvaTrade, write down each broker's exact symbol names for the five (see Module 3, L3.5).",
          "The Rulebook has no broker chapter — nothing conflicts."
        ]
      },
      {
        num: 3,
        title: "MetaTrader",
        tagline: "Your execution platform. Every signal ends with your fingers doing something here, so mistakes cost real money however good the signal was. Work through it with a demo account open.",
        lessons: [
          {
            code: "L3.1",
            title: "MT4 vs MT5",
            html:
              "<p>MetaTrader is made by MetaQuotes; your broker licenses it and connects it to their prices. MT5 is newer: more timeframes, better calendar, faster, and what brokers now push (some no longer offer MT4).</p>" +
              "<p>For this bootcamp they're nearly identical. <strong>Use MT5</strong> unless your broker only offers MT4. An MT4 login doesn't work in the MT5 app and vice versa — if you can't log in, check the account type matches the app.</p>"
          },
          {
            code: "L3.2",
            title: "Installing on desktop and mobile",
            html:
              "<ul>" +
              "<li>Download from your <strong>broker's own site/dashboard</strong> (comes pre-connected to their servers) or the official app store — check the publisher is <strong>MetaQuotes</strong>. Fake trading apps exist.</li>" +
              "<li><strong>The phone is the primary platform</strong> — signals arrive there and the course teaches on mobile. Desktop is worth having for studying history, but nothing requires it.</li>" +
              "</ul>"
          },
          {
            code: "L3.3",
            title: "Logging in, and the investor password",
            html:
              "<p>The broker sends a <strong>login number</strong>, <strong>password</strong> and <strong>server name</strong> (e.g. BrokerName-Live02 / -Demo). In the app: Settings → New Account → Login to an existing account → search the server → enter login and password. Make sure the server matches the welcome email exactly. Most failed logins are the wrong server, a live login on a demo server, or the wrong MT version.</p>" +
              "<p>The <strong>investor password</strong> is read-only: anyone using it can see the account but not trade — it's for proving a track record. Never mix the two up, and <strong>never share your main password with anyone</strong>, including anyone claiming to be from Currency Squad. They will never ask.</p>"
          },
          {
            code: "L3.4",
            title: "The five tabs",
            html:
              "<ul>" +
              "<li><strong>Quotes</strong> — instruments with live bid/ask and spread; where you find symbols and start trades.</li>" +
              "<li><strong>Chart</strong> — price history, basic drawing tools and indicators.</li>" +
              "<li><strong>Trade</strong> — open positions, pending orders and the five account numbers (L3.10).</li>" +
              "<li><strong>History</strong> — every closed trade (L3.11).</li>" +
              "<li><strong>Settings</strong> — accounts and servers; switch between demo and live.</li>" +
              "</ul>" +
              "<p>Desktop names: Market Watch, Charts, Toolbox, Navigator — same logic.</p>"
          },
          {
            code: "L3.5",
            title: "Adding and removing symbols",
            html:
              "<p>Quotes → search icon → type the symbol → tap + to add. Add EURUSD, GBPUSD, XAUUSD, XAGUSD and NAS100; use the edit icon to delete the rest so Quotes shows just the five.</p>" +
              '<div class="rb-box"><p><strong>Symbol names vary by broker.</strong> Gold may be XAUUSD, GOLD or XAUUSD.a (the course\'s demo broker uses XAUUSD!). Nasdaq may be NAS100, USTEC, US100 or NDX100 — same market. Check your broker\'s list once and write your five names down.</p></div>'
          },
          {
            code: "L3.6",
            title: "Placing a market order",
            html:
              "<p>A <strong>market order</strong> fills immediately at the current price.</p>" +
              "<ol>" +
              "<li>Quotes → tap the instrument → Trade.</li>" +
              "<li><strong>Check the symbol</strong> at the top is the one you mean.</li>" +
              "<li>Set the <strong>volume</strong> (lot size) — tap and type it exactly rather than using the steppers. The most important field on the screen; Module 4 says what goes in it. On demo use 0.01 for now.</li>" +
              "<li>Type the <strong>Stop Loss</strong> and <strong>Take Profit</strong> prices. On a real trade you never skip them, and they go in <strong>before</strong> you tap buy or sell.</li>" +
              "<li>Sell by Market (short) or Buy by Market (long). The position appears in the Trade tab.</li>" +
              "</ol>" +
              "<p>The two prices on the buttons: you buy at the higher ask, sell at the lower bid — hence the spread-sized red start.</p>"
          },
          {
            code: "L3.7",
            title: "Pending orders",
            html:
              "<p>A <strong>pending order</strong> waits: if price reaches this level, open my trade. On the order screen tap Market Execution and pick the type:</p>" +
              '<div class="table-wrap"><table class="bc-table bc-plain"><thead><tr><th>Type</th><th>Placed</th><th>Meaning</th></tr></thead><tbody>' +
              "<tr><td>Buy limit</td><td>Below price</td><td>Buy cheaper — expect a dip to your level, then up.</td></tr>" +
              "<tr><td>Sell limit</td><td>Above price</td><td>Sell higher — expect a rise to your level, then down.</td></tr>" +
              "<tr><td>Buy stop</td><td>Above price</td><td>Buy on strength — only if price breaks up through your level.</td></tr>" +
              "<tr><td>Sell stop</td><td>Below price</td><td>Sell on weakness — only if price breaks down through your level.</td></tr>" +
              "</tbody></table></div>" +
              '<div class="rb-box"><p><strong>Memory hook:</strong> limits wait for a better price; stops wait for confirmation of movement. Many signals give an entry price rather than \"enter now\" — a pending order lets you set it and walk away. Unfilled pending orders can be deleted from the Trade tab at no cost.</p></div>'
          },
          {
            code: "L3.8",
            title: "Stop loss and take profit at entry",
            html:
              "<p>SL = price where the trade closes at a loss; TP = price where it closes in profit. Both are entered as <strong>prices</strong>, not distances.</p>" +
              "<ul>" +
              "<li><strong>Buy:</strong> SL below entry, TP above.</li>" +
              "<li><strong>Sell:</strong> SL above entry, TP below.</li>" +
              "</ul>" +
              "<p>\"Invalid S/L or T/P\" = first suspect the wrong side for your direction, then that it's too close to price (brokers enforce a minimum distance).</p>" +
              "<p>The SL goes on <strong>at entry, on the same screen, every time</strong> — not later when you get round to it. A trade without a stop is an open-ended donation waiting for a bad night.</p>"
          },
          {
            code: "L3.9",
            title: "Managing a live trade",
            html:
              "<ul>" +
              "<li><strong>Modify</strong> — Trade tab → press and hold the position → Modify Position to change SL/TP. Moving the stop to entry once well in profit (risk-free) is legitimate. <strong>Moving the stop further away to avoid a loss is not</strong> (Module 9).</li>" +
              "<li><strong>Partial close</strong> — press and hold → Close Position → reduce the volume before confirming (closing 0.05 of 0.10 banks half, the rest runs). Signal management sometimes calls for this — practise until it's boring.</li>" +
              "<li><strong>Full close</strong> — press and hold → Close Position at full volume. A buy closes at the bid, a sell at the ask; the result moves to History.</li>" +
              "</ul>"
          },
          {
            code: "L3.10",
            title: "The five numbers: balance, equity, margin, free margin, margin level",
            html:
              "<ul>" +
              "<li><strong>Balance</strong> — account value from closed trades only.</li>" +
              "<li><strong>Equity</strong> — balance plus the live profit/loss of open trades: what the account is actually worth right now.</li>" +
              "<li><strong>Margin</strong> — deposit currently locked to keep open positions alive.</li>" +
              "<li><strong>Free margin</strong> — equity minus margin: room for new positions or to absorb losses.</li>" +
              "<li><strong>Margin level</strong> — equity ÷ margin as a %. The account's health meter; at the broker's <strong>stop-out level</strong> the platform starts force-closing trades (Module 5).</li>" +
              "</ul>" +
              "<p>No open trades → equity = balance, margin 0, no margin level. Open a trade and all five come alive.</p>"
          },
          {
            code: "L3.11",
            title: "History and statements",
            html:
              "<p>History shows every closed trade — times, prices, volume, swap, commission, result — with account totals at the bottom; change the date range at the top. Desktop can export it as a formal statement (used in Module 11). <strong>Memory tells stories about your trading; history tells the truth.</strong></p>"
          },
          {
            code: "L3.12",
            title: "Common errors decoded",
            html:
              '<div class="table-wrap"><table class="bc-table bc-plain"><thead><tr><th>Message</th><th>Means</th><th>Fix</th></tr></thead><tbody>' +
              "<tr><td>Invalid S/L or T/P</td><td>Stop/target on the wrong side, or too close to price.</td><td>Check the direction logic (L3.8), widen the distance.</td></tr>" +
              "<tr><td>Not enough money</td><td>Not enough free margin for that lot size.</td><td>Reduce volume. If a correctly sized trade triggers it, revisit Module 4 — something is oversized.</td></tr>" +
              "<tr><td>Market closed</td><td>Instrument not trading now (forex weekends, index daily breaks).</td><td>Wait — Module 8 has the hours.</td></tr>" +
              "<tr><td>Trade context busy</td><td>Platform busy with another request (mostly MT4).</td><td>Wait a few seconds, retry. Don't spam — you can end up with duplicate positions.</td></tr>" +
              "<tr><td>Requote / Off quotes</td><td>Price moved before the order arrived, usually in fast markets.</td><td>Retry; avoid entering in the seconds around major news.</td></tr>" +
              "</tbody></table></div>"
          }
        ],
        mistakes: [
          "<strong>Wrong volume by a factor of ten.</strong> 1.0 instead of 0.10 is ten times the risk. Read the volume field twice, every time.",
          "<strong>No SL, planning to add it after.</strong> After is when the news candle hits.",
          "<strong>Confusing buy stop with buy limit.</strong> The platform will happily place the wrong one. Limits wait for better prices; stops wait for breakouts.",
          "<strong>One-tap trading.</strong> It skips the screen where size, SL and TP live. Leave it off — every trade goes through the full order screen."
        ],
        quiz: [
          { q: "You want to buy EURUSD only if price first drops to a cheaper level below the current price. Which order type?", a: "Buy limit — placed below current price, waits for a better (cheaper) price." },
          { q: "Balance $500, equity $470. What does that tell you?", a: "You have open trades currently $30 in loss. Equity = balance + floating profit/loss." },
          { q: "You place a sell and try to set the stop loss below entry. The platform rejects it. Why?", a: "For a sell the stop goes above entry (price rising is the loss). Below is the wrong side → Invalid S/L." },
          { q: "What is the investor password for, and what can someone do with it?", a: "Read-only access to prove a track record: they can see the account and trades but can't place, change or close anything." },
          { q: "Safest response to \"Trade context busy\"?", a: "Wait a few seconds and retry once. Don't spam the button — you can end up with duplicate positions." }
        ],
        task: "On a demo account on your phone, run this exact sequence: place a market order with SL and TP set at entry; place a pending order (any type) with SL and TP; modify the SL on one of them; partially close the market order, then close it fully; delete the pending order if it hasn't filled; open History and look at the swap and commission columns on the closed trade. When you can do it without hunting for buttons, you're ready for position sizing.",
        vsRulebook: [
          "<strong>Stop at entry, every time:</strong> same as the Rulebook's set-and-forget — the SL goes in on the order screen, never later.",
          "<strong>Breakeven:</strong> the course says moving the stop to entry \"once well in profit\" is legitimate. Your AJ plan in the journal uses BE at 1R; the Rulebook (Callisto) uses BE after TP1 (20 pips). Both agree: never move a stop further away.",
          "<strong>Partials:</strong> AJ signal management sometimes calls for partial closes — the journal's TP1–TP6 partial fields already handle logging those."
        ]
      },
      {
        num: 4,
        title: "Lots, Pips & Sizing",
        tagline: "The module that protects your account — the most important one in the bootcamp. Nearly every blown account dies here, not at the entry. Work every example with a calculator until the numbers feel obvious.",
        lessons: [
          {
            code: "L4.1",
            title: "What a lot is",
            html:
              "<ul>" +
              "<li><strong>Standard lot</strong> = 1.00 in the volume field.</li>" +
              "<li><strong>Mini lot</strong> = 0.10.</li>" +
              "<li><strong>Micro lot</strong> = 0.01 — the minimum on most accounts.</li>" +
              "</ul>" +
              "<p>Volume is continuous: 0.07 or 0.23 are fine, and correct sizing rarely lands on a round number. The lot is just a multiplier of the <strong>contract size</strong>. (Example: 4.00 lots on GBPUSD = £400,000 of exposure moving $40 a pip. Most students' correct size looks more like 0.02.)</p>"
          },
          {
            code: "L4.2",
            title: "Contract sizes",
            html:
              '<div class="table-wrap"><table class="bc-table"><thead><tr><th>Instrument</th><th>Ticker</th><th>1.00 lot · 0.01 lot</th></tr></thead><tbody>' +
              "<tr><td>Euro</td><td>EURUSD</td><td>100,000 euros · 0.01 = 1,000</td></tr>" +
              "<tr><td>Pound</td><td>GBPUSD</td><td>100,000 pounds · 0.01 = 1,000</td></tr>" +
              "<tr><td>Gold</td><td>XAUUSD</td><td>100 oz · 0.01 = 1 oz</td></tr>" +
              "<tr><td>Silver</td><td>XAGUSD</td><td>5,000 oz · 0.01 = 50 oz</td></tr>" +
              "<tr><td>Nasdaq</td><td>NAS100</td><td>Commonly 1 unit per point · 0.01 = 0.01</td></tr>" +
              "</tbody></table></div>" +
              '<div class="rb-box"><p><strong>Broker-specific:</strong> forex and metals are near-universal; index contract sizes vary most. Before your first NAS100 trade, tap the symbol in Quotes → details (desktop: Market Watch → Specification) and read the contract size yourself.</p></div>'
          },
          {
            code: "L4.3",
            title: "What a pip is, per instrument",
            html:
              '<div class="table-wrap"><table class="bc-table"><thead><tr><th>Instrument</th><th>Ticker</th><th>1 pip</th></tr></thead><tbody>' +
              "<tr><td>Euro / Pound</td><td>EURUSD, GBPUSD</td><td>0.0001 — 1.0850 → 1.0851</td></tr>" +
              "<tr><td>Gold</td><td>XAUUSD</td><td>$0.10 — 2,400.00 → 2,400.10. A $1 move = 10 pips</td></tr>" +
              "<tr><td>Silver</td><td>XAGUSD</td><td>$0.01 — 29.50 → 29.51</td></tr>" +
              "<tr><td>Nasdaq</td><td>NAS100</td><td>1 full index point — 20,000 → 20,001</td></tr>" +
              "</tbody></table></div>" +
              "<p>Gold pip conventions differ across the industry (some call $1 a pip) — confirm what others mean. In Currency Squad signals distances use the units above, and on metals they state distances in plain dollars where there's any doubt.</p>"
          },
          {
            code: "L4.4",
            title: "Points vs pips vs ticks",
            html:
              "<p>A <strong>point</strong> is the smallest increment your broker quotes — on 5-decimal forex, a tenth of a pip. 300 points on EURUSD = 30 pips. A <strong>tick</strong> is one price update of any size.</p>" +
              "<p>MetaTrader often shows <strong>points</strong>; people talk in <strong>pips</strong>. If a platform number looks ten times too big, it's points — divide by ten.</p>"
          },
          {
            code: "L4.5",
            title: "Pip value per instrument",
            html:
              '<div class="table-wrap"><table class="bc-table bc-plain"><thead><tr><th>Instrument</th><th>Per 1.00 lot</th><th>Per 0.10 · per 0.01</th></tr></thead><tbody>' +
              "<tr><td>Euro / Pound</td><td>$10 / pip</td><td>$1 · $0.10</td></tr>" +
              "<tr><td>Gold</td><td>$10 / pip ($100 per $1 move)</td><td>$1 · $0.10 ($1 per $1 move)</td></tr>" +
              "<tr><td>Silver</td><td>$50 / pip</td><td>$5 · $0.50</td></tr>" +
              "<tr><td>Nasdaq</td><td>commonly $1 / point</td><td>$0.10 · often not available</td></tr>" +
              "</tbody></table></div>" +
              "<p>At the same lot size <strong>silver moves your money five times harder per pip than EURUSD</strong> — that's why copying a lot size from one instrument to another kills accounts.</p>"
          },
          {
            code: "L4.6",
            title: "The position sizing formula",
            html:
              '<div class="rb-box"><p><strong>Lot size = money at risk ÷ (stop distance in pips × pip value per 1.00 lot)</strong></p></div>' +
              "<ol>" +
              "<li><strong>Money at risk</strong> = balance × risk %. The course teaches <strong>1% per trade for beginners</strong> (Module 9 explains why). $600 × 1% = $6.</li>" +
              "<li><strong>Stop distance</strong> in pips — entry minus stop; signals give both prices.</li>" +
              "<li><strong>Pip value per 1.00 lot</strong> — $10 EURUSD/GBPUSD/gold, $50 silver, commonly $1 per point NAS100.</li>" +
              "</ol>" +
              "<p><strong>Always round down</strong> to the nearest 0.01. Rounding up = risking more than you decided. Nobody decides your risk except you, in advance, in cold blood.</p>"
          },
          {
            code: "L4.7–4.9",
            title: "Worked examples (1% risk)",
            html:
              '<div class="table-wrap"><table class="bc-table bc-plain bc-num"><thead><tr><th>Signal</th><th>Divisor</th><th>$300</th><th>$600</th><th>$1,000</th><th>$5,000</th></tr></thead><tbody>' +
              "<tr><td>EURUSD, 30-pip stop</td><td>30 × $10 = 300</td><td>0.01</td><td>0.02</td><td>0.03</td><td>0.16</td></tr>" +
              "<tr><td>GBPUSD, 50-pip stop</td><td>50 × $10 = 500</td><td>skip / 0.01 = $5 (1.7%)</td><td>0.01</td><td>0.02</td><td>0.10</td></tr>" +
              "<tr><td>Gold, $4 stop (40 pips)</td><td>40 × $10 = 400</td><td>skip / 0.01 = $4</td><td>0.01</td><td>0.02</td><td>0.12</td></tr>" +
              "<tr><td>Silver, $0.30 stop (30 pips)</td><td>30 × $50 = 1,500</td><td>skip (0.01 = 5%)</td><td>skip (0.01 = 2.5%)</td><td>skip / 0.01 = $15</td><td>0.03</td></tr>" +
              "<tr><td>NAS100, 50-pt stop, 0.10 min</td><td>50 × $1 = 50</td><td>skip / 0.10 = $5</td><td>0.10</td><td>0.20</td><td>1.00</td></tr>" +
              "</tbody></table></div>" +
              "<ul>" +
              "<li><strong>Gold shortcut:</strong> dollars risked per 0.01 lot = the stop distance in dollars. A $4 stop risks $4 per 0.01.</li>" +
              "<li><strong>Below the minimum lot:</strong> the trade can't be taken at 1% on that balance. Taking 0.01 anyway is a higher risk % — fine if it's a <em>decision</em>, never an accident.</li>" +
              "<li><strong>Silver on small balances:</strong> many silver signals simply can't be taken at sensible risk. Skipping because the maths says so isn't missing out — it's the skill.</li>" +
              "<li><strong>NAS100:</strong> index minimums are often 0.10, so round down to the nearest 0.10. All NAS100 numbers depend on your broker's contract — check the spec and redo one row with yours.</li>" +
              "</ul>"
          },
          {
            code: "L4.10",
            title: "Same lot size, completely different risk",
            html:
              '<div class="table-wrap"><table class="bc-table bc-plain"><thead><tr><th>0.10 lots on</th><th>Ordinary move against you</th><th>Loss</th></tr></thead><tbody>' +
              "<tr><td>Euro</td><td>30 pips</td><td>$30</td></tr>" +
              "<tr><td>Pound</td><td>50 pips</td><td>$50</td></tr>" +
              "<tr><td>Gold</td><td>$8 move</td><td>$80</td></tr>" +
              "<tr><td>Silver</td><td>$0.50 move</td><td>$250</td></tr>" +
              "<tr><td>Nasdaq</td><td>120 points</td><td>$12</td></tr>" +
              "</tbody></table></div>" +
              "<p>Same volume, a twentyfold spread in outcomes. <strong>There is no \"usual lot size\"</strong> — only the size this trade needs, worked out fresh from this trade's stop on this instrument.</p>"
          },
          {
            code: "L4.11",
            title: "The lot size calculator",
            html:
              "<p>Once you can do it by hand you may use a calculator (balance, risk %, instrument, stop → lot size). Currency Squad has one built for the five instruments, with a video tutorial in the portal. <strong>Hand first, calculator second</strong> — the calculator can't catch your input mistakes; the trained you sees a size ten times too big and says no.</p>"
          }
        ],
        mistakes: [
          "<strong>Fixed lot size for everything.</strong> 0.10 on every signal makes your risk random — L4.10 is what random looks like.",
          "<strong>Rounding up.</strong> 0.037 → 0.03, never 0.04.",
          "<strong>Refusing to skip.</strong> If the minimum lot is too big for the balance, the trade isn't available to you. That's the account protecting itself.",
          "<strong>Sizing from money instead of stop distance.</strong> \"I can afford 0.05\" isn't sizing. Size = risk ÷ stop distance, nothing else.",
          "<strong>Ignoring the symbol spec on indices.</strong> The one place broker differences really bite. Check it once."
        ],
        quiz: [
          { q: "$1,000 balance, 1% risk, EURUSD with a 25-pip stop. Lot size?", a: "$10 ÷ (25 × $10 = 250) = 0.04 lots. Loss if stopped: $10." },
          { q: "$600 balance, 1% risk, gold with a $3 stop. Lot size and loss?", a: "$3 = 30 pips → $6 ÷ (30 × $10 = 300) = 0.02 lots. Loss if stopped: $6 (shortcut: $3 per 0.01 × 2)." },
          { q: "Why is 0.10 on silver a completely different decision from 0.10 on EURUSD?", a: "Silver's pip value is $50 per lot vs $10, and it moves further — 0.10 is $5 a pip on silver vs $1 on EURUSD. An ordinary move costs about $250 vs $30." },
          { q: "The formula gives 0.006 lots and the minimum is 0.01. Options?", a: "Skip the trade, or take 0.01 knowing it's roughly 1.7× your planned risk. Never round up without deciding to." },
          { q: "Where do you find your broker's real NAS100 contract size?", a: "In the symbol specification: Quotes → tap the symbol → details on mobile; Market Watch → Specification on desktop." }
        ],
        task: "At 1% of your own real balance, by hand with your working shown, size these three: (1) buy EURUSD, entry 1.0850, stop 1.0820; (2) sell XAUUSD, entry 2,410.00, stop 2,415.00; (3) buy NAS100, entry 20,000, stop 19,940, using your broker's actual contract size. Then run all three through the lot size calculator and confirm it agrees. Any answer below the minimum lot: write \"skip\" plus the risk % that 0.01 would actually carry.",
        vsRulebook: [
          "<strong>Risk per trade — the big difference.</strong> The course teaches <strong>1% per trade</strong> for beginners (Module 9 will explain). The journal's AJ setting is 5% (from what AJ said they trade live), the Rulebook allows up to 5% on own trades, and Callisto is in a scaling phase at up to 20% per idea. Nothing changed in your settings — decide once you've read Module 9.",
          "<strong>Same formula as the journal.</strong> The journal's lot sizes use exactly risk ÷ (stop × $ per pip per lot) and already <strong>round down</strong> to 0.01.",
          "<strong>Gold pip matches:</strong> the journal's XAUUSD is pip size 0.1 at $10 per pip per lot — the same as the course. AJ's 100-pip stop on gold = a $10 move.",
          "<strong>To log the other instruments,</strong> add them in Position Sizing → Settings: EURUSD and GBPUSD pip size 0.0001, $10 per pip; XAGUSD pip size 0.01, $50 per pip; NAS100 pip size 1, $ per point from your broker's spec (commonly $1)."
        ]
      },
      {
        num: 5,
        title: "Leverage & Margin",
        tagline: "Borrowed size, real risk. Leverage gets blamed for accounts it didn't blow and trusted in ways it doesn't deserve. Once Module 4 sizing is in place, leverage is just plumbing.",
        lessons: [
          {
            code: "L5.1",
            title: "What leverage is — and isn't",
            html:
              "<p><strong>Leverage</strong> lets you control a position bigger than your deposit: at 1:100, each $1 controls $100 of exposure; at 1:500, $500.</p>" +
              "<p>It is <strong>not</strong> a multiplier that makes trades bigger. Your size is the lot size you type (Module 4). Leverage only decides <strong>how much of your account is locked as a deposit</strong> to hold that position — the width of the door, not what you carry through it.</p>" +
              "<p>Example: 0.10 lot EURUSD ≈ $11,000 of exposure at 1.10. At 1:100 the broker locks $110; at 1:500, $22. Same pip value, same profit, same loss — only the security deposit differs.</p>"
          },
          {
            code: "L5.2",
            title: "Margin requirement, used margin, free margin, margin level",
            html:
              "<ul>" +
              "<li><strong>Margin requirement</strong> — deposit needed for one position = position value ÷ leverage (the $22 above).</li>" +
              "<li><strong>Used margin</strong> — total locked across all open positions.</li>" +
              "<li><strong>Free margin</strong> — equity minus used margin; absorbs floating losses and funds new positions.</li>" +
              "<li><strong>Margin level</strong> — equity ÷ used margin × 100. $500 equity with $22 used = 2,272% (very healthy). This is the number the broker's systems watch.</li>" +
              "</ul>"
          },
          {
            code: "L5.3",
            title: "Margin call and stop out",
            html:
              "<p>As losses drag equity down, margin level falls. Two broker-set thresholds — <strong>commonly about 100% and 50%</strong>, but check your own broker's:</p>" +
              "<ul>" +
              "<li><strong>Margin call</strong> (the warning) — account flagged, no new positions.</li>" +
              "<li><strong>Stop out</strong> (the enforcement) — the platform force-closes positions automatically, <strong>largest loser first</strong>, at whatever price the market offers, until margin level recovers. Nobody phones you.</li>" +
              "</ul>" +
              "<p>Someone sizing at 1% with a stop on every trade essentially never meets stop out — their stops close trades long before margin level is threatened. <strong>Stop out isn't a risk tool; it's what exists for people who didn't have one.</strong></p>"
          },
          {
            code: "L5.4",
            title: "High leverage isn't high risk if sizing is right",
            html:
              "<p>Two $1,000 accounts, one at 1:30, one at 1:500, same EURUSD signal, 30-pip stop, both sized at 1% = 0.03 lots. Both lose <strong>$9</strong> if stopped. Identical risk — leverage only changed the margin locked.</p>" +
              "<p>Leverage's reputation comes from what it <em>permits</em>: at 1:500 a $1,000 account can open about 4 lots of EURUSD, where a 30-pip move is $1,200 — more than the account. Leverage removes the guardrail; the trader supplies the crash. <strong>Your guardrail is the Module 4 formula.</strong> Keep it and the leverage setting is close to irrelevant.</p>"
          },
          {
            code: "L5.5",
            title: "How beginners blow accounts",
            html:
              "<p>The standard crash: oversized position, no stop (\"I'll watch it\") → it goes against them → closing would make the loss real, so they hold → free margin drains → they <strong>average down</strong> with another position in the same direction → used margin rises, free margin drains faster → margin level slides to stop out → one ordinary wiggle and everything is liquidated. Deposit to zero in an afternoon, and the market did nothing unusual.</p>" +
              '<div class="rb-box"><p>Every step breaks something already taught: the size (Module 4), the missing stop (Module 3), refusing the small loss and doubling down (Modules 9 and 12). <strong>Blown accounts aren\'t bad luck — they\'re a recipe.</strong></p></div>'
          }
        ],
        mistakes: [
          "<strong>Choosing maximum leverage to trade bigger.</strong> Size comes from the formula; higher leverage just locks less margin for the same correct trade.",
          "<strong>Treating free margin as money to spend.</strong> It's the shock absorber. Commit nearly all of it and one adverse move starts the liquidation cascade.",
          "<strong>Relying on stop out as a worst-case stop loss.</strong> Stop out closes everything at the bottom; a stop loss closes one trade at your line.",
          "<strong>Not knowing your broker's margin call and stop out levels.</strong> Two numbers, one minute to find in the account terms. Know them before you fund."
        ],
        quiz: [
          { q: "Two identical 0.03 lot EURUSD trades, one on a 1:30 account, one on 1:500. Which loses more if the 30-pip stop is hit?", a: "Neither — both lose $9 (0.03 × 30 pips × $10). Leverage only changes how much margin is locked." },
          { q: "Equity $800, used margin $400. Margin level, and is anything wrong?", a: "200%. Above typical margin call (100%) so no alarm yet, but half your equity is locked as margin — positions are large. A $400 drop in equity would bring a margin call." },
          { q: "What actually happens at stop out?", a: "The platform automatically force-closes your positions, largest loser first, at whatever price the market offers, until margin level recovers. No warning call." },
          { q: "Why does a properly sized trader with stops almost never see a margin call?", a: "Each trade risks ~1% and its stop closes it long before equity falls enough to threaten margin level — and correctly sized trades use only a little margin." }
        ],
        task: "On demo, open one correctly sized position and write down all five Toolbox numbers (balance, equity, margin, free margin, margin level). Find your broker's margin call and stop out percentages in the account terms and write them down too. Then, in one paragraph: given that position, what would have to happen for the account to reach margin call — and why does your stop loss make that essentially unreachable?",
        vsRulebook: [
          "<strong>Matches the Rulebook:</strong> \"don't use your whole margin\" is the same idea as treating free margin as the shock absorber.",
          "<strong>Your accounts:</strong> look up AvaTrade's and Kudo's leverage, margin call and stop out levels and put them in the notes box — on AvaTrade this matters most, because Callisto split entries (up to 8 legs) and AJ trades can be open on the same account.",
          "<strong>Averaging down:</strong> the course calls adding to a loser a blow-up step. Callisto's planned split legs are different — every leg is sized up front for the full stop, one stop for the basket — but adding <em>unplanned</em> legs is exactly what this lesson warns about."
        ]
      },
      {
        num: 6,
        title: "Reading a Chart",
        tagline: "What the candles are telling you. You don't need to be an analyst to follow signals, but you need the vocabulary signals are written in: candles, timeframes, levels and structure.",
        lessons: [
          {
            code: "L6.1",
            title: "Candlesticks",
            html:
              "<p>Four prices per block of time: <strong>open, high, low, close</strong>. The <strong>body</strong> runs open → close: close above open = <strong>bullish</strong> (usually green), below = <strong>bearish</strong> (usually red). The <strong>wicks</strong> mark the high and low — ground price visited but didn't hold.</p>" +
              "<p>Read candles as the record of a fight: long body, tiny wicks = one side controlled the whole period. Long wicks, small body = price travelled far and was pushed back (a rejection). A long lower wick at a level = sellers pushed down, buyers slammed it back up. Skip memorising pattern names; ask of every candle: <strong>who was winning, and did anything get rejected?</strong></p>"
          },
          {
            code: "L6.2",
            title: "Timeframes",
            html:
              "<p>The timeframe is how much time each candle covers (H1 = 1 hour, M5 = 5 minutes). Same market, different resolution.</p>" +
              "<p>They nest: one H1 candle contains twelve M5 candles — its open is the first open, its high the highest high, its low the lowest low, its close the last close. A calm hourly candle can hide a violent five-minute fight; a scary M5 drop can be a flick on the daily. <strong>Higher timeframes show where the market is going; lower ones show what it's doing right now.</strong></p>"
          },
          {
            code: "L6.3",
            title: "Support and resistance",
            html:
              "<p><strong>Support</strong> = an area where falling price has repeatedly stopped and turned up. <strong>Resistance</strong> = where rising price has repeatedly stopped and turned down. They exist because markets have memory — orders cluster where buying and selling appeared before.</p>" +
              "<ul>" +
              "<li><strong>Zones, not lines</strong> — areas a few pips deep; think rectangle, not laser.</li>" +
              "<li>More touches and rejections = stronger, but nothing holds forever; a clean break is information too.</li>" +
              "<li><strong>Roles flip</strong> — broken resistance often becomes support on the way back, and vice versa.</li>" +
              "</ul>" +
              "<p>For a signal follower: stops and targets live at these zones. A stop just beyond a level means \"if this zone breaks, the idea is wrong\" (Module 9 builds on this).</p>"
          },
          {
            code: "L6.4",
            title: "Trend, range and structure",
            html:
              "<ul>" +
              "<li><strong>Uptrend</strong> — stair pattern of higher highs and higher lows.</li>" +
              "<li><strong>Downtrend</strong> — lower highs and lower lows.</li>" +
              "<li><strong>Range</strong> — sideways between support and resistance, resolving nothing.</li>" +
              "</ul>" +
              "<p><strong>Market structure</strong> = that skeleton of highs and lows. The beginner question: <em>is the stair pattern intact?</em> When an uptrend's pullback breaks below the previous higher low, structure has shifted and the trend is in question. (Deeper layers are in their advanced material.)</p>" +
              "<p>Markets range more often than they trend, and ranges are where impatient traders bleed buying tops and selling bottoms. Recognising there's nothing to do is chart reading too.</p>"
          },
          {
            code: "L6.5",
            title: "Higher timeframe context",
            html:
              "<p>Timeframes are a chain of command: the <strong>daily sets the regime, H4 and H1 shape the day, small timeframes execute</strong>. A pretty M5 uptrend climbing into a daily resistance zone is a small truth inside a bigger warning — and the bigger one usually wins.</p>" +
              '<div class="rb-box"><p><strong>The 30-second habit:</strong> before judging any chart, zoom out — daily, then H4 — and ask: which way is structure pointing, and am I near a major level? Then drop to your timeframe. That is what \"higher timeframe bias\" in their analysis means.</p></div>'
          }
        ],
        mistakes: [
          "<strong>Candle astrology.</strong> Memorising fifty pattern names but unable to say who was in control this hour. Read the fight, not the flashcards.",
          "<strong>Drawing levels as exact lines</strong> and calling them broken on a one-pip poke. Zones, always.",
          "<strong>Living on the 1-minute chart.</strong> The lowest timeframes are mostly noise and exhaust you into overtrading. Nothing you need lives below M5.",
          "<strong>Marking twenty levels per chart.</strong> If everything is a level, nothing is. Two or three obviously respected zones beat a barcode."
        ],
        quiz: [
          { q: "Small body, very long lower wick. Tell the story of that period.", a: "Sellers drove price well down, but buyers rejected those lower prices and pushed it back up to close near the open — a rejection of the lows, buyers in control at that level." },
          { q: "How many M15 candles are inside one H1 candle, and where does the H1 high come from?", a: "Four. The H1 high is the highest high of those four M15 candles." },
          { q: "Price breaks up through resistance, later falls back to that zone and bounces up. What happened?", a: "A role flip: the old resistance became support, and the retest held." },
          { q: "An uptrend breaks below its most recent higher low. What is the market telling you?", a: "Structure has shifted — the stair pattern is broken, so the uptrend is in question (not yet proven reversed)." }
        ],
        task: "Pick one of the five instruments. On H4, mark one support zone and one resistance zone that price has clearly respected at least twice each. Write down whether H4 and H1 are trending or ranging, using the stair pattern to justify it. Screenshot the chart with your zones and keep it — you redraw it properly in TradingView in Module 7.",
        vsRulebook: [
          "<strong>Top-down matches:</strong> the course's zoom-out habit (D → H4 → H1 → your timeframe) is the Rulebook's bias step (Daily → 4H → 1H → 15M, 3 timeframes aligned).",
          "<strong>Structure:</strong> the course stops at the stair pattern and \"structure shifted\"; the Rulebook already goes deeper (CHoCH, BOS with a body close, order blocks, FVGs). Same foundation.",
          "<strong>Difference — lowest timeframe:</strong> the course says nothing you need lives below M5. The Rulebook's confirmations drop to 1M/3M/5M (with an extra BOS + retest required on 1M/3M). For AJ signals you don't need to go lower than M5.",
          "<strong>Zones:</strong> same idea as Rulebook POIs — fresh zones, treated as areas, not exact prices."
        ]
      },
      {
        num: 7,
        title: "TradingView",
        tagline: "Your analysis workstation. MetaTrader executes; TradingView is where analysis is produced. The setup: TradingView to think, MetaTrader to act.",
        lessons: [
          {
            code: "L7.1",
            title: "Why TradingView alongside MetaTrader",
            html:
              "<p>TradingView (browser and app) doesn't hold money or place trades — it only displays and marks up charts, and does that far better: smoother charts, better drawing tools, watchlists, alerts, markups synced across devices.</p>" +
              "<p>Separating the jobs builds a habit: <strong>decide where you can't place the trade</strong>, then move to the execution platform to carry out a decision already made.</p>"
          },
          {
            code: "L7.2",
            title: "Free vs paid",
            html:
              "<p>Free gives full charts, all timeframes, a couple of indicators per chart, one alert, one chart per tab — everything the bootcamp needs. Paid adds multi-chart layouts, more alerts and indicators, second-based intervals. <strong>Start free</strong>; upgrade only when you hit a real wall (usually wanting more alerts). Paid improves convenience, not trading.</p>"
          },
          {
            code: "L7.3",
            title: "Finding the five instruments",
            html:
              "<p>Symbol search shows many results per symbol — one per data feed — and indices appear both as the raw index and as broker CFDs (NAS100, US100…).</p>" +
              "<p><strong>Rule:</strong> chart your own broker's feed if TradingView lists it, so the chart matches your executable prices. Otherwise any major feed is fine — expect a few pips' difference from MetaTrader (most on indices) and treat levels as zones.</p>"
          },
          {
            code: "L7.4",
            title: "Chart type and timeframes",
            html:
              "<p>Use <strong>candlesticks</strong> and never think about it again. Favourite the timeframes that matter: <strong>M5, M15, H1, H4, D</strong>. Flipping D → H4 → H1 is the Lesson 6.5 zoom-out habit made physical.</p>"
          },
          {
            code: "L7.5",
            title: "Drawing tools",
            html:
              "<ul>" +
              "<li><strong>Horizontal line</strong> — a support or resistance price.</li>" +
              "<li><strong>Rectangle</strong> — a zone (the truer shape of S/R); stretch it over the area price keeps reacting to.</li>" +
              "<li><strong>Trendline</strong> — connects higher lows or lower highs to make the stair pattern visible.</li>" +
              "<li><strong>Fib retracement</strong> — percentage levels between a swing low and swing high; traders watch <strong>50–61.8%</strong> for pullbacks to end. For now just know how to draw it low → high.</li>" +
              "</ul>" +
              "<p>Housekeeping: drawings sync to your account — date them or delete stale ones weekly. A chart buried under months of old lines stops being readable.</p>"
          },
          {
            code: "L7.6",
            title: "Indicators and the overload warning",
            html:
              "<p>An indicator is a calculation from past price (moving averages smooth price; RSI scores momentum). Stacking them adds no new information, only more voices — a beginner with six indicators is outsourcing the decision to a committee that always disagrees.</p>" +
              "<p>Skill order: <strong>price first, structure second, indicators later and sparingly</strong>. For the bootcamp: <strong>zero or one</strong> indicator — a single moving average to show trend is plenty.</p>"
          },
          {
            code: "L7.7",
            title: "Watchlists and layouts",
            html:
              "<p>Build a watchlist of exactly the five instruments — your 30-second morning scan. Adding every interesting symbol is how focus dies. Save the setup as a <strong>layout</strong> so drawings, timeframes and watchlist restore on any device.</p>"
          },
          {
            code: "L7.8",
            title: "Price alerts",
            html:
              "<p>Right-click a price → Add Alert (or the alarm-clock icon), set condition and expiry. Alerts are the antidote to screen-watching: mark the level, set the alert, close the app, live your life. Watching every tick doesn't give information — it gives urges (Module 12).</p>"
          },
          {
            code: "L7.9",
            title: "Replay mode",
            html:
              "<p>The rewind icon rolls the chart back and plays it forward candle by candle, hiding everything after — it restores what hindsight destroys: not knowing what happens next. Drill: rewind a month, step forward, call out structure and levels in real time. Ten minutes of replay beats an hour of scrolling history, because you can be wrong in it.</p>"
          },
          {
            code: "L7.10",
            title: "Analyse on TradingView, execute on MetaTrader",
            html:
              "<p>The loop (Module 10 formalises it for signals): context on TradingView with the zoom-out habit, levels marked, alert set → when the moment comes, size it with Module 4 → order in MetaTrader with SL and TP at entry → manage per plan.</p>" +
              '<div class="rb-box"><p><strong>Keep the wall</strong> between deciding and doing. Decisions made with the buy button under your thumb are systematically worse than decisions made a screen away.</p></div>'
          }
        ],
        mistakes: [
          "<strong>Indicator stacking.</strong> Six overlapping opinions from the same prices. Price and structure first; one indicator maximum.",
          "<strong>Panicking over TradingView vs MetaTrader price differences.</strong> Feeds differ by a few pips, indices most. Zones, not lasers.",
          "<strong>A forty-symbol watchlist.</strong> The five. Depth beats breadth.",
          "<strong>Never deleting old drawings.</strong> A chart you can't read is a chart you'll misread."
        ],
        quiz: [
          { q: "Why analyse on TradingView but execute on MetaTrader, beyond chart quality?", a: "It separates deciding from doing: you decide where you can't place a trade, then execute a decision already made. Choices made with the buy button under your thumb are worse." },
          { q: "Searching EURUSD gives many results. Which should you chart?", a: "Your own broker's feed if it's listed, so prices match what you can execute. Otherwise any major feed, expecting a few pips' difference." },
          { q: "Why is replay mode better practice than scrolling back through history?", a: "It hides what happens next, so you have to call structure in real time and can be wrong — scrolling history is hindsight." },
          { q: "The argument against five indicators on your chart?", a: "They're all rearrangements of the same past price — no new information, just more conflicting voices. You end up outsourcing the decision instead of reading price and structure." }
        ],
        task: "Build your TradingView workstation: watchlist of exactly the five instruments, candlestick chart, quick timeframes M5, M15, H1, H4 and D. Redraw your Module 6 zones properly as rectangles, set one alert at the edge of your most important zone, and save the layout. Then run one replay session: rewind any instrument one month on H1 and step through a week of candles, narrating structure out loud. Screenshot the finished workstation.",
        vsRulebook: [
          "<strong>Indicators:</strong> same stance as the Rulebook — optional confluence, never part of an entry. The course allows zero or one (a single moving average).",
          "<strong>Fibonacci:</strong> the course watches 50–61.8% for pullbacks; the Rulebook uses the 0.5 split for premium/discount. Compatible — both centre on the 50% area.",
          "<strong>Timeframes:</strong> the course's favourites (M5, M15, H1, H4, D) cover the Rulebook's bias chain; for Callisto confirmations you'd also add 1M/3M.",
          "<strong>Sessions:</strong> keep the Rulebook's session indicator on your TradingView layout — it counts as tooling, not an entry indicator."
        ]
      },
      {
        num: 8,
        title: "Sessions & Timing",
        tagline: "When the market is actually awake. There are hours when the instruments move with purpose and hours when they drift and chew up impatient traders with spread.",
        lessons: [
          {
            code: "L8.1",
            title: "The four sessions",
            html:
              "<p>Forex trades 24 hours from Monday morning in Asia to Friday evening in New York. Approximate times (they shift an hour when the UK/US clocks change; South Africa doesn't, so SA times move instead):</p>" +
              '<div class="table-wrap"><table class="bc-table bc-plain"><thead><tr><th>Session</th><th>UTC</th><th>SA time</th><th>Character</th></tr></thead><tbody>' +
              "<tr><td>Sydney</td><td>22:00–07:00</td><td>00:00–09:00</td><td>Quiet open of the trading day, thin volume.</td></tr>" +
              "<tr><td>Tokyo</td><td>00:00–09:00</td><td>02:00–11:00</td><td>Asian session; steady but modest moves in these instruments.</td></tr>" +
              "<tr><td>London</td><td>08:00–17:00</td><td>10:00–19:00</td><td>The heavyweight — largest forex volume, real directional moves begin.</td></tr>" +
              "<tr><td>New York</td><td>13:00–22:00</td><td>15:00–00:00</td><td>Second heavyweight; US data lands here, morning overlaps London.</td></tr>" +
              "</tbody></table></div>" +
              '<div class="rb-box"><p><strong>London–New York overlap ≈ 13:00–17:00 UTC (15:00–19:00 SA time)</strong> — the deepest, most active stretch of the day, and where most of their signals come.</p></div>'
          },
          {
            code: "L8.2",
            title: "When each instrument moves",
            html:
              '<div class="table-wrap"><table class="bc-table bc-plain"><thead><tr><th>Instrument</th><th>When it really moves</th></tr></thead><tbody>' +
              "<tr><td>EURUSD</td><td>London open onward, peaking in the overlap. Asian hours usually drift.</td></tr>" +
              "<tr><td>GBPUSD</td><td>Same shape, often sharper at London open, jumpy around UK data.</td></tr>" +
              "<tr><td>XAUUSD</td><td>Active in London, most explosive around US data and the New York morning.</td></tr>" +
              "<tr><td>XAGUSD</td><td>Follows gold's clock with thinner liquidity — same hours, rougher edges.</td></tr>" +
              "<tr><td>NAS100</td><td>US clock — action around the New York stock market open; takes a daily break. Exact CFD hours are broker-specific.</td></tr>" +
              "</tbody></table></div>" +
              "<p>One window — <strong>London afternoon into the New York morning</strong> — covers the prime hours of all five. Know your window and stop expecting miracles outside it.</p>"
          },
          {
            code: "L8.3",
            title: "Why spreads widen",
            html:
              "<p>Spread reflects liquidity. Three predictable widening events:</p>" +
              "<ul>" +
              "<li><strong>Rollover</strong> around 22:00 UTC (00:00 SA) — liquidity briefly evaporates; spreads can multiply for a few minutes.</li>" +
              "<li><strong>Seconds around major news</strong> — providers step back.</li>" +
              "<li><strong>Late Friday</strong> into the weekly close.</li>" +
              "</ul>" +
              "<p>Nobody is cheating you — it's just the worst moment to enter or exit. Unless a stop forces it, don't transact inside these windows.</p>"
          },
          {
            code: "L8.4",
            title: "Rollover, swap and holding overnight",
            html:
              "<p>Swap is applied to any position held through rollover; depends on instrument, direction and rate differential — usually small, sometimes a credit.</p>" +
              "<ul>" +
              "<li><strong>Triple swap</strong> one night a week — most commonly <strong>Wednesday</strong> for forex and metals — to cover the weekend. A triple fee showing on Thursday morning is that.</li>" +
              "<li>Exact rates are in the MetaTrader symbol specification. For short signal trades swap is a rounding error; for multi-night holds, check before entry.</li>" +
              "</ul>"
          },
          {
            code: "L8.5",
            title: "High-impact news — be flat",
            html:
              "<p>The heavyweights: <strong>US Non-Farm Payrolls</strong> (first Friday of the month), <strong>US inflation (CPI)</strong>, <strong>central bank rate decisions</strong> (especially the Fed) and the press conferences after. GBPUSD adds UK inflation and Bank of England decisions.</p>" +
              "<p>At release, price can travel a day's range in seconds, spreads blow out and execution goes bad → <strong>slippage</strong>: orders fill worse than requested, <em>stops included</em>. A stop is an instruction to close at the best available price once your level trades; in a spike that can be well beyond it. Module 4's maths assumes your stop fills where you put it — news is where that bends.</p>" +
              '<div class="rb-box"><p><strong>The rule: beginners are flat around high-impact news.</strong> No open position on the affected instruments, no entries in the final minutes before, and ideally close or reduce ahead of the biggest releases. Watching NFP while holding nothing costs zero and teaches plenty.</p></div>'
          },
          {
            code: "L8.6",
            title: "The economic calendar habit",
            html:
              "<p>Every Sunday or Monday (two minutes): open a calendar (Forex Factory or TradingView's), filter to <strong>high-impact USD and GBP</strong> events, convert to your time, and note them where you plan the week. Red folder icons = the releases to be flat for. Then Wednesday's Fed decision is an appointment you scheduled around, not a surprise.</p>"
          }
        ],
        mistakes: [
          "<strong>Trading the dead hours out of boredom.</strong> Late New York into early Asia = wide spreads and drift. No signal, no session, no trade.",
          "<strong>Blaming the broker for rollover spreads or triple swap.</strong> Both are scheduled and in the specification.",
          "<strong>Holding into NFP to see what happens.</strong> What happens is slippage in whichever direction hurts.",
          "<strong>Checking the calendar after entering.</strong> It's pre-flight, not post-mortem."
        ],
        quiz: [
          { q: "Which stretch of the day is the most liquid and active, and why?", a: "The London–New York overlap, about 13:00–17:00 UTC (15:00–19:00 SA time): the two biggest centres are open at once, and US data lands then." },
          { q: "You're charged triple swap on a Thursday morning. What happened?", a: "You held through Wednesday night's rollover, which charges three days to cover the weekend. Scheduled, not a broker error." },
          { q: "Why can a stop fill worse than you set it during news?", a: "A stop becomes an order to close at the best available price once your level trades. In a spike, price jumps and spreads widen, so the best price can be well past your level — slippage." },
          { q: "What does flat mean, and when must beginners be flat?", a: "No open position on the affected instruments. Around high-impact releases (NFP, CPI, Fed and other central bank decisions): no entries in the final minutes before, ideally close or reduce ahead of the biggest ones." }
        ],
        task: "Build your week's timing sheet: convert the four sessions and the London–New York overlap to your local time. Open an economic calendar, filter to high-impact USD and GBP events for this week, and list each with its local time and which of the five instruments it can move. Finish with one sentence naming your own best daily trading window. Update it weekly.",
        vsRulebook: [
          "<strong>News — AJ:</strong> be flat around high-impact news (no open position, no late entries, close or reduce before the biggest). <strong>Rulebook:</strong> check Forex Factory daily and expect spikes and slippage; no stay-flat rule. Decide whether the flat rule applies to AJ trades only, or to everything.",
          "<strong>Trading window — AJ:</strong> London afternoon into New York morning (about 15:00–19:00 SA time) covers all five instruments. <strong>Rulebook:</strong> London often ranges, New York brings the volume and the expansion where FVG entries set up. Close in practice; worth agreeing one window for both.",
          "<strong>Rollover (00:00 SA time) — AJ:</strong> don't enter or exit in the rollover minutes or late Friday. <strong>Rulebook:</strong> doesn't mention it.",
          "<strong>Swap — AJ:</strong> triple swap Wednesday night; check the rate before holding several nights. Relevant to Callisto baskets that stay open overnight."
        ]
      },
      {
        num: 9,
        title: "Risk Management",
        tagline: "The skill that keeps you in the game. Module 4 controlled risk on one trade; this is the system across a hundred trades — where careers are actually decided.",
        lessons: [
          {
            code: "L9.1",
            title: "Fixed percentage per trade",
            html:
              "<p>Risk a fixed small % of the <strong>current</strong> balance on every trade — <strong>1% for beginners</strong>. Losing streaks of 5, 7, even 10 are a certainty over time, from ordinary variance.</p>" +
              "<ul>" +
              "<li>At <strong>1%</strong>, seven straight losses leaves about <strong>93%</strong> of the account — irritating, survivable.</li>" +
              "<li>At <strong>10%</strong>, the same streak leaves about <strong>48%</strong> — and the psychology of half an account does the rest.</li>" +
              "</ul>" +
              "<p>Fixed-fractional risk self-adjusts: as the balance falls, the dollar risk shrinks, slowing the bleed exactly when needed.</p>"
          },
          {
            code: "L9.2",
            title: "Thinking in R",
            html:
              "<p><strong>R</strong> = the amount risked on a trade. Risk $10, lose it = −1R; make $20 = +2R. R makes results comparable across time and account size (2R is 2R on $300 or $30,000) and takes the sting out of money: a loss becomes −1R, the planned cost of finding out. A 30-pip risk targeting 60 pips is a 2R setup whatever the balance. The course and community speak in R from here on.</p>"
          },
          {
            code: "L9.3",
            title: "Risk to reward and win rate",
            html:
              "<ul>" +
              "<li>100 trades, <strong>40% win rate</strong>, +2R wins, −1R losses: 80R − 60R = <strong>+20R</strong>, while losing more often than winning.</li>" +
              "<li>100 trades, <strong>70% win rate</strong>, risking 3R to make 1R: 70R − 90R = <strong>−20R</strong>, while winning most trades.</li>" +
              "</ul>" +
              "<p>Win rate alone tells you nothing; what matters is <strong>win rate paired with reward size</strong>. Chasing being right aims at the wrong target. Losing streaks happen inside perfectly sound approaches — the maths has room for them, your emotions need the same room.</p>"
          },
          {
            code: "L9.4",
            title: "Where a stop belongs",
            html:
              "<p>Not a pain threshold or a round number: <strong>at the price where the trade's reason no longer exists</strong> (e.g. beyond the support zone a buy depends on).</p>" +
              "<ul>" +
              "<li>Stop distance is a property of the setup, found on the chart; <strong>size flexes around it, never the reverse</strong>. Shrinking a stop to afford a bigger lot puts the exit where the idea is still alive — ordinary wobble becomes needless losses.</li>" +
              "<li>A signal's stop is structural — it encodes where their analysis is invalidated. Taking the signal with its stop, sized by your formula, is inheriting that analysis correctly.</li>" +
              "</ul>"
          },
          {
            code: "L9.5",
            title: "Drawdown and recovery",
            html:
              '<div class="table-wrap"><table class="bc-table bc-plain"><thead><tr><th>Loss from peak</th><th>Gain needed to recover</th></tr></thead><tbody>' +
              "<tr><td>5%</td><td>5.3%</td></tr><tr><td>10%</td><td>11.1%</td></tr><tr><td>20%</td><td>25%</td></tr>" +
              "<tr><td>30%</td><td>42.9%</td></tr><tr><td>50%</td><td>100%</td></tr><tr><td>75%</td><td>300%</td></tr>" +
              "</tbody></table></div>" +
              "<p>Recovery is earned from a smaller base. Down 10% is a normal season; down 50% needs a doubling, and chasing that is how 50 becomes 75. At 1% risk, even the 20% row takes a losing run so long the journal would flag a real problem far earlier.</p>"
          },
          {
            code: "L9.6",
            title: "Daily and weekly loss limits",
            html:
              '<div class="rb-box"><p><strong>Beginner limits: 3R per day, 6R per week.</strong> Hit the daily limit → done until tomorrow, platforms closed, no \"just watching\". Hit the weekly → done until Monday, weekend in the journal instead of the platform.</p></div>' +
              "<p>Trade four after three losses isn't doomed — <em>you</em> after three losses aren't the person who should evaluate it. The limit removes that person automatically, so it has to be written down in advance; a limit negotiated in the moment always loses. Prop firms enforce exactly this in software (Module 13).</p>"
          },
          {
            code: "L9.7",
            title: "Never widen a stop",
            html:
              "<p>Dragging a stop further away \"just this once\": the idea is already dead, the trade is held together by hope, and the maths breaks silently — the position was sized for the original stop, so the eventual loss is bigger than 1R (and it usually hits). One moved stop can cost 3R, 5R or the account, and the times it works teach the lesson that kills you later.</p>" +
              '<div class="rb-box"><p><strong>Stops move toward profit or not at all.</strong> Tightening, or moving to entry on a winner, reduces risk and is fine. Widening isn\'t managing a trade — it\'s refusing a fact.</p></div>'
          }
        ],
        mistakes: [
          "<strong>Increasing risk to recover losses.</strong> Recovery at normal size is arithmetic; at revenge size it's a countdown.",
          "<strong>Judging an approach on ten trades.</strong> The maths needs samples; streaks are noise. The journal is the judge, not last week's feelings.",
          "<strong>Setting limits and renegotiating them live.</strong> A limit you can talk yourself out of is a wish.",
          "<strong>Tightening stops to fit a desired lot size.</strong> The stop comes from structure; size flexes, the stop doesn't."
        ],
        quiz: [
          { q: "100 trades, 40% win rate, winners +2R, losers −1R. Net result?", a: "+20R: 40 × 2R = 80R, minus 60 × 1R = 60R." },
          { q: "An account falls 30% from its peak. What gain gets it back, and why not 30%?", a: "About 42.9%. The recovery is earned on the smaller remaining balance (70% of the peak), so it needs a bigger percentage." },
          { q: "The one direction a stop may move, and why?", a: "Toward profit (tighter, or to entry). That only reduces risk. Widening keeps a dead idea alive and makes the loss bigger than the 1R the trade was sized for." },
          { q: "Three losses before lunch hit your 3R daily limit, then a great-looking setup appears. What do you do?", a: "Nothing — you're done for the day. The limit exists because the person who just lost three trades shouldn't be judging the fourth; the limit was set in advance so it can't be negotiated." },
          { q: "A 40-pip stop gives a smaller lot than you wanted. Why is tightening to 20 pips the wrong fix?", a: "The stop sits where the idea is invalidated; at 20 pips it's inside the zone where the idea is still alive, so normal noise stops you out. Take the smaller size, or skip." }
        ],
        task: "Write your personal risk plan on one page: your risk per trade in %, daily loss limit in R, weekly loss limit in R, the maximum number of positions you'll hold at once, and one sentence on exactly what you do for the rest of the day when a limit is hit. Date it and sign it. It outranks your opinions from now on, and Module 10 assumes it exists.",
        vsRulebook: [
          "<strong>Risk per trade — AJ course:</strong> 1% for beginners. <strong>Journal's AJ setting:</strong> 5% (what AJ said they trade live). <strong>Rulebook:</strong> up to 5% on own trades, up to 20% per idea on Callisto in the current scaling phase. This is the biggest decision — your risk plan (the task above) is the place to settle it per source.",
          "<strong>Daily stop — AJ:</strong> 3R a day, 6R a week, counted in R. <strong>Rulebook:</strong> done for the day at 30% drawdown; the journal's loss protocol uses max drawdown from peak. Note: at 20% per Callisto idea, 3R would be 60%, so the two rules don't translate one-to-one.",
          "<strong>Stop distance — AJ:</strong> the stop comes from the chart for each trade and the size flexes around it. <strong>Rulebook:</strong> stop beyond the structure, but planned at fixed sizes (100 pips own/Premium, 120 Grind Room). The journal's AJ preset also assumes a fixed 100-pip stop — see Module 10's note.",
          "<strong>Moving stops:</strong> both say never widen. <strong>Breakeven — AJ:</strong> to entry at 1:1 (Module 10's live signal). <strong>Rulebook:</strong> to entry after TP1 (20 pips), not before.",
          "<strong>Max positions — AJ:</strong> asks you to set a number (Module 10 suggests 2–3 during the bootcamp). <strong>Rulebook:</strong> no cap on trades; a Callisto basket can be up to 8 legs. Decide how a basket counts against that cap."
        ]
      },
      {
        num: 10,
        title: "Following a Signal",
        tagline: "The outcome the bootcamp exists for: a signal arrives on your phone, and within a few minutes it's a correctly sized, correctly placed trade on your own account — or a correct decision not to take it.",
        lessons: [
          {
            code: "L10.1",
            title: "Anatomy of a signal",
            html:
              "<p>Five components: <strong>instrument</strong>, <strong>direction</strong>, <strong>entry</strong> (market now, or a price for a pending order), <strong>stop loss</strong> (where the idea is invalidated) and <strong>take profit</strong> (one target, or TP1/TP2 for partials).</p>" +
              "<p>Deliberately missing: <strong>a lot size</strong>. Size depends on your balance and risk plan, which only you know. A signal is analysis plus levels; the risk is always yours to assign.</p>" +
              '<div class="rb-box"><p><strong>Real example from their channel:</strong> XAUUSD market buy · entry 4054 · SL 4049 · target 4067. That\'s a $5 stop (50 pips) and $13 target (130 pips) = <strong>2.6R</strong>. Updates followed: \"price hit 1:1 — reduce risk to breakeven (entry)\", then \"1.5× our risk\", then \"close when happy, 2.9× is the target\", then \"closing here\".</p></div>'
          },
          {
            code: "L10.2",
            title: "Translating a signal into your size",
            html:
              "<p>Sell XAUUSD, entry 2,410.00, SL 2,415.00, TP 2,400.00; $1,000 account at 1%:</p>" +
              "<ol>" +
              "<li>Stop distance: 2,415 − 2,410 = $5.00 = <strong>50 pips</strong>.</li>" +
              "<li>Money at risk: 1% of $1,000 = <strong>$10</strong>.</li>" +
              "<li>Lot size: 10 ÷ (50 × 10) = <strong>0.02</strong>.</li>" +
              "<li>Gold shortcut check: 0.02 lots = $2 per $1 of stop × $5 = $10. ✓</li>" +
              "<li>MetaTrader: sell 0.02 XAUUSD, SL 2,415.00, TP 2,400.00, entered on the order screen.</li>" +
              "</ol>" +
              "<p>Under two minutes once practised. Also read the ratio off: $10 risk vs $20 reward = a <strong>2R</strong> setup. Reading R before taking a signal is the start of evaluating rather than just executing.</p>"
          },
          {
            code: "L10.3",
            title: "Price already moved past the entry",
            html:
              "<p>The signal's maths was computed at its entry; every pip since changes it.</p>" +
              "<ul>" +
              "<li><strong>Moved toward the stop</strong> (you can enter cheaper): cautiously fine — smaller stop, bigger reward. Re-size for the new stop and go if the reason still holds.</li>" +
              "<li><strong>Moved a little toward the target</strong> (about a quarter of the way or less): acceptable with recalculation — wider stop from here, smaller reward. Recompute size and R before deciding.</li>" +
              "<li><strong>Moved substantially toward or past the target:</strong> the trade is gone. Let it go.</li>" +
              "</ul>" +
              '<div class="rb-box"><p><strong>A missed trade costs nothing.</strong> No minus in the journal, no drawdown, no recovery maths. Chasing one is buying someone else\'s exit (FOMO — Module 12).</p></div>'
          },
          {
            code: "L10.4",
            title: "Running and unsure",
            html:
              "<p>Order of authority, fixed in advance:</p>" +
              "<ol>" +
              "<li>The trade's own <strong>SL and TP</strong> — already handling every scenario silently.</li>" +
              "<li><strong>Official signal updates</strong> (move stop to entry, close half at TP1…) — execute with the Module 3 mechanics.</li>" +
              "<li>Your own discretion — for a beginner, close to inactive.</li>" +
              "</ol>" +
              "<p>Uncertainty isn't an instruction. No update and price wobbling = the plan is in the market; the right action is almost always nothing. Closing early to stop the suspense, then watching it hit target without you, is a psychology event — journal it either way.</p>"
          },
          {
            code: "L10.5",
            title: "Don't copy someone's lot size",
            html:
              "<p>Someone posts 0.50 lots. On a $25,000 account, 0.50 on a 50-pip gold stop risks $250 = 1%. The same 0.50 on $1,000 risks $250 = <strong>25%</strong> of everything — four ordinary losses and the account is gone. Lot sizes are meaningless without the balance behind them; the only comparable number is <strong>R</strong>.</p>"
          },
          {
            code: "L10.6",
            title: "Several signals open at once",
            html:
              "<ul>" +
              "<li><strong>Cap:</strong> during the bootcamp, no more than <strong>2–3 positions open at once</strong>. Three at 1% each is a full 3R daily limit riding at once. A new signal at your cap is a skip.</li>" +
              "<li><strong>Correlation:</strong> gold and silver often move together, and both often move against the US dollar, as EURUSD and GBPUSD do. Four dollar-sensitive positions are one big opinion about the dollar in four costumes, and one US release hits them all. Count positions, then count actual opinions — the second number is your real exposure.</li>" +
              "</ul>"
          },
          {
            code: "L10.7",
            title: "The limits of signals",
            html:
              "<p>You inherit analysis without owning the reasoning, entries will sometimes differ from theirs, losing streaks arrive and test you because the decisions weren't yours, and a signal can never know your balance, open positions or state of mind.</p>" +
              "<p>Their stated goal: <strong>signals are scaffolding, not the building</strong> — a live apprenticeship. Study each signal's chart, structural stop and ratio through Modules 6 and 9, and eventually check their analysis against your own before taking it.</p>"
          }
        ],
        mistakes: [
          "<strong>Executing before calculating.</strong> The two minutes of sizing is the trade; the clicking is the receipt.",
          "<strong>Chasing a signal that has run.</strong> A missed trade costs nothing; a chased one starts at the worst price in the story.",
          "<strong>Skipping the stop because an update will probably come.</strong> SL at entry, every trade, whoever's analysis it is.",
          "<strong>Stacking correlated signals at full size each.</strong> Count opinions, not just positions.",
          "<strong>Closing early out of suspense.</strong> No update, no plan reason, no action."
        ],
        quiz: [
          { q: "Buy GBPUSD, entry 1.2700, SL 1.2670, TP 1.2760; $600 at 1%. Lot size, and the trade in R?", a: "30-pip stop: $6 ÷ (30 × $10 = 300) = 0.02 lots, risking $6. Target 60 pips = 2R ($12)." },
          { q: "Why do signals never include a lot size?", a: "Size depends on your own balance and risk plan, which the signal can't know. The only comparable number between traders is R." },
          { q: "You open a buy signal late and price is most of the way to TP1. Correct action?", a: "Let it go. The remaining reward is small against a now-wider stop — a missed trade costs nothing." },
          { q: "Buys on EURUSD, GBPUSD and gold, each at 1%. Why might that be closer to one 3% trade?", a: "All three are bets against the US dollar. One US release can move them all together, so it's one opinion at 3%, not three independent 1% trades." },
          { q: "Signal open, price chopping near entry, no update. Correct action?", a: "Nothing. The SL and TP are already in the market; uncertainty isn't an instruction. Wait for the plan or an official update." }
        ],
        task: "On demo, timed: sell XAUUSD at market, SL $4.00 above your entry, TP $8.00 below. Size it by hand for your demo balance at 1%, check it with the calculator, place the order with SL and TP at entry, and screenshot the open position showing both levels. Write down your time from reading the signal to placed order. Repeat on fresh demo trades until the whole procedure takes under three minutes without rushing.",
        vsRulebook: [
          "<strong>AJ stops and targets vary per signal.</strong> The live example had a $5 (50-pip) stop and a 2.6R target, later 2.9R. The journal's AJ preset assumes a fixed 100-pip stop with TP at 1.5R and BE at 1R. Decide whether to log AJ trades with each signal's own SL and TP (and keep the preset only as a fallback) — I can change the journal once you've decided.",
          "<strong>Late entries — AJ:</strong> a written framework (toward the stop: re-size; a quarter toward target: recompute; further: skip). <strong>Rulebook:</strong> Callisto signals are entered in planned split legs as price moves, which is a different way of handling price away from the entry.",
          "<strong>Management — AJ:</strong> the trade's SL/TP first, then official updates, own discretion close to inactive; BE at 1:1, then \"close when happy\" near the target. <strong>Rulebook:</strong> fixed partial plan (10/10/10/20% at TP1–TP4, rest runs) and BE after TP1. Different exit styles — the journal's partials fields handle both.",
          "<strong>Open positions — AJ:</strong> 2–3 at once during the bootcamp, and count gold, silver, EURUSD and GBPUSD as one dollar opinion. <strong>Rulebook:</strong> no cap. Relevant to AvaTrade, where Callisto baskets and AJ gold trades can overlap — both are dollar trades on gold."
        ]
      },
      {
        num: 11,
        title: "Journaling & Review",
        tagline: "The mirror your trading needs. Memory is a story; the journal is the data, and the two disagree constantly — always in memory's favour. Shortest module, highest-leverage habit.",
        lessons: [
          {
            code: "L11.1",
            title: "What to record on every trade",
            html:
              "<p>MetaTrader history already has the objective half (times, prices, volume, result). The journal adds what the platform can't see:</p>" +
              "<ul>" +
              "<li><strong>The setup</strong> — which signal or idea, instrument, direction, and a <strong>screenshot at entry with the levels visible</strong>. Not optional: in review it's the difference between remembering and seeing.</li>" +
              "<li><strong>The numbers in R</strong> — planned risk, planned target, outcome in R (not just dollars).</li>" +
              "<li><strong>Execution quality</strong> — sized correctly, SL and TP at entry, updates followed? Yes, or what deviated. This field is the whole point.</li>" +
              "<li><strong>State</strong> — one honest word on how you felt entering and managing: calm, chasing, hesitant, bored.</li>" +
              "</ul>" +
              "<p>Format matters less than existence — whatever you'll actually keep up wins.</p>"
          },
          {
            code: "L11.2",
            title: "The weekly review (15 minutes)",
            html:
              "<p>Same time each week, ideally the weekend:</p>" +
              "<ol>" +
              "<li><strong>Total the week in R</strong> — one number.</li>" +
              "<li>Reread each trade's execution field and grade it <strong>A</strong> (followed the plan completely, whatever the outcome) or <strong>B</strong> (deviated: wrong size, late entry, missing stop, early close, moved stop).</li>" +
              "<li>Count the B trades and name each deviation. That's the whole diagnosis.</li>" +
              "<li>Write <strong>one sentence</strong> for next week, aimed at the most common deviation.</li>" +
              "</ol>" +
              '<div class="rb-box"><p>The review doesn\'t judge whether trades won. A losing week of all A trades is variance — nothing to fix. A winning week of B trades is a loan from luck, and it will be collected.</p></div>'
          },
          {
            code: "L11.3",
            title: "Finding your patterns",
            html:
              "<p>After three or four weeks the journal becomes a dataset. Classic patterns: fine in London, poor in dead-hours boredom trades; moved stops clustering on one instrument (usually gold — its speed causes the most fear); B trades on days the state says tired or annoyed; chased entries right after a missed winner.</p>" +
              "<p>Find them by sorting: group by <strong>session, instrument, A vs B, state</strong>, and compare the R total of each bucket. One bucket usually pays for another. The repair is rarely dramatic — usually <strong>stop trading the bucket that bleeds</strong>.</p>"
          },
          {
            code: "L11.4",
            title: "Why it's the fastest fix",
            html:
              "<p>Beginners lose through execution, sizing, stops and psychology — not analysis, which the signals already supply. So nearly every real problem lives in the gap between the plan and what you did, and the journal is the only thing that photographs that gap. Memory protects your self-image; the journal protects your account. After a losing week, pages of A trades are the receipt that the process held.</p>"
          },
          {
            code: "L11.5",
            title: "Their journal tool",
            html:
              "<p>Currency Squad has a journal in the portal (video tutorial there): post a chart screenshot per timeframe, enter the risk you placed, and it reads entry, symbol, timeframe, stop and result from the screenshots. On close it asks where your stop ended up (so trailed stops, reduced losses and breakevens are recorded truthfully). It reports win % overall and per instrument; results by day, month, session and time of entry; R milestone stats (how often trades reached 1R and beyond); separate scoring per account; and a <strong>paper trading</strong> category (post the idea before, the result after). It doesn't grade you — A/B and the state word stay your job.</p>"
          }
        ],
        mistakes: [
          "<strong>Journaling only losses.</strong> Winning B trades are the most dangerous entries in the book.",
          "<strong>Recording everything, reviewing nothing.</strong> An unreviewed journal is a scrapbook; the 15 weekly minutes are where the value is.",
          "<strong>Grading by outcome instead of execution.</strong> The market grades outcomes; you grade process.",
          "<strong>Quitting after missing a week.</strong> A journal with holes beats a memory with none."
        ],
        quiz: [
          { q: "One trade followed the plan perfectly and lost 1R; another broke the sizing rules and won 2R. Grade them.", a: "The first is an A (plan followed — the loss is variance). The second is a B (it deviated — the win was luck, and that habit will cost later)." },
          { q: "Why is the entry screenshot non-negotiable?", a: "In review it lets you see what the chart actually showed at entry, instead of what memory reconstructs afterwards." },
          { q: "+6R in London trades, −5R in trades tagged bored outside your window. The repair?", a: "Stop trading outside your window. Cutting the bleeding bucket costs nothing and needs no new skill." },
          { q: "What single number opens the weekly review, and why that unit?", a: "The week's total in R — comparable across weeks and account sizes, and free of the dollar emotions." }
        ],
        task: "Set up your journal today (theirs, or a spreadsheet with the four areas from L11.1). Enter your Module 10 practice trade in full: screenshot, planned R, outcome, execution grade and one state word. Then put a recurring 15-minute weekly review in your calendar for the weekend, and treat the first one as an appointment you can't miss.",
        vsRulebook: [
          "<strong>This journal vs theirs:</strong> your journal already logs the setup, entries, stop, TPs, result and account per trade, and has the Weekly Review tab. What AJ adds that it doesn't have yet: an <strong>A/B execution grade</strong>, a one-word <strong>state</strong>, results <strong>in R</strong>, and R totals by session / instrument / grade / state. I can add those to Log Trade and the Weekly Review if you want them.",
          "<strong>Review — AJ:</strong> weekly, judged on process (A vs B), not on whether trades won; one sentence for next week. <strong>Johnson Journal habit:</strong> weekly review with the PDF/Excel export and the loss protocol, judged mostly on results. Decide whether to add the A/B count to the weekly report.",
          "<strong>Paper trades:</strong> their journal has a paper-trading category; yours doesn't. Useful for logging AJ signals on Kudo while you're not trading that account yet."
        ]
      },
      {
        num: 12,
        title: "Psychology",
        tagline: "The opponent is in the chair. The gap between knowing and doing is psychology. Not about becoming emotionless — about a process that holds when emotions arrive, because they will.",
        lessons: [
          {
            code: "L12.1",
            title: "The four beginner killers",
            html:
              "<ul>" +
              "<li><strong>Revenge trading</strong> — a loss feels personal and the urge is to win it back now, usually bigger. The loss was 1R of planned cost; bigger means the drawdown table works against you at double speed. The fastest route from a normal losing day to a destroyed account — which is why the daily limit removes you before the feeling gets a vote.</li>" +
              "<li><strong>Overtrading</strong> — feels productive, like working hard. Every trade outside the plan is a fee to the spread and a withdrawal from attention. The journal exposes it: bloated trade count, pile of B grades, bored or restless state column. The market pays for waiting well and charges for activity.</li>" +
              "<li><strong>FOMO</strong> — the surge when price runs without you. A missed trade costs nothing; five instruments produce setups every week, forever. The only trades you can truly miss are the ones a blown account is no longer around to take.</li>" +
              "<li><strong>Fear of pulling the trigger</strong> — the hand hovers while the entry closes, usually after a losing streak. Same disease: single outcomes given emotional weight the maths never gave them. The repair is mechanical: when risk is truly small and the procedure is rehearsed, the trade is a routine action with a known worst case, and routine actions don't need courage.</li>" +
              "</ul>"
          },
          {
            code: "L12.2",
            title: "The problem is almost never your entries",
            html:
              "<p>Struggling beginners blame entries and switch strategies — and the results follow them, because the thing producing the results came along too. With sound risk-reward maths, entries only need to be adequate (L9.3). What turns adequate into disaster is execution: oversizing, moved stops, revenge sequences, chased entries — all visible as B grades, none fixed by a new strategy. Good news: you don't need to out-analyse the market, only to out-discipline yourself, and discipline is trainable.</p>"
          },
          {
            code: "L12.3",
            title: "Building a routine",
            html:
              "<p>Willpower drains and markets are always open; routine survives because it removes the decisions where feelings vote. Assembled from the course:</p>" +
              "<ul>" +
              "<li><strong>Weekly (Module 8)</strong> — calendar check: high-impact events in your time, noted before the week opens.</li>" +
              "<li><strong>Daily, before your window</strong> — 30 seconds of higher-timeframe context on the watchlist, today's news, and where you stand against your daily/weekly limits.</li>" +
              "<li><strong>Per signal (Module 10)</strong> — read, calculate, verify, place with SL and TP, journal the entry.</li>" +
              "<li><strong>Daily at close</strong> — journal trades, one state word, <strong>platforms shut at a defined time</strong>. A trading day needs an end.</li>" +
              "<li><strong>Weekly (Module 11)</strong> — the 15-minute review, in the calendar, non-negotiable.</li>" +
              "</ul>" +
              "<p>About 30 minutes a day around your window. On bad days the routine doesn't ask how you feel — just what's next on the list.</p>"
          },
          {
            code: "L12.4",
            title: "After a losing day, and after a winning day",
            html:
              "<p><strong>Losing day:</strong> if the limit was hit, you're done. Either way, journal honestly, grade, and check: were they A trades? A losing day of A trades needs nothing but a shrug — change absolutely nothing. If they were B trades, the deviations are the lesson, not the loss, and tomorrow's one sentence comes from them.</p>" +
              "<p><strong>Winning day:</strong> run the identical audit — winning days hide the sneakiest damage. A green day of B trades (oversized positions that worked, a moved stop that got away with it) is the market paying you to learn habits it will charge for later. Watch for the winner's temptations: sizing up because you're hot, and confidence that makes the next chased entry feel like skill.</p>" +
              '<div class="rb-box"><p>Same response to both days: journal, grade, close the platforms at the defined time. <strong>The account grows in the boring middle, not at the emotional edges.</strong></p></div>'
          }
        ],
        mistakes: [
          "<strong>Treating psychology as someone else's problem.</strong> The safeguards are for everyone — that's why they're rules, not suggestions.",
          "<strong>Fixing feelings with strategy changes.</strong> A new approach carries the same trader. Grade execution before blaming entries.",
          "<strong>Trading to feel something.</strong> Boredom is the quietest killer. If the routine says nothing is there, nothing is there.",
          "<strong>Abandoning the routine on good weeks.</strong> The routine is what stops good weeks from creating bad ones."
        ],
        quiz: [
          { q: "What single mistaken belief sits under revenge trading, FOMO and trigger fear?", a: "That a single trade's outcome matters a lot — giving one result emotional weight the maths never gave it. Over many trades at small risk, no single trade matters much." },
          { q: "A losing day where every trade was graded A. What changes tomorrow?", a: "Nothing. It's variance the maths already allows for; changing a sound process because of a red day is how sound processes get destroyed." },
          { q: "Why is a winning day of B trades the market paying you to learn bad habits?", a: "The deviations (oversizing, moved stops) got rewarded this time, which teaches you to repeat them — and they'll be charged back later with interest." },
          { q: "Why does routine beat willpower for discipline?", a: "Willpower drains and the market is always open; a routine removes the decisions where feelings get a vote, so it holds on bad days." }
        ],
        task: "Write your one-page daily routine in your own timezone: weekly calendar check slot, daily pre-window check, the per-signal procedure, your platform closing time, and the weekly review appointment. Add a section called \"My tells\" with one honest sentence for each of the four killers on how it shows up in you, using journal evidence where you have it. Keep it next to your Module 9 risk plan — together they're your operating manual.",
        vsRulebook: [
          "<strong>Your Psychology tab</strong> already has chapters (Trust the plan, The traps, Habits) from your own journal lessons. AJ's four killers and the routine could go in there as extra chapters — say if you want them added (you can also add them yourself with Edit).",
          "<strong>Number of trades — AJ:</strong> overtrading = trades outside the plan; caps on open positions and a defined platform-closing time. <strong>Rulebook:</strong> no limit on the number of trades; overtrading means trading without a valid setup. Similar idea, but AJ adds an end time to the day.",
          "<strong>Judging a day — AJ:</strong> by A/B execution, never by P/L. <strong>Johnson Journal loss protocol:</strong> reacts to drawdown (results). Both can run side by side: the protocol stops you, the grade tells you why."
        ]
      },
      {
        num: 13,
        title: "What Comes Next",
        tagline: "The road past the bootcamp: prop firms, an honest readiness check, and the concept everything depends on — the edge.",
        lessons: [
          {
            code: "L13.1",
            title: "Prop firms and evaluations",
            html:
              "<p>A prop firm lets you trade its capital for a share of profits (commonly around 80% to the trader), after you pass a paid <strong>evaluation</strong> on a demo account. Typical shape (varies by firm):</p>" +
              "<ul>" +
              "<li>A fee per attempt — under $100 to several hundred, scaling with account size.</li>" +
              "<li>One or two phases with a <strong>profit target</strong> — commonly 8–10% for phase 1, about 5% for phase 2.</li>" +
              "<li><strong>Max daily loss</strong> often ~5% and <strong>max overall drawdown</strong> often ~10%. Touch either, even for a second, and it's failed — fee gone.</li>" +
              "<li>Fine print: minimum trading days, news and weekend holding rules, consistency rules. The fine print fails more people than the targets — read all of it before paying.</li>" +
              "</ul>" +
              "<p>Pass → funded account with the same loss rules permanently, profit splits paid on a schedule. The bootcamp's daily limit and news-flat rule are exactly what firms enforce in software.</p>"
          },
          {
            code: "L13.2",
            title: "Realistic pass rates",
            html:
              "<p>Evaluations are designed so most attempts fail; published and disclosed figures suggest only a minority pass, and those who actually get a payout are fewer still — commonly estimated at <strong>one in ten or fewer</strong>. Treat any precise number with suspicion (including flattering ones in firm marketing); the shape isn't in dispute: the fee model works for the firms because failure is the normal outcome.</p>" +
              "<p>Why prepared traders still fail: the target and the loss limits pull against each other by design — reaching 8% quickly tempts oversizing, and oversizing meets the 5% daily rule; the pressure amplifies every Module 12 killer. <strong>An evaluation is a discipline exam with some analysis in it.</strong></p>"
          },
          {
            code: "L13.3",
            title: "When to attempt one — and when not",
            html:
              "<p>Only when every line is true, <strong>evidenced by your journal</strong>:</p>" +
              "<ul>" +
              "<li>At least <strong>three consecutive months of live trading</strong>, journaled, with overwhelmingly A-graded execution.</li>" +
              "<li><strong>Zero</strong> moved stops and <strong>zero</strong> revenge sequences in those months.</li>" +
              "<li>Daily and weekly limits respected every time they were hit.</li>" +
              "<li>You can state your own numbers: average R per trade, longest losing streak, worst week.</li>" +
              "<li>The fee is money you can lose without pain — tuition with a real chance of no refund.</li>" +
              "</ul>" +
              "<p><strong>Don't</strong> attempt one to escape a small account, while in drawdown, or because someone online passed. It'll still exist in three months.</p>"
          },
          {
            code: "L13.4",
            title: "The edge",
            html:
              "<p>An <strong>edge</strong> is a tested, repeatable process that, across a large sample of trades, wins more R than it loses — not a feeling, hot streak or secret indicator; a process with evidence. Module 9 showed the arithmetic; an edge is that arithmetic demonstrated in real results and kept honest by the journal.</p>" +
              "<p>Following signals with proper sizing is <strong>borrowing</strong> someone's edge while you build foundations. The foundations (execution, sizing, risk, journaling) are the platform an edge is built on, not the edge itself. Building your own means reading markets well enough to produce the analysis, testing it, and proving it in your own data — months of work.</p>"
          },
          {
            code: "L13.5",
            title: "Where to go from here (their recommendation)",
            html:
              "<p>Their route: keep executing signals with discipline, keep the journal running, and join the community and mentorship — live sessions, breakdowns of wins and losses, chart reviews, the <strong>Edge Bootcamp</strong> (a two-phase strategy programme), and for mentorship members 1:1 time with Joshua. The end of the module is a pitch for that, with a \"Book a call with Joshua\" button (or DM @moneyybagjoshua on Instagram).</p>" +
              "<p>Listed as inside the community: daily market updates, live trading sessions, strategy live sessions, student chart analysis, journaling guidance, the full 2-phase Edge Bootcamp, trade breakdowns, backtesting sessions, live Q&amp;A, lot size and risk help, 24-hour support. Their own note: nothing in trading is guaranteed, and it works for members who show up.</p>"
          }
        ],
        mistakes: [
          "<strong>Buying an evaluation as a graduation gift.</strong> Finishing the course starts the evidence period; the journal decides when you're ready.",
          "<strong>Firm shopping instead of skill building.</strong> The constraint is your execution record, not which firm.",
          "<strong>Skipping the fine print.</strong> News, weekend and consistency rules fail prepared traders daily.",
          "<strong>Stopping the journal after the bootcamp.</strong> It's the instrument that runs your career from here."
        ],
        quiz: [
          { q: "What does a prop firm evaluation actually test, and what's the evidence from how they're built?", a: "Discipline more than analysis: the tight daily-loss and drawdown rules instantly fail oversizing, moved stops and revenge trading, while the profit target tempts exactly those." },
          { q: "Why do the profit target and the daily loss limit pull against each other?", a: "Chasing the target quickly tempts bigger size, and bigger size is what breaches the daily loss limit." },
          { q: "Three items from the readiness checklist?", a: "Any three of: 3+ months of live, journaled trading with mostly A grades; zero moved stops and zero revenge sequences; limits respected every time; knowing your average R, longest losing streak and worst week; a fee you can lose without pain." },
          { q: "The honest way to hold pass-rate claims?", a: "Treat any precise figure with suspicion — from firms and critics alike — but accept the shape: most attempts fail, a minority pass, and fewer still get paid." },
          { q: "What is an edge, and how do you know you have one?", a: "A tested, repeatable process that wins more R than it loses over a large sample. You know from your own journal data over many trades — not from a feeling or a streak." }
        ],
        task: "Write an honest self-assessment against the L13.3 checklist, line by line, citing your journal where evidence exists and writing \"no evidence yet\" where it doesn't. Then set one dated milestone for the next 90 days that is entirely within your control — process, not profit (e.g. 90 days of journaled trades at a target A-grade rate, every weekly review done).",
        vsRulebook: [
          "<strong>Long-term plan — AJ:</strong> borrow their edge through signals, build your own (Edge Bootcamp / mentorship), possibly a prop firm once the journal proves readiness. <strong>Rulebook:</strong> scale your own accounts at higher risk now, then step risk down (5% → 2% → 1%) once income averages 5k–10k a month. Different roads; worth deciding which one you're on, or how they combine.",
          "<strong>Prop firm rules vs current risk:</strong> typical evaluations allow ~5% daily loss and ~10% total drawdown. The Rulebook's 20% per Callisto idea and 30% daily stop wouldn't survive one trade there. If prop firms are a goal, that needs a separate, lower-risk plan.",
          "<strong>Readiness:</strong> AJ wants 3 months of live, journaled, mostly-A trading first. Your journal already has the history (Callisto since you started); adding the A/B grade (Module 11) would let it answer that checklist directly.",
          "<strong>Note:</strong> the end of this module is a sales pitch for their paid community and 1:1 mentorship. The Edge Bootcamp you have access to is part of that."
        ]
      }
    ]
  },
  edge: {
    title: "Edge Bootcamp",
    unit: "Lesson",
    intro: "Currency Squad's strategy programme, taught by Joshua (MoneyybagJoshua) on video. Phase 1 is the methodology (19 lessons, about 1h), Phase 2 is live application (6 lessons, about 1h), Phase 3 (Education) is still to come. Written up lesson by lesson from the video transcripts.",
    phases: { 1: "The Methodology", 2: "Live Application", 3: "Education" },
    roadmap: [
      { num: 1, label: "1.1", phase: 1, title: "TradingView basics", length: "4:55" },
      { num: 2, label: "1.2", phase: 1, title: "Wicks and Candles", length: "2:05" },
      { num: 3, label: "1.3", phase: 1, title: "Trading sessions and how to use them", length: "2:17" },
      { num: 4, label: "1.4", phase: 1, title: "Understanding News", length: "1:31" },
      { num: 5, label: "1.5", phase: 1, title: "Market Structure pt 1", length: "2:30" },
      { num: 6, label: "1.6", phase: 1, title: "Market Structure pt 2", length: "1:41" },
      { num: 7, label: "1.7", phase: 1, title: "Market Structure pt 3", length: "2:30" },
      { num: 8, label: "1.8", phase: 1, title: "Supply & Demand", length: "6:41" },
      { num: 9, label: "1.9", phase: 1, title: "Imbalances", length: "2:11" },
      { num: 10, label: "1.10", phase: 1, title: "Support and Resistance pt 1", length: "3:19" },
      { num: 11, label: "1.11", phase: 1, title: "Support and Resistance pt 2", length: "2:39" },
      { num: 12, label: "1.12", phase: 1, title: "Trendlines", length: "5:52" },
      { num: 13, label: "1.13", phase: 1, title: "Fibonacci pt 1", length: "1:47" },
      { num: 14, label: "1.14", phase: 1, title: "Fibonacci pt 2", length: "1:18" },
      { num: 15, label: "1.15", phase: 1, title: "Liquidity and Liquidity Sweeps", length: "4:24" },
      { num: 16, label: "1.16", phase: 1, title: "LTF Liquidity Entry Model", length: "7:06" },
      { num: 17, label: "1.17", phase: 1, title: "GBPUSD Breakdown", length: "4:46" },
      { num: 18, label: "1.18", phase: 1, title: "Free Sauce Vol 1 — Local Liquidity pt 1", length: "3:12" },
      { num: 19, label: "1.19", phase: 1, title: "Free Sauce Vol 2 — Local Liquidity pt 2", length: "1:47" },
      { num: 20, label: "2.x", phase: 2, title: "Live Application — 6 lessons (titles to come)", length: "59m" },
      { num: 21, label: "3.x", phase: 3, title: "Education — coming soon" }
    ],
    modules: [
      {
        num: 1,
        label: "1.1",
        phase: 1,
        title: "TradingView basics",
        tagline: "4:55 video. How Joshua sets up TradingView so you can follow everything later in the course. Setup only — no trading rules yet.",
        lessons: [
          {
            code: "Setup",
            title: "Symbols and data feed",
            html:
              "<ul>" +
              "<li>Watchlist panel holds the symbols: NAS100, gold, silver, EURUSD, GBPUSD. Searching a symbol shows one result per data provider.</li>" +
              "<li>Joshua charts live on <strong>FXCM</strong>. When he backtests during a trading session he uses <strong>OANDA</strong> instead, so his live drawings don't get messed up.</li>" +
              "<li>Timeframes: star the ones you use and they sit on the top bar (the Beginner Bootcamp list was M5, M15, H1, H4, D).</li>" +
              "</ul>"
          },
          {
            code: "Setup",
            title: "Indicator and drawing tools",
            html:
              "<ul>" +
              "<li><strong>One indicator only: Trading Sessions</strong>, toggled on to see what happened in each session and off when not needed.</li>" +
              "<li>Favourite drawing tools: trend line, horizontal ray, vertical line, Fibonacci, long/short position, brush/highlighter, <strong>rectangle</strong> (for zones — his \"boxes\") and <strong>path</strong> (to sketch scenarios).</li>" +
              "</ul>"
          },
          {
            code: "Setup",
            title: "Chart settings and templates",
            html:
              "<ul>" +
              "<li>Clean canvas: solid background, <strong>no grid lines</strong> — he trades purely on the candles and wicks. Buy/sell buttons off, alerts on.</li>" +
              "<li>Save drawing templates (right-click → Template) so each type looks the same every time: zone boxes (e.g. supply / demand), a stop-loss line, a <strong>blue break-of-structure line</strong>, a liquidity line, and a 1:1 marker for when a trade reaches 1R. Colours are personal preference.</li>" +
              "<li><strong>Lines as thin as possible</strong>, so levels are pinpoint accurate.</li>" +
              "<li><strong>Marking a range:</strong> one highlighter dot at each end (e.g. a 15-minute or daily bearish range).</li>" +
              "</ul>" +
              '<div class="rb-box"><p><strong>Habit:</strong> at the start, map out structure and ranges yourself on the chart so you see how price is moving before doing anything else.</p></div>'
          }
        ],
        vsRulebook: [
          "<strong>Session indicator — AJ:</strong> TradingView's built-in Trading Sessions, the only indicator. <strong>Rulebook:</strong> KZP [TFO] kill zones (NY time). Same purpose — decide whether to keep KZP or switch.",
          "<strong>Data feed — AJ:</strong> FXCM for live charts, OANDA for backtesting. <strong>Beginner Bootcamp:</strong> chart your own broker's feed if listed. Your AvaTrade prices can differ from FXCM by a few pips on gold — worth deciding which feed you mark levels on.",
          "<strong>Indicator-free:</strong> both AJ and the Rulebook trade off price, with a session tool as the only add-on."
        ]
      },
      {
        num: 2,
        label: "1.2",
        phase: 1,
        title: "Wicks and Candles",
        tagline: "2:05 video. Basic, but the base for reading ranges and where price is coming into on each timeframe.",
        lessons: [
          {
            code: "Candles",
            title: "Body and wicks",
            html:
              "<ul>" +
              "<li>Colours are personal preference. Default is green bullish / red bearish; Joshua uses <strong>grey for bullish, blue for bearish</strong> — keep that in mind when reading his charts.</li>" +
              "<li>A candle is bullish or bearish by its colour and direction: bullish opened low and closed higher, bearish opened high and closed lower.</li>" +
              "<li><strong>Body</strong> = the open and close of the period.</li>" +
              "<li><strong>Wicks</strong> = how far price travelled during the period. On a daily candle, price went up to the top of the upper wick and down to the bottom of the lower wick at some point that day (the candle doesn't show when), then closed where the body ends.</li>" +
              "</ul>" +
              '<div class="rb-box"><p><strong>Why it matters:</strong> reading bodies and wicks is what the course uses to understand ranges and where price is coming into on the different timeframes.</p></div>'
          }
        ],
        vsRulebook: [
          "<strong>No differences yet.</strong> Same candle basics as the Rulebook. The Rulebook's rule that breaks count only on a body close (a wick through is a sweep, not a break) isn't covered here — watch for how Joshua treats wicks vs body closes in the Market Structure lessons (1.5–1.7)."
        ]
      },
      {
        num: 3,
        label: "1.3",
        phase: 1,
        title: "Trading sessions and how to use them",
        tagline: "2:17 video. When AJ and Joshua trade, and how they use the Asia session.",
        lessons: [
          {
            code: "Sessions",
            title: "Trade the London and New York opens",
            html:
              "<ul>" +
              "<li><strong>AJ and Joshua trade the London open and the New York open</strong> — that's where the volume is, far more than in Asia.</li>" +
              "<li>The <strong>biggest move usually comes in the first hour or two of London</strong>; New York usually gives a move of some sort too.</li>" +
              "<li>Entries can be found on any timeframe at any time, but <strong>pick your session and stick to a set routine around a market open</strong>, watching the charts in that window.</li>" +
              "</ul>" +
              "<p>In SA time (approximate, shifts an hour with UK/US clock changes): London opens around <strong>10:00</strong> in the northern winter (09:00 in summer); New York's forex open is around <strong>15:00</strong> and the US stock market open (which drives NAS100) around <strong>16:30</strong> in winter.</p>"
          },
          {
            code: "Asia",
            title: "Asia builds the liquidity",
            html:
              "<p>The Tokyo/Asia session has much less volume. They use it as a <strong>build-up of liquidity</strong>: within Asia they mark resistance levels, supply and demand levels and trendlines. When Asia rolls over into London, they <strong>use the liquidity built up in Asia to find their London entries</strong>.</p>"
          },
          {
            code: "Tool",
            title: "The sessions indicator",
            html:
              "<p>TradingView's \"Trading Sessions\" indicator shows the sessions on the chart. Joshua doesn't keep it on himself — he knows the times — but it's there if you want it. (In 1.1 he called it the only indicator he'd use.)</p>"
          }
        ],
        vsRulebook: [
          "<strong>When to trade — AJ:</strong> the London and New York opens, mainly the first 1–2 hours, and stick to one routine. <strong>Rulebook:</strong> no session limit; a valid setup gets taken. Nick's view is that London often ranges and New York brings the expansion; your KZP kill zones are London 09:00–12:00 and NY AM 16:30–18:00 SA time (from 2 Nov). Aaron only trades after 15:00.",
          "<strong>Asia — both</strong> treat the Asia session as liquidity for later sessions. <strong>AJ</strong> marks resistance, supply/demand and trendlines inside Asia; <strong>Rulebook</strong> marks the Asian high/low as a liquidity target or sweep level and no longer uses support/resistance.",
          "<strong>Routine:</strong> AJ wants a fixed routine around one open. That ties in with Beginner Bootcamp Module 8 (one trading window) and Module 12 (a defined end time for the day)."
        ]
      },
      {
        num: 4,
        label: "1.4",
        phase: 1,
        title: "Understanding News",
        tagline: "1:31 video. Why they avoid high-impact news at all costs.",
        lessons: [
          {
            code: "News",
            title: "Red folders: stay away",
            html:
              "<ul>" +
              "<li>Use <strong>Forex Factory</strong> with the time set to your own timezone to see exactly when each release is. <strong>Red folders are the ones to stay away from.</strong></li>" +
              "<li>Example shown: <strong>NFP on 3 July</strong>, released at 1:30 on his chart. Price spiked hard straight through the nearby lows.</li>" +
              "<li>If you were in a buy with your stop under that low, you wouldn't just be stopped out — you'd be <strong>slipped</strong>, and can end up losing <strong>two to three times your planned risk</strong>.</li>" +
              "<li>They don't go deep into fundamentals; the point is timing — <strong>avoid news at all costs</strong>.</li>" +
              "</ul>"
          }
        ],
        vsRulebook: [
          "<strong>News — AJ:</strong> avoid red-folder news at all costs (same as Beginner Bootcamp Module 8: be flat). <strong>Rulebook:</strong> check Forex Factory daily and expect spikes and slippage, but no rule to stay out. This is now the second time AJ's material makes it a rule — one of the decisions for the end.",
          "<strong>Slippage on a 20% idea:</strong> 2–3× slippage on a Callisto basket risked at 20% could mean a 40–60% loss in one news candle. Worth weighing when you decide."
        ]
      },
      {
        num: 5,
        label: "1.5",
        phase: 1,
        title: "Market Structure pt 1",
        tagline: "2:30 video. Direction and ranges: what structure is, what a break of structure means, and internal structure.",
        lessons: [
          {
            code: "Structure",
            title: "Bullish, bearish and the break of structure",
            html:
              "<ul>" +
              "<li><strong>Bullish structure:</strong> low → higher high → higher low → higher high… price stepping up.</li>" +
              "<li><strong>Bearish structure:</strong> price stepping its way down (lower highs, lower lows).</li>" +
              "<li><strong>Break of structure (his definition):</strong> in bullish structure, after a higher high and higher low, price makes a <strong>lower low</strong>. That point is the break of structure — the market has <strong>flipped the direction</strong> of the range you're in.</li>" +
              "<li>Always ask two things: <strong>what range am I in, and which direction is it going?</strong></li>" +
              "</ul>"
          },
          {
            code: "Timeframes",
            title: "Every timeframe has its own structure",
            html:
              "<p>A break of structure belongs to the timeframe it's on — on the daily it's a daily break of structure. Inside one day's move there are lots of smaller steps and smaller breaks of structure on every lower timeframe, and it can look very jagged.</p>" +
              "<p><strong>Internal structure:</strong> the structure inside a bigger timeframe's structure. If the main structure is daily, the internal structure sits inside it; on the 4H, the internal structure might be 1H or 15M. This carries across every timeframe (examples follow in pt 2–3).</p>"
          }
        ],
        vsRulebook: [
          "<strong>Terminology — important:</strong> Joshua calls the <em>first</em> break against the trend (a lower low after higher highs/lows) a <strong>break of structure</strong>. In the Rulebook that same event is a <strong>CHoCH</strong> (change of character), and BOS means a break <em>with</em> the trend (continuation). Same price event, different name — keep this in mind reading his charts and the later lessons.",
          "<strong>Body close vs wick — not said yet:</strong> the Rulebook only counts a break on a body candle close (a wick through is a sweep). Joshua hasn't said whether a wick counts; watch for it in pt 2–3.",
          "<strong>Internal structure:</strong> same idea as the Rulebook's internal/LTF structure and stacking timeframes (e.g. daily bias, 4H/1H internal moves)."
        ]
      },
      {
        num: 6,
        label: "1.6",
        phase: 1,
        title: "Market Structure pt 2",
        tagline: "1:41 video. A real gold example of a daily break of structure and the internal ranges inside it.",
        lessons: [
          {
            code: "Example",
            title: "Gold daily, then down the timeframes",
            html:
              "<ul>" +
              "<li><strong>Daily gold:</strong> price had been stepping down (lower highs, lower lows). Then it pushed above a lower high — the <strong>break of structure</strong> where daily turned bullish. After that: low → high → higher low → higher high once price pushed above the previous high.</li>" +
              "<li>The daily range is clear: the low and the high it's working between.</li>" +
              "<li><strong>4H:</strong> inside that daily range there are internal ranges and internal structure of their own. <strong>1H:</strong> more structure again, some similar to the higher timeframe. Down at the <strong>1M</strong> you see crazy amounts of ranges chopping around.</li>" +
              "</ul>" +
              '<div class="rb-box"><p><strong>The skill:</strong> know which direction the market is going on <em>each</em> timeframe, then use that to build your <strong>bias for an execution</strong>.</p></div>'
          }
        ],
        vsRulebook: [
          "<strong>Same top-down idea</strong> as the Rulebook's bias (Daily → 4H → 1H → 15M → LTF). The Rulebook adds a rule AJ hasn't stated yet: <strong>at least three timeframes aligned</strong> before taking a trade.",
          "<strong>Terminology:</strong> again \"break of structure\" here = the Rulebook's CHoCH (the flip from bearish to bullish)."
        ]
      },
      {
        num: 7,
        label: "1.7",
        phase: 1,
        title: "Market Structure pt 3",
        tagline: "2:30 video. GBPUSD example: how a break of structure defines the range you're in, and stepping down the timeframes when one isn't clean.",
        lessons: [
          {
            code: "Range",
            title: "The break sets the range",
            html:
              "<ul>" +
              "<li><strong>GBPUSD 1H:</strong> price stepped up (higher highs, higher lows), then made a <strong>lower low</strong> below the last low — the break of structure.</li>" +
              "<li>Now the <strong>range is the last high to the new low</strong>, and it's <strong>bearish</strong>, because that high hasn't been broken. It stays the range until one end breaks.</li>" +
              "<li>Price plays out inside that range. If it doesn't look clean on that timeframe, <strong>you can't really use it there — step down</strong>.</li>" +
              "</ul>"
          },
          {
            code: "Step down",
            title: "15M and 5M inside the range",
            html:
              "<ul>" +
              "<li><strong>15M:</strong> clearer ranges. Price came up, pulled back, made another high, pulled back, <strong>failed to break that high</strong>, then broke to the downside (15M break of structure) and stepped down — now pushing back up again. The 15M range runs from its low to its high, with its break of structure marked.</li>" +
              "<li><strong>5M:</strong> more internal structure again inside that 15M area.</li>" +
              "<li>Each step down gives more and more ranges inside the bigger one.</li>" +
              "</ul>"
          }
        ],
        vsRulebook: [
          "<strong>Range logic matches:</strong> a range stays bearish until its high is broken — same as the Rulebook's structure read (bias holds until the opposite swing breaks).",
          "<strong>Messy timeframe — AJ:</strong> if it isn't clean, drop to a lower timeframe and use that. <strong>Rulebook:</strong> stacks all the timeframes and wants three aligned; in a weak/messy structure it expects a deeper pullback. Slightly different handling of unclear charts.",
          "<strong>Still open after all three structure lessons:</strong> whether a wick beyond the level counts as a break, or only a body close (Rulebook: body close only). Joshua's examples don't say. Worth asking in their community if it isn't answered later."
        ]
      },
      {
        num: 8,
        label: "1.8",
        phase: 1,
        title: "Supply & Demand",
        tagline: "6:41 video. Supply and demand is other traders' strategy. AJ and Joshua use it to see where those traders enter — and often to trade against them.",
        lessons: [
          {
            code: "Idea",
            title: "Someone else's strategy, used as information",
            html:
              "<p>Supply and demand is a strategy in itself, but <strong>not theirs</strong>. Other traders use it to enter; AJ and Joshua use it to understand <strong>where those traders will enter the market</strong>, as one factor in their analysis — and often to <strong>go against them</strong>.</p>"
          },
          {
            code: "Zones",
            title: "What a demand and supply zone is",
            html:
              "<ul>" +
              "<li>Structure goes push up → retracement → push up. A <strong>demand zone</strong> is where price <strong>slows down right before an imbalance</strong> is created and price pushes up (see 1.9 Imbalances). A <strong>supply zone</strong> is the same in reverse.</li>" +
              "<li>In a bullish trend, S&amp;D traders see the demand zone as the last point price can come back to before continuing up. Price often does react there and continue — <strong>but not always</strong>.</li>" +
              "<li>If there's <strong>more liquidity underneath</strong> (needed to break structure), the market will gravitate to that instead.</li>" +
              "<li>Either way it's an area where price slows down and a lot of people get in — useful to know.</li>" +
              "<li>Every timeframe has them: 4H supply and demand, 1H supply and demand, and so on.</li>" +
              "</ul>"
          },
          {
            code: "Examples",
            title: "Where it works — and where it traps people",
            html:
              "<ul>" +
              "<li><strong>4H demand:</strong> price slowed (a battle between buyers and sellers, visible on lower timeframes) before a big push up, then later came back into it.</li>" +
              "<li><strong>4H supply:</strong> price returned and had a perfect reaction down — the strategy worked for sellers that time.</li>" +
              "<li><strong>15M:</strong> after a 5M break of structure down, price crept back up into a supply and continued down; later it left a demand zone, came back, respected it, and continued higher once bullish.</li>" +
              "<li><strong>The trap:</strong> a 4H demand trader waits for price to reach the lowest point of the bullish range, sees 15M internal breaks of structure up, and buys. Price breaks up a little — then comes back down and <strong>takes out everyone who got in there</strong>.</li>" +
              "</ul>" +
              '<div class="rb-box"><p><strong>Their point:</strong> combine this with where the bigger liquidity is. Seeing S&amp;D traders enter can be the reason to trade against them. The full top-down analysis later shows how.</p></div>'
          }
        ],
        vsRulebook: [
          "<strong>Zones — Rulebook:</strong> order blocks (last opposite candle before an impulse that breaks structure, ideally with a sweep, FVG, inducement or HTF alignment) are POIs you <em>enter from</em> after a LTF confirmation. <strong>AJ:</strong> similar zones, but treated as where <em>other</em> traders enter — information, and often a place to fade.",
          "<strong>The trap example is close to a Rulebook entry:</strong> HTF demand/OB in the discount of a bullish range + LTF break up = the Rulebook's POI-plus-CHoCH entry. AJ's point is that it fails when bigger liquidity sits underneath. The Rulebook guards against this with \"liquidity swept first\" and inducement as OB criteria, and Nick's \"sweep then shift\" model. Worth comparing once AJ's entry model (1.16) is in.",
          "<strong>Liquidity first:</strong> both say price is drawn to liquidity — the Rulebook targets it and wants a sweep before entry; AJ uses it to decide whether a zone will hold."
        ]
      }
    ]
  }
};
