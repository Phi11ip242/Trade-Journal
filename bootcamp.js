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
