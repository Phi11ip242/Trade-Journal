(function(){
  "use strict";

  // Your Supabase project and the journal's name live in config.js. The
  // publishable key is meant to be public: Row Level Security in the
  // database only lets the signed-in owner read or write their own rows.
  var CONFIG = (typeof window !== "undefined" && window.JOURNAL_CONFIG) || {};
  var SUPABASE_URL = String(CONFIG.supabaseUrl || "");
  var SUPABASE_KEY = String(CONFIG.supabaseKey || "");
  var APP_NAME = String(CONFIG.appName || "Trade Journal");
  var CONFIGURED = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(SUPABASE_URL) && SUPABASE_KEY.length > 20;

  var SESSIONS = ["Asia", "London", "New York"];
  var DIRECTIONS = ["Buy", "Sell"];
  var SOURCES = ["Premium", "Grind Room", "Institutional", "Own Trade"];
  // Sources no longer traded: old trades keep them so the history and
  // balance stay right, but they can't be picked for new trades.
  var OLD_SOURCES = ["AJ"];
  var ALL_SOURCES = SOURCES.concat(OLD_SOURCES);
  // Broker accounts. Each keeps its own deposit, deposits/withdrawals,
  // balance, drawdown and lot sizes. The first one is where trades without
  // an account (e.g. from a Johnson Journal backup) belong.
  var DEFAULT_ACCOUNTS = [
    { id: "acc-ava", name: "AvaTrade", startingDeposit: 1000, adjustment: 0 },
    { id: "acc-kudo", name: "Kudo", startingDeposit: 0, adjustment: 0 }
  ];
  var BIASES = ["Bullish", "Bearish", "Ranging"];
  var BIAS_FRAMES = [["daily", "Daily"], ["h4", "4H"], ["h1", "1H"], ["m15", "15M"]];
  // Risk per single trade by source, % of balance: the default the sizer
  // starts at, and the most it allows.
  var SOURCE_RISK = {
    "Premium":       { def: 20, max: 30 },
    "Grind Room":    { def: 20, max: 30 },
    "Institutional": { def: 20, max: 30 },
    "Own Trade":     { def: 5,  max: 20 }
  };
  var CLOSE_TYPES = ["SL", "Force Close", "TP1", "TP2", "TP3", "TP4", "TP5", "TP6", "TP7", "TP8", "TP9", "TP10", "Full TP", "BE"];

  // Used when a trade's pair isn't in the Settings pair list (same as the
  // Excel's IFERROR default), so a calc never comes out as NaN.
  var FALLBACK_PIP_SIZE = 0.1;
  var FALLBACK_USD_PER_PIP = 10;

  // Split entries: same date/pair/direction/source and entries closer than
  // this many pips (of that pair's pip size — 8.00 on gold) are one idea.
  var IDEA_ENTRY_GAP_PIPS = 80;

  // Split-entry risk planner defaults: Premium legs (100-pip stop from the
  // worst entry, entries ~20 pips apart) and Grind Room legs (Aaron's
  // 120-pip structure, entries ~10 pips apart).
  var SPLIT_STOPS_DEFAULT = { premium: [100, 80, 60, 50], grind: [120, 110, 100, 90, 80, 70] };
  var SPLIT_RISK_LEVELS = [20, 30];   // % of balance: normal max, absolute max

  // Position sizing plans (Position Sizing tab). Risk is % of the balance
  // for the WHOLE idea (all legs together). Signals are capped at 20%.
  var SIZING_DEFAULTS = {
    own: 10,            // Own Trade risk %
    premium: 20,        // Premium risk %
    grindLive: 20,      // Grind Room live (Zoom) risk %
    grindSignal: 20,    // Grind Room signal risk %
    inst: 20,           // IT / Thomas risk %
    layer: 25,          // pips between layered entries (Own, Premium, IT): 20–25
    grindLiveStop: 120, // Grind live stop from the worst entry: usually 120, sometimes 130–150
    instStop: 100,      // IT stop from the first entry (he uses 30–100)
  };
  var SIZING_RISK_KEYS = ["own", "premium", "grindLive", "grindSignal", "inst"];
  var SIZING_LIMITS = {
    own: [0.1, 30], premium: [0.1, 20], grindLive: [0.1, 20], grindSignal: [0.1, 20], inst: [0.1, 20],
    layer: [20, 25], grindLiveStop: [100, 150], instStop: [10, 100]
  };
  var OWN_PREM_STOP = 100;          // Own Trade and Premium: 100-pip max stop from the first entry
  var GRIND_SIGNAL_STOP = 120;      // Grind Room signal: 120 from the first (worst) entry
  var GRIND_LIVE_LEGS = 8, GRIND_SIGNAL_LEGS = 5, GRIND_LAYER = 10;
  var LAST_LEG_MIN_STOP = 50;       // a layered entry must stay at least 50 pips from the stop

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

  // ---------- starter Psychology chapters ----------
  // Edited in the app (Edit button on each tab) and saved with the settings.
  // Body text: "- " bullets, "1. " numbered steps, "## " sub-headings,
  // "> " a note, **bold**, and a blank line between paragraphs.
  var DEFAULT_BOOKS = {
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

  // A book (Psychology) is a list of chapters: { id, title, body }.
  function normalizeBook(v){
    if(!Array.isArray(v)) return null;
    return v.filter(function(c){ return c && typeof c === "object"; }).map(function(c){
      return { id: str(c.id) || makeId(), title: str(c.title), body: str(c.body) };
    });
  }

  // ---------- settings + trade shapes ----------
  function defaultSettings(){
    return {
      startingDeposit: 1000,
      depositsWithdrawals: 0,
      riskOwnPremium: 20,      // % — Own Trade and Premium
      riskGrindInst: 5,        // % — Grind Room and Institutional
      defaultStop: 100,        // pips
      maxDrawdown: 30,         // %
      // Split-entry risk planner: one stop distance (pips) per leg, worst
      // entry first. Edited on the Position Sizing tab.
      splitStopsPremium: SPLIT_STOPS_DEFAULT.premium.slice(),
      splitStopsGrind: SPLIT_STOPS_DEFAULT.grind.slice(),
      pairs: [{ pair: "XAUUSD", pipSize: FALLBACK_PIP_SIZE, usdPerPip: FALLBACK_USD_PER_PIP }],
      sizing: Object.assign({}, SIZING_DEFAULTS),
      accounts: DEFAULT_ACCOUNTS.map(function(a){ return Object.assign({}, a); }),
      psychology: defaultBook("psychology"),
      psychReadAt: "",         // last time the Psychology tab was marked as read
      backtests: []                       // practice trades (Backtest tab)
    };
  }

  // Risk % and max drawdown must be above 0 and at most 100; the default
  // stop must be above 0. The two money fields take any number.
  function settingValid(key, n){
    if(key === "riskOwnPremium" || key === "riskGrindInst" || key === "maxDrawdown") return n > 0 && n <= 100;
    if(key === "defaultStop") return n > 0;
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

  var SETTINGS_KEYS = ["startingDeposit", "depositsWithdrawals", "riskOwnPremium", "riskGrindInst", "defaultStop", "maxDrawdown",
    "splitStopsPremium", "splitStopsGrind", "pairs", "cashFlows", "sizing", "accounts", "psychology", "psychReadAt", "backtests"];

  // ---- backtests ----
  // Practice trades from replay/backtesting. Kept apart from real trades: they
  // never touch balances, P/L or any real stat. Stored with the settings, so
  // they go into the JSON backup too.
  var BT_MODELS = ["Own (SMC)", "Aaron EMAs", "AMD", "SMT", "Other"];
  var BT_CONFIRMATIONS = ["CHoCH + retest", "CHoCH + engulfing", "iFVG", "Engulfing", "EMA tap", "Other", "None"];
  var BT_CONFLUENCES = ["HTF POI", "Fresh POI", "Liquidity sweep", "Session high/low", "Devil's mark", "SMT", "FVG", "Order block", "EMA tap", "Displacement"];
  var BT_RESULTS = ["TP hit", "SL hit", "Breakeven", "Closed manually"];
  var BT_KEYS = ["id", "createdAt", "updatedAt", "date", "time", "pair", "direction", "session", "model", "bias",
    "confluences", "confirmation", "confirmationNote", "entry", "stopLoss", "takeProfit", "result", "exit", "mfePips",
    "mistakes", "lessons", "link", "status", "beAt", "notes"];
  var BT_STATUSES = ["Closed", "Open"];
  function normalizeBacktest(b){
    b = (b && typeof b === "object") ? b : {};
    var bias = (b.bias && typeof b.bias === "object") ? b.bias : {};
    var createdAt = num(b.createdAt); if(createdAt === null) createdAt = Date.now();
    var updatedAt = num(b.updatedAt);
    function bv(v){ return v === "Bullish" || v === "Bearish" ? v : ""; }
    return Object.assign(extraFields(b, BT_KEYS), {
      id: str(b.id) || makeId(),
      createdAt: createdAt,
      updatedAt: updatedAt === null ? createdAt : updatedAt,
      date: /^\d{4}-\d{2}-\d{2}$/.test(str(b.date)) ? str(b.date) : "",
      time: str(b.time).slice(0, 10),
      pair: str(b.pair) || "XAUUSD",
      direction: b.direction === "Sell" ? "Sell" : "Buy",
      session: SESSIONS.indexOf(b.session) === -1 ? "" : b.session,
      model: BT_MODELS.indexOf(b.model) === -1 ? "Other" : b.model,
      bias: { daily: bv(bias.daily), h4: bv(bias.h4), h1: bv(bias.h1), m15: bv(bias.m15) },
      confluences: Array.isArray(b.confluences) ? b.confluences.filter(function(c){ return BT_CONFLUENCES.indexOf(c) !== -1; }) : [],
      confirmation: BT_CONFIRMATIONS.indexOf(b.confirmation) === -1 ? "None" : b.confirmation,
      confirmationNote: str(b.confirmationNote),
      entry: num(b.entry), stopLoss: num(b.stopLoss), takeProfit: num(b.takeProfit),
      result: BT_RESULTS.indexOf(b.result) === -1 ? "Closed manually" : b.result,
      exit: num(b.exit), mfePips: num(b.mfePips),
      mistakes: str(b.mistakes), lessons: str(b.lessons), link: str(b.link),
      status: b.status === "Open" ? "Open" : "Closed",   // Open = still playing out; left out of the stats
      beAt: num(b.beAt),                                  // price where the stop would go to breakeven
      notes: str(b.notes)
    });
  }
  // Derived numbers for one backtest: stop and result in pips, R, planned R:R,
  // and how many bias timeframes agree with the direction.
  function backtestCalc(b, settings){
    var spec = pairSpec(settings, b.pair);
    var dir = b.direction === "Sell" ? -1 : 1;
    var stopPips = (b.entry !== null && b.stopLoss !== null) ? Math.abs(b.entry - b.stopLoss) / spec.pipSize : null;
    var isOpen = b.status === "Open";
    var exitPrice = isOpen ? null : b.exit !== null ? b.exit
      : b.result === "TP hit" ? b.takeProfit
      : b.result === "SL hit" ? b.stopLoss
      : b.result === "Breakeven" ? b.entry : null;
    var resultPips = (b.entry !== null && exitPrice !== null) ? (exitPrice - b.entry) * dir / spec.pipSize : null;
    var r = (resultPips !== null && stopPips) ? resultPips / stopPips : null;
    var plannedRR = (b.entry !== null && b.takeProfit !== null && stopPips) ? (b.takeProfit - b.entry) * dir / spec.pipSize / stopPips : null;
    var want = dir === 1 ? "Bullish" : "Bearish";
    var aligned = ["daily", "h4", "h1", "m15"].filter(function(k){ return b.bias[k] === want; }).length;
    var outcome = r === null ? "open" : r > 0.05 ? "win" : r < -0.05 ? "loss" : "be";
    // Breakeven trigger: how far in favour (pips and R) the stop goes to entry.
    var bePips = (b.entry !== null && b.beAt !== null) ? (b.beAt - b.entry) * dir / spec.pipSize : null;
    var beR = (bePips !== null && stopPips) ? bePips / stopPips : null;
    return { stopPips: stopPips, resultPips: resultPips, r: r, plannedRR: plannedRR, aligned: aligned, outcome: outcome,
      isOpen: isOpen, bePips: bePips, beR: beR };
  }

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

  // A list of stop distances: every value a number above 0, at least one.
  // Anything else is null (and the default list is kept).
  function stopList(v){
    if(!Array.isArray(v) || !v.length) return null;
    var out = v.map(num);
    return out.every(function(n){ return n !== null && n > 0; }) ? out : null;
  }

  function normalizeSettings(s){
    s = (s && typeof s === "object") ? s : {};
    var d = Object.assign(extraFields(s, SETTINGS_KEYS), defaultSettings());
    ["startingDeposit", "depositsWithdrawals", "riskOwnPremium", "riskGrindInst", "defaultStop", "maxDrawdown"].forEach(function(k){
      var n = num(s[k]);
      if(n !== null && settingValid(k, n)) d[k] = n;
    });
    ["splitStopsPremium", "splitStopsGrind"].forEach(function(k){
      var list = stopList(s[k]);
      if(list) d[k] = list;
    });
    d.sizing = normalizeSizing(s.sizing);
    d.cashFlows = Array.isArray(s.cashFlows) ? s.cashFlows.map(normalizeFlow).filter(function(f){ return f.date && f.amount > 0; }) : [];

    // Accounts. Settings from before accounts existed (a Johnson Journal
    // backup) had one deposit for the whole journal: that becomes AvaTrade,
    // with Kudo added empty.
    var accounts = Array.isArray(s.accounts) ? s.accounts.filter(function(a){ return a && typeof a === "object"; }).map(function(a){
      var dep = num(a.startingDeposit), adj = num(a.adjustment);
      return { id: str(a.id) || makeId(), name: str(a.name).trim() || "Account",
        startingDeposit: dep === null ? 0 : dep, adjustment: adj === null ? 0 : adj };
    }) : [];
    if(!accounts.length){
      accounts = DEFAULT_ACCOUNTS.map(function(a){ return Object.assign({}, a); });
      accounts[0].startingDeposit = d.startingDeposit;
      accounts[0].adjustment = d.depositsWithdrawals;
    }
    d.accounts = accounts;
    var accIds = accounts.map(function(a){ return a.id; });
    d.cashFlows.forEach(function(f){ if(accIds.indexOf(f.account) === -1) f.account = accIds[0]; });
    // The journal-wide deposit = every account together (what "All accounts" shows).
    d.startingDeposit = round2(sum(accounts.map(function(a){ return a.startingDeposit; })));
    d.depositsWithdrawals = round2(sum(accounts.map(function(a){ return a.adjustment; })));

    d.backtests = Array.isArray(s.backtests) ? s.backtests.map(normalizeBacktest) : [];
    var book = normalizeBook(s.psychology);
    if(book) d.psychology = book;
    d.psychReadAt = /^\d{4}-\d{2}-\d{2}$/.test(str(s.psychReadAt)) ? str(s.psychReadAt) : "";
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
  var TRADE_KEYS = ["id", "createdAt", "updatedAt", "date", "session", "pair", "direction", "source", "account", "bias",
    "confirmation", "entry", "stopLoss", "closes", "lesson", "newIdea"];
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
      lesson: str(t.lesson),
      newIdea: t.newIdea === true   // ticked: this trade starts a new idea even if it sits close to the last one
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
    return {
      spec: spec,
      isOpen: isOpen,
      closes: closes,
      lots: clean(lots),
      pl: isOpen ? null : round2(sum),
      slPips: slPips,
      stopDistance: slPips === null ? null : Math.abs(slPips)
    };
  }

  // ---------- accounts ----------
  // A trade with no account (logged before accounts existed, or from a
  // Johnson Journal backup) or on a removed account belongs to the first.
  function accountIdOf(t, settings){
    var list = settings.accounts || [];
    for(var i = 0; i < list.length; i++) if(list[i].id === t.account) return t.account;
    return list.length ? list[0].id : "";
  }
  function accountById(settings, id){
    return (settings.accounts || []).filter(function(a){ return a.id === id; })[0] || null;
  }
  // Settings narrowed to one account ("" = all accounts added together):
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
    if(!prev || t.newIdea) return false;
    var a = num(prev.entry), b = num(t.entry);
    if(a === null || b === null) return false;
    return prev.date === t.date &&
      prev.pair === t.pair &&
      prev.direction === t.direction &&
      prev.source === t.source &&
      accountIdOf(prev, settings) === accountIdOf(t, settings) &&
      Math.abs(b - a) < IDEA_ENTRY_GAP_PIPS * pairSpec(settings, t.pair).pipSize;
  }

  // The plan stop distance for a source, in pips from the idea's WORST entry:
  // Grind Room / Institutional use the Grind ladder's first stop (120),
  // Premium the Premium ladder's (100), Own Trade the default stop (100).
  // Grind Room 120 (Aaron), IT the IT stop setting (max 100), Premium and
  // Own Trade 100.
  function planStopPips(source, settings){
    var sz = settings.sizing || SIZING_DEFAULTS;
    if(source === "Grind Room") return GRIND_SIGNAL_STOP;
    if(source === "Institutional") return sz.instStop;
    return OWN_PREM_STOP;
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
    var pipCount = planStopPips(draft.source, settings);
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
  function riskPctForSource(source, settings){
    var sz = (settings && settings.sizing) || SIZING_DEFAULTS;
    if(source === "Own Trade") return sz.own;
    if(source === "Premium") return sz.premium;
    if(source === "Grind Room") return sz.grindSignal;
    if(source === "Institutional") return sz.inst;
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
      risk: risk,
      riskPct: balance > 0 ? risk / balance : null,
      tooSmall: lots < 0.01
    };
  }

  // Partials for Own Trade and Premium: TP distances from the FIRST entry
  // (deeper entries are further in profit at the same price). 10% of each
  // entry at TP1–TP3, 20% at TP4, the rest (50%) is managed by hand toward
  // TP5/TP6 10% each; the last 30% is the runner, managed by hand.
  // Closes round to 0.01 (at least 0.01 while lots remain).
  var PARTIAL_LADDER = [
    { tp: "TP1", pips: 20, pct: 0.10 },
    { tp: "TP2", pips: 40, pct: 0.10 },
    { tp: "TP3", pips: 60, pct: 0.10 },
    { tp: "TP4", pips: 100, pct: 0.20 },
    { tp: "TP5", pips: 150, pct: 0.10 },
    { tp: "TP6", pips: 200, pct: 0.10 },
    { tp: "Runner", pips: null, pct: null }
  ];
  function partialPlan(plan, usdPerPip){
    var lots = plan.lots, left = lots, banked = 0;
    var offsets = plan.legs.map(function(l){ return l.offset; });
    function pipsAll(p){ return sum(offsets.map(function(o){ return p + o; })); }
    return PARTIAL_LADDER.map(function(lv){
      if(lv.pct === null){
        // Runner: what's left on every entry, valued at this level.
        return { tp: lv.tp, pips: lv.pips, manage: true, close: round2(left), total: round2(left * offsets.length),
          value: lv.pips === null ? null : round2(left * pipsAll(lv.pips) * usdPerPip), banked: round2(banked) };
      }
      var c = Math.round(lots * lv.pct * 100) / 100;
      if(c < 0.01 && left >= 0.01) c = 0.01;
      c = Math.min(round2(c), round2(left));
      left = round2(left - c);
      var got = round2(c * pipsAll(lv.pips) * usdPerPip);
      banked = round2(banked + got);
      return { tp: lv.tp, pips: lv.pips, manage: false, close: c, total: round2(c * offsets.length), value: got, banked: banked, left: left };
    });
  }


  // ---- sizing balance + own-trade daily stop ----
  // Fixed risk on the current balance (the loss protocol was removed on
  // 18 Nov). One rule stays: a full stop-loss on an own trade = no more own
  // trades that day (signals still allowed).
  function lossProtocol(derived, today){
    var ownStopDay = {};
    derived.ideas.forEach(function(idea){
      if(idea.closedCount < idea.tradeIds.length) return;
      if(idea.source === "Own Trade" && idea.hitSL && idea.pl < 0) ownStopDay[idea.date] = true;
    });
    return { state: "normal", sizingBalance: derived.account.balance, riskMult: 1, ownDoneToday: !!ownStopDay[today] };
  }

  // Every plan of the Position Sizing tab for a balance.
  function sizingPlans(balance, settings, usdPerPip, riskMult){
    var sz = Object.assign({}, settings.sizing || SIZING_DEFAULTS);
    if(riskMult && riskMult !== 1){
      SIZING_RISK_KEYS.forEach(function(k){ sz[k] = round2(sz[k] * riskMult); });
    }
    var L = sz.layer;
    function single(stop, risk){ return layerPlan([stop], [0], balance, risk, usdPerPip); }
    function three(stop, risk){
      return layerPlan([stop, stop - L, stop - 2 * L], [0, L, 2 * L], balance, risk, usdPerPip);
    }
    function ladder(stop, legs, risk){
      var st = [], off = [];
      for(var i = 0; i < legs; i++){ st.push(stop - i * GRIND_LAYER); off.push(i * GRIND_LAYER); }
      return layerPlan(st, off, balance, risk, usdPerPip);
    }
    var instThree = sz.instStop - 2 * L >= LAST_LEG_MIN_STOP;
    return {
      own: { risk: sz.own, single: single(OWN_PREM_STOP, sz.own), three: three(OWN_PREM_STOP, sz.own) },
      premium: { risk: sz.premium, single: single(OWN_PREM_STOP, sz.premium), three: three(OWN_PREM_STOP, sz.premium) },
      grindLive: { risk: sz.grindLive, stop: sz.grindLiveStop, plan: ladder(sz.grindLiveStop, GRIND_LIVE_LEGS, sz.grindLive) },
      grindSignal: { risk: sz.grindSignal, stop: GRIND_SIGNAL_STOP, plan: ladder(GRIND_SIGNAL_STOP, GRIND_SIGNAL_LEGS, sz.grindSignal) },
      inst: { risk: sz.inst, stop: sz.instStop, single: single(sz.instStop, sz.inst),
        three: instThree ? three(sz.instStop, sz.inst) : null,
        minThreeStop: 2 * L + LAST_LEG_MIN_STOP }
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
      var acc = accountIdOf(t, settings);
      var ideaNo = sameIdea(prevBy[acc], t, settings) ? prevIdeaBy[acc] : maxIdea + 1;
      if(ideaNo > maxIdea) maxIdea = ideaNo;

      var idea = ideaById[ideaNo];
      if(!idea){
        // Every trade in an idea shares its date, pair, direction and source.
        idea = ideaById[ideaNo] = { id: ideaNo, date: t.date, source: t.source, account: acc, tradeIds: [], closedCount: 0, pl: 0,
          balanceBefore: round2(base + netFlows + cumulative), hitSL: false };
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
        if((t.closes || []).some(function(c){ return c.type === "SL"; })) idea.hitSL = true;
      }

      var row = { n: i + 1, trade: t, calc: calc, idea: ideaNo, balanceAfter: balanceAfter, account: acc };
      rows.push(row);
      byId[t.id] = row;
      prevBy[acc] = t;
      prevIdeaBy[acc] = ideaNo;
    });

    applyFlowsUpTo(null);
    var balance = round2(base + netFlows + cumulative);
    var stopLine = round2(peak * (1 - settings.maxDrawdown / 100));

    return {
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

    // Per source, over the same closed ideas: net is the sum of those ideas'
    // P/L, avg is per idea. Wins/losses/BE use the same rule as the
    // Milestones streaks (an idea within $1 of zero is breakeven), and the
    // win rate leaves breakeven ideas out: wins / (wins + losses).
    var bySource = ALL_SOURCES.filter(function(name){
      return SOURCES.indexOf(name) !== -1 || closedIdeas.some(function(i){ return i.source === name; });
    }).map(function(name){
      var list = closedIdeas.filter(function(i){ return i.source === name; })
                            .map(function(i){ return i.pl; });
      var wins = list.filter(function(v){ return ideaResult(v) === "W"; }).length;
      var losses = list.filter(function(v){ return ideaResult(v) === "L"; }).length;
      return { name: name, ideas: list.length, wins: wins, losses: losses, be: list.length - wins - losses,
        winRate: (wins + losses) ? wins / (wins + losses) : null,
        net: round2(sum(list)), avg: mean(list) };
    });

    // Point 0 is the balance before any trade; then one point per closed trade.
    var equity = [{ n: 0, balance: derived.account.base }].concat(closed.map(function(r, i){
      return { n: i + 1, balance: r.balanceAfter };
    }));

    return {
      core: core,
      bySession: group(SESSIONS, "session"),
      bySource: bySource,
      equity: equity
    };
  }

  // ---------- position sizing ----------
  var SIZING_STOPS = [30, 50, 70, 100];
  var LADDER_FROM = 3, LADDER_TO = 10;   // tenths of a lot: 0.3 → 1.0

  // Lots + the dollars actually at risk for those (rounded-down) lots.
  // Null when the risk % or the stop isn't a positive number.
  function sizeFor(balance, riskPct, stopPips, usdPerPip){
    if(!(riskPct > 0) || !(stopPips > 0)) return null;
    var lots = lotsFor(balance, riskPct, stopPips, usdPerPip);
    return { lots: lots, risk: riskDollars(lots, stopPips, usdPerPip) };
  }

  // Sizes are worked out for the first pair in the Settings list, at the
  // risk % picked in the sizer (riskPct).
  function sizingStats(derived, settings, riskPct){
    var pair = settings.pairs.length ? settings.pairs[0].pair : "";
    var usd = pairSpec(settings, pair).usdPerPip;
    var balance = derived.account.balance;
    var stop = settings.defaultStop;

    var ladder = [];
    for(var i = LADDER_FROM; i <= LADDER_TO; i++){
      var lots = i / 10;
      var risk = stop > 0 ? round2(lots * stop * usd) : null;
      var needed = (risk !== null && riskPct > 0) ? round2(risk / (riskPct / 100)) : null;
      ladder.push({
        lots: lots,
        risk: risk,
        needed: needed,
        unlocked: needed !== null && balance >= needed,
        shortfall: needed === null ? null : round2(needed - balance)
      });
    }

    return {
      pair: pair,
      usdPerPip: usd,
      stop: stop,
      size: sizeFor(balance, riskPct, stop, usd),
      byStop: SIZING_STOPS.map(function(s){
        return { stop: s, size: sizeFor(balance, riskPct, s, usd) };
      }),
      ladder: ladder
    };
  }

  // ---------- weekly review ----------
  var MAX_STOP_PIPS = 100;

  // Every number uses closed trades only, and ideas only once every trade in
  // them is closed (as on the dashboard). `logged` counts all trades, open
  // ones included, just to tell whether the week has anything to show.
  function weeklyStats(derived, range){
    var rows = derived.rows.filter(function(r){ return r.trade.date >= range.start && r.trade.date <= range.end; });
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

  // ---------- split-entry risk planner ----------
  // The risk % of the balance is spread over every leg at the SAME lot size:
  // lots per leg = balance × risk / (sum of the legs' stop pips × usdPerPip),
  // rounded DOWN to 0.01. Each leg risks lots × its own stop.
  function splitPlan(balance, riskPct, stops, usdPerPip){
    var totalPips = sum(stops);
    var lots = lotsFor(balance, riskPct, totalPips, usdPerPip);
    var cumulative = 0;
    var legs = stops.map(function(stop, i){
      var risk = riskDollars(lots, stop, usdPerPip);
      cumulative = round2(cumulative + risk);
      return { leg: i + 1, stop: stop, risk: risk, cumulative: cumulative };
    });
    return {
      riskPct: riskPct,
      maxRisk: round2(balance * riskPct / 100),
      totalPips: totalPips,
      lots: lots,
      totalLots: round2(lots * stops.length),
      legs: legs,
      total: cumulative,
      pctOfBalance: balance > 0 ? cumulative / balance : null,
      // Even the 0.01 minimum on every leg would go over the risk.
      tooSmall: lots === 0,
      minRisk: riskDollars(0.01, totalPips, usdPerPip)
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

    var recRows = source ? closedRows.filter(function(r){ return r.trade.source === source; }) : closedRows;
    var recIdeas = derived.ideas.filter(function(i){ return ideaClosed(i) && (!source || i.source === source); });
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
    viewSettings: viewSettings,
    viewTrades: viewTrades,
    accountIdOf: accountIdOf,
    settingValid: settingValid,
    weeklyStats: weeklyStats,
    sizeFor: sizeFor,
    sizingStats: sizingStats,
    splitPlan: splitPlan,
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
    lossProtocol: lossProtocol,
    partialPlan: partialPlan,
    normalizeSizing: normalizeSizing,
    SOURCE_RISK: SOURCE_RISK,
    derive: derive
  };
  (typeof window !== "undefined" ? window : globalThis).CallistoCalc = Calc;

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
  // Sizing always works on one account: the one picked at the top, or the
  // first account when "All accounts" is showing.
  function sizingAccount(){ return validActive() || (settings.accounts[0] ? settings.accounts[0].id : ""); }
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

  function showView(name){
    renderAcctSwitch();
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

  // ---------- backtest ----------
  (function(){
    var form = document.getElementById("bt-form");
    if(!form) return;
    function $(id){ return document.getElementById(id); }
    var f = {
      date: $("bt-date"), time: $("bt-time"), pair: $("bt-pair"), direction: $("bt-direction"), session: $("bt-session"),
      model: $("bt-model"), confirmation: $("bt-confirmation"), confirmationNote: $("bt-confirmation-note"),
      entry: $("bt-entry"), stopLoss: $("bt-sl"), takeProfit: $("bt-tp"), result: $("bt-result"), exit: $("bt-exit"),
      mfePips: $("bt-mfe"), mistakes: $("bt-mistakes"), lessons: $("bt-lessons"), link: $("bt-link"),
      status: $("bt-status"), beAt: $("bt-be"), notes: $("bt-notes")
    };
    var biasSel = Array.prototype.slice.call(form.querySelectorAll("[data-bias]"));
    var elChips = $("bt-confluences"), elErr = $("bt-error"), elTitle = $("bt-form-title");
    var elSave = $("bt-save"), elCancel = $("bt-cancel"), elReadout = $("bt-readout");
    var elFilter = $("bt-filter-model"), elTable = $("bt-table");
    var editingId = null, chosen = [];

    function opts(list, blank){
      return (blank ? '<option value="">' + escapeHtml(blank) + "</option>" : "") +
        list.map(function(o){ return "<option>" + escapeHtml(o) + "</option>"; }).join("");
    }
    f.session.innerHTML = opts(SESSIONS, "—");
    f.model.innerHTML = opts(BT_MODELS);
    f.confirmation.innerHTML = opts(BT_CONFIRMATIONS);
    f.result.innerHTML = opts(BT_RESULTS);
    f.status.innerHTML = opts(BT_STATUSES);
    function syncStatus(){
      var open = f.status.value === "Open";
      f.result.disabled = open; f.exit.disabled = open;
    }
    f.status.addEventListener("change", syncStatus);
    biasSel.forEach(function(sel){ sel.innerHTML = opts(["Bullish", "Bearish"], "—"); });
    elFilter.innerHTML = '<option value="">All models</option>' + opts(BT_MODELS);

    function list(){ return settings.backtests || (settings.backtests = []); }
    function renderChips(){
      elChips.innerHTML = BT_CONFLUENCES.map(function(c){
        var on = chosen.indexOf(c) !== -1;
        return '<button type="button" class="chip bt-chip' + (on ? " on" : "") + '" aria-pressed="' + on + '" data-c="' + escapeHtml(c) + '">' + escapeHtml(c) + "</button>";
      }).join("");
    }
    elChips.addEventListener("click", function(ev){
      var b = ev.target.closest("[data-c]"); if(!b) return;
      var c = b.dataset.c, i = chosen.indexOf(c);
      if(i === -1) chosen.push(c); else chosen.splice(i, 1);
      renderChips();
    });

    function draft(){
      var bias = {};
      biasSel.forEach(function(sel){ bias[sel.dataset.bias] = sel.value; });
      return normalizeBacktest({
        id: editingId || undefined, date: f.date.value, time: f.time.value.trim(), pair: f.pair.value,
        direction: f.direction.value, session: f.session.value, model: f.model.value, bias: bias,
        confluences: chosen.slice(), confirmation: f.confirmation.value, confirmationNote: f.confirmationNote.value.trim(),
        entry: f.entry.value, stopLoss: f.stopLoss.value, takeProfit: f.takeProfit.value, result: f.result.value,
        exit: f.exit.value, mfePips: f.mfePips.value, mistakes: f.mistakes.value.trim(), lessons: f.lessons.value.trim(),
        link: f.link.value.trim(), status: f.status.value, beAt: f.beAt.value, notes: f.notes.value.trim()
      });
    }
    function fmtR(v){ return v === null ? "—" : (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(2) + "R"; }
    function fmtPips(v){ return v === null ? "—" : (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1); }
    function updateReadout(){
      var c = backtestCalc(draft(), settings);
      elReadout.innerHTML =
        "<span>Stop <strong>" + (c.stopPips === null ? "—" : c.stopPips.toFixed(1) + " pips") + "</strong></span>" +
        "<span>Planned <strong>" + (c.plannedRR === null ? "—" : "1 : " + c.plannedRR.toFixed(2)) + "</strong></span>" +
        "<span>BE at <strong>" + (c.bePips === null ? "—" : fmtPips(c.bePips) + " pips" + (c.beR === null ? "" : " (" + c.beR.toFixed(2) + "R)")) + "</strong></span>" +
        "<span>Result <strong>" + (c.isOpen ? "open" : c.resultPips === null ? "—" : fmtPips(c.resultPips) + " pips") + "</strong></span>" +
        '<span>R <strong class="' + (c.r > 0.05 ? "pos" : c.r < -0.05 ? "neg" : "") + '">' + fmtR(c.r) + "</strong></span>" +
        "<span>Bias aligned <strong>" + c.aligned + "/4</strong></span>";
    }
    form.addEventListener("input", updateReadout);
    form.addEventListener("change", updateReadout);

    function resetForm(){
      var keepModel = f.model.value, keepPair = f.pair.value;
      form.reset();
      f.pair.innerHTML = opts(settings.pairs.map(function(p){ return p.pair; }));
      if(keepPair && settings.pairs.some(function(p){ return p.pair === keepPair; })) f.pair.value = keepPair;
      if(keepModel) f.model.value = keepModel;
      f.date.value = todayStr();
      chosen = []; editingId = null;
      syncStatus();
      elTitle.textContent = "Log a backtest"; elSave.textContent = "Save backtest";
      elCancel.hidden = true; elErr.hidden = true;
      renderChips(); updateReadout();
    }
    function fill(b){
      f.pair.innerHTML = opts(settings.pairs.map(function(p){ return p.pair; }).concat(
        settings.pairs.some(function(p){ return p.pair === b.pair; }) ? [] : [b.pair]));
      Object.keys(f).forEach(function(k){ f[k].value = b[k] === null || b[k] === undefined ? "" : b[k]; });
      biasSel.forEach(function(sel){ sel.value = b.bias[sel.dataset.bias] || ""; });
      chosen = b.confluences.slice(); editingId = b.id;
      syncStatus();
      elTitle.textContent = "Edit backtest"; elSave.textContent = "Save changes";
      elCancel.hidden = false; elErr.hidden = true;
      renderChips(); updateReadout();
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    form.addEventListener("submit", function(ev){
      ev.preventDefault();
      var b = draft();
      var err = !b.date ? "Pick the date." :
        b.entry === null || b.stopLoss === null ? "Enter the entry and the stop loss." :
        b.entry === b.stopLoss ? "Entry and stop can't be the same price." :
        (b.status === "Closed" && b.result === "Closed manually" && b.exit === null) ? "Closed manually — enter the exit price." :
        (b.beAt !== null && (b.beAt - b.entry) * (b.direction === "Buy" ? 1 : -1) <= 0) ? "The BE price has to be in profit — above the entry for a buy, below it for a sell." : "";
      if(!err && (b.stopLoss - b.entry) * (b.direction === "Buy" ? 1 : -1) > 0) err = "The stop is on the wrong side for a " + b.direction.toLowerCase() + ".";
      if(err){ elErr.textContent = err; elErr.hidden = false; return; }
      if(editingId){
        settings.backtests = list().map(function(x){ return x.id === editingId ? normalizeBacktest(Object.assign({}, x, b, { createdAt: x.createdAt, updatedAt: Date.now() })) : x; });
      }else{
        settings.backtests = list().concat([b]);
      }
      saveSettings();
      resetForm();
      renderBacktests();
    });
    elCancel.addEventListener("click", resetForm);

    function summary(rows){
      var done = rows.filter(function(r){ return r.c.r !== null; });
      var W = done.filter(function(r){ return r.c.outcome === "win"; }), L = done.filter(function(r){ return r.c.outcome === "loss"; });
      var rs = done.map(function(r){ return r.c.r; });
      var gw = sum(W.map(function(r){ return r.c.r; })), gl = -sum(L.map(function(r){ return r.c.r; }));
      var mfe = rows.map(function(r){ return r.b.mfePips; }).filter(function(v){ return v !== null; });
      return { n: rows.length, done: done.length, wins: W.length, losses: L.length, be: done.length - W.length - L.length,
        winRate: W.length + L.length ? W.length / (W.length + L.length) : null,
        totalR: rs.length ? sum(rs) : null, avgR: rs.length ? mean(rs) : null,
        avgWin: W.length ? gw / W.length : null, avgLoss: L.length ? -gl / L.length : null,
        pf: gl > 0 ? gw / gl : null, avgMfe: mfe.length ? mean(mfe) : null };
    }
    function breakdown(title, rows, keyFn, order){
      var groups = {};
      rows.forEach(function(r){ var k = keyFn(r); (groups[k] = groups[k] || []).push(r); });
      var keys = (order || Object.keys(groups).sort()).filter(function(k){ return groups[k]; });
      if(!keys.length) return "";
      return '<div class="bt-break"><h3>' + escapeHtml(title) + '</h3><div class="mini-scroll"><table class="mini-table">' +
        "<thead><tr><th></th><th>Trades</th><th>Win %</th><th>Avg R</th><th>Total R</th></tr></thead><tbody>" +
        keys.map(function(k){
          var s = summary(groups[k]);
          return "<tr><td>" + escapeHtml(k) + "</td><td>" + s.n + "</td><td>" + fmtPct(s.winRate) + "</td>" +
            '<td class="' + (s.avgR > 0 ? "pos" : s.avgR < 0 ? "neg" : "") + '">' + fmtR(s.avgR) + "</td>" +
            '<td class="' + (s.totalR > 0 ? "pos" : s.totalR < 0 ? "neg" : "") + '">' + fmtR(s.totalR) + "</td></tr>";
        }).join("") + "</tbody></table></div></div>";
    }

    function renderBacktests(){
      var m = elFilter.value;
      var rows = list().filter(function(b){ return !m || b.model === m; })
        .map(function(b){ return { b: b, c: backtestCalc(b, settings) }; })
        .sort(function(x, y){ return x.b.date < y.b.date ? 1 : x.b.date > y.b.date ? -1 : y.b.createdAt - x.b.createdAt; });
      var s = summary(rows);
      $("bt-stats").innerHTML =
        statCard("btN", "Backtests", String(s.n), (s.n - s.done) ? (s.n - s.done) + " still open" : "") +
        statCard("btWin", "Win rate", fmtPct(s.winRate), s.wins + " W · " + s.losses + " L · " + s.be + " BE") +
        statCard("btAvg", "Avg R per trade", fmtR(s.avgR), "expectancy") +
        statCard("btTotal", "Total R", fmtR(s.totalR)) +
        statCard("btWL", "Avg win / avg loss", fmtR(s.avgWin) + " / " + fmtR(s.avgLoss)) +
        statCard("btPF", "Profit factor", s.pf === null ? "—" : s.pf.toFixed(2)) +
        statCard("btMfe", "Avg max pips in favour", s.avgMfe === null ? "—" : s.avgMfe.toFixed(0));
      $("bt-breakdowns").innerHTML = rows.length ?
        (m ? "" : breakdown("By model", rows, function(r){ return r.b.model; }, BT_MODELS)) +
        breakdown("By confirmation", rows, function(r){ return r.b.confirmation; }, BT_CONFIRMATIONS) +
        breakdown("By session", rows, function(r){ return r.b.session || "—"; }, SESSIONS.concat(["—"])) +
        breakdown("By bias aligned", rows, function(r){ return r.c.aligned + "/4"; }, ["4/4", "3/4", "2/4", "1/4", "0/4"]) +
        breakdown("By confluence (trades that had it)", [].concat.apply([], rows.map(function(r){
          return r.b.confluences.map(function(c){ return { b: r.b, c: r.c, k: c }; });
        })), function(r){ return r.k; }, BT_CONFLUENCES)
        : '<div class="hint">No backtests yet. Log your first one above.</div>';

      elTable.innerHTML = rows.length ?
        "<thead><tr><th>Date</th><th>Model</th><th>Dir</th><th>Session</th><th>Bias</th><th>Confirmation</th><th>Stop</th><th>BE at</th><th>Result</th><th>R</th><th>Max fav.</th><th>Notes</th><th></th></tr></thead><tbody>" +
        rows.map(function(r){
          var b = r.b, c = r.c;
          return '<tr data-id="' + escapeHtml(b.id) + '">' +
            "<td>" + escapeHtml(fmtDayLabel(b.date)) + (b.time ? " " + escapeHtml(b.time) : "") + "</td>" +
            "<td>" + escapeHtml(b.model) + "</td><td>" + b.direction + "</td><td>" + escapeHtml(b.session || "—") + "</td>" +
            "<td>" + c.aligned + "/4</td>" +
            '<td title="' + escapeHtml(b.confluences.join(", ") + (b.confirmationNote ? " — " + b.confirmationNote : "")) + '">' + escapeHtml(b.confirmation) + "</td>" +
            "<td>" + (c.stopPips === null ? "—" : c.stopPips.toFixed(0)) + "</td>" +
            "<td>" + (c.bePips === null ? "—" : fmtPips(c.bePips)) + "</td>" +
            "<td>" + (c.isOpen ? '<span class="bt-open">Open</span>' : escapeHtml(b.result) + (c.resultPips === null ? "" : " (" + fmtPips(c.resultPips) + ")")) + "</td>" +
            '<td class="' + (c.r > 0.05 ? "pos" : c.r < -0.05 ? "neg" : "") + '">' + fmtR(c.r) + "</td>" +
            "<td>" + (b.mfePips === null ? "—" : Math.round(b.mfePips)) + "</td>" +
            '<td class="bt-lesson">' + [["Mistake", b.mistakes], ["Lesson", b.lessons], ["Note", b.notes]].filter(function(x){ return x[1]; })
              .map(function(x){ return "<div><strong>" + x[0] + ":</strong> " + escapeHtml(x[1]) + "</div>"; }).join("") + (b.link ? ' <a href="' + escapeHtml(b.link) + '" target="_blank" rel="noopener">chart</a>' : "") + "</td>" +
            '<td class="bt-acts"><button type="button" class="ghost small" data-act="edit">Edit</button> <button type="button" class="ghost small danger" data-act="delete">Delete</button></td>' +
          "</tr>";
        }).join("") + "</tbody>"
        : '<tbody><tr><td class="bt-empty">Nothing logged yet.</td></tr></tbody>';
    }
    elFilter.addEventListener("change", renderBacktests);
    elTable.addEventListener("click", function(ev){
      var btn = ev.target.closest("button[data-act]"); if(!btn) return;
      var id = btn.closest("tr").dataset.id;
      var b = list().filter(function(x){ return x.id === id; })[0]; if(!b) return;
      if(btn.dataset.act === "edit"){ fill(b); return; }
      if(btn.dataset.armed !== "1"){ btn.dataset.armed = "1"; btn.textContent = "Tap again to delete"; return; }
      settings.backtests = list().filter(function(x){ return x.id !== id; });
      if(editingId === id) resetForm();
      saveSettings();
      renderBacktests();
    });

    renderers.backtest = function(){
      if(!editingId) resetForm();
      renderBacktests();
    };
  })();

  // ---------- rulebook ----------
  // Static content in index.html; chapters are <details>. The chapter links
  // open the chapter they jump to.
  (function(){
    var chapters = Array.prototype.slice.call(document.querySelectorAll(".rb-chapter"));
    function setAll(open){ chapters.forEach(function(d){ d.open = open; }); }
    document.getElementById("rb-open-all").addEventListener("click", function(){ setAll(true); });
    document.getElementById("rb-close-all").addEventListener("click", function(){ setAll(false); });
    document.getElementById("rb-toc").addEventListener("click", function(ev){
      var a = ev.target.closest("a");
      if(!a) return;
      ev.preventDefault();
      var target = document.getElementById(a.getAttribute("href").slice(1));
      if(!target) return;
      target.open = true;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  })();

  // ---------- Psychology (editable chapters) ----------
  // Chapters live in settings.psychology. Read mode
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

  var psychology = setupBook("psychology");
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
  var elStatus = document.getElementById("f-status");
  var elStatusHint = document.getElementById("f-status-hint");
  var elCloses = document.getElementById("f-closes");
  var elClosesEmpty = document.getElementById("f-closes-empty");
  var elCloseTotals = document.getElementById("f-close-totals");
  var elLesson = document.getElementById("f-lesson");
  var elNewIdea = document.getElementById("f-new-idea");
  var elFormError = document.getElementById("form-error");
  var btnSubmit = document.getElementById("btn-submit");
  var btnClear = document.getElementById("btn-clear");
  var btnCancelEdit = document.getElementById("btn-cancel-edit");
  var btnAddClose = document.getElementById("btn-add-close");

  var editingId = null;
  // True while the Stop Loss box is filled by the app (plan stop); typing a
  // stop turns it off, clearing the box turns it back on.
  var slAuto = true;
  var formDerived = derive(trades, settings);
  var elAccount = document.getElementById("f-account");
  var elPlanHint = document.getElementById("f-plan");
  var elBias = {};
  buildSeg(elAccount, [], false);
  // Account buttons come from Settings, so they're rebuilt whenever the
  // form is shown.
  function refreshAccountChoices(){
    fillSeg(elAccount, settings.accounts.map(function(a){ return { value: a.id, label: a.name }; }));
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
    for(var i = 1; i <= 10; i++){
      if(used.indexOf("TP" + i) === -1) return "TP" + i;
    }
    return "Full TP";
  }

  function addCloseRow(c){
    var row = document.createElement("div");
    row.className = "close-row";
    row.innerHTML =
      '<select class="c-type" aria-label="Close type">' +
        CLOSE_TYPES.map(function(t){ return "<option>" + escapeHtml(t) + "</option>"; }).join("") +
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

    // SL closes at the stop, BE closes at entry.
    type.addEventListener("change", function(){
      if(type.value === "SL" && elSL.value !== "") price.value = elSL.value;
      else if(type.value === "BE" && elEntry.value !== "") price.value = elEntry.value;
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
      lesson: elLesson.value.trim(),
      newIdea: elNewIdea.checked
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

  // Grind Room / Institutional plan to 120 pips, the rest to 100.
  // Grind Room live can run to 150; IT/Own/Premium max 100.
  function maxStopFor(source){
    if(source === "Grind Room") return SIZING_LIMITS.grindLiveStop[1];
    return source === "" ? MAX_STOP_PIPS : Math.max(MAX_STOP_PIPS, planStopPips(source, settings));
  }

  function updateLive(){
    var draft = readForm();
    // Loss protocol and lot sizes come from the trade's own account.
    var formAcc = draft.account || sizingAccount();
    formDerived = deriveAccount(formAcc);
    updateStop(draft);
    var calc = tradeCalc(draft, settings);
    // Signed pips mean nothing until a direction is picked.
    var hasDir = draft.direction !== "";

    if(calc.slPips === null) elSLPips.textContent = "—";
    else elSLPips.textContent = (hasDir ? fmtPips(calc.slPips) : calc.stopDistance.toFixed(1)) + " pips";

    var warnings = [];
    var maxStop = maxStopFor(draft.source);
    if(calc.stopDistance !== null && calc.stopDistance > maxStop){
      warnings.push("Stop is " + calc.stopDistance.toFixed(1) + " pips — the rule is " + maxStop + " maximum.");
    }
    if(draft.confirmation === ""){
      warnings.push("No confirmation written. No valid confirmation = no trade.");
    }
    if(!editingTrade()){
      var protW = lossProtocol(formDerived, todayStr());
      if(draft.source === "Own Trade" && protW.ownDoneToday) warnings.push("Own trade hit a full stop today — no more own trades today (signals are fine).");
    }
    elWarnings.innerHTML = warnings.map(function(w){
      return '<div class="warn">' + escapeHtml(w) + "</div>";
    }).join("");

    if(draft.source === "" || !(calc.stopDistance > 0)){
      elSizeHint.textContent = "Size: pick a source and enter entry + stop.";
    }else{
      var prot = lossProtocol(formDerived, todayStr());
      var riskPct = round2(riskPctForSource(draft.source, settings) * prot.riskMult);
      var size = sizeFor(prot.sizingBalance, riskPct, calc.stopDistance, calc.spec.usdPerPip);
      var plans = sizingPlans(prot.sizingBalance, settings, calc.spec.usdPerPip, prot.riskMult);
      var layered = draft.source === "Own Trade" ? "3 entries: " + fmtLots(plans.own.three.lots) + " each" :
        draft.source === "Premium" ? "3 entries: " + fmtLots(plans.premium.three.lots) + " each" :
        draft.source === "Grind Room" ? "signal 5 legs: " + fmtLots(plans.grindSignal.plan.lots) + " each · live 8 legs: " + fmtLots(plans.grindLive.plan.lots) + " each" :
        draft.source === "Institutional" && plans.inst.three ? "3 entries: " + fmtLots(plans.inst.three.lots) + " each" : "";
      elSizeHint.innerHTML =
        "1 entry: <strong>" + (size ? fmtLots(size.lots) + " lots · " + escapeHtml(fmtUsd(size.risk)) + " risk" : "—") + "</strong> " +
        "(" + riskPct + "% of " + (multiAccount() ? escapeHtml(accountName(formAcc)) + "'s " : "") + escapeHtml(fmtUsd(prot.sizingBalance)) + " at " + calc.stopDistance.toFixed(1) + " pips" +
        ")" +
        (layered ? " · " + escapeHtml(layered) + " (Position Sizing has the full plan)" : "");
    }


    elPlanHint.hidden = true;
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
    refreshAccountChoices();
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
    fillSeg(elSource, SOURCES);
    form.reset();
    clearInvalid();
    elDate.value = todayStr();
    refreshPairOptions("");
    [elDirection, elSession, elSource].forEach(function(seg){ segSet(seg, ""); });
    refreshAccountChoices();
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
    // An old source (e.g. AJ) is offered only while editing a trade that has it.
    fillSeg(elSource, OLD_SOURCES.indexOf(t.source) !== -1 ? SOURCES.concat([t.source]) : SOURCES);
    segSet(elSource, t.source);
    refreshAccountChoices();
    segSet(elAccount, accountIdOf(t, settings));
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
    elNewIdea.checked = !!t.newIdea;
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
  fillFilter(ffSource, ALL_SOURCES);
  fillFilter(ffDirection, DIRECTIONS);
  fillFilter(ffResult, RESULTS);

  [ffSession, ffSource, ffDirection, ffResult, ffFrom, ffTo, document.getElementById("ff-view")].forEach(function(el){
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
    if(ffSource.value && t.source !== ffSource.value) return false;
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
  var TABLE_COLUMNS = 11;
  var BIAS_CHIPS = [["daily", "D"], ["h4", "4H"], ["h1", "1H"], ["m15", "15"]];
  var BIAS_CLASS = { Bullish: "bull", Bearish: "bear", Ranging: "range" };

  function biasChips(bias){
    return '<span class="bias-chips">' + BIAS_CHIPS.map(function(c){
      var value = bias[c[0]];
      return '<span class="chip ' + (BIAS_CLASS[value] || "") + '" title="' + escapeHtml(c[1] + ": " + (value || "not set")) + '">' + c[1] + "</span>";
    }).join("") + "</span>";
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
        "<td>" + escapeHtml(t.source) +
          (multiAccount() && !validActive() ? '<span class="acct-tag">' + escapeHtml(accountName(r.account)) + "</span>" : "") + "</td>" +
        "<td>" + biasChips(t.bias) + "</td>" +
        '<td class="r">' + fmtPrice(t.entry, c.spec) + "</td>" +
        '<td class="r">' + fmtPips(c.slPips) + "</td>" +
        '<td class="r">' + (c.isOpen ? "—" : fmtLots(c.lots)) + "</td>" +
        '<td class="r">' + (c.isOpen ? '<span class="badge">Open</span>' : fmtMoney(c.pl)) + "</td>" +
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
      (multiAccount() ? "<span>Account <b>" + escapeHtml(accountName(r.account)) + "</b></span>" : "") +
      "<span>Stop loss <b>" + fmtPrice(t.stopLoss, c.spec) + "</b></span>";

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

  // ---------- trade log: ideas view ----------
  // One row per idea: how big the idea really was against the plan risk for
  // its source. Uses the same filters (Result filters the idea's result).
  var ffView = document.getElementById("ff-view");
  var ideaWrap = document.getElementById("idea-wrap");
  var ideaBody = document.getElementById("idea-body");
  var ideaSummary = document.getElementById("idea-summary");
  function ideaRows(d){
    var map = {}, order = [];
    d.rows.forEach(function(r){
      var t = r.trade;
      if(ffSession.value && t.session !== ffSession.value) return;
      if(ffSource.value && t.source !== ffSource.value) return;
      if(ffDirection.value && t.direction !== ffDirection.value) return;
      if(ffFrom.value && t.date < ffFrom.value) return;
      if(ffTo.value && t.date > ffTo.value) return;
      var g = map[r.idea];
      if(!g){ g = map[r.idea] = { id: r.idea, date: t.date, source: t.source, dir: t.direction, legs: 0, lots: 0, riskSL: 0, pl: 0, open: false }; order.push(g); }
      g.legs++;
      g.lots += r.calc.lots || 0;
      if(r.calc.slPips !== null && r.calc.slPips < 0) g.riskSL += Math.abs(r.calc.slPips) * (r.calc.lots || 0) * r.calc.spec.usdPerPip;
      if(r.calc.pl === null) g.open = true; else g.pl += r.calc.pl;
    });
    return order.map(function(g){
      var idea = d.ideaById[g.id] || {};
      var bal = idea.balanceBefore > 0 ? idea.balanceBefore : null;
      g.plan = riskPctForSource(g.source, settings);
      g.riskPct = bal ? g.riskSL / bal * 100 : null;
      g.plPct = bal ? g.pl / bal * 100 : null;
      g.r = g.riskSL > 0 && !g.open ? g.pl / g.riskSL : null;
      g.result = g.open ? "Open" : g.pl > 0 ? "Win" : g.pl < 0 ? "Loss" : "BE";
      // Over plan: the stop risked more than the plan, or the loss was bigger
      // than it (0.5% slack for rounding).
      var lim = g.plan === null ? null : g.plan + 0.5;
      g.over = lim !== null && ((g.riskPct !== null && g.riskPct > lim) || (g.plPct !== null && -g.plPct > lim));
      return g;
    }).filter(function(g){ return !ffResult.value || g.result === ffResult.value; });
  }
  function renderIdeas(d){
    var list = ideaRows(d).reverse();
    var pct = function(v){ return v === null ? "—" : v.toFixed(1) + "%"; };
    ideaBody.innerHTML = list.map(function(g){
      var check = g.plan === null ? '<span class="neutral">—</span>' :
        g.over ? '<span class="chk over">Over plan</span>' : '<span class="chk ok">Within plan</span>';
      return "<tr>" +
        '<td class="r">' + g.id + "</td>" +
        '<td class="col-date">' + escapeHtml(g.date) + "</td>" +
        "<td>" + escapeHtml(g.source) + "</td>" +
        "<td>" + escapeHtml(g.dir) + "</td>" +
        '<td class="r">' + g.legs + "</td>" +
        '<td class="r">' + fmtLots(round2(g.lots)) + "</td>" +
        '<td class="r">' + (g.plan === null ? "—" : g.plan + "%") + "</td>" +
        '<td class="r">' + (g.riskSL > 0 ? escapeHtml(fmtUsd(round2(g.riskSL))) + ' <span class="neutral">' + pct(g.riskPct) + "</span>" : '<span class="neutral">—</span>') + "</td>" +
        '<td class="r">' + (g.open ? '<span class="neutral">open</span>' : fmtMoney(round2(g.pl)) + ' <span class="neutral">' + pct(g.plPct) + "</span>") + "</td>" +
        '<td class="r">' + (g.r === null ? "—" : (g.r > 0 ? "+" : "") + g.r.toFixed(2) + "R") + "</td>" +
        '<td><span class="res res-' + g.result.toLowerCase() + '">' + g.result + "</span></td>" +
        "<td>" + check + "</td>" +
      "</tr>";
    }).join("");
    var W = list.filter(function(g){ return g.result === "Win"; }).length,
        L = list.filter(function(g){ return g.result === "Loss"; }).length,
        B = list.filter(function(g){ return g.result === "BE"; }).length,
        O = list.filter(function(g){ return g.over; }).length;
    ideaSummary.innerHTML = list.length ? "<strong>" + list.length + "</strong> ideas · " + W + " won · " + L + " lost · " + B + " BE · " +
      (O ? '<span class="chk over">' + O + " over plan</span>" : '<span class="chk ok">all within plan</span>') +
      '<span class="neutral"> — risk at SL uses the stop logged on each leg; plan % is your current setting for that source.</span>' : "";
    ideaWrap.hidden = list.length === 0;
    emptyState.hidden = list.length !== 0;
    emptyState.textContent = list.length ? "" : (d.rows.length ? "No ideas match these filters." : 'No trades logged yet. Log your first trade from the "+ Log Trade" tab.');
  }

  function renderTable(){
    var d = deriveView();
    var ideasMode = ffView.value === "ideas";
    if(ideasMode){ tableWrap.hidden = true; renderIdeas(d); return; }
    ideaWrap.hidden = true; ideaSummary.innerHTML = "";
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
    var d = deriveView();
    var s = dashboardStats(d);

    // Net P/L, balance and the equity curve come from closed trades, so show
    // the dashboard as soon as one trade is closed, even if its idea isn't.
    var none = s.core.closedTrades === 0;
    dashEmpty.hidden = !none;
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
      "<thead><tr><th>Source</th><th>Ideas</th><th>Wins</th><th>Losses</th><th>BE</th><th title='Wins ÷ (wins + losses); breakeven ideas (within $1 of zero) are left out'>Win rate (excl. BE)</th><th>Net P/L</th><th>Avg P/L</th></tr></thead>" +
      "<tbody>" + s.bySource.map(function(g){
        return '<tr data-group="' + escapeHtml(g.name) + '">' +
          "<td>" + escapeHtml(g.name) + "</td>" +
          "<td>" + g.ideas + "</td>" +
          "<td>" + g.wins + "</td>" +
          "<td>" + g.losses + "</td>" +
          "<td>" + g.be + "</td>" +
          "<td>" + fmtPct(g.winRate) + "</td>" +
          "<td>" + (g.ideas ? fmtMoney(g.net) : "—") + "</td>" +
          "<td>" + (g.ideas ? fmtMoney(round2(g.avg)) : "—") + "</td>" +
        "</tr>";
      }).join("") + "</tbody>";

    renderEquity(s.equity, d.account.stopLine);
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

    var values = points.map(function(p){ return p.balance; }).concat([stopLine]);
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

    svg += '<line class="stop-line" x1="' + mL + '" x2="' + (W - mR) + '" y1="' + y(stopLine) + '" y2="' + y(stopLine) + '"/>';

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
      '<div class="chart-key"><span><i></i>Balance</span><span><i class="dashed"></i>Stop-trading line ' +
      escapeHtml(fmtUsd(stopLine)) + "</span></div>";

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

  // Partials for ONE position of `lots`: 10% at TP1–TP3, 20% at TP4, then
  // the rest is managed. Pips are from that position's own entry.
  function partialsCard(title, lots, usd, sub){
    if(!(lots >= 0.01)) {
      return '<div class="partials-card"><h4>' + escapeHtml(title) + '</h4><div class="hint">Below 0.01 lots at this balance.</div></div>';
    }
    var plan = { lots: lots, legs: [{ offset: 0 }] };
    var rows = partialPlan(plan, usd).map(function(r){
      if(r.manage){
        return '<tr class="pt-manage"><td>' + r.tp + "</td><td>" + (r.pips === null ? "—" : r.pips) + "</td>" +
          "<td>" + (r.close > 0 ? fmtLots(r.close) + " left" : "nothing left") + "</td>" +
          "<td>manage it</td></tr>";
      }
      return "<tr><td>" + r.tp + "</td><td>" + r.pips + "</td>" +
        "<td>" + (r.close > 0 ? fmtLots(r.close) : "— (none left)") + "</td>" +
        "<td>" + escapeHtml(fmtUsd(r.banked)) + "</td></tr>";
    }).join("");
    return '<div class="partials-card">' +
      '<div class="plan-block-head"><h4>' + escapeHtml(title) + '</h4><span class="plan-lots">' + fmtLots(lots) + " lots</span></div>" +
      (sub ? '<div class="hint">' + escapeHtml(sub) + "</div>" : "") +
      '<div class="mini-scroll"><table class="mini-table plan-table">' +
      "<thead><tr><th>TP</th><th>Pips</th><th>Close</th><th>Banked</th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table></div>" +
    "</div>";
  }

  function renderPartials(p, usd){
    document.getElementById("partials-cards").innerHTML =
      partialsCard("Own — 1 entry", p.own.single.lots, usd, "") +
      partialsCard("Own — 3 entries, per leg", p.own.three.lots, usd, "Do this on each of the 3 legs.") +
      partialsCard("Premium — 1 entry", p.premium.single.lots, usd, "") +
      partialsCard("Premium — 3 entries, per leg", p.premium.three.lots, usd, "Do this on each of the 3 legs.");
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

  function renderSizingOutputs(){
    var accId = sizingAccount();
    var d = deriveAccount(accId);
    var a = d.account;
    document.getElementById("size-stand-title").textContent = multiAccount() ? "Where you stand — " + accountName(accId) : "Where you stand";
    var accNote = document.getElementById("size-acct-note");
    accNote.hidden = !!validActive() || !multiAccount();
    accNote.textContent = "Showing " + accountName(accId) + ". Pick an account at the top to size for another one.";
    var pair = settings.pairs.length ? settings.pairs[0].pair : "";
    var usd = pairSpec(settings, pair).usdPerPip;
    var prot = lossProtocol(d, todayStr());
    var protEl = document.getElementById("protocol-panel");
    protEl.hidden = !prot.ownDoneToday;
    protEl.innerHTML = prot.ownDoneToday ? '<div class="warn">Own trade hit a full stop today — no more own trades today. Signals are fine.</div>' : "";
    var p = sizingPlans(prot.sizingBalance, settings, usd, prot.riskMult);
    var sz = settings.sizing;
    var L = sz.layer;

    document.getElementById("size-stand").innerHTML =
      statCard("closedPL", "Closed P/L", fmtMoney(a.closedPL)) +
      statCard("balance", "Current balance", escapeHtml(fmtUsd(a.balance))) +
      statCard("peak", "Peak balance", escapeHtml(fmtUsd(a.peak))) +
      statCard("drawdown", "Drawdown from peak", a.drawdownPct.toFixed(1) + "%") +
      statCard("stopLine", "Stop-trading line", escapeHtml(fmtUsd(a.stopLine))) +
      statCard("status", "Status", a.stopped ? "STOP — drawdown limit hit" : "OK to trade")
        .replace('class="stat-card"', 'class="stat-card ' + (a.stopped ? "status-stop" : "status-ok") + '"');

    var layerNote = "Layered toward the stop every " + L + " pips inside a 50-pip zone; the last entry stays " +
      (OWN_PREM_STOP - 2 * L) + " pips from the stop.";

    elPlanCards.innerHTML =
      planCard("own", "Own trades", p.own.risk,
        "Max stop 100 pips from the first entry. One entry, or three layered entries.",
        planBlock("1 entry", p.own.single, "Stop 100 pips.") +
        planBlock("3 entries", p.own.three, layerNote)) +

      planCard("premium", "Premium (Nick)", p.premium.risk,
        "Same as own trades — 100-pip max stop — but up to 20%. Splitting is preferred.",
        planBlock("3 entries", p.premium.three, layerNote, "preferred") +
        planBlock("1 entry", p.premium.single, "Stop 100 pips.")) +

      planCard("grindSignal", "Grind Room — signal (Aaron)", p.grindSignal.risk,
        GRIND_SIGNAL_LEGS + " entries every " + GRIND_LAYER + " pips into the 50-pip zone; stop " + GRIND_SIGNAL_STOP + " pips from the first (worst) entry.",
        planBlock(GRIND_SIGNAL_LEGS + " entries", p.grindSignal.plan, "")) +

      planCard("grindLive", "Grind Room — live (Zoom)", p.grindLive.risk,
        GRIND_LIVE_LEGS + " entries every " + GRIND_LAYER + " pips; stop measured from the worst entry — usually 120–130, rarely 150.",
        planBlock(GRIND_LIVE_LEGS + " entries · " + p.grindLive.stop + "-pip stop", p.grindLive.plan, ""),
        '<div class="seg plan-seg" role="group" aria-label="Live stop">' + [120, 130, 150].map(function(v){
          return '<button type="button" data-live-stop="' + v + '" class="' + (p.grindLive.stop === v ? "on" : "") + '">' + v + " pips</button>";
        }).join("") + "</div>") +

      planCard("inst", "IT / Thomas", p.inst.risk,
        "Stop varies (30–100 pips) and he uses a 50-pip zone. Set today's stop: a tight stop = 1 entry; from " +
          p.inst.minThreeStop + " pips you can layer 3 entries " + L + " pips apart.",
        (p.inst.three ? planBlock("3 entries", p.inst.three, "Layered every " + L + " pips; last entry " + (p.inst.stop - 2 * L) + " pips from the stop.") : "") +
        planBlock("1 entry", p.inst.single, p.inst.three ? "" : "Stop is too tight to layer — take 1 entry."),
        '<div class="field plan-inst-stop"><label for="sz-instStop">Today\'s stop from the first entry (pips, max 100)</label>' +
          '<input type="number" step="any" inputmode="decimal" id="sz-instStop" data-sizing-inline="instStop" value="' + p.inst.stop + '"></div>');

    renderPartials(p, usd);
  }



  function sizingError(msg){
    elSzError.textContent = msg;
    elSzError.hidden = !msg;
  }
  var SIZING_MSG = {
    own: "Own-trade risk must be between 0.1% and 30%.",
    premium: "Signal risk must be between 0.1% and 20%.",
    grindLive: "Signal risk must be between 0.1% and 20%.",
    grindSignal: "Signal risk must be between 0.1% and 20%.",
    inst: "Signal risk must be between 0.1% and 20%.",
    layer: "The layer gap must be 20–25 pips (3 entries in a 50-pip zone).",
    instStop: "IT stop must be 10–100 pips."
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
  elPlanCards.addEventListener("click", function(ev){
    var b = ev.target.closest("button[data-live-stop]");
    if(!b) return;
    if(setSizing("grindLiveStop", b.dataset.liveStop)) renderSizingOutputs();
  });
  // The IT stop box is re-drawn with the cards, so apply it on change.
  elPlanCards.addEventListener("change", function(ev){
    var inp = ev.target.closest("[data-sizing-inline]");
    if(!inp) return;
    setSizing(inp.dataset.sizingInline, inp.value);
    renderSizingOutputs();
  });
  elPlanCards.addEventListener("keydown", function(ev){
    if(ev.key === "Enter" && ev.target.closest("[data-sizing-inline]")) ev.target.blur();
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

  // ---- accounts editor ----
  var elAcctRows = document.getElementById("s-accounts");
  var elAcctNew = document.getElementById("s-acct-new");
  var elAcctError = document.getElementById("s-acct-error");
  function showErr(el, msg){ el.textContent = msg; el.hidden = !msg; }

  function accountUse(id){
    return trades.filter(function(t){ return accountIdOf(t, settings) === id; }).length +
      (settings.cashFlows || []).filter(function(f){ return f.account === id; }).length;
  }
  var acctConfirm = null;   // id of the account whose delete is being confirmed
  function renderAccountRows(){
    var only = settings.accounts.length === 1;
    elAcctRows.innerHTML = settings.accounts.map(function(a){
      var used = accountUse(a.id);
      var nT = trades.filter(function(t){ return accountIdOf(t, settings) === a.id; }).length;
      var nF = (settings.cashFlows || []).filter(function(f){ return f.account === a.id; }).length;
      var confirmBox = acctConfirm === a.id ?
        '<div class="a-confirm">Delete <strong>' + escapeHtml(a.name) + "</strong> for good, with its " +
          nT + " trade" + (nT === 1 ? "" : "s") + " and " + nF + " deposit" + (nF === 1 ? "" : "s") + "/withdrawal" + (nF === 1 ? "" : "s") +
          "? It can't be undone — Export JSON first if you might want it back." +
          '<div class="a-confirm-acts"><button type="button" class="danger a-confirm-yes">Delete ' + escapeHtml(a.name) + '</button>' +
          '<button type="button" class="ghost a-confirm-no">Cancel</button></div></div>' : "";
      return '<div class="pair-row" data-id="' + escapeHtml(a.id) + '">' +
        '<div class="field"><label>Account</label><input type="text" class="a-name" value="' + escapeHtml(a.name) + '" aria-label="Account name"></div>' +
        '<div class="field"><label>Starting deposit ($)</label><input type="number" step="any" inputmode="decimal" class="a-dep" value="' + a.startingDeposit + '"></div>' +
        '<div class="field"><label>Adjustment ($)</label><input type="number" step="any" inputmode="decimal" class="a-adj" value="' + a.adjustment + '"></div>' +
        '<button type="button" class="p-remove a-remove" aria-label="Remove ' + escapeHtml(a.name) + '"' +
          (only ? ' disabled title="At least one account is needed"' : used ? ' title="Delete this account and everything on it"' : ' title="Remove this account"') + ">&times;</button>" +
        confirmBox +
      "</div>";
    }).join("");
  }
  function nameTaken(list, name, exceptId){
    return list.some(function(x){ return x.id !== exceptId && x.name.toLowerCase() === name.toLowerCase(); });
  }
  function afterAccountChange(){
    var tot = viewSettings(settings, "");
    settings.startingDeposit = tot.startingDeposit;
    settings.depositsWithdrawals = tot.depositsWithdrawals;
    saveSettings();
    renderAcctSwitch();
    renderAccountRows();
    renderFlows();
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
    var row = ev.target.closest(".pair-row"); if(!row) return;
    var id = row.dataset.id;
    if(ev.target.closest(".a-confirm-no")){ acctConfirm = null; renderAccountRows(); return; }
    if(ev.target.closest(".a-confirm-yes")){ deleteAccount(id); return; }
    var btn = ev.target.closest(".a-remove"); if(!btn || btn.disabled) return;
    if(settings.accounts.length <= 1) return;
    if(accountUse(id)){ acctConfirm = id; renderAccountRows(); return; }
    settings.accounts = settings.accounts.filter(function(a){ return a.id !== id; });
    afterAccountChange();
  });
  // Removes an account with every trade and deposit/withdrawal on it. Trades
  // go first: a trade whose account no longer exists would otherwise fall
  // back to the first account and land in its balance.
  function deleteAccount(id){
    if(settings.accounts.length <= 1 || !accountById(settings, id)) return;
    trades = trades.filter(function(t){ return accountIdOf(t, settings) !== id; });
    settings.cashFlows = (settings.cashFlows || []).filter(function(f){ return f.account !== id; });
    settings.accounts = settings.accounts.filter(function(a){ return a.id !== id; });
    if(activeAccount === id) activeAccount = "";
    acctConfirm = null;
    saveTrades();
    afterAccountChange();
    renderTable();
  }
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

  function renderSizing(){
    settingInputs.forEach(function(input){ input.value = settings[input.dataset.setting]; });
    sizingInputs.forEach(function(input){ input.value = settings.sizing[input.dataset.sizing]; });
    sizingError("");
    elPairError.hidden = true;
    showErr(elAcctError, "");
    renderAccountRows();
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
    var keepAcc = elCfAccount.value || sizingAccount();
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

  function shownWeekRange(){
    var d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return getWeekRange(d);
  }

  function renderWeekly(){
    var range = shownWeekRange();
    var w = weeklyStats(deriveView(), range);

    document.getElementById("week-range-label").textContent =
      (weekOffset === 0 ? "This week · " : "") + range.start + " to " + range.end;
    btnWkNext.disabled = weekOffset >= 0;
    btnWkPdf.disabled = btnWkXlsx.disabled = w.logged === 0;
    document.getElementById("weekly-stats-grid").innerHTML =
      statCard("wkTrades", "Trades", String(w.trades)) +
      statCard("wkIdeas", "Ideas", String(w.ideas)) +
      statCard("wkNet", "Net P/L", w.closed ? fmtMoney(w.net) : "—") +
      statCard("wkWinRate", WEEK_WIN_RATE_LABEL, fmtPct(w.winRate));

    document.getElementById("weekly-empty").hidden = w.logged !== 0;
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
    var w = weeklyStats(derived, range);
    var rows = derived.rows.filter(function(r){ return r.trade.date >= range.start && r.trade.date <= range.end; });
    var before = derived.rows.filter(function(r){ return r.trade.date < range.start && r.calc.pl !== null; });
    var flowsBefore = sum(sortedFlows(viewS()).filter(function(f){ return f.date < range.start; }).map(flowAmount));
    var startBalance = round2(derived.account.base + flowsBefore + sum(before.map(function(r){ return r.calc.pl; })));
    var closed = rows.filter(function(r){ return r.calc.pl !== null; });
    var pls = closed.map(function(r){ return r.calc.pl; });

    return {
      range: range,
      who: (elUser.textContent || "").replace(/^ · /, "") + (multiAccount() ? " · " + (validActive() ? accountName(validActive()) : "All accounts") : ""),
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
        ["Balance at end ($)", round2(startBalance + (w.closed ? w.net : 0))]
      ],
      trades: rows.map(function(r){
        var t = r.trade, c = r.calc, b = t.bias;
        return {
          n: r.n, date: t.date, session: t.session, pair: t.pair, direction: t.direction, source: t.source,
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
  function weekFileName(rep, ext){ return fileSlug() + "-week-" + rep.range.start + "." + ext; }

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

      var head = ["#", "Date", "Session", "Pair", "Direction", "Source", "Bias D/4H/1H/15M", "Entry", "Stop",
        "SL pips", "Lots", "P/L ($)", "Idea", "Result", "Confirmation", "Mistake / Lesson"];
      var body = rep.trades.map(function(t){
        return [t.n, t.date, t.session, t.pair, t.direction, t.source, t.bias, t.entry, t.stop,
          t.slPips, t.lots, t.pl, t.idea, t.result, t.confirmation, t.lesson];
      });
      var ws2 = X.utils.aoa_to_sheet([head].concat(body));
      ws2["!cols"] = [5, 11, 10, 9, 9, 13, 22, 9, 9, 8, 6, 9, 5, 7, 40, 40].map(function(w){ return { wch: w }; });
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
      var GOLD = [20, 20, 24], INK = [255, 255, 255], GREEN = [22, 140, 80], RED = [200, 40, 55];
      var M = 36;
      var headStyles = { fillColor: GOLD, textColor: INK, fontStyle: "bold" };
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
      doc.text(pdfText("Week " + rep.range.start + " to " + rep.range.end +
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
          "SL pips", "Lots", "P/L", "Idea", "Result"]],
        body: rep.trades.map(function(t){
          return [t.n, t.date, pdfText(t.session), pdfText(t.pair), t.direction, pdfText(t.source), t.bias,
            pdfNum(t.entry, t.priceDp), pdfNum(t.stop, t.priceDp), pdfNum(t.slPips, 1), pdfNum(t.lots, 2), pdfUsd(t.pl),
            t.idea, t.result];
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
  // Backup files keep this id from when the app was called Callisto Journal,
  // so every backup made before the rename still imports.
  var EXPORT_APP = "callisto-journal";
  var EXPORT_VERSION = 3;

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
    if(isObject && data.version === 2 && data.app === undefined){
      return "This backup is from the old version 2 of this journal. This version uses a different trade model and can only import its own version " + EXPORT_VERSION + " backups.";
    }
    var ok = isObject &&
      data.app === EXPORT_APP &&
      data.version === EXPORT_VERSION &&
      data.settings && typeof data.settings === "object" && !Array.isArray(data.settings) &&
      Array.isArray(data.trades) &&
      data.trades.every(function(t){ return t && typeof t === "object" && !Array.isArray(t); });
    return ok ? "" : "That file doesn't look like a journal backup (Johnson Journal or this journal, version " + EXPORT_VERSION + ").";
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
    authScreen.hidden = false;
    authForm.hidden = true;
    authLoading.hidden = false;
    authLoading.innerHTML = CONFIGURED ?
      "Couldn't load the database library. Check your connection and reload the page." :
      "<strong>Almost there.</strong> Open <code>config.js</code> and paste in your Supabase project URL and publishable key, then reload.";
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
