(function(){
  "use strict";

  // Your Supabase project and the journal's name live in config.js, so
  // that is the only file you edit when you set the site up. The
  // publishable key is meant to be public: Row Level Security in the
  // database only lets the signed-in owner read or write their own rows.
  var CONFIG = (typeof window !== "undefined" && window.JOURNAL_CONFIG) || {};
  var SUPABASE_URL = String(CONFIG.supabaseUrl || "");
  var SUPABASE_KEY = String(CONFIG.supabaseKey || "");
  var APP_NAME = String(CONFIG.appName || "Trade Journal");
  var CONFIGURED = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(SUPABASE_URL) && SUPABASE_KEY.length > 20;

  var SESSIONS = ["Asia", "London", "New York"];
  var DIRECTIONS = ["Buy", "Sell"];
  var SOURCES = ["Signal", "Own Trade"];
  var DEFAULT_ACCOUNTS = [
    { id: "acc-ava", name: "AvaTrade", startingDeposit: 1000, adjustment: 0 },
    { id: "acc-kudo", name: "Kudo", startingDeposit: 300, adjustment: 0 }
  ];
  // risk = % of the account per idea when following that provider;
  // stop = their usual stop in pips from the worst entry (0 = the plan stop).
  var DEFAULT_PROVIDERS = [
    { id: "prov-aj", name: "AJ", risk: 5, stop: 100 },
    { id: "prov-aaron", name: "Aaron", risk: 20, stop: 120 },
    { id: "prov-thomas", name: "Thomas", risk: 20, stop: 100 },
    { id: "prov-nick", name: "Nick", risk: 20, stop: 100 }
  ];
  var NO_PROVIDER = "Signal (no provider)";
  var BIASES = ["Bullish", "Bearish", "Ranging"];
  var BIAS_FRAMES = [["daily", "Daily"], ["h4", "4H"], ["h1", "1H"], ["m15", "15M"]];
  // Risk per idea by source, % of balance: the most the sizer allows.
  // 20% per idea is the hard cap, whatever the source.
  var MAX_IDEA_RISK = 20;
  var SOURCE_RISK = {
    "Signal":    { def: 5, max: MAX_IDEA_RISK },
    "Own Trade": { def: 5, max: MAX_IDEA_RISK }
  };
  // Any other type stored on a trade (TP6, TP7, ...) is kept and shown too.
  var CLOSE_TYPES = ["TP", "TP1", "TP2", "TP3", "TP4", "TP5", "Full TP", "Partial", "BE", "SL", "Force Close"];

  // Used when a trade's pair isn't in the Settings pair list, so a calc
  // never comes out as NaN.
  var FALLBACK_PIP_SIZE = 0.1;
  var FALLBACK_USD_PER_PIP = 10;

  // Split entries: same date/pair/direction/source and entries closer than
  // this many pips (of that pair's pip size — 8.00 on gold) are one idea.
  var IDEA_ENTRY_GAP_PIPS = 80;

  // Position sizing (Position Sizing tab). Risk is % of the balance for the
  // WHOLE idea (all entries together). Trades are planned to a fixed
  // reward:risk: take profit at `rr` × the stop, stop to breakeven once
  // price is `beAt` × the stop in profit.
  var SIZING_DEFAULTS = {
    signal: 5,      // Signal risk % per idea
    own: 5,         // Own Trade risk % per idea
    rr: 1.5,        // take-profit target, in R (multiples of the stop)
    beAt: 1,        // move the stop to breakeven at this many R
    layer: 25       // pips between layered entries (3-entry plan)
  };
  var SIZING_RISK_KEYS = ["signal", "own"];
  var SIZING_LIMITS = {
    signal: [0.1, MAX_IDEA_RISK], own: [0.1, MAX_IDEA_RISK],
    rr: [0.5, 10], beAt: [0.25, 5], layer: [5, 50]
  };
  var LAST_LEG_MIN_STOP = 30;       // a layered entry must stay at least this far from the stop

  // Milestones unlock by themselves from the trades — no targets, no
  // deadlines. Amounts in USD.
  var MILESTONES = {
    day:     [500, 1000, 2000, 5000, 10000, 20000],
    week:    [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000],
    month:   [5000, 10000, 20000, 50000, 100000, 200000, 400000],
    balance: [5000, 10000, 20000, 30000, 50000, 100000, 250000, 500000, 1000000]
  };
  // Streaks: an idea within this many dollars of 0 is breakeven and neither
  // extends nor breaks a win or loss streak.
  var STREAK_BE_USD = 1;

  // ---------- small helpers ----------
  function round2(v){ return Math.round((v + Number.EPSILON) * 100) / 100; }

  // A 0..1 rate as a percent, rounded once to 1 decimal (6/13 -> 46.2).
  // Every percent shown or exported goes through this, never round2 first.
  function pct1(rate){ return Math.round(Math.round(rate * 1e7) / 1e4) / 10; }

  // Strips binary float noise (15.000000000000002 -> 15) so threshold checks
  // like "stop > 100 pips" behave the way the numbers read.
  function clean(v){ return Math.round(v * 1e6) / 1e6; }

  // Finite number or null. Empty strings and junk become null, never NaN.
  function num(v){
    if(v === null || v === undefined || v === "") return null;
    var n = typeof v === "number" ? v : parseFloat(v);
    return isFinite(n) ? n : null;
  }

  function str(v){ return (v === null || v === undefined) ? "" : String(v); }

  function fmtDateLocal(d){
    var m = String(d.getMonth()+1).padStart(2,"0");
    var day = String(d.getDate()).padStart(2,"0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function todayStr(){ return fmtDateLocal(new Date()); }

  // Monday-Sunday range containing the given date, as local YYYY-MM-DD strings.
  function getWeekRange(d){
    var day = d.getDay(); // 0 = Sunday .. 6 = Saturday
    var diffToMonday = day === 0 ? -6 : 1 - day;
    var monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday);
    var sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return { start: fmtDateLocal(monday), end: fmtDateLocal(sunday) };
  }

  function makeId(){
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  // ---------- starter Rulebook + Psychology ----------
  // Edited in the app (Edit button on each tab) and saved with the settings.
  // Body text: "- " bullets, "1. " numbered steps, "## " sub-headings,
  // "> " a note, **bold**, and a blank line between paragraphs.
  var DEFAULT_BOOKS = {
    rulebook: [
      { title: "How I trade", body:
        "Write the strategy here as you learn it. Keep only the latest version of each rule — when a rule changes, edit it in place.\n\n" +
        "> The rules decide the trade, not the feeling." },
      { title: "Pre-trade checklist", body:
        "1. **Bias** decided on the higher timeframes before looking for an entry.\n" +
        "2. **Setup** — a valid entry by the rules. No setup, no trade.\n" +
        "3. **Reward:risk** — the target is at least **1.5×** the stop. If it isn't, skip it.\n" +
        "4. **Stop** beyond structure, no more than the plan stop (Position Sizing).\n" +
        "5. **Size** checked on the Position Sizing tab before the order goes in.\n" +
        "6. **News** — no red-folder release about to hit." },
      { title: "Trade management", body:
        "- **Take profit at 1.5R** — 1.5 × the stop distance from the entry.\n" +
        "- **Stop to breakeven at 1R** — once price is one stop-distance in profit. Then leave it: no trailing, no hovering.\n" +
        "- Set and forget: enter knowing you're OK losing that money, then let the plan run.\n" +
        "- The Log Trade form shows the breakeven and take-profit prices as soon as entry and stop are in." },
      { title: "Risk", body:
        "- **Signals:** 5% of the balance per idea.\n" +
        "- **Own trades:** 5% per idea while testing.\n" +
        "- **Hard cap: 20% per idea**, whether it's 1 entry or several.\n" +
        "- Size from the current balance, never fixed lots. Don't size up after a couple of wins.\n" +
        "- Max drawdown from the peak (Settings) = stop and review." },
      { title: "Loss protocol", body:
        "- An own trade that hits the full stop = done with own trades for the day. Signals are still allowed.\n" +
        "- After any loss, keep the **same lot size** for the next 2 ideas. If both win, back to the normal risk.\n" +
        "- A second loss inside those 2 ideas = **half risk** and done for the day. Back to full after 2 winning ideas." },
      { title: "Signals", body:
        "- Take the signal as posted: same entry, stop and target.\n" +
        "- Missed the entry? Skip it — no chasing a signal that has already run.\n" +
        "- Log every signal you take as **Signal**, so its real results show up on the Dashboard." },
      { title: "News", body:
        "- Check forexfactory.com every day for red-folder events.\n" +
        "- Big movers: interest rates / FOMC, CPI, NFP, GDP, PCE, central-bank speeches.\n" +
        "- Expect spikes and slippage straight after a release." }
    ],
    psychology: [
      { title: "Trust the plan", body:
        "- **Judge the day by whether you followed the plan, not by the profit.** Following the plan and losing is a good day. Gambling and winning is not.\n" +
        "- All plans lose sometimes. Losses are data.\n" +
        "- Same entries, same risk, same stops, same management — every time. Boring is the goal.\n" +
        "- Confidence comes from reps. The journal is the evidence.\n" +
        "- Goals are milestones, not deadlines. Time pressure makes you chase." },
      { title: "The traps", body:
        "- **Revenge trading** — \"one more trade will win it back\" is how one loss becomes three.\n" +
        "- **Covering a trade** — never open the opposite trade to hedge one you're scared of. Trust it or close it.\n" +
        "- **FOMO / late entries** — a missed entry is a missed entry.\n" +
        "- **Profit chasing** — jumping in early on a weak setup for a \"better\" price.\n" +
        "- **Fearing out** — closing a valid trade because it pulls back. The stop is the plan.\n" +
        "- **Breakeven too early** — before 1R you get tapped out right before the move.\n" +
        "- **Fiddling with the stop** — once it's at breakeven, leave it.\n" +
        "- **Panic closes** — usually a sign the position was too big. Size so you can sit through the full stop.\n" +
        "- **Sizing up after wins** — two wins, bigger lots, one loss and you're net down." },
      { title: "Habits", body:
        "- Check the lot size before every entry.\n" +
        "- Stop loss in with the order — never \"I'll add it in a second\".\n" +
        "- Write the plan and the emotion in the journal for every trade.\n" +
        "- Read this tab once a week and mark it as read." }
    ]
  };
  function defaultBook(kind){
    return DEFAULT_BOOKS[kind].map(function(c, i){ return { id: kind + "-" + (i + 1), title: c.title, body: c.body }; });
  }

  // ---------- settings + trade shapes ----------
  function defaultSettings(){
    return {
      // Each broker account keeps its own money: starting deposit, an
      // adjustment for money in/out before the ledger, and its own
      // deposits/withdrawals (cashFlows carry the account id).
      accounts: DEFAULT_ACCOUNTS.map(function(a){ return Object.assign({}, a); }),
      // Who called a Signal trade, with the risk % per idea for their signals.
      providers: DEFAULT_PROVIDERS.map(function(p){ return Object.assign({}, p); }),
      // Kept for the account views (filled per account by viewSettings).
      startingDeposit: 0,
      depositsWithdrawals: 0,
      defaultStop: 100,        // pips — the plan / max stop
      maxDrawdown: 30,         // %
      pairs: [{ pair: "XAUUSD", pipSize: FALLBACK_PIP_SIZE, usdPerPip: FALLBACK_USD_PER_PIP }],
      sizing: Object.assign({}, SIZING_DEFAULTS),
      // Rulebook and Psychology chapters, edited in the app.
      rulebook: defaultBook("rulebook"),
      psychology: defaultBook("psychology"),
      psychReadAt: ""          // last time the Psychology tab was marked as read
    };
  }

  // Max drawdown must be above 0 and at most 100; the plan stop must be
  // above 0. The two money fields take any number.
  function settingValid(key, n){
    if(key === "maxDrawdown") return n > 0 && n <= 100;
    if(key === "defaultStop") return n > 0 && n <= 1000;
    return true;
  }

  // Copies every field of `obj` that isn't in `known`, untouched — so data
  // this version doesn't use (overDailyLimit, ui, ...) survives a save.
  function extraFields(obj, known){
    var out = {};
    if(obj && typeof obj === "object" && !Array.isArray(obj)){
      Object.keys(obj).forEach(function(k){
        if(known.indexOf(k) === -1) out[k] = obj[k];
      });
    }
    return out;
  }

  var SETTINGS_KEYS = ["accounts", "providers", "startingDeposit", "depositsWithdrawals", "defaultStop", "maxDrawdown",
    "pairs", "cashFlows", "sizing", "rulebook", "psychology", "psychReadAt"];

  function normalizeSizing(v){
    v = (v && typeof v === "object") ? v : {};
    var out = Object.assign({}, SIZING_DEFAULTS);
    Object.keys(SIZING_DEFAULTS).forEach(function(k){
      var n = num(v[k]), lim = SIZING_LIMITS[k];
      if(n !== null && n >= lim[0] && n <= lim[1]) out[k] = n;
    });
    return out;
  }
  function sizingValid(key, n){
    var lim = SIZING_LIMITS[key];
    return !!lim && n !== null && n >= lim[0] && n <= lim[1];
  }

  // ---- deposits / withdrawals ledger ----
  // Dated money in or out of the account. Not trading P/L: they move the
  // balance but never count toward P/L, win rate or ROI. Saved entries are
  // locked; they can only be changed after an explicit unlock.
  var FLOW_KEYS = ["id", "account", "date", "type", "amount", "note", "createdAt"];
  function normalizeFlow(f){
    f = (f && typeof f === "object") ? f : {};
    var amount = num(f.amount);
    var createdAt = num(f.createdAt);
    return Object.assign(extraFields(f, FLOW_KEYS), {
      id: str(f.id) || makeId(),
      account: str(f.account),
      date: str(f.date),
      type: f.type === "withdrawal" ? "withdrawal" : "deposit",
      amount: amount !== null ? Math.abs(amount) : 0,
      note: str(f.note),
      createdAt: createdAt === null ? Date.now() : createdAt
    });
  }
  // Signed amount: deposits add, withdrawals take away.
  function flowAmount(f){ return f.type === "withdrawal" ? -f.amount : f.amount; }
  function sortedFlows(settings){
    return (settings.cashFlows || []).slice().sort(function(a, b){
      return a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt;
    });
  }

  // A book (Rulebook / Psychology) is a list of chapters: { id, title, body }.
  // An empty or broken list falls back to null (and the default is kept).
  function normalizeBook(v){
    if(!Array.isArray(v)) return null;
    return v.filter(function(c){ return c && typeof c === "object"; }).map(function(c){
      return { id: str(c.id) || makeId(), title: str(c.title), body: str(c.body) };
    });
  }

  function normalizeSettings(s){
    s = (s && typeof s === "object") ? s : {};
    var d = Object.assign(extraFields(s, SETTINGS_KEYS), defaultSettings());
    ["startingDeposit", "depositsWithdrawals", "defaultStop", "maxDrawdown"].forEach(function(k){
      var n = num(s[k]);
      if(n !== null && settingValid(k, n)) d[k] = n;
    });
    ["rulebook", "psychology"].forEach(function(k){
      var book = normalizeBook(s[k]);
      if(book) d[k] = book;
    });
    d.psychReadAt = /^\d{4}-\d{2}-\d{2}$/.test(str(s.psychReadAt)) ? str(s.psychReadAt) : "";
    d.sizing = normalizeSizing(s.sizing);
    d.cashFlows = Array.isArray(s.cashFlows) ? s.cashFlows.map(normalizeFlow).filter(function(f){ return f.date && f.amount > 0; }) : [];

    // Accounts. Settings saved before accounts existed had one deposit for
    // the whole journal: that becomes a single "Main account" to rename.
    var accounts = Array.isArray(s.accounts) ? s.accounts.filter(function(a){ return a && typeof a === "object"; }).map(function(a){
      var dep = num(a.startingDeposit), adj = num(a.adjustment);
      return { id: str(a.id) || makeId(), name: str(a.name).trim() || "Account",
        startingDeposit: dep === null ? 0 : dep, adjustment: adj === null ? 0 : adj };
    }) : [];
    if(!accounts.length && !Array.isArray(s.accounts) && (num(s.startingDeposit) !== null || Array.isArray(s.cashFlows))){
      var oldDep = num(s.startingDeposit), oldAdj = num(s.depositsWithdrawals);
      accounts = [{ id: "acc-1", name: "Main account", startingDeposit: oldDep === null ? 1000 : oldDep, adjustment: oldAdj === null ? 0 : oldAdj }];
    }
    if(accounts.length) d.accounts = accounts;
    var accIds = d.accounts.map(function(a){ return a.id; });
    d.cashFlows.forEach(function(f){ if(accIds.indexOf(f.account) === -1) f.account = accIds[0]; });

    // Providers.
    if(Array.isArray(s.providers)){
      d.providers = s.providers.filter(function(v){ return v && typeof v === "object" && str(v.name).trim(); }).map(function(v){
        var r = num(v.risk), st = num(v.stop);
        return { id: str(v.id) || makeId(), name: str(v.name).trim(),
          risk: r !== null && r >= SIZING_LIMITS.signal[0] && r <= SIZING_LIMITS.signal[1] ? r : SIZING_DEFAULTS.signal,
          stop: st !== null && st > 0 && st <= 1000 ? st : 0 };
      });
    }
    d.startingDeposit = 0;
    d.depositsWithdrawals = 0;
    if(Array.isArray(s.pairs)){
      var pairs = s.pairs.map(function(p){
        p = p || {};
        var size = num(p.pipSize), usd = num(p.usdPerPip);
        return Object.assign(extraFields(p, ["pair", "pipSize", "usdPerPip"]), {
          pair: str(p.pair).trim(),
          pipSize: size !== null && size > 0 ? size : FALLBACK_PIP_SIZE,
          usdPerPip: usd !== null && usd > 0 ? usd : FALLBACK_USD_PER_PIP
        });
      }).filter(function(p){ return p.pair !== ""; });
      if(pairs.length) d.pairs = pairs;
    }
    return d;
  }

  // Cleans the fields in the trade model and keeps any other stored field
  // exactly as it is (mfePrice from before MFE was dropped, overDailyLimit,
  // status). Anything derived (pips, P/L, idea, balance) is recalculated on
  // render and never stored.
  var TRADE_KEYS = ["id", "createdAt", "updatedAt", "date", "session", "pair", "direction", "source", "account", "provider", "bias",
    "confirmation", "entry", "stopLoss", "closes", "lesson"];
  var STATUSES = ["Open", "Closed"];

  function normalizeTrade(t){
    t = (t && typeof t === "object") ? t : {};
    var bias = (t.bias && typeof t.bias === "object") ? t.bias : {};
    var createdAt = num(t.createdAt);
    if(createdAt === null) createdAt = Date.now();
    var updatedAt = num(t.updatedAt);
    return Object.assign(extraFields(t, TRADE_KEYS), {
      id: str(t.id) || makeId(),
      createdAt: createdAt,
      updatedAt: updatedAt === null ? createdAt : updatedAt,
      date: str(t.date),
      session: str(t.session),
      pair: str(t.pair),
      direction: t.direction === "Sell" ? "Sell" : "Buy",
      source: str(t.source),
      account: str(t.account),
      provider: t.source === "Signal" ? str(t.provider) : "",
      bias: Object.assign(extraFields(bias, ["daily", "h4", "h1", "m15"]), {
        daily: str(bias.daily),
        h4: str(bias.h4),
        h1: str(bias.h1),
        m15: str(bias.m15)
      }),
      confirmation: str(t.confirmation),
      entry: num(t.entry),
      stopLoss: num(t.stopLoss),
      closes: (Array.isArray(t.closes) ? t.closes : []).map(function(c){
        c = c || {};
        return Object.assign(extraFields(c, ["type", "price", "lots"]), { type: str(c.type), price: num(c.price), lots: num(c.lots) });
      }),
      lesson: str(t.lesson)
    });
  }

  // ---------- pure calculations ----------
  // Digits after the point in a number as written: 0.1 -> 1, 0.0001 -> 4.
  function decimalsOf(n){
    var parts = String(n).split("e-");
    var dot = parts[0].indexOf(".");
    var digits = dot === -1 ? 0 : parts[0].length - dot - 1;
    return digits + (parts[1] ? parseInt(parts[1], 10) : 0);
  }

  // Prices show one decimal more than the pip size: 2 for XAUUSD (0.1),
  // 5 for EURUSD (0.0001).
  function specFor(pipSize, usdPerPip){
    return { pipSize: pipSize, usdPerPip: usdPerPip, priceDp: decimalsOf(pipSize) + 1 };
  }

  function pairSpec(settings, pair){
    var list = (settings && Array.isArray(settings.pairs)) ? settings.pairs : [];
    for(var i = 0; i < list.length; i++){
      if(list[i] && list[i].pair === pair){
        var size = num(list[i].pipSize), usd = num(list[i].usdPerPip);
        return specFor(
          size !== null && size > 0 ? size : FALLBACK_PIP_SIZE,
          usd !== null && usd > 0 ? usd : FALLBACK_USD_PER_PIP
        );
      }
    }
    return specFor(FALLBACK_PIP_SIZE, FALLBACK_USD_PER_PIP);
  }

  function dirSign(direction){ return direction === "Buy" ? 1 : -1; }

  // pips(price) = (price − entry) / pipSize × dir. Null if either price is missing.
  function pips(direction, entry, price, pipSize){
    entry = num(entry); price = num(price);
    if(entry === null || price === null) return null;
    return clean((price - entry) / pipSize * dirSign(direction));
  }

  function closePL(pipCount, lots, usdPerPip){
    lots = num(lots);
    if(pipCount === null || lots === null) return null;
    return pipCount * lots * usdPerPip;
  }

  // Everything derivable from one trade on its own.
  function tradeCalc(t, settings){
    var spec = pairSpec(settings, t.pair);
    var sum = 0, lots = 0;
    var closes = (t.closes || []).map(function(c){
      var p = pips(t.direction, t.entry, c.price, spec.pipSize);
      var pl = closePL(p, c.lots, spec.usdPerPip);
      if(pl !== null) sum += pl;
      lots += num(c.lots) || 0;
      return { type: c.type, price: c.price, lots: c.lots, pips: p, pl: pl === null ? null : round2(pl) };
    });
    // Trades saved before the Open/Closed status existed have none: they are
    // Open until they have a close, as before.
    var isOpen = t.status === "Open" || closes.length === 0;
    var slPips = pips(t.direction, t.entry, t.stopLoss, spec.pipSize);
    var stopDistance = slPips === null ? null : Math.abs(slPips);
    // What the trade risked if the full position had hit the stop. Only
    // known once it's closed (the closed lots are the position size) and
    // only for a stop on the losing side of the entry.
    var risk = (!isOpen && slPips !== null && slPips < 0 && lots > 0) ? round2(clean(lots) * stopDistance * spec.usdPerPip) : null;
    var pl = isOpen ? null : round2(sum);
    return {
      spec: spec,
      isOpen: isOpen,
      closes: closes,
      lots: clean(lots),
      pl: pl,
      slPips: slPips,
      stopDistance: stopDistance,
      risk: risk,
      r: (risk !== null && risk > 0) ? clean(pl / risk) : null
    };
  }

  // ---------- accounts + providers ----------
  // A trade with no account (logged before accounts existed) or an account
  // that was removed belongs to the first account.
  function accountIdOf(t, settings){
    var list = settings.accounts || [];
    for(var i = 0; i < list.length; i++) if(list[i].id === t.account) return t.account;
    return list.length ? list[0].id : "";
  }
  function accountById(settings, id){
    return (settings.accounts || []).filter(function(a){ return a.id === id; })[0] || null;
  }
  function providerById(settings, id){
    return (settings.providers || []).filter(function(p){ return p.id === id; })[0] || null;
  }
  // Who the trade's idea came from: a provider's name, "Own Trade", or
  // NO_PROVIDER for a Signal trade nobody is credited with.
  function whoOf(t, settings){
    if(t.source === "Own Trade") return "Own Trade";
    var p = providerById(settings, t.provider);
    return p ? p.name : NO_PROVIDER;
  }
  // The filter used on every tab: "" = everything, "Signal" = every signal
  // trade, otherwise one provider's name or "Own Trade".
  function matchWho(source, who, f){
    if(!f) return true;
    if(f === "Signal") return source === "Signal";
    return who === f;
  }
  function whoOptions(settings){
    return [{ value: "Signal", label: "All signals" }]
      .concat((settings.providers || []).map(function(p){ return { value: p.name, label: p.name }; }))
      .concat([{ value: NO_PROVIDER, label: NO_PROVIDER }, { value: "Own Trade", label: "Own Trade" }]);
  }
  // Settings narrowed to one account ("" = every account added together):
  // its starting money and its deposits/withdrawals. The rest is shared.
  function viewSettings(settings, accountId){
    var list = (settings.accounts || []).filter(function(a){ return !accountId || a.id === accountId; });
    return Object.assign({}, settings, {
      startingDeposit: round2(sum(list.map(function(a){ return a.startingDeposit; }))),
      depositsWithdrawals: round2(sum(list.map(function(a){ return a.adjustment; }))),
      cashFlows: (settings.cashFlows || []).filter(function(f){ return !accountId || f.account === accountId; })
    });
  }
  function viewTrades(trades, settings, accountId){
    return accountId ? trades.filter(function(t){ return accountIdOf(t, settings) === accountId; }) : trades;
  }

  function sortChronological(trades){
    return trades.slice().sort(function(a, b){
      if(a.date !== b.date) return a.date < b.date ? -1 : 1;
      if(a.createdAt !== b.createdAt) return (a.createdAt || 0) - (b.createdAt || 0);
      return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
    });
  }

  // The gap is compared in price units (80 × 0.1 is exactly 8), so gold
  // groups exactly as it did with the old fixed gap of 8.
  function sameIdea(prev, t, settings){
    if(!prev) return false;
    var a = num(prev.entry), b = num(t.entry);
    if(a === null || b === null) return false;
    return prev.date === t.date &&
      prev.pair === t.pair &&
      prev.direction === t.direction &&
      prev.source === t.source &&
      accountIdOf(prev, settings) === accountIdOf(t, settings) &&
      prev.provider === t.provider &&
      Math.abs(b - a) < IDEA_ENTRY_GAP_PIPS * pairSpec(settings, t.pair).pipSize;
  }

  // The plan stop distance, in pips from the idea's WORST entry: the plan
  // stop from Position Sizing, the same for every source.
  function planStopPips(source, settings, providerId){
    if(source === "Signal"){
      var p = providerById(settings, providerId);
      if(p && p.stop > 0) return p.stop;
    }
    return settings.defaultStop;
  }

  // The other legs of the idea a draft trade would belong to, found with the
  // same grouping the journal uses. editing = the stored trade being edited
  // (left out, its createdAt keeps the draft in its place), or null.
  function ideaLegsFor(draft, trades, settings, editing){
    if(!draft.date || !draft.pair || !draft.direction || !draft.source || draft.entry === null) return [];
    var probe = Object.assign({}, draft, {
      id: "__probe__", closes: [], status: "Open",
      createdAt: editing ? editing.createdAt : Date.now()
    });
    var list = trades.filter(function(t){ return !editing || t.id !== editing.id; }).concat([probe]);
    var d = derive(list, settings);
    var idea = d.ideaById[d.byId[probe.id].idea];
    return idea.tradeIds
      .filter(function(id){ return id !== probe.id; })
      .map(function(id){ return d.byId[id].trade; });
  }

  // One stop for the whole basket. A leg that already has a real stop (not
  // one parked at its own entry for breakeven) sets it for the idea, as long
  // as this entry stays within the plan distance of it; otherwise (a new
  // worst entry) it is the plan stop from the worst entry of the idea.
  function planStop(draft, legs, settings){
    var sign = dirSign(draft.direction);
    var spec = pairSpec(settings, draft.pair);
    var pipCount = planStopPips(draft.source, settings, draft.provider);
    for(var i = legs.length - 1; i >= 0; i--){
      var s = num(legs[i].stopLoss), e = num(legs[i].entry);
      if(s === null || e === null || s === e) continue;
      var dist = (draft.entry - s) * sign / spec.pipSize;
      if(dist > 0 && dist <= pipCount + 1e-6) return { price: s, fromLeg: true };
      break;
    }
    var entries = legs.map(function(l){ return num(l.entry); })
      .concat([draft.entry])
      .filter(function(v){ return v !== null; });
    var worst = sign > 0 ? Math.max.apply(null, entries) : Math.min.apply(null, entries);
    return {
      price: Number((worst - sign * pipCount * spec.pipSize).toFixed(spec.priceDp)),
      fromLeg: false, worst: worst, pips: pipCount
    };
  }

  // lots(risk, stop) = balance × risk / (stop × usdPerPip), rounded DOWN to 0.01.
  function lotsFor(balance, riskPct, stopPips, usdPerPip){
    var x = balance * (riskPct / 100) / (stopPips * usdPerPip);
    if(!isFinite(x) || x <= 0) return 0;
    return Math.floor(x * 100 + 1e-9) / 100;
  }

  function riskDollars(lots, stopPips, usdPerPip){
    return round2(lots * stopPips * usdPerPip);
  }

  // The risk % of a whole idea for a source, from the sizing settings.
  // The risk % of a whole idea: Own Trade from the sizing settings, a
  // Signal from its provider (or the general signal risk if none is picked).
  function riskPctForSource(source, settings, providerId){
    var sz = (settings && settings.sizing) || SIZING_DEFAULTS;
    if(source === "Own Trade") return sz.own;
    if(source === "Signal"){
      var p = providerById(settings, providerId);
      return p ? p.risk : sz.signal;
    }
    return null;
  }

  // One lot size for every leg so that all legs stopped out together lose
  // the idea's risk: lots = balance × risk / (sum of leg stops × $/pip),
  // rounded DOWN to 0.01. stops[i] = pips from leg i's entry to the stop,
  // offsets[i] = pips from the first entry toward the stop.
  function layerPlan(stops, offsets, balance, riskPct, usdPerPip){
    var total = sum(stops);
    var lots = lotsFor(balance, riskPct, total, usdPerPip);
    var risk = riskDollars(lots, total, usdPerPip);
    return {
      legs: stops.map(function(st, i){
        return { n: i + 1, offset: offsets[i], stop: st, lots: lots, risk: riskDollars(lots, st, usdPerPip) };
      }),
      lots: lots,
      totalLots: round2(lots * stops.length),
      totalStop: total,
      stopFirst: stops[0],
      risk: risk,
      riskPct: balance > 0 ? risk / balance : null,
      tooSmall: lots < 0.01
    };
  }

  // The fixed reward:risk plan for one position: stop to breakeven at
  // `beAt` R, take profit at `rr` R. Distances in pips from the entry,
  // money for `lots` at `usdPerPip`.
  function rrPlan(stopPips, lots, usdPerPip, rr, beAt){
    return {
      stop: stopPips,
      bePips: clean(stopPips * beAt),
      tpPips: clean(stopPips * rr),
      risk: riskDollars(lots, stopPips, usdPerPip),
      reward: riskDollars(lots, stopPips * rr, usdPerPip),
      rr: rr,
      beAt: beAt
    };
  }

  // Every plan of the Position Sizing tab for a balance: per source, one
  // entry at the plan stop, or three entries layered `layer` pips apart
  // toward the stop (only when the last entry stays far enough from it).
  function sizingPlans(balance, settings, usdPerPip){
    var sz = settings.sizing || SIZING_DEFAULTS;
    var L = sz.layer, stop = settings.defaultStop;
    function single(risk, st){ st = st || stop; return layerPlan([st], [0], balance, risk, usdPerPip); }
    function three(risk, st){
      st = st || stop;
      return st - 2 * L >= LAST_LEG_MIN_STOP ? layerPlan([st, st - L, st - 2 * L], [0, L, 2 * L], balance, risk, usdPerPip) : null;
    }
    return {
      stop: stop,
      layer: L,
      minLayerStop: 2 * L + LAST_LEG_MIN_STOP,
      providers: (settings.providers || []).map(function(p){
        var st = p.stop > 0 ? p.stop : stop;
        return { id: p.id, name: p.name, risk: p.risk, stop: st, single: single(p.risk, st), three: three(p.risk, st) };
      }),
      own: { risk: sz.own, stop: stop, single: single(sz.own), three: three(sz.own) }
    };
  }

  // A typed risk % for a source: null if not above 0, capped at the max.
  function clampRisk(source, pct){
    pct = num(pct);
    if(pct === null || !(pct > 0) || !SOURCE_RISK[source]) return null;
    return Math.min(pct, SOURCE_RISK[source].max);
  }

  // One pass over the whole journal: trade numbers, ideas, running balance
  // and the account position. Every view reads from this.
  function derive(trades, settings){
    var base = settings.startingDeposit + settings.depositsWithdrawals;
    var rows = [], byId = {}, ideas = [], ideaById = {};
    var cumulative = 0, peak = round2(base), maxIdea = 0;
    // The last trade (and its idea) per account: legs of one idea are on one
    // account, even when another account's trade comes in between.
    var prevBy = {}, prevIdeaBy = {};
    // Deposits/withdrawals count from the start of their date. They move the
    // balance and the peak by the same amount, so a withdrawal never shows
    // up as drawdown and a deposit never as profit.
    var flows = sortedFlows(settings), fi = 0, netFlows = 0, deposited = base;
    function applyFlowsUpTo(date){
      while(fi < flows.length && (date === null || flows[fi].date <= date)){
        var amt = flowAmount(flows[fi]);
        netFlows = round2(netFlows + amt);
        if(amt > 0) deposited = round2(deposited + amt);
        peak = round2(Math.max(peak + amt, base + netFlows + cumulative));
        fi++;
      }
    }

    sortChronological(trades).forEach(function(t, i){
      applyFlowsUpTo(t.date);
      var calc = tradeCalc(t, settings);
      var acc = accountIdOf(t, settings), who = whoOf(t, settings);
      var ideaNo = sameIdea(prevBy[acc], t, settings) ? prevIdeaBy[acc] : maxIdea + 1;
      if(ideaNo > maxIdea) maxIdea = ideaNo;

      var idea = ideaById[ideaNo];
      if(!idea){
        // Every trade in an idea shares its date, pair, direction and source.
        idea = ideaById[ideaNo] = { id: ideaNo, date: t.date, source: t.source, who: who, account: acc, tradeIds: [], closedCount: 0, pl: 0, risk: 0, riskKnown: true };
        ideas.push(idea);
      }
      idea.tradeIds.push(t.id);

      var balanceAfter = null;
      if(calc.pl !== null){
        cumulative = round2(cumulative + calc.pl);
        balanceAfter = round2(base + netFlows + cumulative);
        if(balanceAfter > peak) peak = balanceAfter;
        idea.closedCount++;
        idea.pl = round2(idea.pl + calc.pl);
        if(calc.risk === null) idea.riskKnown = false;
        else idea.risk = round2(idea.risk + calc.risk);
      }

      var row = { n: i + 1, trade: t, calc: calc, idea: ideaNo, balanceAfter: balanceAfter, who: who, account: acc };
      rows.push(row);
      byId[t.id] = row;
      prevBy[acc] = t;
      prevIdeaBy[acc] = ideaNo;
    });

    applyFlowsUpTo(null);
    // An idea's R = its P/L over what all its entries risked together.
    ideas.forEach(function(i){ i.r = (i.riskKnown && i.risk > 0) ? clean(i.pl / i.risk) : null; });
    var balance = round2(base + netFlows + cumulative);
    var stopLine = round2(peak * (1 - settings.maxDrawdown / 100));

    return {
      providerNames: (settings.providers || []).map(function(p){ return p.name; }),
      rows: rows,          // chronological
      byId: byId,
      ideas: ideas,
      ideaById: ideaById,
      account: {
        base: round2(base),
        netFlows: netFlows,           // deposits minus withdrawals from the ledger
        deposited: deposited,         // starting deposit + every ledger deposit
        closedPL: cumulative,
        balance: balance,
        peak: peak,
        drawdownPct: peak > 0 ? clean((peak - balance) / peak * 100) : 0,
        stopLine: stopLine,
        stopped: balance <= stopLine
      }
    };
  }

  // ---------- dashboard stats ----------
  function sum(list){ return list.reduce(function(s, v){ return s + v; }, 0); }
  function mean(list){ return list.length ? sum(list) / list.length : null; }

  // Win/loss summary of a list of P/L values — used for trades and for ideas.
  // Anything that can't be computed (no wins, no losses) is null, never NaN.
  function winLossStats(pls){
    var wins = pls.filter(function(v){ return v > 0; });
    var losses = pls.filter(function(v){ return v < 0; });
    var avgWin = mean(wins), avgLoss = mean(losses);
    var ratio = (avgWin !== null && avgLoss !== null) ? avgWin / Math.abs(avgLoss) : null;
    return {
      count: pls.length,
      wins: wins.length,
      losses: losses.length,
      be: pls.length - wins.length - losses.length,
      winRate: pls.length ? wins.length / pls.length : null,
      avgWin: avgWin,
      avgLoss: avgLoss,
      biggestWin: wins.length ? Math.max.apply(null, wins) : null,
      biggestLoss: losses.length ? Math.min.apply(null, losses) : null,
      ratio: ratio,
      breakevenWinRate: ratio === null ? null : 1 / (1 + ratio)
    };
  }

  var MIN_IDEAS_FOR_VERDICT = 30;

  // An idea is judged only once every trade in it is closed.
  function ideaClosed(i){ return i.closedCount === i.tradeIds.length; }

  // Core stats are by idea: an idea's P/L is the sum of its trades (Win > 0,
  // Loss < 0, BE = 0). Net P/L and balance stay the total of every closed
  // trade, so they match the trade numbers exactly; closed trades in
  // still-open ideas are reported separately.
  function dashboardStats(derived){
    var closed = derived.rows.filter(function(r){ return r.calc.pl !== null; });
    var pls = closed.map(function(r){ return r.calc.pl; });

    function group(names, key){
      return names.map(function(name){
        var list = closed.filter(function(r){ return r.trade[key] === name; })
                         .map(function(r){ return r.calc.pl; });
        return { name: name, trades: list.length, net: round2(sum(list)), avg: mean(list) };
      });
    }

    var closedIdeas = derived.ideas.filter(ideaClosed);
    var openIdeas = derived.ideas.filter(function(i){ return !ideaClosed(i); });

    var core = winLossStats(closedIdeas.map(function(i){ return i.pl; }));
    core.closedTrades = pls.length;
    core.net = round2(sum(pls));
    core.balance = derived.account.balance;
    core.openIdeas = openIdeas.length;
    core.openIdeasPL = round2(sum(openIdeas.map(function(i){ return i.pl; })));
    core.openIdeasClosedTrades = sum(openIdeas.map(function(i){ return i.closedCount; }));
    core.verdict = core.count < MIN_IDEAS_FOR_VERDICT ? "Too few ideas — keep logging" :
      (core.net > 0 ? "Profitable so far" : "Losing so far");
    // R: each closed idea's P/L in multiples of what it risked (ideas with a
    // stop on every entry). Average R is the expectancy per idea.
    var rs = closedIdeas.map(function(i){ return i.r; }).filter(function(v){ return v !== null && v !== undefined; });
    core.rCount = rs.length;
    core.avgR = mean(rs);
    core.totalR = rs.length ? clean(sum(rs)) : null;
    var rWins = rs.filter(function(v){ return v > 0; });
    core.avgWinR = mean(rWins);

    // Per source, over the same closed ideas: net is the sum of those ideas'
    // P/L, avg is per idea. Wins/losses/BE use the same rule as the
    // Milestones streaks (an idea within $1 of zero is breakeven), and the
    // win rate leaves breakeven ideas out: wins / (wins + losses).
    // One row per provider (and Own Trade), then all signals together.
    // Rows with no ideas are left out, except Own Trade and All signals.
    var whoNames = [];
    closedIdeas.forEach(function(i){ if(i.source === "Signal" && whoNames.indexOf(i.who) === -1) whoNames.push(i.who); });
    var order = (derived.providerNames || []).concat([NO_PROVIDER]);
    whoNames.sort(function(a, b){ return order.indexOf(a) - order.indexOf(b); });
    function whoRow(label, f){
      var ideasIn = closedIdeas.filter(function(i){ return matchWho(i.source, i.who, f); });
      var list = ideasIn.map(function(i){ return i.pl; });
      var wins = list.filter(function(v){ return ideaResult(v) === "W"; }).length;
      var losses = list.filter(function(v){ return ideaResult(v) === "L"; }).length;
      var rList = ideasIn.filter(function(i){ return i.r !== null && i.r !== undefined; }).map(function(i){ return i.r; });
      return { name: label, total: f === "Signal", ideas: list.length, wins: wins, losses: losses, be: list.length - wins - losses,
        winRate: (wins + losses) ? wins / (wins + losses) : null,
        net: round2(sum(list)), avg: mean(list), avgR: mean(rList) };
    }
    var bySource = whoNames.map(function(n){ return whoRow(n, n); })
      .concat([whoRow("All signals", "Signal"), whoRow("Own Trade", "Own Trade")]);

    // Point 0 is the balance before any trade; then one point per closed
    // trade. When filtered, the curve is the starting balance plus only the
    // trades the filter shows.
    var running = derived.account.base;
    var equity = [{ n: 0, balance: derived.account.base }].concat(closed.map(function(r, i){
      running = round2(running + r.calc.pl);
      return { n: i + 1, balance: derived.filtered ? running : r.balanceAfter };
    }));

    return {
      core: core,
      bySession: group(SESSIONS, "session"),
      bySource: bySource,
      equity: equity
    };
  }

  // ---------- position sizing ----------
  // Lots + the dollars actually at risk for those (rounded-down) lots.
  // Null when the risk % or the stop isn't a positive number.
  function sizeFor(balance, riskPct, stopPips, usdPerPip){
    if(!(riskPct > 0) || !(stopPips > 0)) return null;
    var lots = lotsFor(balance, riskPct, stopPips, usdPerPip);
    return { lots: lots, risk: riskDollars(lots, stopPips, usdPerPip) };
  }

  // ---------- weekly review ----------
  // Every number uses closed trades only, and ideas only once every trade in
  // them is closed (as on the dashboard). `logged` counts all trades, open
  // ones included, just to tell whether the week has anything to show.
  function weeklyStats(derived, range, source){
    var rows = derived.rows.filter(function(r){
      return r.trade.date >= range.start && r.trade.date <= range.end && matchWho(r.trade.source, r.who, source);
    });
    var pls = rows.filter(function(r){ return r.calc.pl !== null; }).map(function(r){ return r.calc.pl; });
    var ideas = {};
    rows.forEach(function(r){
      var idea = derived.ideaById[r.idea];
      if(ideaClosed(idea)) ideas[r.idea] = true;
    });
    return {
      logged: rows.length,
      trades: pls.length,
      ideas: Object.keys(ideas).length,
      closed: pls.length,
      net: round2(sum(pls)),
      // By idea, over the same fully closed ideas as the dashboard.
      winRate: winLossStats(Object.keys(ideas).map(function(id){ return derived.ideaById[id].pl; })).winRate
    };
  }

  // ---------- milestones + records ----------
  // "YYYY-MM-DD" as a local date (new Date("YYYY-MM-DD") would be UTC).
  function parseLocalDate(s){
    var p = String(s).split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  var PERIOD_KEY = {
    day: function(date){ return date; },
    week: function(date){ return getWeekRange(parseLocalDate(date)).start; },   // Monday
    month: function(date){ return date.slice(0, 7); }                           // YYYY-MM
  };

  // Net P/L per day / week / month, oldest first. Every closed trade counts
  // on its idea's date (all trades in an idea share it), so the totals match
  // Net P/L and the balance exactly.
  function periodTotals(rows, kind){
    var list = [], byKey = {};
    rows.forEach(function(r){
      var key = PERIOD_KEY[kind](r.trade.date);
      if(!byKey[key]){ byKey[key] = { key: key, pl: 0 }; list.push(byKey[key]); }
      byKey[key].pl = round2(byKey[key].pl + r.calc.pl);
    });
    return list;
  }

  // P/L and return per day / week / month, oldest first. ROI is the
  // period's P/L over the balance at the start of that period (the balance
  // before its first closed trade), so deposits made earlier count.
  function periodReturns(derived, kind){
    var list = [], byKey = {};
    derived.rows.forEach(function(r){
      if(r.calc.pl === null) return;
      var key = PERIOD_KEY[kind](r.trade.date);
      var p = byKey[key];
      if(!p){
        p = byKey[key] = { key: key, pl: 0, startBalance: round2(r.balanceAfter - r.calc.pl) };
        list.push(p);
      }
      p.pl = round2(p.pl + r.calc.pl);
    });
    list.forEach(function(p){ p.roi = p.startBalance > 0 ? p.pl / p.startBalance : null; });
    return list;
  }

  function averageReturn(periods){
    if(!periods.length) return null;
    var rois = periods.filter(function(p){ return p.roi !== null; });
    return {
      count: periods.length,
      pl: round2(sum(periods.map(function(p){ return p.pl; })) / periods.length),
      roi: rois.length ? sum(rois.map(function(p){ return p.roi; })) / rois.length : null
    };
  }

  // The steady per-period rate that turns the deposit into the current
  // closed balance over the calendar periods from the first trade to the
  // last (weeks or months without trades still count).
  function compoundedRate(derived, periods, kind){
    if(!periods.length || !(derived.account.base > 0)) return null;
    var first = periods[0].key, last = periods[periods.length - 1].key, n;
    if(kind === "week"){
      n = Math.round((parseLocalDate(last) - parseLocalDate(first)) / (7 * 864e5)) + 1;
    }else{
      n = (Number(last.slice(0, 4)) - Number(first.slice(0, 4))) * 12 + Number(last.slice(5, 7)) - Number(first.slice(5, 7)) + 1;
    }
    // Chain the period returns, so deposits and withdrawals don't count as
    // growth. With no ledger entries this equals balance / deposit.
    var growth = 1;
    periods.forEach(function(p){ if(p.roi !== null) growth *= 1 + p.roi; });
    if(!(growth > 0)) return null;
    return { count: n, roi: Math.pow(growth, 1 / n) - 1 };
  }

  function bestWorst(periods){
    var best = null, worst = null;
    periods.forEach(function(p){
      if(!best || p.pl > best.pl) best = p;
      if(!worst || p.pl < worst.pl) worst = p;
    });
    return { best: best, worst: worst };
  }

  // Each threshold unlocks on the first period whose P/L reaches it.
  function unlockPeriods(periods, thresholds){
    return thresholds.map(function(t){
      for(var i = 0; i < periods.length; i++){
        if(periods[i].pl >= t) return { amount: t, unlocked: true, key: periods[i].key, value: periods[i].pl };
      }
      return { amount: t, unlocked: false };
    });
  }

  // Each balance level unlocks on the first closed trade that takes the
  // balance (deposits included) to it, or at the start if the deposit
  // already covers it.
  function unlockBalance(derived, thresholds){
    var closed = derived.rows.filter(function(r){ return r.calc.pl !== null; });
    var base = derived.account.base;
    return thresholds.map(function(t){
      if(base >= t) return { amount: t, unlocked: true, key: closed.length ? closed[0].trade.date : null, value: base };
      for(var i = 0; i < closed.length; i++){
        if(closed[i].balanceAfter >= t) return { amount: t, unlocked: true, key: closed[i].trade.date, value: closed[i].balanceAfter };
      }
      return { amount: t, unlocked: false };
    });
  }

  function ideaResult(pl){
    return pl > STREAK_BE_USD ? "W" : (pl < -STREAK_BE_USD ? "L" : "BE");
  }

  // Win / loss streaks over fully closed ideas, oldest first. Breakeven
  // ideas are skipped: they neither extend nor break a streak.
  function streakStats(ideas){
    var longest = { W: null, L: null }, run = null, be = 0;
    ideas.forEach(function(i){
      var r = ideaResult(i.pl);
      if(r === "BE"){ be++; return; }
      if(run && run.type === r){
        run.count++;
        run.end = i.date;
      }else{
        run = { type: r, count: 1, start: i.date, end: i.date };
      }
      var best = longest[r];
      if(!best || run.count > best.count) longest[r] = { type: r, count: run.count, start: run.start, end: run.end };
    });
    return { longestWin: longest.W, longestLoss: longest.L, current: run, be: be };
  }

  // Milestone tracks always use the whole account; `source` (optional)
  // narrows only the records.
  function milestoneStats(derived, source){
    var closedRows = derived.rows.filter(function(r){ return r.calc.pl !== null; });
    var all = {
      day: periodTotals(closedRows, "day"),
      week: periodTotals(closedRows, "week"),
      month: periodTotals(closedRows, "month")
    };

    var recRows = source ? closedRows.filter(function(r){ return matchWho(r.trade.source, r.who, source); }) : closedRows;
    var recIdeas = derived.ideas.filter(function(i){ return ideaClosed(i) && matchWho(i.source, i.who, source); });
    var pls = recIdeas.map(function(i){ return i.pl; });
    var wins = pls.filter(function(v){ return ideaResult(v) === "W"; });
    var losses = pls.filter(function(v){ return ideaResult(v) === "L"; });

    return {
      tracks: {
        day: unlockPeriods(all.day, MILESTONES.day),
        week: unlockPeriods(all.week, MILESTONES.week),
        month: unlockPeriods(all.month, MILESTONES.month),
        balance: unlockBalance(derived, MILESTONES.balance)
      },
      balance: derived.account.balance,
      records: {
        day: bestWorst(periodTotals(recRows, "day")),
        week: bestWorst(periodTotals(recRows, "week")),
        month: bestWorst(periodTotals(recRows, "month")),
        streaks: streakStats(recIdeas),
        ideas: recIdeas.length,
        wins: wins.length,
        losses: losses.length,
        be: pls.length - wins.length - losses.length,
        winRate: (wins.length + losses.length) ? wins.length / (wins.length + losses.length) : null,
        avgWin: mean(wins),
        avgLoss: mean(losses)
      }
    };
  }

  var Calc = {
    settingValid: settingValid,
    weeklyStats: weeklyStats,
    sizeFor: sizeFor,
    milestoneStats: milestoneStats,
    MILESTONES: MILESTONES,
    dashboardStats: dashboardStats,
    round2: round2,
    pct1: pct1,
    num: num,
    getWeekRange: getWeekRange,
    defaultSettings: defaultSettings,
    normalizeSettings: normalizeSettings,
    normalizeTrade: normalizeTrade,
    pairSpec: pairSpec,
    pips: pips,
    closePL: closePL,
    tradeCalc: tradeCalc,
    sortChronological: sortChronological,
    lotsFor: lotsFor,
    riskDollars: riskDollars,
    riskPctForSource: riskPctForSource,
    clampRisk: clampRisk,
    layerPlan: layerPlan,
    sizingPlans: sizingPlans,
    rrPlan: rrPlan,
    normalizeSizing: normalizeSizing,
    viewSettings: viewSettings,
    viewTrades: viewTrades,
    whoOf: whoOf,
    matchWho: matchWho,
    whoOptions: whoOptions,
    accountIdOf: accountIdOf,
    SOURCE_RISK: SOURCE_RISK,
    derive: derive
  };
  (typeof window !== "undefined" ? window : globalThis).JournalCalc = Calc;

  // Everything below needs a browser.
  if(typeof document === "undefined") return;

  // ---------- persistence: Supabase ----------
  // Trades and settings live in the cloud, one row per trade plus one
  // settings row. The journal is loaded into memory after sign-in; every
  // view keeps working on the in-memory `trades` / `settings` exactly as
  // before, and saveTrades() / saveSettings() push changes up.
  // Not set up yet (config.js still has the placeholders): no client, and
  // the sign-in box explains what to do instead.
  var sb = CONFIGURED && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
  document.title = APP_NAME;
  Array.prototype.forEach.call(document.querySelectorAll("[data-app-name]"), function(el){ el.textContent = APP_NAME; });

  var trades = [];
  var settings = defaultSettings();
  var userId = null;
  var loaded = false;            // this user's journal is in memory

  // id -> JSON of each trade as last confirmed saved. A save sends only
  // what differs from this, so anything that failed goes again next time.
  var cloudTrades = {};
  var tradeSaving = false, tradeAgain = false, tradeError = "";
  var settingsTimer = null, settingsDirty = false, settingsSaving = false, settingsError = "";

  var elSync = document.getElementById("sync-status");

  function errText(err){
    return (err && (err.message || err.error_description)) || String(err || "Unknown error");
  }
  function check(res){
    if(res && res.error) throw res.error;
    return res;
  }

  function hasUnsaved(){
    if(!loaded) return false;
    var d = tradeDiff();
    return tradeSaving || settingsSaving || settingsDirty || d.upserts.length > 0 || d.deletes.length > 0;
  }

  function refreshSync(){
    var state = "", text = "", title = "";
    if(loaded){
      var err = tradeError || settingsError;
      if(err){ state = "error"; text = "Not saved — tap to retry"; title = err; }
      else if(tradeSaving || settingsSaving || settingsDirty){ state = "saving"; text = "Saving…"; }
      else { state = "saved"; text = "Saved"; }
    }
    elSync.textContent = text;
    elSync.title = title;
    elSync.dataset.state = state;
    elSync.hidden = !loaded;
  }

  function tradeDiff(){
    var current = {}, upserts = [], deletes = [], stamp = new Date().toISOString();
    trades.forEach(function(t){
      var json = JSON.stringify(t);
      current[t.id] = json;
      if(cloudTrades[t.id] !== json) upserts.push({ id: t.id, user_id: userId, data: t, updated_at: stamp });
    });
    Object.keys(cloudTrades).forEach(function(id){
      if(!Object.prototype.hasOwnProperty.call(current, id)) deletes.push(id);
    });
    return { current: current, upserts: upserts, deletes: deletes };
  }

  function saveTrades(){
    if(!loaded) return;
    if(tradeSaving){ tradeAgain = true; return; }
    var diff = tradeDiff();
    if(!diff.upserts.length && !diff.deletes.length){ refreshSync(); return; }

    tradeSaving = true;
    tradeAgain = false;
    refreshSync();
    var job = Promise.resolve();
    if(diff.upserts.length){
      job = job.then(function(){ return sb.from("trades").upsert(diff.upserts).then(check); });
    }
    if(diff.deletes.length){
      job = job.then(function(){ return sb.from("trades").delete().in("id", diff.deletes).then(check); });
    }
    job.then(function(){
      diff.upserts.forEach(function(r){ cloudTrades[r.id] = diff.current[r.id]; });
      diff.deletes.forEach(function(id){ delete cloudTrades[id]; });
      tradeError = "";
    }, function(err){
      console.error("Saving trades failed", err);
      tradeError = errText(err);
    }).then(function(){
      tradeSaving = false;
      // Changes made while this save was running go up straight away; a
      // failure waits for the next change, a tap on the status, or reconnect.
      if(tradeAgain && !tradeError) saveTrades();
      refreshSync();
    });
  }

  function saveSettings(){
    if(!loaded) return;
    settingsDirty = true;
    clearTimeout(settingsTimer);
    settingsTimer = setTimeout(flushSettings, 600);   // typing in Settings = one save
    refreshSync();
  }

  function flushSettings(){
    clearTimeout(settingsTimer);
    settingsTimer = null;
    if(!loaded || !settingsDirty || settingsSaving) return;
    settingsDirty = false;
    settingsSaving = true;
    refreshSync();
    sb.from("settings")
      .upsert({ user_id: userId, data: settings, updated_at: new Date().toISOString() })
      .then(check)
      .then(function(){ settingsError = ""; }, function(err){
        console.error("Saving settings failed", err);
        settingsDirty = true;
        settingsError = errText(err);
      })
      .then(function(){
        settingsSaving = false;
        if(settingsDirty && !settingsError) flushSettings();
        refreshSync();
      });
  }

  function retrySaves(){
    tradeError = "";
    settingsError = "";
    saveTrades();
    flushSettings();
    refreshSync();
  }
  elSync.addEventListener("click", function(){ if(elSync.dataset.state === "error") retrySaves(); });
  window.addEventListener("online", retrySaves);
  window.addEventListener("beforeunload", function(ev){
    if(hasUnsaved()){ ev.preventDefault(); ev.returnValue = ""; }
  });

  // Supabase returns at most 1000 rows per request, so read in pages.
  function fetchAllTrades(){
    var PAGE = 1000, rows = [];
    function page(from){
      return sb.from("trades").select("id,data").order("id").range(from, from + PAGE - 1)
        .then(check)
        .then(function(res){
          var got = res.data || [];
          rows = rows.concat(got);
          return got.length === PAGE ? page(from + PAGE) : rows;
        });
    }
    return page(0);
  }

  // ---------- tab switching ----------
  var tabButtons = Array.prototype.slice.call(document.querySelectorAll("nav.tabs button"));
  var tabNav = document.querySelector("nav.tabs");
  var renderers = {};   // view name -> render function, filled in per view

  // ---------- active account ----------
  // Every tab shows one account ("" = all accounts added together). The
  // choice is remembered on this device only.
  var ACTIVE_KEY = "tj-active-account";
  var activeAccount = "";
  try { activeAccount = window.localStorage.getItem(ACTIVE_KEY) || ""; } catch(e){}
  var elAcct = document.getElementById("acct-switch");
  function validActive(){
    if(activeAccount && !accountById(settings, activeAccount)) activeAccount = "";
    return activeAccount;
  }
  function viewS(){ return viewSettings(settings, validActive()); }
  function deriveView(){ return derive(viewTrades(trades, settings, validActive()), viewS()); }
  function deriveAccount(id){ return derive(viewTrades(trades, settings, id), viewSettings(settings, id)); }
  function accountName(id){ var a = accountById(settings, id); return a ? a.name : ""; }
  function multiAccount(){ return settings.accounts.length > 1; }
  function renderAcctSwitch(){
    validActive();
    elAcct.innerHTML = (multiAccount() ? '<option value="">All accounts</option>' : "") + settings.accounts.map(function(a){
      return '<option value="' + escapeHtml(a.id) + '">' + escapeHtml(a.name) + "</option>";
    }).join("");
    if(!multiAccount() && settings.accounts.length) activeAccount = settings.accounts[0].id;
    elAcct.value = activeAccount;
  }
  function currentView(){
    var b = tabButtons.filter(function(x){ return x.classList.contains("active"); })[0];
    return b ? b.dataset.view : "list";
  }
  elAcct.addEventListener("change", function(){
    activeAccount = elAcct.value;
    try { window.localStorage.setItem(ACTIVE_KEY, activeAccount); } catch(e){}
    var v = currentView();
    if(renderers[v]) renderers[v]();
  });

  // The "Who" filter on every tab: all signals, each provider, Own Trade.
  function refreshWhoFilters(){
    [[ffSource, "All"], [dfSource, "All"], [wkSource, "All sources"], [elMsSource, "All sources"]].forEach(function(x){
      var el = x[0];
      if(!el) return;
      var v = el.value;
      el.innerHTML = '<option value="">' + x[1] + "</option>" + whoOptions(settings).map(function(o){
        return '<option value="' + escapeHtml(o.value) + '">' + escapeHtml(o.label) + "</option>";
      }).join("");
      el.value = v;
      if(el.value !== v) el.value = "";
    });
    if(elMsSource) msSource = elMsSource.value;
  }

  function showView(name){
    renderAcctSwitch();
    refreshWhoFilters();
    tabButtons.forEach(function(btn){
      var active = btn.dataset.view === name;
      btn.classList.toggle("active", active);
      document.getElementById("view-" + btn.dataset.view).classList.toggle("hidden", !active);
      // On a phone the tab bar scrolls sideways — keep the active tab in view.
      if(active) tabNav.scrollLeft = btn.offsetLeft - (tabNav.clientWidth - btn.offsetWidth) / 2;
    });
    if(renderers[name]) renderers[name]();
  }
  tabButtons.forEach(function(btn){
    btn.addEventListener("click", function(){ showView(btn.dataset.view); });
  });

  // ---------- books: Rulebook + Psychology ----------
  // Chapters live in settings.rulebook / settings.psychology. Read mode
  // shows them as collapsible chapters; Edit turns each into a title box
  // and a text box, saved as you type.
  function inlineMarkup(text){
    return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }
  // "- " bullets, "1. " steps, "## " sub-heading, "> " note, blank line = new paragraph.
  function renderBody(body){
    var html = "", list = null, para = [];
    function flushPara(){ if(para.length){ html += "<p>" + para.join("<br>") + "</p>"; para = []; } }
    function flushList(){ if(list){ html += "</" + list + ">"; list = null; } }
    String(body || "").split(/\r?\n/).forEach(function(line){
      var t = line.trim(), m;
      if(t === ""){ flushPara(); flushList(); return; }
      if((m = /^[-*]\s+(.*)$/.exec(t))){
        flushPara();
        if(list !== "ul"){ flushList(); html += "<ul>"; list = "ul"; }
        html += "<li>" + inlineMarkup(m[1]) + "</li>";
      }else if((m = /^\d+[.)]\s+(.*)$/.exec(t))){
        flushPara();
        if(list !== "ol"){ flushList(); html += '<ol class="rb-steps">'; list = "ol"; }
        html += "<li>" + inlineMarkup(m[1]) + "</li>";
      }else if((m = /^##\s+(.*)$/.exec(t))){
        flushPara(); flushList();
        html += '<h3 class="rb-sub">' + inlineMarkup(m[1]) + "</h3>";
      }else if((m = /^>\s?(.*)$/.exec(t))){
        flushPara(); flushList();
        html += '<p class="rb-note">' + inlineMarkup(m[1]) + "</p>";
      }else{
        flushList();
        para.push(inlineMarkup(t));
      }
    });
    flushPara(); flushList();
    return html || '<p class="neutral">Empty — tap Edit to write this chapter.</p>';
  }

  function setupBook(kind){
    var root = document.getElementById("book-" + kind);
    var editing = false;
    var openIds = {};   // chapter id -> open, kept across re-renders

    function chapters(){ return settings[kind]; }
    function save(){ saveSettings(); }

    function render(){
      var list = chapters();
      var head = root.querySelector(".book-head");
      var body = root.querySelector(".book-body");
      head.querySelector(".book-edit").textContent = editing ? "Done" : "Edit";
      head.querySelector(".book-tools").hidden = editing || !list.length;
      var toc = head.querySelector(".rb-toc");
      toc.hidden = editing || !list.length;
      toc.innerHTML = list.map(function(c, i){
        return '<a href="#" data-jump="' + escapeHtml(c.id) + '">' + escapeHtml(c.title || "Chapter " + (i + 1)) + "</a>";
      }).join("");

      if(!editing){
        body.innerHTML = list.length ? list.map(function(c, i){
          var open = openIds[c.id] !== undefined ? openIds[c.id] : i === 0;
          return '<details class="panel rb-chapter" data-id="' + escapeHtml(c.id) + '"' + (open ? " open" : "") + ">" +
            "<summary>" + (i + 1) + " · " + escapeHtml(c.title || "Untitled") + "</summary>" +
            '<div class="rb-text">' + renderBody(c.body) + "</div></details>";
        }).join("") : '<div class="panel empty-state">No chapters yet — tap Edit to add one.</div>';
        return;
      }

      body.innerHTML = list.map(function(c, i){
        return '<div class="panel book-edit-card" data-id="' + escapeHtml(c.id) + '">' +
          '<div class="book-edit-row">' +
            '<input type="text" class="be-title" value="' + escapeHtml(c.title) + '" placeholder="Chapter title" aria-label="Chapter title">' +
            '<button type="button" class="ghost small" data-act="up"' + (i === 0 ? " disabled" : "") + ' aria-label="Move up">&uarr;</button>' +
            '<button type="button" class="ghost small" data-act="down"' + (i === list.length - 1 ? " disabled" : "") + ' aria-label="Move down">&darr;</button>' +
            '<button type="button" class="ghost small danger" data-act="delete">Delete</button>' +
          "</div>" +
          '<textarea class="be-body" rows="' + Math.max(5, Math.min(18, c.body.split("\n").length + 2)) + '" aria-label="Chapter text">' + escapeHtml(c.body) + "</textarea>" +
        "</div>";
      }).join("") +
      '<div class="book-edit-foot">' +
        '<button type="button" data-act="add">+ Add chapter</button>' +
        '<span class="hint">Formatting: start a line with "- " for a bullet, "1. " for a step, "## " for a sub-heading, "> " for a note. **Bold** with double stars. Saves as you type.</span>' +
      "</div>";
    }

    root.querySelector(".book-edit").addEventListener("click", function(){
      editing = !editing;
      render();
    });
    root.querySelector(".book-open-all").addEventListener("click", function(){
      chapters().forEach(function(c){ openIds[c.id] = true; });
      render();
    });
    root.querySelector(".book-close-all").addEventListener("click", function(){
      chapters().forEach(function(c){ openIds[c.id] = false; });
      render();
    });
    root.querySelector(".rb-toc").addEventListener("click", function(ev){
      var a = ev.target.closest("a[data-jump]");
      if(!a) return;
      ev.preventDefault();
      var target = root.querySelector('.rb-chapter[data-id="' + a.dataset.jump + '"]');
      if(!target) return;
      target.open = true;
      openIds[a.dataset.jump] = true;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    root.addEventListener("toggle", function(ev){
      var d = ev.target;
      if(d.classList && d.classList.contains("rb-chapter")) openIds[d.dataset.id] = d.open;
    }, true);

    root.addEventListener("input", function(ev){
      var card = ev.target.closest(".book-edit-card");
      if(!card) return;
      var c = chapters().filter(function(x){ return x.id === card.dataset.id; })[0];
      if(!c) return;
      if(ev.target.classList.contains("be-title")) c.title = ev.target.value;
      else if(ev.target.classList.contains("be-body")) c.body = ev.target.value;
      save();
    });
    root.addEventListener("click", function(ev){
      var btn = ev.target.closest("button[data-act]");
      if(!btn || !editing) return;
      var list = chapters(), act = btn.dataset.act;
      if(act === "add"){
        var id = makeId();
        list.push({ id: id, title: "", body: "" });
        save(); render();
        var inp = root.querySelector('.book-edit-card[data-id="' + id + '"] .be-title');
        if(inp) inp.focus();
        return;
      }
      var card = btn.closest(".book-edit-card");
      var i = list.findIndex(function(x){ return x.id === card.dataset.id; });
      if(i === -1) return;
      if(act === "delete"){
        if(!window.confirm('Delete the chapter "' + (list[i].title || "Untitled") + '"?')) return;
        list.splice(i, 1);
      }else if(act === "up" && i > 0){
        list.splice(i - 1, 0, list.splice(i, 1)[0]);
      }else if(act === "down" && i < list.length - 1){
        list.splice(i + 1, 0, list.splice(i, 1)[0]);
      }else return;
      save(); render();
    });

    return {
      render: function(){ editing = false; render(); },
      reset: function(){
        if(!window.confirm("Replace every chapter with the starter version? Your edits on this tab will be lost.")) return;
        settings[kind] = defaultBook(kind);
        openIds = {};
        save(); editing = false; render();
      }
    };
  }

  var rulebook = setupBook("rulebook");
  var psychology = setupBook("psychology");
  renderers.rulebook = rulebook.render;
  document.getElementById("rb-reset").addEventListener("click", rulebook.reset);
  document.getElementById("ps-reset").addEventListener("click", psychology.reset);

  // Psychology: read once a week. The marker shows when it was last read.
  var elPsRead = document.getElementById("ps-read");
  var elPsLast = document.getElementById("ps-last");
  function renderPsychology(){
    psychology.render();
    var last = settings.psychReadAt;
    var age = last ? Math.floor((parseLocalDate(todayStr()) - parseLocalDate(last)) / 864e5) : null;
    elPsLast.className = "ps-last" + (age === null || age >= 7 ? " due" : "");
    elPsLast.textContent = last ?
      "Last read " + (age === 0 ? "today" : age === 1 ? "yesterday" : age + " days ago") + (age >= 7 ? " — time for this week's read." : ".") :
      "Not marked as read yet.";
    elPsRead.disabled = age === 0;
  }
  renderers.psychology = renderPsychology;
  elPsRead.addEventListener("click", function(){
    settings.psychReadAt = todayStr();
    saveSettings();
    renderPsychology();
  });

  // ---------- formatting ----------
  function escapeHtml(s){
    if(s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function(c){
      return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c];
    });
  }

  function fmtUsd(v){
    if(v === null || v === undefined || isNaN(v)) return "—";
    var abs = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (v < 0 ? "-" : "") + "$" + abs;
  }

  function fmtMoney(v){
    if(v === null || v === undefined || isNaN(v)) return "—";
    var cls = v > 0 ? "pos" : (v < 0 ? "neg" : "neutral");
    return '<span class="' + cls + '">' + fmtUsd(v) + "</span>";
  }

  function fmtPips(v){
    if(v === null || v === undefined || isNaN(v)) return "—";
    return (v > 0 ? "+" : "") + v.toFixed(1);
  }

  function fmtPrice(v, spec){
    if(v === null || v === undefined || isNaN(v)) return "—";
    return Number(v).toFixed(spec.priceDp);
  }

  function fmtLots(v){
    if(v === null || v === undefined || isNaN(v)) return "—";
    return v.toFixed(2);
  }

  // ---------- segmented buttons ----------
  // Options are plain strings, or { value, label } when the stored value
  // (an id) differs from what's shown.
  function fillSeg(el, options){
    var keep = segGet(el);
    el.innerHTML = options.map(function(o){
      var v = typeof o === "string" ? o : o.value, l = typeof o === "string" ? o : o.label;
      return '<button type="button" data-value="' + escapeHtml(v) + '" aria-pressed="false">' + escapeHtml(l) + "</button>";
    }).join("");
    segSet(el, keep);
  }
  function buildSeg(el, options, allowNone){
    fillSeg(el, options);
    el.addEventListener("click", function(ev){
      var btn = ev.target.closest("button");
      if(!btn) return;
      var v = btn.dataset.value;
      segSet(el, (allowNone && segGet(el) === v) ? "" : v);
      updateLive();
    });
  }

  function segGet(el){
    var btn = el.querySelector("button.on");
    return btn ? btn.dataset.value : "";
  }

  function segSet(el, value){
    Array.prototype.forEach.call(el.querySelectorAll("button"), function(btn){
      var on = btn.dataset.value === value;
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  // ---------- log trade form ----------
  var form = document.getElementById("trade-form");
  var elFormTitle = document.getElementById("form-title");
  var elDate = document.getElementById("f-date");
  var elPair = document.getElementById("f-pair");
  var elDirection = document.getElementById("f-direction");
  var elSession = document.getElementById("f-session");
  var elSource = document.getElementById("f-source");
  var elBiasRows = document.getElementById("f-bias");
  var elConfirmation = document.getElementById("f-confirmation");
  var elEntry = document.getElementById("f-entry");
  var elSL = document.getElementById("f-sl");
  var elSLPips = document.getElementById("f-sl-pips");
  var elSLNote = document.getElementById("f-sl-note");
  var elSLApplyWrap = document.getElementById("f-sl-apply-wrap");
  var elSLApply = document.getElementById("f-sl-apply");
  var elSLApplyText = document.getElementById("f-sl-apply-text");
  var elWarnings = document.getElementById("f-warnings");
  var elSizeHint = document.getElementById("f-size-hint");
  var elPlanHint = document.getElementById("f-plan");
  var elStatus = document.getElementById("f-status");
  var elStatusHint = document.getElementById("f-status-hint");
  var elCloses = document.getElementById("f-closes");
  var elClosesEmpty = document.getElementById("f-closes-empty");
  var elCloseTotals = document.getElementById("f-close-totals");
  var elLesson = document.getElementById("f-lesson");
  var elFormError = document.getElementById("form-error");
  var btnSubmit = document.getElementById("btn-submit");
  var btnClear = document.getElementById("btn-clear");
  var btnCancelEdit = document.getElementById("btn-cancel-edit");
  var btnAddClose = document.getElementById("btn-add-close");

  var editingId = null;
  // True while the Stop Loss box is filled by the app (plan stop); typing a
  // stop turns it off, clearing the box turns it back on.
  var slAuto = true;
  var elAccount = document.getElementById("f-account");
  var elProvider = document.getElementById("f-provider");
  var elProviderWrap = document.getElementById("f-provider-wrap");
  var elBias = {};
  buildSeg(elAccount, [], false);
  buildSeg(elProvider, [], false);
  // Account and provider buttons come from Settings, so they're rebuilt
  // whenever the form is shown.
  function refreshFormChoices(){
    fillSeg(elAccount, settings.accounts.map(function(a){ return { value: a.id, label: a.name }; }));
    fillSeg(elProvider, settings.providers.map(function(p){ return { value: p.id, label: p.name }; }));
    if(!segGet(elAccount) && settings.accounts.length === 1) segSet(elAccount, settings.accounts[0].id);
  }

  buildSeg(elDirection, DIRECTIONS, false);
  buildSeg(elSession, SESSIONS, false);
  buildSeg(elSource, SOURCES, false);
  buildSeg(elStatus, STATUSES, false);
  BIAS_FRAMES.forEach(function(frame){
    var label = document.createElement("span");
    label.className = "label";
    label.textContent = frame[1];
    var seg = document.createElement("div");
    seg.className = "seg";
    seg.setAttribute("role", "group");
    seg.setAttribute("aria-label", frame[1] + " bias");
    buildSeg(seg, BIASES, true);
    elBiasRows.appendChild(label);
    elBiasRows.appendChild(seg);
    elBias[frame[0]] = seg;
  });

  // Rebuilt whenever the form is shown, since the pair list lives in Settings.
  // A trade logged on a pair that was later removed keeps its pair on edit.
  function refreshPairOptions(selected){
    var names = settings.pairs.map(function(p){ return p.pair; });
    if(selected && names.indexOf(selected) === -1) names.push(selected);
    elPair.innerHTML = names.map(function(n){
      return '<option value="' + escapeHtml(n) + '">' + escapeHtml(n) + "</option>";
    }).join("");
    elPair.value = selected || names[0] || "";
  }

  // ---- close rows ----
  function closeRowEls(){
    return Array.prototype.slice.call(elCloses.querySelectorAll(".close-row"));
  }

  function nextUnusedTP(){
    var used = closeRowEls().map(function(row){ return row.querySelector(".c-type").value; });
    return used.indexOf("TP") === -1 ? "TP" : "Partial";
  }

  function addCloseRow(c){
    var row = document.createElement("div");
    row.className = "close-row";
    row.innerHTML =
      '<select class="c-type" aria-label="Close type">' +
        CLOSE_TYPES.concat(c && c.type && CLOSE_TYPES.indexOf(c.type) === -1 ? [c.type] : [])
          .map(function(t){ return "<option>" + escapeHtml(t) + "</option>"; }).join("") +
      "</select>" +
      '<input type="number" step="any" inputmode="decimal" class="c-price" placeholder="Price" aria-label="Close price">' +
      '<input type="number" step="any" inputmode="decimal" class="c-lots" placeholder="Lots" aria-label="Close lots">' +
      '<div class="c-out num"><span class="c-pips">—</span><span class="c-pl">—</span></div>' +
      '<button type="button" class="c-remove" title="Remove this close" aria-label="Remove this close">&times;</button>';

    var type = row.querySelector(".c-type");
    var price = row.querySelector(".c-price");
    type.value = c ? c.type : nextUnusedTP();
    if(c){
      price.value = c.price === null ? "" : c.price;
      row.querySelector(".c-lots").value = c.lots === null ? "" : c.lots;
    }

    // SL closes at the stop, BE at entry, TP at the plan's take profit.
    function fillPrice(){
      if(type.value === "SL" && elSL.value !== "") price.value = elSL.value;
      else if(type.value === "BE" && elEntry.value !== "") price.value = elEntry.value;
      else if(type.value === "TP"){ var pp = planPrices(); if(pp) price.value = pp.tp; }
    }
    if(!c) fillPrice();
    type.addEventListener("change", function(){
      fillPrice();
      updateLive();
    });
    row.querySelector(".c-remove").addEventListener("click", function(){
      row.remove();
      updateLive();
    });

    elCloses.appendChild(row);
    return row;
  }

  btnAddClose.addEventListener("click", function(){
    var row = addCloseRow(null);
    updateLive();
    row.querySelector(".c-price").focus();
  });

  // Breakeven and take-profit prices for what's in the form, or null.
  function planPrices(){
    var draft = readForm();
    var calc = tradeCalc(draft, settings);
    if(!draft.direction || draft.entry === null || calc.slPips === null || !(calc.slPips < 0)) return null;
    var sign = dirSign(draft.direction), d = calc.stopDistance * calc.spec.pipSize, sz = settings.sizing;
    return {
      be: Number((draft.entry + sign * d * sz.beAt).toFixed(calc.spec.priceDp)),
      tp: Number((draft.entry + sign * d * sz.rr).toFixed(calc.spec.priceDp))
    };
  }

  // ---- read + live readouts ----
  function readForm(){
    var bias = {};
    BIAS_FRAMES.forEach(function(frame){ bias[frame[0]] = segGet(elBias[frame[0]]); });
    return {
      date: elDate.value,
      session: segGet(elSession),
      pair: elPair.value,
      direction: segGet(elDirection),
      source: segGet(elSource),
      account: segGet(elAccount),
      provider: segGet(elSource) === "Signal" ? segGet(elProvider) : "",
      status: segGet(elStatus),
      bias: bias,
      confirmation: elConfirmation.value.trim(),
      entry: num(elEntry.value),
      stopLoss: num(elSL.value),
      closes: closeRowEls().map(function(row){
        return {
          type: row.querySelector(".c-type").value,
          price: num(row.querySelector(".c-price").value),
          lots: num(row.querySelector(".c-lots").value)
        };
      }),
      lesson: elLesson.value.trim()
    };
  }

  function editingTrade(){
    return editingId ? trades.find(function(x){ return x.id === editingId; }) || null : null;
  }

  // Fill the plan stop while the box is on auto, and offer to give the same
  // stop to the idea's other legs. Returns those legs.
  function updateStop(draft){
    var legs = ideaLegsFor(draft, trades, settings, editingTrade());
    var ready = draft.date && draft.pair && draft.direction && draft.source && draft.entry !== null;
    var plan = ready ? planStop(draft, legs, settings) : null;

    if(slAuto){
      elSL.value = plan ? plan.price : "";
      draft.stopLoss = plan ? plan.price : null;
    }
    if(slAuto && plan){
      elSLNote.textContent = plan.fromLeg ?
        "Auto: same stop as the other legs of this idea." :
        "Auto: " + plan.pips + " pips from the worst entry (" + plan.worst + ").";
    }else{
      elSLNote.textContent = slAuto ? "Auto-fills from entry, direction and source." : "";
    }

    var others = draft.stopLoss === null ? [] : legs.filter(function(l){ return num(l.stopLoss) !== draft.stopLoss; });
    elSLApplyWrap.hidden = others.length === 0;
    elSLApplyText.textContent = "Also set this stop on the other " +
      (others.length === 1 ? "leg" : others.length + " legs") + " of this idea";
    return legs;
  }

  // The plan stop is also the most a stop may be.
  function maxStopFor(draft){ return planStopPips(draft.source, settings, draft.provider); }

  function updateLive(){
    var draft = readForm();
    elProviderWrap.hidden = draft.source !== "Signal";
    updateStop(draft);
    var calc = tradeCalc(draft, settings);
    // Signed pips mean nothing until a direction is picked.
    var hasDir = draft.direction !== "";

    if(calc.slPips === null) elSLPips.textContent = "—";
    else elSLPips.textContent = (hasDir ? fmtPips(calc.slPips) : calc.stopDistance.toFixed(1)) + " pips";

    var warnings = [];
    var maxStop = maxStopFor(draft);
    if(calc.stopDistance !== null && calc.stopDistance > maxStop){
      warnings.push("Stop is " + calc.stopDistance.toFixed(1) + " pips — your max is " + maxStop + ".");
    }
    if(hasDir && calc.slPips !== null && calc.slPips > 0){
      warnings.push("The stop is on the profit side of the entry — check the direction.");
    }
    if(draft.confirmation === ""){
      warnings.push("No confirmation written. No valid confirmation = no trade.");
    }
    elWarnings.innerHTML = warnings.map(function(w){
      return '<div class="warn">' + escapeHtml(w) + "</div>";
    }).join("");

    if(!draft.account || draft.source === "" || (draft.source === "Signal" && !draft.provider) || !(calc.stopDistance > 0)){
      elSizeHint.textContent = "Size: pick the account, the source" + (draft.source === "Signal" ? " and who called it" : "") + ", then enter entry + stop.";
    }else{
      // Sized from THIS account's balance, never the other account's.
      var acctD = deriveAccount(draft.account);
      var bal = acctD.account.balance;
      var riskPct = riskPctForSource(draft.source, settings, draft.provider);
      var size = sizeFor(bal, riskPct, calc.stopDistance, calc.spec.usdPerPip);
      var plans = sizingPlans(bal, settings, calc.spec.usdPerPip);
      var pp = draft.source === "Own Trade" ? plans.own : plans.providers.filter(function(x){ return x.id === draft.provider; })[0];
      var p3 = pp ? pp.three : null;
      var editing = editingTrade();
      var openHere = acctD.rows.filter(function(r){ return r.calc.isOpen && (!editing || r.trade.id !== editing.id); }).length;
      elSizeHint.innerHTML =
        "1 entry: <strong>" + (size ? fmtLots(size.lots) + " lots · " + escapeHtml(fmtUsd(size.risk)) + " risk" : "—") + "</strong> " +
        "(" + riskPct + "% of " + escapeHtml(accountName(draft.account)) + "'s " + escapeHtml(fmtUsd(bal)) + " at " + calc.stopDistance.toFixed(1) + " pips)" +
        (p3 && !p3.tooSmall ? " · 3 entries: " + fmtLots(p3.lots) + " each" : "") +
        (openHere ? '<div class="open-note">' + openHere + " other trade" + (openHere === 1 ? " is" : "s are") + " already open on " + escapeHtml(accountName(draft.account)) +
          " — their risk adds to this one.</div>" : "");
    }

    // The fixed reward:risk plan: breakeven and take-profit prices from the
    // entry and the stop distance.
    var sz = settings.sizing;
    if(hasDir && draft.entry !== null && calc.slPips !== null && calc.slPips < 0){
      var sign = dirSign(draft.direction), dist = calc.stopDistance, pip = calc.spec.pipSize;
      var bePrice = draft.entry + sign * dist * sz.beAt * pip;
      var tpPrice = draft.entry + sign * dist * sz.rr * pip;
      elPlanHint.hidden = false;
      elPlanHint.innerHTML =
        '<span>Stop to BE at <b>' + fmtPrice(bePrice, calc.spec) + "</b> (" + sz.beAt + "R · +" + (dist * sz.beAt).toFixed(1) + " pips)</span>" +
        '<span>Take profit at <b>' + fmtPrice(tpPrice, calc.spec) + "</b> (" + sz.rr + "R · +" + (dist * sz.rr).toFixed(1) + " pips)</span>";
    }else{
      elPlanHint.hidden = true;
      elPlanHint.innerHTML = "";
    }

    var rows = closeRowEls();
    rows.forEach(function(row, i){
      var c = calc.closes[i];
      row.querySelector(".c-pips").textContent = hasDir && c.pips !== null ? fmtPips(c.pips) + " pips" : "—";
      row.querySelector(".c-pl").innerHTML = hasDir ? fmtMoney(c.pl) : "—";
    });
    elStatusHint.textContent = draft.status === "Open" ?
      "Open trades can have blank or partial closes and count in no stats until marked Closed." :
      "Closed needs at least one close, each with a price and lots.";
    elClosesEmpty.hidden = rows.length > 0;
    elCloseTotals.innerHTML = rows.length === 0 ? "" :
      "Total: " + fmtLots(calc.lots) + " lots · " + (hasDir ? fmtMoney(calc.pl) : "—");
  }

  function renderForm(){
    // Keep the chosen pair unless it has since been removed or renamed in
    // Settings (a trade being edited falls back to its own pair).
    var keep = elPair.value;
    var editing = editingId ? trades.find(function(x){ return x.id === editingId; }) : null;
    var listed = settings.pairs.some(function(p){ return p.pair === keep; });
    if(!listed && !(editing && editing.pair === keep)) keep = editing ? editing.pair : "";
    refreshPairOptions(keep);
    refreshFormChoices();
    // A new trade starts on the account shown at the top.
    if(!editing && !segGet(elAccount) && validActive()) segSet(elAccount, validActive());
    updateLive();
  }
  renderers["new"] = renderForm;

  // Runs before the form's own input handler (target before bubbling).
  elSL.addEventListener("input", function(){ slAuto = elSL.value === ""; });
  form.addEventListener("input", updateLive);

  // ---- reset / fill ----
  function clearInvalid(){
    elFormError.hidden = true;
    Array.prototype.forEach.call(form.querySelectorAll(".invalid"), function(el){
      el.classList.remove("invalid");
    });
  }

  function resetForm(){
    editingId = null;
    form.reset();
    clearInvalid();
    elDate.value = todayStr();
    refreshPairOptions("");
    [elDirection, elSession, elSource, elProvider].forEach(function(seg){ segSet(seg, ""); });
    refreshFormChoices();
    segSet(elAccount, validActive() || (settings.accounts.length === 1 ? settings.accounts[0].id : ""));
    segSet(elStatus, "Open");
    BIAS_FRAMES.forEach(function(frame){ segSet(elBias[frame[0]], ""); });
    elCloses.innerHTML = "";
    slAuto = true;
    elSLApply.checked = true;
    elFormTitle.textContent = "Log Trade";
    btnSubmit.textContent = "Save Trade";
    btnCancelEdit.hidden = true;
    updateLive();
  }

  function fillFormFromTrade(t){
    elDate.value = t.date;
    refreshPairOptions(t.pair);
    segSet(elDirection, t.direction);
    segSet(elSession, t.session);
    segSet(elSource, t.source);
    refreshFormChoices();
    segSet(elAccount, accountIdOf(t, settings));
    segSet(elProvider, t.provider);
    segSet(elStatus, tradeCalc(t, settings).isOpen ? "Open" : "Closed");
    BIAS_FRAMES.forEach(function(frame){ segSet(elBias[frame[0]], t.bias[frame[0]]); });
    elConfirmation.value = t.confirmation;
    elEntry.value = t.entry === null ? "" : t.entry;
    elSL.value = t.stopLoss === null ? "" : t.stopLoss;
    // A stored stop is kept as typed; a trade saved without one gets the plan stop.
    slAuto = t.stopLoss === null;
    elCloses.innerHTML = "";
    t.closes.forEach(addCloseRow);
    elLesson.value = t.lesson;
  }

  function startEdit(id){
    var t = trades.find(function(x){ return x.id === id; });
    if(!t) return;
    resetForm();
    editingId = id;
    fillFormFromTrade(t);
    elFormTitle.textContent = "Edit Trade — " + t.date;
    btnSubmit.textContent = "Update Trade";
    btnCancelEdit.hidden = false;
    showView("new");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  btnClear.addEventListener("click", function(){ resetForm(); });
  btnCancelEdit.addEventListener("click", function(){
    resetForm();
    showView("list");
  });

  // ---- save ----
  function validateForm(draft){
    var errors = [];
    function need(ok, el, msg){
      if(ok) return;
      el.classList.add("invalid");
      errors.push(msg);
    }
    need(draft.date !== "", elDate, "Date");
    need(draft.pair !== "", elPair, "Pair");
    need(draft.direction !== "", elDirection, "Direction");
    need(draft.session !== "", elSession, "Session");
    need(draft.account !== "", elAccount, "Account");
    need(draft.source !== "", elSource, "Source");
    need(draft.source !== "Signal" || draft.provider !== "", elProvider, "Who called it");
    need(draft.entry !== null, elEntry, "Entry");
    need(draft.status !== "", elStatus, "Status");

    var messages = errors.length ? ["Still needed: " + errors.join(", ") + "."] : [];

    // An Open trade counts in no stats, so its closes may be blank or partial.
    if(draft.status !== "Closed") return messages;

    if(draft.closes.length === 0){
      messages.push("A Closed trade needs at least one close — add one or mark the trade Open.");
    }
    // A half-filled close would count as a $0 close, so it can't be saved.
    var badRows = 0;
    closeRowEls().forEach(function(row, i){
      var c = draft.closes[i];
      var price = row.querySelector(".c-price"), lots = row.querySelector(".c-lots");
      if(c.price === null){ price.classList.add("invalid"); }
      if(c.lots === null || c.lots <= 0){ lots.classList.add("invalid"); }
      if(c.price === null || c.lots === null || c.lots <= 0) badRows++;
    });
    if(badRows){
      messages.push("Every close on a Closed trade needs a price and lots above 0 — fill it in, remove the row, or mark the trade Open.");
    }
    return messages;
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    clearInvalid();

    var draft = readForm();
    var messages = validateForm(draft);
    if(messages.length){
      elFormError.textContent = messages.join(" ");
      elFormError.hidden = false;
      elFormError.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    var now = Date.now();
    var existing = editingId ? trades.find(function(x){ return x.id === editingId; }) : null;
    // One stop for the basket: optionally copy it onto the idea's other legs.
    if(draft.stopLoss !== null && !elSLApplyWrap.hidden && elSLApply.checked){
      ideaLegsFor(draft, trades, settings, existing).forEach(function(leg){
        if(num(leg.stopLoss) === draft.stopLoss) return;
        var i = trades.indexOf(leg);
        if(i !== -1) trades[i] = normalizeTrade(Object.assign({}, leg, { stopLoss: draft.stopLoss, updatedAt: now }));
      });
    }
    if(existing){
      draft.id = existing.id;
      draft.createdAt = existing.createdAt;
    }else{
      draft.id = makeId();
      draft.createdAt = now;
    }
    draft.updatedAt = now;
    // The form's fields on top of the stored trade, so fields the form
    // doesn't show (overDailyLimit, ...) are kept.
    var record = normalizeTrade(existing ? Object.assign({}, existing, draft) : draft);

    if(existing){
      trades[trades.indexOf(existing)] = record;
    }else{
      trades.push(record);
    }
    saveTrades();

    resetForm();
    showView("list");
  });

  // ---------- trade log: filters ----------
  var ffSession = document.getElementById("ff-session");
  var ffSource = document.getElementById("ff-source");
  var ffDirection = document.getElementById("ff-direction");
  var ffResult = document.getElementById("ff-result");
  var ffFrom = document.getElementById("ff-from");
  var ffTo = document.getElementById("ff-to");
  var ffClear = document.getElementById("ff-clear");
  var RESULTS = ["Win", "Loss", "BE", "Open"];

  function fillFilter(el, options){
    el.innerHTML = '<option value="">All</option>' + options.map(function(o){
      return "<option>" + escapeHtml(o) + "</option>";
    }).join("");
  }
  fillFilter(ffSession, SESSIONS);
  fillFilter(ffDirection, DIRECTIONS);
  fillFilter(ffResult, RESULTS);

  [ffSession, ffSource, ffDirection, ffResult, ffFrom, ffTo].forEach(function(el){
    el.addEventListener("change", renderTable);
  });
  ffClear.addEventListener("click", function(){
    [ffSession, ffSource, ffDirection, ffResult, ffFrom, ffTo].forEach(function(el){ el.value = ""; });
    renderTable();
  });

  function resultOf(calc){
    if(calc.pl === null) return "Open";
    if(calc.pl > 0) return "Win";
    if(calc.pl < 0) return "Loss";
    return "BE";
  }

  function matchesFilters(row){
    var t = row.trade;
    if(ffSession.value && t.session !== ffSession.value) return false;
    if(!matchWho(t.source, row.who, ffSource.value)) return false;
    if(ffDirection.value && t.direction !== ffDirection.value) return false;
    if(ffResult.value && resultOf(row.calc) !== ffResult.value) return false;
    if(ffFrom.value && t.date < ffFrom.value) return false;
    if(ffTo.value && t.date > ffTo.value) return false;
    return true;
  }

  // ---------- trade log: table ----------
  var tableWrap = document.getElementById("table-wrap");
  var tableBody = document.getElementById("table-body");
  var emptyState = document.getElementById("empty-state");
  var expandedIds = new Set();
  var TABLE_COLUMNS = 12;
  var BIAS_CHIPS = [["daily", "D"], ["h4", "4H"], ["h1", "1H"], ["m15", "15"]];
  var BIAS_CLASS = { Bullish: "bull", Bearish: "bear", Ranging: "range" };

  function biasChips(bias){
    return '<span class="bias-chips">' + BIAS_CHIPS.map(function(c){
      var value = bias[c[0]];
      return '<span class="chip ' + (BIAS_CLASS[value] || "") + '" title="' + escapeHtml(c[1] + ": " + (value || "not set")) + '">' + c[1] + "</span>";
    }).join("") + "</span>";
  }

  // An R multiple, signed and coloured: +1.50R, -1.00R.
  function fmtR(v){
    if(v === null || v === undefined || !isFinite(v)) return "—";
    var cls = v > 0.005 ? "pos" : (v < -0.005 ? "neg" : "neutral");
    return '<span class="' + cls + '">' + (v > 0 ? "+" : "") + v.toFixed(2) + "R</span>";
  }

  function fmtRoi(rate){
    if(rate === null || rate === undefined || !isFinite(rate)) return "—";
    var v = pct1(rate);
    var cls = v > 0 ? "pos" : (v < 0 ? "neg" : "neutral");
    return '<span class="' + cls + '">' + (v > 0 ? "+" : "") + v.toFixed(1) + "%</span>";
  }

  function fmtDayLabel(date){
    return parseLocalDate(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  function renderDayHeader(date, p){
    return '<tr class="day-row"><td colspan="' + TABLE_COLUMNS + '">' +
      '<span class="day-date">' + escapeHtml(fmtDayLabel(date)) + "</span>" +
      '<span class="day-stats">' + (p ?
        "Day P/L " + fmtMoney(p.pl) + ' <span class="day-sep">·</span> ROI ' + fmtRoi(p.roi) :
        '<span class="neutral">No closed trades</span>') + "</span>" +
    "</td></tr>";
  }

  function renderRow(r){
    var t = r.trade, c = r.calc;
    var open = expandedIds.has(t.id);
    return (
      '<tr class="trade-row' + (open ? " open" : "") + '" data-id="' + escapeHtml(t.id) + '">' +
        '<td class="r trade-no">' + r.n + "</td>" +
        '<td class="col-date">' + escapeHtml(t.date) + "</td>" +
        "<td>" + escapeHtml(t.session) + "</td>" +
        '<td class="' + (t.direction === "Buy" ? "dir-buy" : "dir-sell") + '">' + escapeHtml(t.direction) + "</td>" +
        "<td>" + escapeHtml(r.who) +
          (multiAccount() && !validActive() ? '<span class="acct-tag">' + escapeHtml(accountName(r.account)) + "</span>" : "") + "</td>" +
        "<td>" + biasChips(t.bias) + "</td>" +
        '<td class="r">' + fmtPrice(t.entry, c.spec) + "</td>" +
        '<td class="r">' + fmtPips(c.slPips) + "</td>" +
        '<td class="r">' + (c.isOpen ? "—" : fmtLots(c.lots)) + "</td>" +
        '<td class="r">' + (c.isOpen ? '<span class="badge">Open</span>' : fmtMoney(c.pl)) + "</td>" +
        '<td class="r">' + (c.isOpen ? "—" : fmtR(c.r)) + "</td>" +
        '<td class="r">' + r.idea + "</td>" +
      "</tr>" +
      '<tr class="detail-row"' + (open ? "" : " hidden") + ">" +
        '<td colspan="' + TABLE_COLUMNS + '">' + (open ? renderDetail(r) : "") + "</td>" +
      "</tr>"
    );
  }

  function renderDetail(r){
    var t = r.trade, c = r.calc;

    var meta =
      "<span>Pair <b>" + escapeHtml(t.pair) + "</b></span>" +
      "<span>Account <b>" + escapeHtml(accountName(r.account)) + "</b></span>" +
      "<span>Source <b>" + escapeHtml(t.source) + "</b></span>" +
      "<span>Stop loss <b>" + fmtPrice(t.stopLoss, c.spec) + "</b></span>" +
      (c.risk !== null ? "<span>Risked <b>" + escapeHtml(fmtUsd(c.risk)) + "</b></span>" : "");

    var closes = "";
    if(c.isOpen){
      closes = '<div class="detail-block hint">' + (c.closes.length ?
        "This trade is Open — not counted in any stats until marked Closed via Edit." :
        "No closes yet — this trade is Open. Add closes via Edit.") + "</div>";
    }
    if(c.closes.length){
      closes +=
        '<table class="closes-table num">' +
          '<thead><tr><th>Type</th><th class="r">Price</th><th class="r">Lots</th><th class="r">Pips</th><th class="r">$</th></tr></thead>' +
          "<tbody>" + c.closes.map(function(cl){
            return "<tr>" +
              "<td>" + escapeHtml(cl.type) + "</td>" +
              '<td class="r">' + fmtPrice(cl.price, c.spec) + "</td>" +
              '<td class="r">' + fmtLots(cl.lots) + "</td>" +
              '<td class="r">' + fmtPips(cl.pips) + "</td>" +
              '<td class="r">' + fmtMoney(cl.pl) + "</td>" +
            "</tr>";
          }).join("") + "</tbody>" +
          '<tfoot><tr><td>Total</td><td></td><td class="r">' + fmtLots(c.lots) + '</td><td></td><td class="r">' + fmtMoney(c.pl) + "</td></tr></tfoot>" +
        "</table>";
    }

    function block(label, text){
      return '<div class="detail-block"><div class="d-label">' + label + '</div><div class="d-value">' +
        (text ? escapeHtml(text) : '<span class="neutral">—</span>') + "</div></div>";
    }

    return (
      '<div class="detail-inner">' +
        '<div class="detail-meta num">' + meta + "</div>" +
        closes +
        block("Confirmation", t.confirmation) +
        block("Mistake / Lesson", t.lesson) +
        '<div class="detail-actions">' +
          '<button type="button" class="small edit-btn">Edit</button>' +
          '<button type="button" class="small danger delete-btn">Delete</button>' +
        "</div>" +
      "</div>"
    );
  }

  function renderTable(){
    var d = deriveView();
    // Newest first; the # column keeps the chronological number from derive().
    var list = d.rows.filter(matchesFilters).reverse();

    // A header row before each day: that day's P/L and return on the
    // balance it started with (all of the day's closed trades, not just
    // the ones the filters show).
    var days = {};
    periodReturns(d, "day").forEach(function(p){ days[p.key] = p; });
    var html = "", lastDate = null;
    list.forEach(function(r){
      if(r.trade.date !== lastDate){
        lastDate = r.trade.date;
        html += renderDayHeader(lastDate, days[lastDate]);
      }
      html += renderRow(r);
    });
    tableBody.innerHTML = html;
    tableWrap.hidden = list.length === 0;
    emptyState.hidden = list.length !== 0;
    if(d.rows.length === 0){
      emptyState.textContent = 'No trades logged yet. Log your first trade from the "+ Log Trade" tab.';
    }else if(list.length === 0){
      emptyState.textContent = "No trades match these filters.";
    }else{
      emptyState.textContent = "";
    }
  }
  renderers.list = renderTable;

  function deleteTrade(id){
    var ok = window.confirm("Delete this trade? This cannot be undone.");
    if(!ok) return;
    trades = trades.filter(function(t){ return t.id !== id; });
    expandedIds.delete(id);
    if(editingId === id) resetForm();
    saveTrades();
    renderTable();
  }

  tableBody.addEventListener("click", function(ev){
    var detail = ev.target.closest("tr.detail-row");
    if(detail){
      var id = detail.previousElementSibling.dataset.id;
      if(ev.target.closest(".edit-btn")) startEdit(id);
      else if(ev.target.closest(".delete-btn")) deleteTrade(id);
      return;
    }
    var row = ev.target.closest("tr.trade-row");
    if(!row) return;
    if(expandedIds.has(row.dataset.id)) expandedIds.delete(row.dataset.id);
    else expandedIds.add(row.dataset.id);
    renderTable();
  });

  // ---------- dashboard ----------
  var dfSource = document.getElementById("df-source");
  var dfFrom = document.getElementById("df-from");
  var dfTo = document.getElementById("df-to");
  var dfNote = document.getElementById("df-note");
  [dfSource, dfFrom, dfTo].forEach(function(el){ el.addEventListener("change", renderDash); });
  document.getElementById("df-clear").addEventListener("click", function(){
    [dfSource, dfFrom, dfTo].forEach(function(el){ el.value = ""; });
    renderDash();
  });

  // The journal narrowed to a source and/or date range. Trades keep their
  // real balance after them; ideas count when the idea's source and date
  // match (all its trades share them).
  function filterDerived(d, f){
    if(!f.source && !f.from && !f.to) return d;
    function ok(source, who, date){
      return matchWho(source, who, f.source) && (!f.from || date >= f.from) && (!f.to || date <= f.to);
    }
    var rows = d.rows.filter(function(r){ return ok(r.trade.source, r.who, r.trade.date); });
    var closedPL = round2(sum(rows.filter(function(r){ return r.calc.pl !== null; }).map(function(r){ return r.calc.pl; })));
    return {
      rows: rows,
      byId: d.byId,
      ideas: d.ideas.filter(function(i){ return ok(i.source, i.who, i.date); }),
      providerNames: d.providerNames,
      ideaById: d.ideaById,
      account: Object.assign({}, d.account, { closedPL: closedPL }),
      filtered: true
    };
  }

  var dashEmpty = document.getElementById("dash-empty");
  var dashBody = document.getElementById("dash-body");
  var elEquityChart = document.getElementById("equity-chart");
  var elEquityReadout = document.getElementById("equity-readout");

  function fmtPct(v){
    if(v === null || v === undefined || !isFinite(v)) return "—";
    return pct1(v).toFixed(1) + "%";
  }

  function fmtRatio(v){
    if(v === null || v === undefined || !isFinite(v)) return "—";
    return v.toFixed(2);
  }

  function statCard(key, label, valueHtml, sub){
    return (
      '<div class="stat-card" data-stat="' + key + '">' +
        '<span class="label">' + escapeHtml(label) + "</span>" +
        '<div class="value">' + valueHtml + "</div>" +
        (sub ? '<div class="sub">' + escapeHtml(sub) + "</div>" : "") +
      "</div>"
    );
  }

  function groupTable(el, firstHeader, groups){
    el.innerHTML =
      "<thead><tr><th>" + firstHeader + "</th><th>Trades</th><th>Net P/L</th><th>Avg P/L</th></tr></thead>" +
      "<tbody>" + groups.map(function(g){
        return '<tr data-group="' + escapeHtml(g.name) + '">' +
          "<td>" + escapeHtml(g.name) + "</td>" +
          "<td>" + g.trades + "</td>" +
          "<td>" + (g.trades ? fmtMoney(g.net) : "—") + "</td>" +
          "<td>" + (g.trades ? fmtMoney(round2(g.avg)) : "—") + "</td>" +
        "</tr>";
      }).join("") + "</tbody>";
  }

  function winLossCards(prefix, s, countLabel){
    return (
      statCard(prefix + "count", countLabel, String(s.count)) +
      statCard(prefix + "wins", "Wins", String(s.wins)) +
      statCard(prefix + "losses", "Losses", String(s.losses)) +
      statCard(prefix + "winRate", "Win rate", fmtPct(s.winRate))
    );
  }

  function avgCards(prefix, s){
    return (
      statCard(prefix + "avgWin", "Avg win", s.avgWin === null ? "—" : fmtMoney(round2(s.avgWin))) +
      statCard(prefix + "avgLoss", "Avg loss", s.avgLoss === null ? "—" : fmtMoney(round2(s.avgLoss)))
    );
  }

  function ratioCards(prefix, s){
    return (
      statCard(prefix + "ratio", "Win/loss size ratio", fmtRatio(s.ratio), "avg win ÷ avg loss") +
      statCard(prefix + "breakeven", "Breakeven win rate", fmtPct(s.breakevenWinRate), "needed at this ratio")
    );
  }

  function returnCard(key, label, p, sub){
    return statCard(key, label, p ? fmtMoney(p.pl) + ' <span class="roi">' + fmtRoi(p.roi) + "</span>" : "—", sub);
  }

  function compoundCard(key, label, c, unit){
    return statCard(key, label, c ? fmtRoi(c.roi) : "—", c ? "steady rate over " + c.count + " " + unit + ", losses included" : "");
  }

  function returnsTable(el, firstHeader, periods, labelFn){
    el.innerHTML =
      "<thead><tr><th>" + firstHeader + "</th><th>Start balance</th><th>P/L</th><th>ROI</th></tr></thead>" +
      "<tbody>" + periods.slice().reverse().map(function(p){
        return "<tr><td>" + escapeHtml(labelFn(p.key)) + "</td>" +
          "<td>" + escapeHtml(fmtUsd(p.startBalance)) + "</td>" +
          "<td>" + fmtMoney(p.pl) + "</td>" +
          "<td>" + fmtRoi(p.roi) + "</td></tr>";
      }).join("") + "</tbody>";
  }

  function renderReturns(d){
    var days = periodReturns(d, "day"), weeks = periodReturns(d, "week"), months = periodReturns(d, "month");
    var today = todayStr();
    function find(list, key){ return list.filter(function(p){ return p.key === key; })[0] || null; }
    var thisDay = find(days, today);
    var thisWeek = find(weeks, PERIOD_KEY.week(today));
    var thisMonth = find(months, PERIOD_KEY.month(today));
    var base = d.account.deposited;
    var lifetime = { pl: d.account.closedPL, roi: base > 0 ? d.account.closedPL / base : null };
    var avgDay = averageReturn(days), avgWeek = averageReturn(weeks), avgMonth = averageReturn(months);

    document.getElementById("dash-returns").innerHTML =
      returnCard("today", "Today", thisDay, thisDay ? "" : "no closed trades today") +
      returnCard("week", "This week", thisWeek, thisWeek ? "" : "no closed trades this week") +
      returnCard("month", "This month", thisMonth, thisMonth ? "" : "no closed trades this month") +
      returnCard("lifetime", "Lifetime", lifetime, "on " + fmtUsd(base) + " deposited") +
      returnCard("avgDay", "Avg trading day", avgDay, avgDay ? "over " + avgDay.count + " days" : "") +
      returnCard("avgWeek", "Avg week", avgWeek, avgWeek ? "over " + avgWeek.count + " weeks" : "") +
      returnCard("avgMonth", "Avg month", avgMonth, avgMonth ? "over " + avgMonth.count + " months" : "") +
      compoundCard("compWeek", "Compounded / week", compoundedRate(d, weeks, "week"), "weeks") +
      compoundCard("compMonth", "Compounded / month", compoundedRate(d, months, "month"), "months");

    returnsTable(document.getElementById("dash-months"), "Month", months, function(k){
      return parseLocalDate(k + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    });
    returnsTable(document.getElementById("dash-weeks"), "Week of", weeks, function(k){
      return parseLocalDate(k).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    });
  }

  function renderDash(){
    var full = deriveView();
    var f = { source: dfSource.value, from: dfFrom.value, to: dfTo.value };
    var d = filterDerived(full, f);
    var s = dashboardStats(d);
    var parts = [];
    if(f.source) parts.push((f.source === "Signal" ? "signal" : f.source) + " trades only");
    if(f.from || f.to) parts.push((f.from || "start") + " to " + (f.to || "today"));
    dfNote.hidden = !d.filtered;
    dfNote.textContent = d.filtered ? "Showing " + parts.join(", ") + ". Balance and the stop-trading line are always the whole account." : "";

    // Net P/L, balance and the equity curve come from closed trades, so show
    // the dashboard as soon as one trade is closed, even if its idea isn't.
    var none = s.core.closedTrades === 0;
    dashEmpty.hidden = !none;
    dashEmpty.textContent = d.filtered ? "No closed trades match these filters" : "No closed trades yet";
    dashBody.hidden = none;
    if(none) return;

    var c = s.core;
    document.getElementById("dash-core").innerHTML =
      winLossCards("", c, "Closed ideas") +
      statCard("be", "Breakeven", String(c.be)) +
      statCard("net", "Net P/L", fmtMoney(c.net), "all closed trades") +
      statCard("balance", "Balance", escapeHtml(fmtUsd(c.balance))) +
      avgCards("", c) +
      statCard("biggestWin", "Best idea", c.biggestWin === null ? "—" : fmtMoney(c.biggestWin)) +
      statCard("biggestLoss", "Worst idea", c.biggestLoss === null ? "—" : fmtMoney(c.biggestLoss)) +
      statCard("avgR", "Avg R per idea", fmtR(c.avgR), c.rCount ? "expectancy over " + c.rCount + " ideas" : "needs a stop on every entry") +
      statCard("totalR", "Total R", fmtR(c.totalR)) +
      statCard("avgWinR", "Avg winner", fmtR(c.avgWinR), "target is " + settings.sizing.rr + "R") +
      ratioCards("", c);

    var coreNote = document.getElementById("dash-core-note");
    coreNote.hidden = c.openIdeas === 0;
    coreNote.innerHTML = c.openIdeas === 0 ? "" :
      c.openIdeas + (c.openIdeas === 1 ? " idea is" : " ideas are") + " still open and not counted in the idea stats. " +
      (c.openIdeasClosedTrades ?
        "Closed trades in open ideas (" + c.openIdeasClosedTrades + ") add " + fmtMoney(c.openIdeasPL) + ", which is included in Net P/L and Balance." :
        "No trades in open ideas are closed yet.");

    var verdict = document.getElementById("dash-verdict");
    verdict.textContent = c.verdict;
    verdict.className = "verdict" + (c.verdict === "Profitable so far" ? " good" : (c.verdict === "Losing so far" ? " bad" : ""));

    renderReturns(d);

    groupTable(document.getElementById("dash-session"), "Session", s.bySession);

    document.getElementById("dash-source").innerHTML =
      "<thead><tr><th>Who</th><th>Ideas</th><th>Wins</th><th>Losses</th><th>BE</th><th title='Wins ÷ (wins + losses); breakeven ideas (within $1 of zero) are left out'>Win rate (excl. BE)</th><th>Net P/L</th><th>Avg P/L</th><th>Avg R</th></tr></thead>" +
      "<tbody>" + s.bySource.map(function(g){
        return '<tr data-group="' + escapeHtml(g.name) + '"' + (g.total ? ' class="total-row"' : "") + ">" +
          "<td>" + escapeHtml(g.name) + "</td>" +
          "<td>" + g.ideas + "</td>" +
          "<td>" + g.wins + "</td>" +
          "<td>" + g.losses + "</td>" +
          "<td>" + g.be + "</td>" +
          "<td>" + fmtPct(g.winRate) + "</td>" +
          "<td>" + (g.ideas ? fmtMoney(g.net) : "—") + "</td>" +
          "<td>" + (g.ideas ? fmtMoney(round2(g.avg)) : "—") + "</td>" +
          "<td>" + fmtR(g.avgR) + "</td>" +
        "</tr>";
      }).join("") + "</tbody>";

    renderEquity(s.equity, d.filtered ? null : d.account.stopLine);
  }
  renderers.dash = renderDash;

  // ---- equity curve (inline SVG, drawn at the container's real pixel width
  //      so the text stays readable on a phone) ----
  function niceStep(range, targetTicks){
    var raw = range / targetTicks;
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var f = raw / mag;
    return (f <= 1 ? 1 : (f <= 2 ? 2 : (f <= 5 ? 5 : 10))) * mag;
  }

  function fmtAxisUsd(v, step){
    var digits = step < 1 ? 2 : 0;
    return (v < 0 ? "-" : "") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function renderEquity(points, stopLine){
    var W = elEquityChart.clientWidth || 600;
    var H = W < 500 ? 220 : 260;
    var N = points.length - 1;

    // stopLine is null when the dashboard is filtered (the curve is then the
    // start balance plus the filtered trades, not the account).
    var values = points.map(function(p){ return p.balance; }).concat(stopLine === null ? [] : [stopLine]);
    var lo = Math.min.apply(null, values), hi = Math.max.apply(null, values);
    var pad = (hi - lo) * 0.08 || 1;
    var step = niceStep(hi - lo + pad * 2, 4);
    var y0 = Math.floor((lo - pad) / step) * step;
    var y1 = Math.ceil((hi + pad) / step) * step;

    var ticks = [];
    for(var v = y0; v <= y1 + step / 1000; v += step) ticks.push(v);
    var longest = Math.max.apply(null, ticks.map(function(t){ return fmtAxisUsd(t, step).length; }));

    var mL = longest * 6.6 + 14, mR = 14, mT = 12, mB = 40;
    var pw = W - mL - mR, ph = H - mT - mB;
    function x(n){ return mL + (N === 0 ? 0 : n / N * pw); }
    function y(val){ return mT + (y1 - val) / (y1 - y0) * ph; }

    var svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Equity curve: running balance after each closed trade, with the stop-trading line">';

    ticks.forEach(function(t){
      svg += '<line class="grid-line" x1="' + mL + '" x2="' + (W - mR) + '" y1="' + y(t) + '" y2="' + y(t) + '"/>' +
        '<text x="' + (mL - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + fmtAxisUsd(t, step) + "</text>";
    });

    // x axis: whole trade numbers, thinned so labels never touch.
    var xStep = Math.max(1, niceStep(N, Math.max(1, Math.floor(pw / 46))));
    xStep = Math.ceil(xStep);
    svg += '<line class="axis-line" x1="' + mL + '" x2="' + (W - mR) + '" y1="' + (mT + ph) + '" y2="' + (mT + ph) + '"/>';
    for(var n = 0; n <= N; n += xStep){
      svg += '<text x="' + x(n) + '" y="' + (mT + ph + 16) + '" text-anchor="middle">' + n + "</text>";
    }
    svg += '<text x="' + (mL + pw / 2) + '" y="' + (H - 4) + '" text-anchor="middle">Closed trade #</text>';

    if(stopLine !== null){
      svg += '<line class="stop-line" x1="' + mL + '" x2="' + (W - mR) + '" y1="' + y(stopLine) + '" y2="' + y(stopLine) + '"/>';
    }

    svg += '<path class="eq-line" d="' + points.map(function(p, i){
      return (i ? "L" : "M") + x(p.n).toFixed(1) + " " + y(p.balance).toFixed(1);
    }).join(" ") + '"/>';
    // Dots only while they have room — crowded dots would hide the line.
    if(N === 0 || pw / N >= 14){
      points.forEach(function(p){
        svg += '<circle class="eq-dot" r="4" cx="' + x(p.n).toFixed(1) + '" cy="' + y(p.balance).toFixed(1) + '"/>';
      });
    }

    svg += '<line class="crosshair" y1="' + mT + '" y2="' + (mT + ph) + '" visibility="hidden"/>' +
      '<circle class="eq-focus" r="5" visibility="hidden"/>' +
      '<rect class="hit" x="' + mL + '" y="' + mT + '" width="' + pw + '" height="' + ph + '" fill="transparent"/>' +
      "</svg>";

    elEquityChart.innerHTML = svg +
      '<div class="chart-key"><span><i></i>' + (stopLine === null ? "Start balance + filtered trades" : "Balance") + "</span>" +
      (stopLine === null ? "" : '<span><i class="dashed"></i>Stop-trading line ' + escapeHtml(fmtUsd(stopLine)) + "</span>") + "</div>";

    var crosshair = elEquityChart.querySelector(".crosshair");
    var focus = elEquityChart.querySelector(".eq-focus");
    var hit = elEquityChart.querySelector(".hit");

    function readout(p){
      var label = p.n === 0 ? "Start" : "After closed trade " + p.n;
      elEquityReadout.innerHTML = escapeHtml(label) + ": <b>" + escapeHtml(fmtUsd(p.balance)) + "</b>";
    }
    function showPoint(ev){
      var px = ev.clientX - elEquityChart.getBoundingClientRect().left;
      var idx = N === 0 ? 0 : Math.round((px - mL) / pw * N);
      var p = points[Math.max(0, Math.min(N, idx))];
      crosshair.setAttribute("x1", x(p.n)); crosshair.setAttribute("x2", x(p.n));
      focus.setAttribute("cx", x(p.n)); focus.setAttribute("cy", y(p.balance));
      crosshair.setAttribute("visibility", "visible");
      focus.setAttribute("visibility", "visible");
      readout(p);
    }
    function clearPoint(){
      crosshair.setAttribute("visibility", "hidden");
      focus.setAttribute("visibility", "hidden");
      readout(points[N]);
    }
    hit.addEventListener("pointermove", showPoint);
    hit.addEventListener("pointerdown", showPoint);
    hit.addEventListener("pointerleave", clearPoint);
    readout(points[N]);
  }

  var resizeQueued = false;
  window.addEventListener("resize", function(){
    if(resizeQueued) return;
    resizeQueued = true;
    window.requestAnimationFrame(function(){
      resizeQueued = false;
      if(!document.getElementById("view-dash").classList.contains("hidden")) renderDash();
    });
  });

  // ---------- position sizing + settings ----------
  var settingInputs = Array.prototype.slice.call(document.querySelectorAll("[data-setting]"));
  var elPairRows = document.getElementById("s-pairs");
  var elPairNew = document.getElementById("s-pair-new");
  var elPairError = document.getElementById("s-pair-error");

  // ---- sizing plans ----
  var sizingInputs = Array.prototype.slice.call(document.querySelectorAll("[data-sizing]"));
  var elSzError = document.getElementById("sz-error");
  var elPlanCards = document.getElementById("plan-cards");

  function legTable(plan, opts){
    opts = opts || {};
    if(plan.tooSmall){
      return '<div class="warn">Below 0.01 lots per leg at this balance — use fewer entries.</div>';
    }
    var rows = plan.legs.map(function(l){
      return "<tr><td>" + l.n + "</td>" +
        "<td>" + (l.offset === 0 ? "first" : "+" + l.offset + " pips") + "</td>" +
        "<td>" + l.stop + " pips</td>" +
        "<td>" + fmtLots(l.lots) + "</td>" +
        "<td>" + escapeHtml(fmtUsd(l.risk)) + "</td></tr>";
    }).join("");
    return '<div class="mini-scroll"><table class="mini-table plan-table">' +
      "<thead><tr><th>Entry</th><th>Layer</th><th>Stop</th><th>Lots</th><th>Risk $</th></tr></thead>" +
      "<tbody>" + rows + "</tbody>" +
      "<tfoot><tr><td colspan=\"3\">" + (plan.legs.length > 1 ? "All " + plan.legs.length + " entries" : "Total") + "</td>" +
      "<td>" + fmtLots(plan.totalLots) + "</td>" +
      "<td>" + escapeHtml(fmtUsd(plan.risk)) + (plan.riskPct !== null ? " · " + fmtPct(plan.riskPct) : "") + "</td></tr></tfoot>" +
      "</table></div>";
  }

  // The fixed reward:risk plan for one position: what's at risk, where the
  // stop goes to breakeven and what the take profit pays.
  function rrCard(title, plan, usd, sub){
    var sz = settings.sizing;
    if(!plan || plan.tooSmall){
      return '<div class="partials-card"><h4>' + escapeHtml(title) + '</h4><div class="hint">' +
        (plan ? "Below 0.01 lots at this balance." : "Stop too tight to layer.") + "</div></div>";
    }
    var lots = plan.legs.length > 1 ? plan.totalLots : plan.lots;
    // With layered entries, each leg sits closer to the stop: the take
    // profit is placed from the FIRST entry, so deeper legs make more.
    var totalStop = plan.totalStop;
    var risk = plan.risk;
    var tpPips = plan.stopFirst * sz.rr;
    var rewardPips = sum(plan.legs.map(function(l){ return tpPips + l.offset; }));
    var reward = round2(plan.lots * rewardPips * usd);
    var bePips = plan.stopFirst * sz.beAt;
    return '<div class="partials-card">' +
      '<div class="plan-block-head"><h4>' + escapeHtml(title) + '</h4><span class="plan-lots">' + fmtLots(lots) + " lots</span></div>" +
      (sub ? '<div class="hint">' + escapeHtml(sub) + "</div>" : "") +
      '<div class="mini-scroll"><table class="mini-table plan-table">' +
      "<thead><tr><th>Level</th><th>Pips from 1st entry</th><th>Result</th></tr></thead><tbody>" +
        "<tr><td>Stop loss</td><td>−" + plan.stopFirst + "</td><td>" + fmtMoney(-risk) + " (−1R)</td></tr>" +
        "<tr><td>Stop to BE</td><td>+" + clean(bePips) + "</td><td>" + sz.beAt + "R reached → risk-free</td></tr>" +
        "<tr><td>Take profit</td><td>+" + clean(tpPips) + "</td><td>" + fmtMoney(reward) + " (+" + (risk > 0 ? (reward / risk).toFixed(2) : "—") + "R)</td></tr>" +
      "</tbody></table></div>" +
      (plan.legs.length > 1 ? '<div class="hint">Stop measured from the first entry (' + totalStop + " pips across all legs). Deeper entries sit closer to the stop, so the idea pays a little more than " + sz.rr + "R.</div>" : "") +
    "</div>";
  }

  function renderRR(p, usd){
    var sz = settings.sizing;
    document.getElementById("rr-intro").innerHTML =
      "Take profit at <strong>" + sz.rr + "R</strong> (" + clean(p.stop * sz.rr) + " pips on a " + p.stop + "-pip stop) · stop to breakeven at <strong>" +
      sz.beAt + "R</strong> (" + clean(p.stop * sz.beAt) + " pips). Breakeven win rate at " + sz.rr + "R: <strong>" +
      fmtPct(1 / (1 + sz.rr)) + "</strong> — win more often than that and the plan makes money.";
    var rows = p.providers.map(function(x){ return [x.name, x]; }).concat([["Own trade", p.own]]);
    document.getElementById("partials-cards").innerHTML =
      '<div class="mini-scroll rr-wrap"><table class="mini-table rr-table">' +
      "<thead><tr><th>Who</th><th>Risk</th><th>1 entry</th><th>Stop loss (−1R)</th><th>BE at</th><th>Take profit (+" + sz.rr + "R)</th></tr></thead><tbody>" +
      rows.map(function(r){
        var plan = r[1].single;
        if(!plan || plan.tooSmall){
          return "<tr><td>" + escapeHtml(r[0]) + "</td><td>" + r[1].risk + "%</td><td colspan=\"4\" class=\"neutral\">Below 0.01 lots at this balance</td></tr>";
        }
        var st = r[1].stop;
        var reward = round2(plan.lots * st * sz.rr * usd);
        return "<tr><td>" + escapeHtml(r[0]) + "</td><td>" + r[1].risk + "%</td><td>" + fmtLots(plan.lots) + " lots</td>" +
          "<td>" + fmtMoney(-plan.risk) + " <span class=\"neutral\">(−" + st + " pips)</span></td>" +
          "<td>+" + clean(st * sz.beAt) + " pips</td>" +
          "<td>" + fmtMoney(reward) + " <span class=\"neutral\">(+" + clean(st * sz.rr) + " pips)</span></td></tr>";
      }).join("") + "</tbody></table></div>" +
      '<div class="hint field-gap">With 3 layered entries the take profit is measured from the first entry, so the deeper entries pay a little more than ' + sz.rr + "R.</div>";
  }

  function planBlock(title, plan, note, tag){
    return '<div class="plan-block">' +
      '<div class="plan-block-head"><h4>' + escapeHtml(title) + "</h4>" +
        (plan && !plan.tooSmall ? '<span class="plan-lots">' + fmtLots(plan.lots) + (plan.legs.length > 1 ? " each" : " lots") + "</span>" : "") +
        (tag ? '<span class="plan-tag">' + escapeHtml(tag) + "</span>" : "") +
      "</div>" +
      (note ? '<div class="hint">' + note + "</div>" : "") +
      (plan ? legTable(plan) : "") +
    "</div>";
  }

  function planCard(key, title, risk, sub, bodyHtml, extra){
    return '<div class="panel plan-card" data-plan="' + key + '">' +
      '<div class="plan-card-head"><h3>' + escapeHtml(title) + "</h3>" +
        '<span class="plan-risk">' + risk + "% risk</span></div>" +
      (sub ? '<div class="hint">' + sub + "</div>" : "") +
      (extra || "") + bodyHtml +
    "</div>";
  }

  // Position Sizing works on one account: the one picked at the top, or the
  // first account when "All accounts" is showing.
  function sizingAccount(){ return validActive() || (settings.accounts[0] ? settings.accounts[0].id : ""); }

  function renderSizingOutputs(){
    var accId = sizingAccount();
    var d = deriveAccount(accId);
    var a = d.account;
    document.getElementById("size-stand-title").textContent = "Where you stand — " + accountName(accId);
    var note = document.getElementById("size-acct-note");
    note.hidden = !!validActive() || !multiAccount();
    note.textContent = "Showing " + accountName(accId) + ". Pick an account at the top to size for another one.";
    var pair = settings.pairs.length ? settings.pairs[0].pair : "";
    var usd = pairSpec(settings, pair).usdPerPip;
    var p = sizingPlans(a.balance, settings, usd);
    var L = p.layer;

    document.getElementById("size-stand").innerHTML =
      statCard("closedPL", "Closed P/L", fmtMoney(a.closedPL)) +
      statCard("balance", "Current balance", escapeHtml(fmtUsd(a.balance))) +
      statCard("peak", "Peak balance", escapeHtml(fmtUsd(a.peak))) +
      statCard("drawdown", "Drawdown from peak", a.drawdownPct.toFixed(1) + "%") +
      statCard("stopLine", "Stop-trading line", escapeHtml(fmtUsd(a.stopLine))) +
      statCard("status", "Status", a.stopped ? "STOP — drawdown limit hit" : "OK to trade")
        .replace('class="stat-card"', 'class="stat-card ' + (a.stopped ? "status-stop" : "status-ok") + '"');

    function card(key, title, plan, sub){
      var layerNote = "Layered toward the stop every " + L + " pips; the last entry stays " + (plan.stop - 2 * L) + " pips from the stop.";
      var noLayer = "The " + plan.stop + "-pip stop is too tight to layer 3 entries " + L + " pips apart (needs " + p.minLayerStop + "+). Take 1 entry.";
      return planCard(key, title, plan.risk, sub,
        planBlock("1 entry", plan.single, "Stop " + plan.stop + " pips.") +
        (plan.three ? planBlock("3 entries", plan.three, layerNote) : '<div class="hint">' + escapeHtml(noLayer) + "</div>"));
    }

    var sub = "Sized from " + escapeHtml(accountName(accId)) + "'s balance (" + escapeHtml(fmtUsd(a.balance)) + ") on " + escapeHtml(pair || "your first pair") + ".";
    elPlanCards.innerHTML =
      p.providers.map(function(x){ return card("prov-" + x.id, x.name + " signals", x, sub); }).join("") +
      card("own", "Own trades", p.own, sub);

    renderRR(p, usd);
  }

  function sizingError(msg){
    elSzError.textContent = msg;
    elSzError.hidden = !msg;
  }
  var SIZING_MSG = {
    own: "Own-trade risk must be between 0.1% and " + MAX_IDEA_RISK + "% — " + MAX_IDEA_RISK + "% per idea is the hard cap.",
    provider: "Provider risk must be between 0.1% and " + MAX_IDEA_RISK + "% — " + MAX_IDEA_RISK + "% per idea is the hard cap.",
    signal: "Signal risk must be between 0.1% and " + MAX_IDEA_RISK + "% — " + MAX_IDEA_RISK + "% per idea is the hard cap.",
    rr: "The take-profit target must be between 0.5R and 10R.",
    beAt: "Breakeven must be between 0.25R and 5R.",
    layer: "The layer gap must be 5–50 pips."
  };
  function setSizing(key, value){
    var n = num(value);
    if(!sizingValid(key, n)){ sizingError(SIZING_MSG[key] || ""); return false; }
    sizingError("");
    settings.sizing = Object.assign({}, settings.sizing);
    settings.sizing[key] = n;
    saveSettings();
    return true;
  }
  sizingInputs.forEach(function(input){
    input.addEventListener("input", function(){
      if(setSizing(input.dataset.sizing, input.value)) renderSizingOutputs();
    });
    input.addEventListener("change", function(){
      input.value = settings.sizing[input.dataset.sizing];
      sizingError("");
    });
  });
  function renderPairRows(){
    var only = settings.pairs.length === 1;
    elPairRows.innerHTML = settings.pairs.map(function(p, i){
      return (
        '<div class="pair-row" data-index="' + i + '">' +
          '<div class="field"><label for="p-name-' + i + '">Pair</label>' +
            '<input type="text" id="p-name-' + i + '" class="p-name" value="' + escapeHtml(p.pair) + '"></div>' +
          '<div class="field"><label for="p-size-' + i + '">Pip size</label>' +
            '<input type="number" step="any" inputmode="decimal" id="p-size-' + i + '" class="p-size" value="' + p.pipSize + '"></div>' +
          '<div class="field"><label for="p-usd-' + i + '">$ per pip per lot</label>' +
            '<input type="number" step="any" inputmode="decimal" id="p-usd-' + i + '" class="p-usd" value="' + p.usdPerPip + '"></div>' +
          '<button type="button" class="p-remove" aria-label="Remove ' + escapeHtml(p.pair) + '"' +
            (only ? ' disabled title="At least one pair is needed"' : ' title="Remove this pair"') + ">&times;</button>" +
        "</div>"
      );
    }).join("");
  }

  // ---- accounts + providers editors ----
  var elAcctRows = document.getElementById("s-accounts");
  var elAcctNew = document.getElementById("s-acct-new");
  var elAcctError = document.getElementById("s-acct-error");
  var elProvRows = document.getElementById("s-providers");
  var elProvNew = document.getElementById("s-prov-new");
  var elProvError = document.getElementById("s-prov-error");
  function showErr(el, msg){ el.textContent = msg; el.hidden = !msg; }

  function accountUse(id){
    return trades.filter(function(t){ return accountIdOf(t, settings) === id; }).length +
      (settings.cashFlows || []).filter(function(f){ return f.account === id; }).length;
  }
  function providerUse(id){ return trades.filter(function(t){ return t.source === "Signal" && t.provider === id; }).length; }

  function renderAccountRows(){
    var only = settings.accounts.length === 1;
    elAcctRows.innerHTML = settings.accounts.map(function(a){
      var used = accountUse(a.id);
      return '<div class="pair-row" data-id="' + escapeHtml(a.id) + '">' +
        '<div class="field"><label>Account</label><input type="text" class="a-name" value="' + escapeHtml(a.name) + '" aria-label="Account name"></div>' +
        '<div class="field"><label>Starting deposit ($)</label><input type="number" step="any" inputmode="decimal" class="a-dep" value="' + a.startingDeposit + '"></div>' +
        '<div class="field"><label>Adjustment ($)</label><input type="number" step="any" inputmode="decimal" class="a-adj" value="' + a.adjustment + '"></div>' +
        '<button type="button" class="p-remove a-remove" aria-label="Remove ' + escapeHtml(a.name) + '"' +
          (only ? ' disabled title="At least one account is needed"' : used ? ' disabled title="Has trades or deposits — can\'t be removed"' : ' title="Remove this account"') + ">&times;</button>" +
      "</div>";
    }).join("");
  }
  function renderProviderRows(){
    elProvRows.innerHTML = settings.providers.map(function(v){
      var used = providerUse(v.id);
      return '<div class="pair-row" data-id="' + escapeHtml(v.id) + '">' +
        '<div class="field"><label>Provider</label><input type="text" class="v-name" value="' + escapeHtml(v.name) + '" aria-label="Provider name"></div>' +
        '<div class="field"><label>Risk per idea (%)</label><input type="number" step="any" inputmode="decimal" class="v-risk" value="' + v.risk + '"></div>' +
        '<div class="field"><label>Stop (pips) · ' + used + (used === 1 ? " trade" : " trades") + '</label><input type="number" step="any" inputmode="decimal" class="v-stop" value="' + (v.stop || settings.defaultStop) + '"></div>' +
        '<button type="button" class="p-remove v-remove" aria-label="Remove ' + escapeHtml(v.name) + '"' +
          (used ? ' disabled title="Has trades — can\'t be removed"' : ' title="Remove this provider"') + ">&times;</button>" +
      "</div>";
    }).join("") || '<div class="hint">No providers yet — add the people whose signals you take.</div>';
  }
  function nameTaken(list, name, exceptId){
    return list.some(function(x){ return x.id !== exceptId && x.name.toLowerCase() === name.toLowerCase(); });
  }
  function afterAccountChange(){
    saveSettings();
    renderAcctSwitch();
    renderAccountRows();
    renderFlows();
    renderSizingOutputs();
  }
  function afterProviderChange(){
    saveSettings();
    refreshWhoFilters();
    renderProviderRows();
    renderSizingOutputs();
  }

  elAcctRows.addEventListener("change", function(ev){
    var row = ev.target.closest(".pair-row"); if(!row) return;
    var a = accountById(settings, row.dataset.id); if(!a) return;
    showErr(elAcctError, "");
    if(ev.target.classList.contains("a-name")){
      var name = ev.target.value.trim();
      if(!name) return showErr(elAcctError, "An account needs a name.");
      if(nameTaken(settings.accounts, name, a.id)) return showErr(elAcctError, name + " is already an account.");
      a.name = name;
    }else{
      var n = num(ev.target.value);
      if(n === null) return showErr(elAcctError, "Enter a number (0 is fine).");
      if(ev.target.classList.contains("a-dep")){
        if(n < 0) return showErr(elAcctError, "The starting deposit can't be below 0.");
        a.startingDeposit = n;
      }else a.adjustment = n;
    }
    afterAccountChange();
  });
  elAcctRows.addEventListener("click", function(ev){
    var btn = ev.target.closest(".a-remove"); if(!btn || btn.disabled) return;
    var id = btn.closest(".pair-row").dataset.id;
    if(accountUse(id) || settings.accounts.length <= 1) return;
    settings.accounts = settings.accounts.filter(function(a){ return a.id !== id; });
    afterAccountChange();
  });
  function addAccount(){
    var name = elAcctNew.value.trim();
    if(!name) return showErr(elAcctError, "Type the account name first.");
    if(nameTaken(settings.accounts, name, "")) return showErr(elAcctError, name + " is already an account.");
    settings.accounts.push({ id: makeId(), name: name, startingDeposit: 0, adjustment: 0 });
    elAcctNew.value = "";
    showErr(elAcctError, "");
    afterAccountChange();
  }
  document.getElementById("s-acct-add").addEventListener("click", addAccount);
  elAcctNew.addEventListener("keydown", function(ev){ if(ev.key === "Enter"){ ev.preventDefault(); addAccount(); } });

  elProvRows.addEventListener("change", function(ev){
    var row = ev.target.closest(".pair-row"); if(!row) return;
    var v = providerById(settings, row.dataset.id); if(!v) return;
    showErr(elProvError, "");
    if(ev.target.classList.contains("v-name")){
      var name = ev.target.value.trim();
      if(!name) return showErr(elProvError, "A provider needs a name.");
      if(name === "Own Trade" || name === "Signal" || name === NO_PROVIDER || nameTaken(settings.providers, name, v.id)) return showErr(elProvError, name + " is already used.");
      v.name = name;
    }else if(ev.target.classList.contains("v-stop")){
      var st = num(ev.target.value);
      if(st === null || !(st > 0) || st > 1000) return showErr(elProvError, "The stop must be above 0 pips.");
      v.stop = st;
    }else{
      var n = num(ev.target.value);
      if(!sizingValid("signal", n)) return showErr(elProvError, SIZING_MSG.provider);
      v.risk = n;
    }
    afterProviderChange();
  });
  elProvRows.addEventListener("click", function(ev){
    var btn = ev.target.closest(".v-remove"); if(!btn || btn.disabled) return;
    var id = btn.closest(".pair-row").dataset.id;
    if(providerUse(id)) return;
    settings.providers = settings.providers.filter(function(v){ return v.id !== id; });
    afterProviderChange();
  });
  function addProvider(){
    var name = elProvNew.value.trim();
    if(!name) return showErr(elProvError, "Type the provider's name first.");
    if(name === "Own Trade" || name === "Signal" || name === NO_PROVIDER || nameTaken(settings.providers, name, "")) return showErr(elProvError, name + " is already used.");
    settings.providers.push({ id: makeId(), name: name, risk: SIZING_DEFAULTS.signal, stop: settings.defaultStop });
    elProvNew.value = "";
    showErr(elProvError, "");
    afterProviderChange();
  }
  document.getElementById("s-prov-add").addEventListener("click", addProvider);
  elProvNew.addEventListener("keydown", function(ev){ if(ev.key === "Enter"){ ev.preventDefault(); addProvider(); } });

  function renderSizing(){
    settingInputs.forEach(function(input){ input.value = settings[input.dataset.setting]; });
    sizingInputs.forEach(function(input){ input.value = settings.sizing[input.dataset.sizing]; });
    sizingError("");
    elPairError.hidden = true;
    showErr(elAcctError, "");
    showErr(elProvError, "");
    renderAccountRows();
    renderProviderRows();
    renderPairRows();
    renderFlows();
    renderSizingOutputs();
  }
  renderers.sizing = renderSizing;

  // ---- deposits / withdrawals ledger ----
  var elCfAccount = document.getElementById("cf-account");
  var elCfDate = document.getElementById("cf-date");
  var elCfType = document.getElementById("cf-type");
  var elCfAmount = document.getElementById("cf-amount");
  var elCfNote = document.getElementById("cf-note");
  var elCfError = document.getElementById("cf-error");
  var elCfTable = document.getElementById("cf-table");
  var unlockedFlows = {};   // id -> true while being edited; never saved, so a reload re-locks everything

  function cfError(msg){
    elCfError.textContent = msg;
    elCfError.hidden = !msg;
  }

  function accountOptions(selected){
    return settings.accounts.map(function(a){
      return '<option value="' + escapeHtml(a.id) + '"' + (a.id === selected ? " selected" : "") + ">" + escapeHtml(a.name) + "</option>";
    }).join("");
  }
  function renderFlows(){
    if(!elCfDate.value) elCfDate.value = todayStr();
    var keepAcc = elCfAccount.value || validActive();
    elCfAccount.innerHTML = accountOptions(keepAcc);
    if(keepAcc) elCfAccount.value = keepAcc;
    var list = sortedFlows(settings).reverse();
    if(!list.length){
      elCfTable.innerHTML = '<tbody><tr><td class="flow-empty">No deposits or withdrawals logged yet.</td></tr></tbody>';
      return;
    }
    var totIn = 0, totOut = 0;
    list.forEach(function(f){ if(f.type === "deposit") totIn += f.amount; else totOut += f.amount; });
    elCfTable.innerHTML =
      "<thead><tr><th>Account</th><th>Date</th><th>Type</th><th>Amount</th><th>Note</th><th></th></tr></thead><tbody>" +
      list.map(function(f){
        var signed = flowAmount(f);
        if(!unlockedFlows[f.id]){
          return '<tr data-id="' + escapeHtml(f.id) + '">' +
            "<td>" + escapeHtml(accountName(f.account)) + "</td>" +
            "<td>" + escapeHtml(fmtDayLabel(f.date)) + "</td>" +
            "<td>" + (f.type === "deposit" ? "Deposit" : "Withdrawal") + "</td>" +
            '<td class="' + (signed < 0 ? "neg" : "pos") + '">' + escapeHtml((signed < 0 ? "−" : "+") + fmtUsd(f.amount)) + "</td>" +
            '<td class="flow-note">' + escapeHtml(f.note) + "</td>" +
            '<td><span class="flow-lock" title="Locked">🔒</span> <button type="button" class="ghost small" data-act="unlock">Unlock</button></td>' +
          "</tr>";
        }
        return '<tr data-id="' + escapeHtml(f.id) + '" class="flow-editing">' +
          '<td><select data-f="account" aria-label="Account">' + accountOptions(f.account) + "</select></td>" +
          '<td><input type="date" data-f="date" value="' + escapeHtml(f.date) + '" aria-label="Date"></td>' +
          '<td><select data-f="type" aria-label="Type"><option value="deposit"' + (f.type === "deposit" ? " selected" : "") + '>Deposit</option><option value="withdrawal"' + (f.type === "withdrawal" ? " selected" : "") + ">Withdrawal</option></select></td>" +
          '<td><input type="number" step="any" min="0" inputmode="decimal" data-f="amount" value="' + f.amount + '" aria-label="Amount"></td>' +
          '<td><input type="text" data-f="note" value="' + escapeHtml(f.note) + '" aria-label="Note"></td>' +
          '<td><button type="button" class="small primary" data-act="lock">Save &amp; lock</button> <button type="button" class="ghost small danger" data-act="delete">Delete</button></td>' +
        "</tr>";
      }).join("") +
      '</tbody><tfoot><tr><td colspan="3">Total</td><td>' + escapeHtml("+" + fmtUsd(round2(totIn)) + " / −" + fmtUsd(round2(totOut))) + "</td><td colspan=\"2\"></td></tr></tfoot>";
  }

  function flowFromInputs(account, date, type, amountStr, note){
    var amount = num(amountStr);
    if(!accountById(settings, account)) return { error: "Pick the account the money went into or came out of." };
    if(!date) return { error: "Pick the date of the deposit or withdrawal." };
    if(amount === null || !(amount > 0)) return { error: "Enter an amount above $0." };
    return { flow: { account: account, date: date, type: type, amount: round2(amount), note: str(note).trim() } };
  }

  document.getElementById("cf-add").addEventListener("click", function(){
    var r = flowFromInputs(elCfAccount.value, elCfDate.value, elCfType.value, elCfAmount.value, elCfNote.value);
    if(r.error){ cfError(r.error); return; }
    cfError("");
    settings.cashFlows = (settings.cashFlows || []).concat([normalizeFlow(r.flow)]);
    elCfAmount.value = "";
    elCfNote.value = "";
    saveSettings();
    renderFlows();
    renderSizingOutputs();
  });

  elCfTable.addEventListener("click", function(ev){
    var btn = ev.target.closest("button[data-act]");
    if(!btn) return;
    var tr = btn.closest("tr");
    var id = tr.dataset.id;
    var act = btn.dataset.act;
    if(act === "unlock"){
      unlockedFlows[id] = true;
      renderFlows();
      return;
    }
    if(act === "delete"){
      // Two taps: the first arms the button, the second deletes.
      if(btn.dataset.armed !== "1"){ btn.dataset.armed = "1"; btn.textContent = "Tap again to delete"; return; }
      settings.cashFlows = settings.cashFlows.filter(function(f){ return f.id !== id; });
      delete unlockedFlows[id];
    }else if(act === "lock"){
      var get = function(k){ return tr.querySelector('[data-f="' + k + '"]').value; };
      var r = flowFromInputs(get("account"), get("date"), get("type"), get("amount"), get("note"));
      if(r.error){ cfError(r.error); return; }
      settings.cashFlows = settings.cashFlows.map(function(f){
        return f.id === id ? normalizeFlow(Object.assign({}, f, r.flow)) : f;
      });
      delete unlockedFlows[id];
    }
    cfError("");
    saveSettings();
    renderFlows();
    renderSizingOutputs();
  });

  // Settings apply as you type; a blank, non-numeric or out-of-range field
  // keeps the last good value and snaps back to it when you leave the field.
  settingInputs.forEach(function(input){
    input.addEventListener("input", function(){
      var n = num(input.value);
      if(n === null || !settingValid(input.dataset.setting, n)) return;
      settings[input.dataset.setting] = n;
      saveSettings();
      renderSizingOutputs();
    });
    input.addEventListener("change", function(){
      input.value = settings[input.dataset.setting];
    });
  });

  function pairError(msg){
    elPairError.textContent = msg;
    elPairError.hidden = !msg;
  }

  function pairNameTaken(name, exceptIndex){
    return settings.pairs.some(function(p, i){ return i !== exceptIndex && p.pair === name; });
  }

  elPairRows.addEventListener("change", function(ev){
    var row = ev.target.closest(".pair-row");
    if(!row) return;
    var i = Number(row.dataset.index), p = settings.pairs[i];
    pairError("");

    if(ev.target.classList.contains("p-name")){
      var name = ev.target.value.trim();
      if(name === "") pairError("A pair needs a name.");
      else if(pairNameTaken(name, i)) pairError(name + " is already in the list.");
      else if(name !== p.pair){
        // Carry the new name onto every trade logged on this pair.
        trades.forEach(function(t){ if(t.pair === p.pair) t.pair = name; });
        saveTrades();
        p.pair = name;
      }
    }else{
      var n = num(ev.target.value);
      if(n === null || n <= 0) pairError("Pip size and $ per pip must be above 0.");
      else if(ev.target.classList.contains("p-size")) p.pipSize = n;
      else p.usdPerPip = n;
    }
    saveSettings();
    renderPairRows();
    renderSizingOutputs();
  });

  elPairRows.addEventListener("click", function(ev){
    var btn = ev.target.closest(".p-remove");
    if(!btn || settings.pairs.length <= 1) return;
    var index = Number(btn.closest(".pair-row").dataset.index);
    var name = settings.pairs[index].pair;
    var used = trades.filter(function(t){ return t.pair === name; }).length;
    if(used){
      pairError("Used by " + used + (used === 1 ? " trade" : " trades") + " — " + name + " can't be removed.");
      return;
    }
    settings.pairs.splice(index, 1);
    pairError("");
    saveSettings();
    renderPairRows();
    renderSizingOutputs();
  });

  function addPair(){
    var name = elPairNew.value.trim();
    if(name === ""){ pairError("Type a pair name first."); return; }
    if(pairNameTaken(name, -1)){ pairError(name + " is already in the list."); return; }
    settings.pairs.push({ pair: name, pipSize: FALLBACK_PIP_SIZE, usdPerPip: FALLBACK_USD_PER_PIP });
    elPairNew.value = "";
    pairError("");
    saveSettings();
    renderPairRows();
    renderSizingOutputs();
  }
  document.getElementById("s-pair-add").addEventListener("click", addPair);
  elPairNew.addEventListener("keydown", function(ev){
    if(ev.key === "Enter"){ ev.preventDefault(); addPair(); }
  });

  // ---------- milestones ----------
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var elMsSource = document.getElementById("ms-source");
  var msSource = "";
  elMsSource.innerHTML = '<option value="">All sources</option>' + SOURCES.map(function(o){
    return '<option value="' + escapeHtml(o) + '">' + escapeHtml(o) + "</option>";
  }).join("");
  elMsSource.addEventListener("change", function(){ msSource = elMsSource.value; renderMilestones(); });

  function fmtAmount(v){
    if(v >= 1000000) return "$" + (v / 1000000) + "M";
    if(v >= 1000) return "$" + (v / 1000) + "k";
    return "$" + v;
  }
  function fmtDay(key){
    if(!key) return "";
    var d = parseLocalDate(key);
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }
  function fmtPeriod(kind, key){
    if(!key) return "";
    if(kind === "week") return "Week of " + fmtDay(key);
    if(kind === "month"){ var p = key.split("-"); return MONTHS[Number(p[1]) - 1] + " " + p[0]; }
    return fmtDay(key);
  }
  // The last calendar day of a period, for the "NEW" tag (unlocked in the
  // last 7 days).
  function periodEnd(kind, key){
    var d = parseLocalDate(kind === "month" ? key + "-01" : key);
    if(kind === "week") d.setDate(d.getDate() + 6);
    if(kind === "month") d = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return d;
  }
  function isRecent(kind, key){
    if(!key) return false;
    var age = (new Date() - periodEnd(kind, key)) / 86400000;
    return age <= 7;
  }

  var MS_NOUN = { day: "day", week: "week", month: "month", balance: "balance" };

  function badges(kind, list){
    return list.map(function(m){
      var label = fmtAmount(m.amount) + " " + MS_NOUN[kind];
      if(!m.unlocked){
        return '<div class="ms-badge locked" data-amount="' + m.amount + '"><div class="ms-amt">' + escapeHtml(label) + "</div>" +
          '<div class="ms-sub">Locked</div></div>';
      }
      var when = kind === "balance" ? fmtDay(m.key) : fmtPeriod(kind, m.key);
      return '<div class="ms-badge unlocked" data-amount="' + m.amount + '">' +
        (isRecent(kind === "balance" ? "day" : kind, m.key) ? '<span class="ms-new">NEW</span>' : "") +
        '<div class="ms-amt">' + escapeHtml(label) + "</div>" +
        '<div class="ms-sub">' + escapeHtml(when ? "Unlocked " + when : "Unlocked") + "</div>" +
        '<div class="ms-sub">' + (kind === "balance" ? escapeHtml(fmtUsd(m.value)) : "with " + fmtMoney(m.value)) + "</div>" +
      "</div>";
    }).join("");
  }

  function recordCard(key, label, rec, kind){
    if(!rec) return statCard(key, label, "—");
    return statCard(key, label, fmtMoney(rec.pl), fmtPeriod(kind, rec.key));
  }
  function streakCard(key, label, st){
    if(!st) return statCard(key, label, "—");
    return statCard(key, label, String(st.count) + (st.count === 1 ? " idea" : " ideas"),
      st.start === st.end ? fmtDay(st.start) : fmtDay(st.start) + " – " + fmtDay(st.end));
  }

  function renderMilestones(){
    var d = deriveView();
    var m = milestoneStats(d, msSource);

    // Balance progress: from the last unlocked level (or the starting
    // deposit) to the next locked one.
    var levels = m.tracks.balance;
    var next = levels.filter(function(x){ return !x.unlocked; })[0];
    var done = levels.filter(function(x){ return x.unlocked; });
    var from = done.length ? done[done.length - 1].amount : Math.min(d.account.base, m.balance);
    var prog = document.getElementById("ms-progress");
    if(next){
      var pct = Math.max(0, Math.min(1, (m.balance - from) / (next.amount - from)));
      prog.innerHTML =
        '<div class="ms-progress-label"><span>' + escapeHtml(fmtUsd(m.balance)) + "</span><span>Next: " + escapeHtml(fmtAmount(next.amount)) + "</span></div>" +
        '<div class="ms-bar"><div class="ms-fill" style="width:' + (pct * 100).toFixed(1) + '%"></div></div>' +
        '<div class="hint">' + escapeHtml(fmtUsd(round2(next.amount - m.balance))) + " to go · " + (pct * 100).toFixed(0) + "% of the way from " + escapeHtml(fmtAmount(from)) + "</div>";
    }else{
      prog.innerHTML = '<div class="ms-progress-label"><span>' + escapeHtml(fmtUsd(m.balance)) + "</span><span>Every balance milestone unlocked</span></div>";
    }

    document.getElementById("ms-balance").innerHTML = badges("balance", m.tracks.balance);
    document.getElementById("ms-day").innerHTML = badges("day", m.tracks.day);
    document.getElementById("ms-week").innerHTML = badges("week", m.tracks.week);
    document.getElementById("ms-month").innerHTML = badges("month", m.tracks.month);

    var r = m.records, cur = r.streaks.current;
    document.getElementById("ms-records").innerHTML =
      recordCard("bestDay", "Best day", r.day.best, "day") +
      recordCard("bestWeek", "Best week", r.week.best, "week") +
      recordCard("bestMonth", "Best month", r.month.best, "month") +
      recordCard("worstDay", "Worst day", r.day.worst, "day") +
      recordCard("worstWeek", "Worst week", r.week.worst, "week") +
      recordCard("worstMonth", "Worst month", r.month.worst, "month") +
      streakCard("winStreak", "Longest win streak", r.streaks.longestWin) +
      streakCard("lossStreak", "Longest losing streak", r.streaks.longestLoss) +
      statCard("current", "Current streak", cur ? cur.count + (cur.type === "W" ? (cur.count === 1 ? " win" : " wins") : (cur.count === 1 ? " loss" : " losses")) + " in a row" : "—") +
      statCard("ideas", "Closed ideas", String(r.ideas), r.wins + " W · " + r.losses + " L · " + r.be + " BE") +
      statCard("winRate", "Win rate", fmtPct(r.winRate), "wins ÷ (wins + losses), BE left out") +
      statCard("avgWin", "Avg win", r.avgWin === null ? "—" : fmtMoney(round2(r.avgWin))) +
      statCard("avgLoss", "Avg loss", r.avgLoss === null ? "—" : fmtMoney(round2(r.avgLoss)));
  }
  renderers.milestones = renderMilestones;

  // ---------- weekly review ----------
  var weekOffset = 0;   // 0 = this week, -1 = last week, ...
  var WEEK_WIN_RATE_LABEL = "Win rate (by idea)";
  var btnWkPrev = document.getElementById("wk-prev");
  var btnWkNext = document.getElementById("wk-next");
  var btnWkPdf = document.getElementById("wk-pdf");
  var btnWkXlsx = document.getElementById("wk-xlsx");
  var wkSource = document.getElementById("wk-source");
  wkSource.innerHTML = '<option value="">All sources</option>' + SOURCES.map(function(o){
    return '<option value="' + escapeHtml(o) + '">' + escapeHtml(o) + "</option>";
  }).join("");
  wkSource.addEventListener("change", function(){ renderWeekly(); });

  function shownWeekRange(){
    var d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return getWeekRange(d);
  }

  function renderWeekly(){
    var range = shownWeekRange();
    var d = deriveView();
    var w = weeklyStats(d, range, wkSource.value);
    var weekRows = d.rows.filter(function(r){
      return r.trade.date >= range.start && r.trade.date <= range.end && matchWho(r.trade.source, r.who, wkSource.value);
    });
    var rs = [], seen = {};
    weekRows.forEach(function(r){
      var idea = d.ideaById[r.idea];
      if(seen[r.idea] || !ideaClosed(idea)) return;
      seen[r.idea] = true;
      if(idea.r !== null && idea.r !== undefined) rs.push(idea.r);
    });

    document.getElementById("week-range-label").textContent =
      (weekOffset === 0 ? "This week · " : "") + range.start + " to " + range.end;
    btnWkNext.disabled = weekOffset >= 0;
    btnWkPdf.disabled = btnWkXlsx.disabled = w.logged === 0;
    document.getElementById("weekly-stats-grid").innerHTML =
      statCard("wkTrades", "Trades", String(w.trades)) +
      statCard("wkIdeas", "Ideas", String(w.ideas)) +
      statCard("wkNet", "Net P/L", w.closed ? fmtMoney(w.net) : "—") +
      statCard("wkWinRate", WEEK_WIN_RATE_LABEL, fmtPct(w.winRate)) +
      statCard("wkR", "Total R", fmtR(rs.length ? clean(sum(rs)) : null), rs.length ? "over " + rs.length + " ideas" : "");

    var empty = document.getElementById("weekly-empty");
    empty.hidden = w.logged !== 0;
    empty.textContent = wkSource.value ? "No " + wkSource.value + " trades this week" : "No trades this week";

    // The week's trades, newest last, so the review reads like a diary.
    var list = document.getElementById("weekly-trades");
    list.hidden = weekRows.length === 0;
    list.innerHTML = weekRows.length ? '<h2 class="panel-title">Trades this week</h2><div class="mini-scroll"><table class="mini-table week-table">' +
      "<thead><tr><th>#</th><th>Date</th><th>Who</th>" + (multiAccount() && !validActive() ? "<th>Account</th>" : "") + "<th>Dir</th><th>Session</th><th>P/L</th><th>R</th><th>Lesson</th></tr></thead><tbody>" +
      weekRows.map(function(r){
        var t = r.trade, c = r.calc;
        return "<tr><td>" + r.n + "</td><td>" + escapeHtml(t.date) + "</td><td>" + escapeHtml(r.who) + "</td>" +
          (multiAccount() && !validActive() ? "<td>" + escapeHtml(accountName(r.account)) + "</td>" : "") +
          '<td class="' + (t.direction === "Buy" ? "dir-buy" : "dir-sell") + '">' + escapeHtml(t.direction) + "</td>" +
          "<td>" + escapeHtml(t.session) + "</td>" +
          "<td>" + (c.isOpen ? '<span class="badge">Open</span>' : fmtMoney(c.pl)) + "</td>" +
          "<td>" + (c.isOpen ? "—" : fmtR(c.r)) + "</td>" +
          '<td class="week-lesson">' + (t.lesson ? escapeHtml(t.lesson) : '<span class="neutral">—</span>') + "</td></tr>";
      }).join("") + "</tbody></table></div>" : "";
  }
  renderers.weekly = renderWeekly;

  btnWkPrev.addEventListener("click", function(){ weekOffset--; renderWeekly(); });
  btnWkNext.addEventListener("click", function(){ if(weekOffset < 0){ weekOffset++; renderWeekly(); } });

  // ---------- weekly summary: PDF / Excel ----------
  // The libraries are only downloaded the first time you export.
  var LIB_URLS = {
    xlsx: ["https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"],
    pdf: [
      "https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js",
      "https://cdn.jsdelivr.net/npm/jspdf-autotable@5.0.8/dist/jspdf.plugin.autotable.min.js"
    ]
  };
  var scriptLoads = {};
  function loadScript(src){
    if(!scriptLoads[src]){
      scriptLoads[src] = new Promise(function(resolve, reject){
        var s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = function(){
          delete scriptLoads[src];
          reject(new Error("Couldn't download the export library. Check your connection and try again."));
        };
        document.head.appendChild(s);
      });
    }
    return scriptLoads[src];
  }
  function loadLibs(list){
    return list.reduce(function(p, src){ return p.then(function(){ return loadScript(src); }); }, Promise.resolve());
  }

  var BIAS_SHORT = { Bullish: "Bull", Bearish: "Bear", Ranging: "Rng" };

  // Everything both exports need, as plain values.
  function weekReport(){
    var range = shownWeekRange();
    var derived = deriveView();
    var source = wkSource.value;
    var w = weeklyStats(derived, range, source);
    var rows = derived.rows.filter(function(r){
      return r.trade.date >= range.start && r.trade.date <= range.end && matchWho(r.trade.source, r.who, source);
    });
    var before = derived.rows.filter(function(r){ return r.trade.date < range.start && r.calc.pl !== null; });
    var flowsBefore = sum(sortedFlows(settings).filter(function(f){ return f.date < range.start; }).map(flowAmount));
    var startBalance = round2(derived.account.base + flowsBefore + sum(before.map(function(r){ return r.calc.pl; })));
    var closed = rows.filter(function(r){ return r.calc.pl !== null; });
    var pls = closed.map(function(r){ return r.calc.pl; });

    return {
      range: range,
      who: (elUser.textContent || "").replace(/^ · /, ""),
      source: (source === "Signal" ? "All signals" : source || "All sources") + " · " + (validActive() ? accountName(validActive()) : "All accounts"),
      generated: todayStr(),
      summary: [
        ["Trades", w.trades],
        ["Ideas", w.ideas],
        ["Wins", pls.filter(function(v){ return v > 0; }).length],
        ["Losses", pls.filter(function(v){ return v < 0; }).length],
        ["Breakeven", pls.filter(function(v){ return v === 0; }).length],
        [WEEK_WIN_RATE_LABEL, w.winRate === null ? null : pct1(w.winRate)],
        ["Net P/L ($)", w.closed ? w.net : null],
        ["Best trade ($)", pls.length ? Math.max.apply(null, pls) : null],
        ["Worst trade ($)", pls.length ? Math.min.apply(null, pls) : null],
        ["Balance at start ($)", startBalance],
        [source ? "Balance at end, " + source + " trades only ($)" : "Balance at end ($)", round2(startBalance + (w.closed ? w.net : 0))]
      ],
      trades: rows.map(function(r){
        var t = r.trade, c = r.calc, b = t.bias;
        return {
          n: r.n, date: t.date, session: t.session, pair: t.pair, direction: t.direction, source: r.who, account: accountName(r.account), r: c.r,
          bias: [b.daily, b.h4, b.h1, b.m15].map(function(v){ return BIAS_SHORT[v] || "-"; }).join(" / "),
          entry: t.entry, stop: t.stopLoss, priceDp: c.spec.priceDp, slPips: c.slPips, lots: c.isOpen ? null : c.lots, pl: c.pl,
          idea: r.idea, result: resultOf(c),
          confirmation: t.confirmation, lesson: t.lesson,
          closes: c.closes
        };
      })
    };
  }

  function fileSlug(){ return APP_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "trade-journal"; }
  function weekFileName(rep, ext){
    return fileSlug() + "-week-" + rep.range.start + (rep.source !== "All sources" ? "-" + rep.source.toLowerCase().replace(/\s+/g, "-") : "") + "." + ext;
  }

  function exportFailed(err){
    console.error("Weekly export failed", err);
    window.alert(errText(err));
  }

  function withBusy(btn, label, job){
    var old = btn.textContent;
    btn.disabled = true;
    btn.textContent = label;
    return job().catch(exportFailed).then(function(){
      btn.textContent = old;
      btn.disabled = false;
    });
  }

  // ---- Excel: Summary, Trades and Closes sheets ----
  function exportWeekXlsx(){
    var rep = weekReport();
    return loadLibs(LIB_URLS.xlsx).then(function(){
      var X = window.XLSX;
      var wb = X.utils.book_new();

      var summary = [
        [APP_NAME + " — weekly summary"],
        ["Week", rep.range.start + " to " + rep.range.end],
        ["Source", rep.source],
        ["Account", rep.who],
        ["Generated", rep.generated],
        []
      ].concat(rep.summary);
      var ws1 = X.utils.aoa_to_sheet(summary);
      // The win-rate label has no "(%)", so store it as a real percentage
      // (0.5 shown as 50.0%) rather than a bare 50.
      summary.forEach(function(row, r){
        if(row[0] !== WEEK_WIN_RATE_LABEL || row[1] === null) return;
        ws1[X.utils.encode_cell({ r: r, c: 1 })] = { t: "n", v: round2(row[1] * 10) / 1000, z: "0.0%" };
      });
      ws1["!cols"] = [{ wch: 36 }, { wch: 24 }];
      X.utils.book_append_sheet(wb, ws1, "Summary");

      var head = ["#", "Date", "Account", "Session", "Pair", "Direction", "Who", "Bias D/4H/1H/15M", "Entry", "Stop",
        "SL pips", "Lots", "P/L ($)", "R", "Idea", "Result", "Confirmation", "Mistake / Lesson"];
      var body = rep.trades.map(function(t){
        return [t.n, t.date, t.account, t.session, t.pair, t.direction, t.source, t.bias, t.entry, t.stop,
          t.slPips, t.lots, t.pl, t.r === null ? null : round2(t.r), t.idea, t.result, t.confirmation, t.lesson];
      });
      var ws2 = X.utils.aoa_to_sheet([head].concat(body));
      ws2["!cols"] = [5, 11, 12, 10, 9, 9, 14, 22, 9, 9, 8, 6, 9, 6, 5, 7, 40, 40].map(function(w){ return { wch: w }; });
      X.utils.book_append_sheet(wb, ws2, "Trades");

      var closes = [["Trade #", "Date", "Type", "Price", "Lots", "Pips", "P/L ($)"]];
      rep.trades.forEach(function(t){
        t.closes.forEach(function(c){ closes.push([t.n, t.date, c.type, c.price, c.lots, c.pips, c.pl]); });
      });
      var ws3 = X.utils.aoa_to_sheet(closes);
      ws3["!cols"] = [8, 11, 11, 10, 7, 8, 9].map(function(w){ return { wch: w }; });
      X.utils.book_append_sheet(wb, ws3, "Closes");

      X.writeFile(wb, weekFileName(rep, "xlsx"));
    });
  }

  // ---- PDF: week stats, trades, closes, notes ----
  // The PDF's built-in font only covers basic Latin, so swap the few
  // symbols that would otherwise print as junk.
  function pdfText(v){
    if(v === null || v === undefined || v === "") return "-";
    return String(v)
      .replace(/[−–—]/g, "-").replace(/≤/g, "<=").replace(/≥/g, ">=")
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, "...")
      .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?");
  }
  function pdfNum(v, dp){ return v === null || v === undefined ? "-" : Number(v).toFixed(dp); }
  function pdfUsd(v){ return v === null || v === undefined ? "-" : fmtUsd(v); }

  function exportWeekPdf(){
    var rep = weekReport();
    return loadLibs(LIB_URLS.pdf).then(function(){
      var doc = new window.jspdf.jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      var HEAD = [20, 20, 24], INK = [255, 255, 255], GREEN = [22, 140, 80], RED = [200, 40, 55];
      var M = 36;
      var headStyles = { fillColor: HEAD, textColor: INK, fontStyle: "bold" };
      function plColor(data, col){
        if(data.section !== "body" || data.column.index !== col) return;
        var raw = data.row.raw[col];
        if(/^-\$/.test(raw)) data.cell.styles.textColor = RED;
        else if(/^\$/.test(raw) && raw !== "$0.00") data.cell.styles.textColor = GREEN;
      }

      doc.setFontSize(16);
      doc.text(pdfText(APP_NAME + " - Weekly Summary"), M, 40);
      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(pdfText("Week " + rep.range.start + " to " + rep.range.end + "   |   " + rep.source +
        (rep.who ? "   |   " + rep.who : "") + "   |   generated " + rep.generated), M, 56);
      doc.setTextColor(0);

      var summaryBody = rep.summary.map(function(s){
        var label = s[0], v = s[1];
        if(v === null) v = "-";
        else if(/\(\$\)/.test(label)) v = fmtUsd(v);
        else if(label === WEEK_WIN_RATE_LABEL) v = Number(v).toFixed(1) + "%";
        return [label.replace(/ \((\$|%)\)$/, ""), pdfText(v)];
      });
      doc.autoTable({
        startY: 70, margin: { left: M }, tableWidth: 300, theme: "grid",
        head: [["Week stats", ""]], body: summaryBody, headStyles: headStyles,
        styles: { fontSize: 9, cellPadding: 3 },
        didParseCell: function(data){ plColor(data, 1); }
      });
      var y = doc.lastAutoTable.finalY + 22;

      doc.autoTable({
        startY: y, margin: { left: M, right: M }, theme: "striped",
        head: [["#", "Date", "Session", "Pair", "Dir", "Source", "Bias D/4H/1H/15M", "Entry", "Stop",
          "SL pips", "Lots", "P/L", "R", "Idea", "Result"]],
        body: rep.trades.map(function(t){
          return [t.n, t.date, pdfText(t.session), pdfText(t.pair), t.direction, pdfText(t.source), t.bias,
            pdfNum(t.entry, t.priceDp), pdfNum(t.stop, t.priceDp), pdfNum(t.slPips, 1), pdfNum(t.lots, 2), pdfUsd(t.pl),
            t.r === null ? "-" : (t.r > 0 ? "+" : "") + t.r.toFixed(2) + "R", t.idea, t.result];
        }),
        headStyles: headStyles, styles: { fontSize: 8, cellPadding: 3 },
        didParseCell: function(data){ plColor(data, 11); }
      });

      var closeRows = [];
      rep.trades.forEach(function(t){
        t.closes.forEach(function(c){
          closeRows.push([t.n, t.date, pdfText(c.type), pdfNum(c.price, t.priceDp), pdfNum(c.lots, 2), pdfNum(c.pips, 1), pdfUsd(c.pl)]);
        });
      });
      if(closeRows.length){
        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 20, margin: { left: M }, tableWidth: 480, theme: "striped",
          head: [["Trade #", "Date", "Close", "Price", "Lots", "Pips", "P/L"]], body: closeRows,
          headStyles: headStyles, styles: { fontSize: 8, cellPadding: 3 },
          didParseCell: function(data){ plColor(data, 6); }
        });
      }

      var notes = rep.trades.filter(function(t){ return t.confirmation.trim() || t.lesson.trim(); });
      if(notes.length){
        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 20, margin: { left: M, right: M }, theme: "grid",
          head: [["#", "Confirmation", "Mistake / Lesson"]],
          body: notes.map(function(t){ return [t.n, pdfText(t.confirmation.trim()), pdfText(t.lesson.trim())]; }),
          headStyles: headStyles, styles: { fontSize: 8.5, cellPadding: 4, valign: "top" },
          columnStyles: { 0: { cellWidth: 30 } }
        });
      }

      doc.save(weekFileName(rep, "pdf"));
    });
  }

  btnWkPdf.addEventListener("click", function(){ withBusy(btnWkPdf, "Preparing…", exportWeekPdf); });
  btnWkXlsx.addEventListener("click", function(){ withBusy(btnWkXlsx, "Preparing…", exportWeekXlsx); });

  // ---------- export / import ----------
  // Backups made by this journal carry this id and version.
  var EXPORT_APP = "trade-journal";
  var EXPORT_VERSION = 1;

  document.getElementById("btn-export").addEventListener("click", function(){
    var payload = {
      app: EXPORT_APP,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      settings: settings,
      trades: trades
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = fileSlug() + "-backup-" + todayStr() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Returns an error message, or "" if the file is a version 3 backup.
  function importProblem(data){
    var isObject = data && typeof data === "object" && !Array.isArray(data);
    if(isObject && data.app === "callisto-journal"){
      return "That backup is from your other journal (Johnson Journal). This journal starts clean and only imports its own backups.";
    }
    var ok = isObject &&
      data.app === EXPORT_APP &&
      data.version === EXPORT_VERSION &&
      data.settings && typeof data.settings === "object" && !Array.isArray(data.settings) &&
      Array.isArray(data.trades) &&
      data.trades.every(function(t){ return t && typeof t === "object" && !Array.isArray(t); });
    return ok ? "" : "That file doesn't look like a backup from this journal.";
  }

  function importText(text){
    var data;
    try{
      data = JSON.parse(text);
    }catch(e){
      window.alert("That file isn't valid JSON. Import cancelled — nothing was changed.");
      return;
    }
    var problem = importProblem(data);
    if(problem){
      window.alert(problem + " Import cancelled — nothing was changed.");
      return;
    }
    var ok = window.confirm(
      "Importing will REPLACE all " + trades.length + " trade(s) and your settings with the " +
      data.trades.length + " trade(s) and settings from this file. This cannot be undone. Continue?"
    );
    if(!ok) return;

    trades = data.trades.map(normalizeTrade);
    settings = normalizeSettings(data.settings);
    saveTrades();
    saveSettings();
    expandedIds.clear();
    resetForm();
    showView("list");
    window.alert("Import complete: " + trades.length + " trade(s) loaded.");
  }

  var importFileInput = document.getElementById("import-file");
  document.getElementById("btn-import").addEventListener("click", function(){
    importFileInput.value = "";
    importFileInput.click();
  });
  importFileInput.addEventListener("change", function(){
    var file = importFileInput.files && importFileInput.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(){ importText(String(reader.result)); };
    reader.readAsText(file);
  });

  // ---------- sign-in ----------
  var authScreen = document.getElementById("auth-screen");
  var authForm = document.getElementById("auth-form");
  var authLoading = document.getElementById("auth-loading");
  var authEmail = document.getElementById("auth-email");
  var authPassword = document.getElementById("auth-password");
  var authError = document.getElementById("auth-error");
  var authSubmit = document.getElementById("auth-submit");
  var btnSignOut = document.getElementById("btn-signout");
  var elUser = document.getElementById("user-email");

  // mode: "login" (form) or "loading" (spinner text). msg shows under the form.
  function showAuth(mode, msg){
    authScreen.hidden = false;
    authForm.hidden = mode !== "login";
    authLoading.hidden = mode !== "loading";
    authError.textContent = msg || "";
    authError.hidden = !msg;
    if(mode === "login") setTimeout(function(){ (authEmail.value ? authPassword : authEmail).focus(); }, 0);
  }
  function hideAuth(){ authScreen.hidden = true; }

  function clearJournal(){
    loaded = false;
    clearTimeout(settingsTimer);
    trades = [];
    settings = defaultSettings();
    cloudTrades = {};
    tradeSaving = tradeAgain = settingsSaving = settingsDirty = false;
    tradeError = settingsError = "";
    expandedIds.clear();
    resetForm();
    showView("list");
    refreshSync();
  }

  function loadJournal(){
    showAuth("loading");
    Promise.all([
      fetchAllTrades(),
      sb.from("settings").select("data").eq("user_id", userId).maybeSingle().then(check)
    ]).then(function(res){
      trades = res[0].map(function(r){
        return normalizeTrade(Object.assign({}, r.data, { id: r.id }));
      });
      cloudTrades = {};
      trades.forEach(function(t){ cloudTrades[t.id] = JSON.stringify(t); });
      settings = normalizeSettings(res[1].data ? res[1].data.data : null);
      loaded = true;
      expandedIds.clear();
      resetForm();
      showView("list");
      hideAuth();
      refreshSync();
    }, function(err){
      console.error("Loading the journal failed", err);
      showAuth("login", "Signed in, but your journal couldn't be loaded: " + errText(err) + ". Check your connection and sign in again.");
      sb.auth.signOut();
    });
  }

  authForm.addEventListener("submit", function(ev){
    ev.preventDefault();
    authSubmit.disabled = true;
    authError.hidden = true;
    sb.auth.signInWithPassword({ email: authEmail.value.trim(), password: authPassword.value })
      .then(function(res){
        if(res.error){
          var bad = /invalid login credentials/i.test(res.error.message || "");
          showAuth("login", bad ? "Wrong email or password." : errText(res.error));
        }else{
          authPassword.value = "";
        }
      }, function(err){ showAuth("login", errText(err)); })
      .then(function(){ authSubmit.disabled = false; });
  });

  btnSignOut.addEventListener("click", function(){
    if(hasUnsaved() && !window.confirm("Some changes haven't reached the cloud yet. Sign out anyway and lose them?")) return;
    sb.auth.signOut();
  });

  // Not connected to Supabase yet: say so on the sign-in box and stop here.
  if(!sb){
    resetForm();
    showView("list");
    authScreen.hidden = false;
    authForm.hidden = true;
    authLoading.hidden = false;
    authLoading.innerHTML = CONFIGURED ?
      "Couldn't load the database library. Check your connection and reload the page." :
      "<strong>Almost there.</strong> Open <code>config.js</code> and paste in your Supabase project URL and publishable key (README step 3), then reload.";
    return;
  }

  // Fires once on page load (INITIAL_SESSION) and on every sign-in/out.
  // Supabase calls must not run inside this callback, hence setTimeout.
  sb.auth.onAuthStateChange(function(event, session){
    var id = session && session.user ? session.user.id : null;
    setTimeout(function(){
      if(id && id !== userId){
        userId = id;
        elUser.textContent = session.user.email ? " · " + session.user.email : "";
        btnSignOut.hidden = false;
        loadJournal();
      }else if(!id && (userId !== null || event === "INITIAL_SESSION")){
        userId = null;
        elUser.textContent = "";
        btnSignOut.hidden = true;
        clearJournal();
        showAuth("login");
      }
    }, 0);
  });

  // ---------- init ----------
  resetForm();
  showView("list");
  refreshSync();
  showAuth("loading");
})();
