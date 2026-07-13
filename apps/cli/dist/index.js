var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);

// ../../node_modules/.pnpm/consola@3.4.2/node_modules/consola/dist/chunks/prompt.mjs
var exports_prompt = {};
__export(exports_prompt, {
  prompt: () => prompt,
  kCancel: () => kCancel
});
import g, { stdin, stdout } from "node:process";
import f from "node:readline";
import { WriteStream } from "node:tty";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
function requireSrc() {
  if (hasRequiredSrc)
    return src;
  hasRequiredSrc = 1;
  const ESC = "\x1B";
  const CSI = `${ESC}[`;
  const beep = "\x07";
  const cursor = {
    to(x, y) {
      if (!y)
        return `${CSI}${x + 1}G`;
      return `${CSI}${y + 1};${x + 1}H`;
    },
    move(x, y) {
      let ret = "";
      if (x < 0)
        ret += `${CSI}${-x}D`;
      else if (x > 0)
        ret += `${CSI}${x}C`;
      if (y < 0)
        ret += `${CSI}${-y}A`;
      else if (y > 0)
        ret += `${CSI}${y}B`;
      return ret;
    },
    up: (count = 1) => `${CSI}${count}A`,
    down: (count = 1) => `${CSI}${count}B`,
    forward: (count = 1) => `${CSI}${count}C`,
    backward: (count = 1) => `${CSI}${count}D`,
    nextLine: (count = 1) => `${CSI}E`.repeat(count),
    prevLine: (count = 1) => `${CSI}F`.repeat(count),
    left: `${CSI}G`,
    hide: `${CSI}?25l`,
    show: `${CSI}?25h`,
    save: `${ESC}7`,
    restore: `${ESC}8`
  };
  const scroll = {
    up: (count = 1) => `${CSI}S`.repeat(count),
    down: (count = 1) => `${CSI}T`.repeat(count)
  };
  const erase = {
    screen: `${CSI}2J`,
    up: (count = 1) => `${CSI}1J`.repeat(count),
    down: (count = 1) => `${CSI}J`.repeat(count),
    line: `${CSI}2K`,
    lineEnd: `${CSI}K`,
    lineStart: `${CSI}1K`,
    lines(count) {
      let clear = "";
      for (let i = 0;i < count; i++)
        clear += this.line + (i < count - 1 ? cursor.up() : "");
      if (count)
        clear += cursor.left;
      return clear;
    }
  };
  src = { cursor, scroll, erase, beep };
  return src;
}
function requirePicocolors() {
  if (hasRequiredPicocolors)
    return picocolors.exports;
  hasRequiredPicocolors = 1;
  let p = process || {}, argv2 = p.argv || [], env2 = p.env || {};
  let isColorSupported2 = !(!!env2.NO_COLOR || argv2.includes("--no-color")) && (!!env2.FORCE_COLOR || argv2.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env2.TERM !== "dumb" || !!env2.CI);
  let formatter = (open, close, replace = open) => (input) => {
    let string = "" + input, index = string.indexOf(close, open.length);
    return ~index ? open + replaceClose2(string, close, replace, index) + close : open + string + close;
  };
  let replaceClose2 = (string, close, replace, index) => {
    let result = "", cursor = 0;
    do {
      result += string.substring(cursor, index) + replace;
      cursor = index + close.length;
      index = string.indexOf(close, cursor);
    } while (~index);
    return result + string.substring(cursor);
  };
  let createColors2 = (enabled = isColorSupported2) => {
    let f2 = enabled ? formatter : () => String;
    return {
      isColorSupported: enabled,
      reset: f2("\x1B[0m", "\x1B[0m"),
      bold: f2("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
      dim: f2("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
      italic: f2("\x1B[3m", "\x1B[23m"),
      underline: f2("\x1B[4m", "\x1B[24m"),
      inverse: f2("\x1B[7m", "\x1B[27m"),
      hidden: f2("\x1B[8m", "\x1B[28m"),
      strikethrough: f2("\x1B[9m", "\x1B[29m"),
      black: f2("\x1B[30m", "\x1B[39m"),
      red: f2("\x1B[31m", "\x1B[39m"),
      green: f2("\x1B[32m", "\x1B[39m"),
      yellow: f2("\x1B[33m", "\x1B[39m"),
      blue: f2("\x1B[34m", "\x1B[39m"),
      magenta: f2("\x1B[35m", "\x1B[39m"),
      cyan: f2("\x1B[36m", "\x1B[39m"),
      white: f2("\x1B[37m", "\x1B[39m"),
      gray: f2("\x1B[90m", "\x1B[39m"),
      bgBlack: f2("\x1B[40m", "\x1B[49m"),
      bgRed: f2("\x1B[41m", "\x1B[49m"),
      bgGreen: f2("\x1B[42m", "\x1B[49m"),
      bgYellow: f2("\x1B[43m", "\x1B[49m"),
      bgBlue: f2("\x1B[44m", "\x1B[49m"),
      bgMagenta: f2("\x1B[45m", "\x1B[49m"),
      bgCyan: f2("\x1B[46m", "\x1B[49m"),
      bgWhite: f2("\x1B[47m", "\x1B[49m"),
      blackBright: f2("\x1B[90m", "\x1B[39m"),
      redBright: f2("\x1B[91m", "\x1B[39m"),
      greenBright: f2("\x1B[92m", "\x1B[39m"),
      yellowBright: f2("\x1B[93m", "\x1B[39m"),
      blueBright: f2("\x1B[94m", "\x1B[39m"),
      magentaBright: f2("\x1B[95m", "\x1B[39m"),
      cyanBright: f2("\x1B[96m", "\x1B[39m"),
      whiteBright: f2("\x1B[97m", "\x1B[39m"),
      bgBlackBright: f2("\x1B[100m", "\x1B[49m"),
      bgRedBright: f2("\x1B[101m", "\x1B[49m"),
      bgGreenBright: f2("\x1B[102m", "\x1B[49m"),
      bgYellowBright: f2("\x1B[103m", "\x1B[49m"),
      bgBlueBright: f2("\x1B[104m", "\x1B[49m"),
      bgMagentaBright: f2("\x1B[105m", "\x1B[49m"),
      bgCyanBright: f2("\x1B[106m", "\x1B[49m"),
      bgWhiteBright: f2("\x1B[107m", "\x1B[49m")
    };
  };
  picocolors.exports = createColors2();
  picocolors.exports.createColors = createColors2;
  return picocolors.exports;
}
function J({ onlyFirst: t = false } = {}) {
  const F = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?(?:\\u0007|\\u001B\\u005C|\\u009C))", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"].join("|");
  return new RegExp(F, t ? undefined : "g");
}
function T$1(t) {
  if (typeof t != "string")
    throw new TypeError(`Expected a \`string\`, got \`${typeof t}\``);
  return t.replace(Q, "");
}
function O(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
function A$1(t, u = {}) {
  if (typeof t != "string" || t.length === 0 || (u = { ambiguousIsNarrow: true, ...u }, t = T$1(t), t.length === 0))
    return 0;
  t = t.replace(FD(), "  ");
  const F = u.ambiguousIsNarrow ? 1 : 2;
  let e2 = 0;
  for (const s of t) {
    const i = s.codePointAt(0);
    if (i <= 31 || i >= 127 && i <= 159 || i >= 768 && i <= 879)
      continue;
    switch (DD.eastAsianWidth(s)) {
      case "F":
      case "W":
        e2 += 2;
        break;
      case "A":
        e2 += F;
        break;
      default:
        e2 += 1;
    }
  }
  return e2;
}
function sD() {
  const t = new Map;
  for (const [u, F] of Object.entries(r)) {
    for (const [e2, s] of Object.entries(F))
      r[e2] = { open: `\x1B[${s[0]}m`, close: `\x1B[${s[1]}m` }, F[e2] = r[e2], t.set(s[0], s[1]);
    Object.defineProperty(r, u, { value: F, enumerable: false });
  }
  return Object.defineProperty(r, "codes", { value: t, enumerable: false }), r.color.close = "\x1B[39m", r.bgColor.close = "\x1B[49m", r.color.ansi = L$1(), r.color.ansi256 = N(), r.color.ansi16m = I(), r.bgColor.ansi = L$1(m), r.bgColor.ansi256 = N(m), r.bgColor.ansi16m = I(m), Object.defineProperties(r, { rgbToAnsi256: { value: (u, F, e2) => u === F && F === e2 ? u < 8 ? 16 : u > 248 ? 231 : Math.round((u - 8) / 247 * 24) + 232 : 16 + 36 * Math.round(u / 255 * 5) + 6 * Math.round(F / 255 * 5) + Math.round(e2 / 255 * 5), enumerable: false }, hexToRgb: { value: (u) => {
    const F = /[a-f\d]{6}|[a-f\d]{3}/i.exec(u.toString(16));
    if (!F)
      return [0, 0, 0];
    let [e2] = F;
    e2.length === 3 && (e2 = [...e2].map((i) => i + i).join(""));
    const s = Number.parseInt(e2, 16);
    return [s >> 16 & 255, s >> 8 & 255, s & 255];
  }, enumerable: false }, hexToAnsi256: { value: (u) => r.rgbToAnsi256(...r.hexToRgb(u)), enumerable: false }, ansi256ToAnsi: { value: (u) => {
    if (u < 8)
      return 30 + u;
    if (u < 16)
      return 90 + (u - 8);
    let F, e2, s;
    if (u >= 232)
      F = ((u - 232) * 10 + 8) / 255, e2 = F, s = F;
    else {
      u -= 16;
      const C = u % 36;
      F = Math.floor(u / 36) / 5, e2 = Math.floor(C / 6) / 5, s = C % 6 / 5;
    }
    const i = Math.max(F, e2, s) * 2;
    if (i === 0)
      return 30;
    let D = 30 + (Math.round(s) << 2 | Math.round(e2) << 1 | Math.round(F));
    return i === 2 && (D += 60), D;
  }, enumerable: false }, rgbToAnsi: { value: (u, F, e2) => r.ansi256ToAnsi(r.rgbToAnsi256(u, F, e2)), enumerable: false }, hexToAnsi: { value: (u) => r.ansi256ToAnsi(r.hexToAnsi256(u)), enumerable: false } }), r;
}
function G(t, u, F) {
  return String(t).normalize().replace(/\r\n/g, `
`).split(`
`).map((e2) => oD(e2, u, F)).join(`
`);
}
function k$1(t, u) {
  if (typeof t == "string")
    return c.aliases.get(t) === u;
  for (const F of t)
    if (F !== undefined && k$1(F, u))
      return true;
  return false;
}
function lD(t, u) {
  if (t === u)
    return;
  const F = t.split(`
`), e2 = u.split(`
`), s = [];
  for (let i = 0;i < Math.max(F.length, e2.length); i++)
    F[i] !== e2[i] && s.push(i);
  return s;
}
function d$1(t, u) {
  const F = t;
  F.isTTY && F.setRawMode(u);
}

class x {
  constructor(u, F = true) {
    h(this, "input"), h(this, "output"), h(this, "_abortSignal"), h(this, "rl"), h(this, "opts"), h(this, "_render"), h(this, "_track", false), h(this, "_prevFrame", ""), h(this, "_subscribers", new Map), h(this, "_cursor", 0), h(this, "state", "initial"), h(this, "error", ""), h(this, "value");
    const { input: e2 = stdin, output: s = stdout, render: i, signal: D, ...C } = u;
    this.opts = C, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = i.bind(this), this._track = F, this._abortSignal = D, this.input = e2, this.output = s;
  }
  unsubscribe() {
    this._subscribers.clear();
  }
  setSubscriber(u, F) {
    const e2 = this._subscribers.get(u) ?? [];
    e2.push(F), this._subscribers.set(u, e2);
  }
  on(u, F) {
    this.setSubscriber(u, { cb: F });
  }
  once(u, F) {
    this.setSubscriber(u, { cb: F, once: true });
  }
  emit(u, ...F) {
    const e2 = this._subscribers.get(u) ?? [], s = [];
    for (const i of e2)
      i.cb(...F), i.once && s.push(() => e2.splice(e2.indexOf(i), 1));
    for (const i of s)
      i();
  }
  prompt() {
    return new Promise((u, F) => {
      if (this._abortSignal) {
        if (this._abortSignal.aborted)
          return this.state = "cancel", this.close(), u(S);
        this._abortSignal.addEventListener("abort", () => {
          this.state = "cancel", this.close();
        }, { once: true });
      }
      const e2 = new WriteStream(0);
      e2._write = (s, i, D) => {
        this._track && (this.value = this.rl?.line.replace(/\t/g, ""), this._cursor = this.rl?.cursor ?? 0, this.emit("value", this.value)), D();
      }, this.input.pipe(e2), this.rl = f.createInterface({ input: this.input, output: e2, tabSize: 2, prompt: "", escapeCodeTimeout: 50 }), f.emitKeypressEvents(this.input, this.rl), this.rl.prompt(), this.opts.initialValue !== undefined && this._track && this.rl.write(this.opts.initialValue), this.input.on("keypress", this.onKeypress), d$1(this.input, true), this.output.on("resize", this.render), this.render(), this.once("submit", () => {
        this.output.write(srcExports.cursor.show), this.output.off("resize", this.render), d$1(this.input, false), u(this.value);
      }), this.once("cancel", () => {
        this.output.write(srcExports.cursor.show), this.output.off("resize", this.render), d$1(this.input, false), u(S);
      });
    });
  }
  onKeypress(u, F) {
    if (this.state === "error" && (this.state = "active"), F?.name && (!this._track && c.aliases.has(F.name) && this.emit("cursor", c.aliases.get(F.name)), c.actions.has(F.name) && this.emit("cursor", F.name)), u && (u.toLowerCase() === "y" || u.toLowerCase() === "n") && this.emit("confirm", u.toLowerCase() === "y"), u === "\t" && this.opts.placeholder && (this.value || (this.rl?.write(this.opts.placeholder), this.emit("value", this.opts.placeholder))), u && this.emit("key", u.toLowerCase()), F?.name === "return") {
      if (this.opts.validate) {
        const e2 = this.opts.validate(this.value);
        e2 && (this.error = e2 instanceof Error ? e2.message : e2, this.state = "error", this.rl?.write(this.value));
      }
      this.state !== "error" && (this.state = "submit");
    }
    k$1([u, F?.name, F?.sequence], "cancel") && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
  }
  close() {
    this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), d$1(this.input, false), this.rl?.close(), this.rl = undefined, this.emit(`${this.state}`, this.value), this.unsubscribe();
  }
  restoreCursor() {
    const u = G(this._prevFrame, process.stdout.columns, { hard: true }).split(`
`).length - 1;
    this.output.write(srcExports.cursor.move(-999, u * -1));
  }
  render() {
    const u = G(this._render(this) ?? "", process.stdout.columns, { hard: true });
    if (u !== this._prevFrame) {
      if (this.state === "initial")
        this.output.write(srcExports.cursor.hide);
      else {
        const F = lD(this._prevFrame, u);
        if (this.restoreCursor(), F && F?.length === 1) {
          const e2 = F[0];
          this.output.write(srcExports.cursor.move(0, e2)), this.output.write(srcExports.erase.lines(1));
          const s = u.split(`
`);
          this.output.write(s[e2]), this._prevFrame = u, this.output.write(srcExports.cursor.move(0, s.length - e2 - 1));
          return;
        }
        if (F && F?.length > 1) {
          const e2 = F[0];
          this.output.write(srcExports.cursor.move(0, e2)), this.output.write(srcExports.erase.down());
          const s = u.split(`
`).slice(e2);
          this.output.write(s.join(`
`)), this._prevFrame = u;
          return;
        }
        this.output.write(srcExports.erase.down());
      }
      this.output.write(u), this.state === "initial" && (this.state = "active"), this._prevFrame = u;
    }
  }
}
function ce() {
  return g.platform !== "win32" ? g.env.TERM !== "linux" : !!g.env.CI || !!g.env.WT_SESSION || !!g.env.TERMINUS_SUBLIME || g.env.ConEmuTask === "{cmd::Cmder}" || g.env.TERM_PROGRAM === "Terminus-Sublime" || g.env.TERM_PROGRAM === "vscode" || g.env.TERM === "xterm-256color" || g.env.TERM === "alacritty" || g.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
async function prompt(message, opts = {}) {
  const handleCancel = (value) => {
    if (typeof value !== "symbol" || value.toString() !== "Symbol(clack:cancel)") {
      return value;
    }
    switch (opts.cancel) {
      case "reject": {
        const error = new Error("Prompt cancelled.");
        error.name = "ConsolaPromptCancelledError";
        if (Error.captureStackTrace) {
          Error.captureStackTrace(error, prompt);
        }
        throw error;
      }
      case "undefined": {
        return;
      }
      case "null": {
        return null;
      }
      case "symbol": {
        return kCancel;
      }
      default:
      case "default": {
        return opts.default ?? opts.initial;
      }
    }
  };
  if (!opts.type || opts.type === "text") {
    return await he({
      message,
      defaultValue: opts.default,
      placeholder: opts.placeholder,
      initialValue: opts.initial
    }).then(handleCancel);
  }
  if (opts.type === "confirm") {
    return await ye({
      message,
      initialValue: opts.initial
    }).then(handleCancel);
  }
  if (opts.type === "select") {
    return await ve({
      message,
      options: opts.options.map((o2) => typeof o2 === "string" ? { value: o2, label: o2 } : o2),
      initialValue: opts.initial
    }).then(handleCancel);
  }
  if (opts.type === "multiselect") {
    return await fe({
      message,
      options: opts.options.map((o2) => typeof o2 === "string" ? { value: o2, label: o2 } : o2),
      required: opts.required,
      initialValues: opts.initial
    }).then(handleCancel);
  }
  throw new Error(`Unknown prompt type: ${opts.type}`);
}
var src, hasRequiredSrc, srcExports, picocolors, hasRequiredPicocolors, picocolorsExports, e, Q, P$1, X, DD, uD = function() {
  return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|(?:\uD83E\uDDD1\uD83C\uDFFF\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFC-\uDFFF])|\uD83D\uDC68(?:\uD83C\uDFFB(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|[\u2695\u2696\u2708]\uFE0F|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))?|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC)?|(?:\uD83D\uDC69(?:\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC69(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83E\uDDD1(?:\u200D(?:\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDE36\u200D\uD83C\uDF2B|\uD83C\uDFF3\uFE0F\u200D\u26A7|\uD83D\uDC3B\u200D\u2744|(?:(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\uD83C\uDFF4\u200D\u2620|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]|\uD83D[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])\uFE0F|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDE35\u200D\uD83D\uDCAB|\uD83D\uDE2E\u200D\uD83D\uDCA8|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83E\uDDD1(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83D\uDC69(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83D\uDC08\u200D\u2B1B|\u2764\uFE0F\u200D(?:\uD83D\uDD25|\uD83E\uDE79)|\uD83D\uDC41\uFE0F|\uD83C\uDFF3\uFE0F|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|[#\*0-9]\uFE0F\u20E3|\u2764\uFE0F|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF4|(?:[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270C\u270D]|\uD83D[\uDD74\uDD90])(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC08\uDC15\uDC3B\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE2E\uDE35\uDE36\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5]|\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD]|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0D\uDD0E\uDD10-\uDD17\uDD1D\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78\uDD7A-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCB\uDDD0\uDDE0-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6]|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDD77\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
}, FD, m = 10, L$1 = (t = 0) => (u) => `\x1B[${u + t}m`, N = (t = 0) => (u) => `\x1B[${38 + t};5;${u}m`, I = (t = 0) => (u, F, e2) => `\x1B[${38 + t};2;${u};${F};${e2}m`, r, tD, eD, iD, v, CD = 39, w$1 = "\x07", W$1 = "[", rD = "]", R = "m", y, V$1 = (t) => `${v.values().next().value}${W$1}${t}${R}`, z = (t) => `${v.values().next().value}${y}${t}${w$1}`, ED = (t) => t.split(" ").map((u) => A$1(u)), _ = (t, u, F) => {
  const e2 = [...u];
  let s = false, i = false, D = A$1(T$1(t[t.length - 1]));
  for (const [C, o] of e2.entries()) {
    const E = A$1(o);
    if (D + E <= F ? t[t.length - 1] += o : (t.push(o), D = 0), v.has(o) && (s = true, i = e2.slice(C + 1).join("").startsWith(y)), s) {
      i ? o === w$1 && (s = false, i = false) : o === R && (s = false);
      continue;
    }
    D += E, D === F && C < e2.length - 1 && (t.push(""), D = 0);
  }
  !D && t[t.length - 1].length > 0 && t.length > 1 && (t[t.length - 2] += t.pop());
}, nD = (t) => {
  const u = t.split(" ");
  let F = u.length;
  for (;F > 0 && !(A$1(u[F - 1]) > 0); )
    F--;
  return F === u.length ? t : u.slice(0, F).join(" ") + u.slice(F).join("");
}, oD = (t, u, F = {}) => {
  if (F.trim !== false && t.trim() === "")
    return "";
  let e2 = "", s, i;
  const D = ED(t);
  let C = [""];
  for (const [E, a] of t.split(" ").entries()) {
    F.trim !== false && (C[C.length - 1] = C[C.length - 1].trimStart());
    let n = A$1(C[C.length - 1]);
    if (E !== 0 && (n >= u && (F.wordWrap === false || F.trim === false) && (C.push(""), n = 0), (n > 0 || F.trim === false) && (C[C.length - 1] += " ", n++)), F.hard && D[E] > u) {
      const B = u - n, p = 1 + Math.floor((D[E] - B - 1) / u);
      Math.floor((D[E] - 1) / u) < p && C.push(""), _(C, a, u);
      continue;
    }
    if (n + D[E] > u && n > 0 && D[E] > 0) {
      if (F.wordWrap === false && n < u) {
        _(C, a, u);
        continue;
      }
      C.push("");
    }
    if (n + D[E] > u && F.wordWrap === false) {
      _(C, a, u);
      continue;
    }
    C[C.length - 1] += a;
  }
  F.trim !== false && (C = C.map((E) => nD(E)));
  const o = [...C.join(`
`)];
  for (const [E, a] of o.entries()) {
    if (e2 += a, v.has(a)) {
      const { groups: B } = new RegExp(`(?:\\${W$1}(?<code>\\d+)m|\\${y}(?<uri>.*)${w$1})`).exec(o.slice(E).join("")) || { groups: {} };
      if (B.code !== undefined) {
        const p = Number.parseFloat(B.code);
        s = p === CD ? undefined : p;
      } else
        B.uri !== undefined && (i = B.uri.length === 0 ? undefined : B.uri);
    }
    const n = iD.codes.get(Number(s));
    o[E + 1] === `
` ? (i && (e2 += z("")), s && n && (e2 += V$1(n))) : a === `
` && (s && n && (e2 += V$1(s)), i && (e2 += z(i)));
  }
  return e2;
}, aD, c, S, AD, pD = (t, u, F) => (u in t) ? AD(t, u, { enumerable: true, configurable: true, writable: true, value: F }) : t[u] = F, h = (t, u, F) => (pD(t, typeof u != "symbol" ? u + "" : u, F), F), fD, bD, mD = (t, u, F) => (u in t) ? bD(t, u, { enumerable: true, configurable: true, writable: true, value: F }) : t[u] = F, Y = (t, u, F) => (mD(t, typeof u != "symbol" ? u + "" : u, F), F), wD, SD, $D = (t, u, F) => (u in t) ? SD(t, u, { enumerable: true, configurable: true, writable: true, value: F }) : t[u] = F, q = (t, u, F) => ($D(t, typeof u != "symbol" ? u + "" : u, F), F), jD, PD, V, u = (t, n) => V ? t : n, le, L, W, C, o, d, k, P, A, T, F, w = (t) => {
  switch (t) {
    case "initial":
    case "active":
      return e.cyan(le);
    case "cancel":
      return e.red(L);
    case "error":
      return e.yellow(W);
    case "submit":
      return e.green(C);
  }
}, B = (t) => {
  const { cursor: n, options: s, style: r2 } = t, i = t.maxItems ?? Number.POSITIVE_INFINITY, a = Math.max(process.stdout.rows - 4, 0), c2 = Math.min(a, Math.max(i, 5));
  let l = 0;
  n >= l + c2 - 3 ? l = Math.max(Math.min(n - c2 + 3, s.length - c2), 0) : n < l + 2 && (l = Math.max(n - 2, 0));
  const $ = c2 < s.length && l > 0, p = c2 < s.length && l + c2 < s.length;
  return s.slice(l, l + c2).map((M, v2, x2) => {
    const j = v2 === 0 && $, E = v2 === x2.length - 1 && p;
    return j || E ? e.dim("...") : r2(M, v2 + l === n);
  });
}, he = (t) => new PD({ validate: t.validate, placeholder: t.placeholder, defaultValue: t.defaultValue, initialValue: t.initialValue, render() {
  const n = `${e.gray(o)}
${w(this.state)} ${t.message}
`, s = t.placeholder ? e.inverse(t.placeholder[0]) + e.dim(t.placeholder.slice(1)) : e.inverse(e.hidden("_")), r2 = this.value ? this.valueWithCursor : s;
  switch (this.state) {
    case "error":
      return `${n.trim()}
${e.yellow(o)} ${r2}
${e.yellow(d)} ${e.yellow(this.error)}
`;
    case "submit":
      return `${n}${e.gray(o)} ${e.dim(this.value || t.placeholder)}`;
    case "cancel":
      return `${n}${e.gray(o)} ${e.strikethrough(e.dim(this.value ?? ""))}${this.value?.trim() ? `
${e.gray(o)}` : ""}`;
    default:
      return `${n}${e.cyan(o)} ${r2}
${e.cyan(d)}
`;
  }
} }).prompt(), ye = (t) => {
  const n = t.active ?? "Yes", s = t.inactive ?? "No";
  return new fD({ active: n, inactive: s, initialValue: t.initialValue ?? true, render() {
    const r2 = `${e.gray(o)}
${w(this.state)} ${t.message}
`, i = this.value ? n : s;
    switch (this.state) {
      case "submit":
        return `${r2}${e.gray(o)} ${e.dim(i)}`;
      case "cancel":
        return `${r2}${e.gray(o)} ${e.strikethrough(e.dim(i))}
${e.gray(o)}`;
      default:
        return `${r2}${e.cyan(o)} ${this.value ? `${e.green(k)} ${n}` : `${e.dim(P)} ${e.dim(n)}`} ${e.dim("/")} ${this.value ? `${e.dim(P)} ${e.dim(s)}` : `${e.green(k)} ${s}`}
${e.cyan(d)}
`;
    }
  } }).prompt();
}, ve = (t) => {
  const n = (s, r2) => {
    const i = s.label ?? String(s.value);
    switch (r2) {
      case "selected":
        return `${e.dim(i)}`;
      case "active":
        return `${e.green(k)} ${i} ${s.hint ? e.dim(`(${s.hint})`) : ""}`;
      case "cancelled":
        return `${e.strikethrough(e.dim(i))}`;
      default:
        return `${e.dim(P)} ${e.dim(i)}`;
    }
  };
  return new jD({ options: t.options, initialValue: t.initialValue, render() {
    const s = `${e.gray(o)}
${w(this.state)} ${t.message}
`;
    switch (this.state) {
      case "submit":
        return `${s}${e.gray(o)} ${n(this.options[this.cursor], "selected")}`;
      case "cancel":
        return `${s}${e.gray(o)} ${n(this.options[this.cursor], "cancelled")}
${e.gray(o)}`;
      default:
        return `${s}${e.cyan(o)} ${B({ cursor: this.cursor, options: this.options, maxItems: t.maxItems, style: (r2, i) => n(r2, i ? "active" : "inactive") }).join(`
${e.cyan(o)}  `)}
${e.cyan(d)}
`;
    }
  } }).prompt();
}, fe = (t) => {
  const n = (s, r2) => {
    const i = s.label ?? String(s.value);
    return r2 === "active" ? `${e.cyan(A)} ${i} ${s.hint ? e.dim(`(${s.hint})`) : ""}` : r2 === "selected" ? `${e.green(T)} ${e.dim(i)}` : r2 === "cancelled" ? `${e.strikethrough(e.dim(i))}` : r2 === "active-selected" ? `${e.green(T)} ${i} ${s.hint ? e.dim(`(${s.hint})`) : ""}` : r2 === "submitted" ? `${e.dim(i)}` : `${e.dim(F)} ${e.dim(i)}`;
  };
  return new wD({ options: t.options, initialValues: t.initialValues, required: t.required ?? true, cursorAt: t.cursorAt, validate(s) {
    if (this.required && s.length === 0)
      return `Please select at least one option.
${e.reset(e.dim(`Press ${e.gray(e.bgWhite(e.inverse(" space ")))} to select, ${e.gray(e.bgWhite(e.inverse(" enter ")))} to submit`))}`;
  }, render() {
    const s = `${e.gray(o)}
${w(this.state)} ${t.message}
`, r2 = (i, a) => {
      const c2 = this.value.includes(i.value);
      return a && c2 ? n(i, "active-selected") : c2 ? n(i, "selected") : n(i, a ? "active" : "inactive");
    };
    switch (this.state) {
      case "submit":
        return `${s}${e.gray(o)} ${this.options.filter(({ value: i }) => this.value.includes(i)).map((i) => n(i, "submitted")).join(e.dim(", ")) || e.dim("none")}`;
      case "cancel": {
        const i = this.options.filter(({ value: a }) => this.value.includes(a)).map((a) => n(a, "cancelled")).join(e.dim(", "));
        return `${s}${e.gray(o)} ${i.trim() ? `${i}
${e.gray(o)}` : ""}`;
      }
      case "error": {
        const i = this.error.split(`
`).map((a, c2) => c2 === 0 ? `${e.yellow(d)} ${e.yellow(a)}` : `   ${a}`).join(`
`);
        return `${s + e.yellow(o)} ${B({ options: this.options, cursor: this.cursor, maxItems: t.maxItems, style: r2 }).join(`
${e.yellow(o)}  `)}
${i}
`;
      }
      default:
        return `${s}${e.cyan(o)} ${B({ options: this.options, cursor: this.cursor, maxItems: t.maxItems, style: r2 }).join(`
${e.cyan(o)}  `)}
${e.cyan(d)}
`;
    }
  } }).prompt();
}, kCancel;
var init_prompt = __esm(() => {
  srcExports = requireSrc();
  picocolors = { exports: {} };
  picocolorsExports = /* @__PURE__ */ requirePicocolors();
  e = /* @__PURE__ */ getDefaultExportFromCjs(picocolorsExports);
  Q = J();
  P$1 = { exports: {} };
  (function(t) {
    var u = {};
    t.exports = u, u.eastAsianWidth = function(e2) {
      var s = e2.charCodeAt(0), i = e2.length == 2 ? e2.charCodeAt(1) : 0, D = s;
      return 55296 <= s && s <= 56319 && 56320 <= i && i <= 57343 && (s &= 1023, i &= 1023, D = s << 10 | i, D += 65536), D == 12288 || 65281 <= D && D <= 65376 || 65504 <= D && D <= 65510 ? "F" : D == 8361 || 65377 <= D && D <= 65470 || 65474 <= D && D <= 65479 || 65482 <= D && D <= 65487 || 65490 <= D && D <= 65495 || 65498 <= D && D <= 65500 || 65512 <= D && D <= 65518 ? "H" : 4352 <= D && D <= 4447 || 4515 <= D && D <= 4519 || 4602 <= D && D <= 4607 || 9001 <= D && D <= 9002 || 11904 <= D && D <= 11929 || 11931 <= D && D <= 12019 || 12032 <= D && D <= 12245 || 12272 <= D && D <= 12283 || 12289 <= D && D <= 12350 || 12353 <= D && D <= 12438 || 12441 <= D && D <= 12543 || 12549 <= D && D <= 12589 || 12593 <= D && D <= 12686 || 12688 <= D && D <= 12730 || 12736 <= D && D <= 12771 || 12784 <= D && D <= 12830 || 12832 <= D && D <= 12871 || 12880 <= D && D <= 13054 || 13056 <= D && D <= 19903 || 19968 <= D && D <= 42124 || 42128 <= D && D <= 42182 || 43360 <= D && D <= 43388 || 44032 <= D && D <= 55203 || 55216 <= D && D <= 55238 || 55243 <= D && D <= 55291 || 63744 <= D && D <= 64255 || 65040 <= D && D <= 65049 || 65072 <= D && D <= 65106 || 65108 <= D && D <= 65126 || 65128 <= D && D <= 65131 || 110592 <= D && D <= 110593 || 127488 <= D && D <= 127490 || 127504 <= D && D <= 127546 || 127552 <= D && D <= 127560 || 127568 <= D && D <= 127569 || 131072 <= D && D <= 194367 || 177984 <= D && D <= 196605 || 196608 <= D && D <= 262141 ? "W" : 32 <= D && D <= 126 || 162 <= D && D <= 163 || 165 <= D && D <= 166 || D == 172 || D == 175 || 10214 <= D && D <= 10221 || 10629 <= D && D <= 10630 ? "Na" : D == 161 || D == 164 || 167 <= D && D <= 168 || D == 170 || 173 <= D && D <= 174 || 176 <= D && D <= 180 || 182 <= D && D <= 186 || 188 <= D && D <= 191 || D == 198 || D == 208 || 215 <= D && D <= 216 || 222 <= D && D <= 225 || D == 230 || 232 <= D && D <= 234 || 236 <= D && D <= 237 || D == 240 || 242 <= D && D <= 243 || 247 <= D && D <= 250 || D == 252 || D == 254 || D == 257 || D == 273 || D == 275 || D == 283 || 294 <= D && D <= 295 || D == 299 || 305 <= D && D <= 307 || D == 312 || 319 <= D && D <= 322 || D == 324 || 328 <= D && D <= 331 || D == 333 || 338 <= D && D <= 339 || 358 <= D && D <= 359 || D == 363 || D == 462 || D == 464 || D == 466 || D == 468 || D == 470 || D == 472 || D == 474 || D == 476 || D == 593 || D == 609 || D == 708 || D == 711 || 713 <= D && D <= 715 || D == 717 || D == 720 || 728 <= D && D <= 731 || D == 733 || D == 735 || 768 <= D && D <= 879 || 913 <= D && D <= 929 || 931 <= D && D <= 937 || 945 <= D && D <= 961 || 963 <= D && D <= 969 || D == 1025 || 1040 <= D && D <= 1103 || D == 1105 || D == 8208 || 8211 <= D && D <= 8214 || 8216 <= D && D <= 8217 || 8220 <= D && D <= 8221 || 8224 <= D && D <= 8226 || 8228 <= D && D <= 8231 || D == 8240 || 8242 <= D && D <= 8243 || D == 8245 || D == 8251 || D == 8254 || D == 8308 || D == 8319 || 8321 <= D && D <= 8324 || D == 8364 || D == 8451 || D == 8453 || D == 8457 || D == 8467 || D == 8470 || 8481 <= D && D <= 8482 || D == 8486 || D == 8491 || 8531 <= D && D <= 8532 || 8539 <= D && D <= 8542 || 8544 <= D && D <= 8555 || 8560 <= D && D <= 8569 || D == 8585 || 8592 <= D && D <= 8601 || 8632 <= D && D <= 8633 || D == 8658 || D == 8660 || D == 8679 || D == 8704 || 8706 <= D && D <= 8707 || 8711 <= D && D <= 8712 || D == 8715 || D == 8719 || D == 8721 || D == 8725 || D == 8730 || 8733 <= D && D <= 8736 || D == 8739 || D == 8741 || 8743 <= D && D <= 8748 || D == 8750 || 8756 <= D && D <= 8759 || 8764 <= D && D <= 8765 || D == 8776 || D == 8780 || D == 8786 || 8800 <= D && D <= 8801 || 8804 <= D && D <= 8807 || 8810 <= D && D <= 8811 || 8814 <= D && D <= 8815 || 8834 <= D && D <= 8835 || 8838 <= D && D <= 8839 || D == 8853 || D == 8857 || D == 8869 || D == 8895 || D == 8978 || 9312 <= D && D <= 9449 || 9451 <= D && D <= 9547 || 9552 <= D && D <= 9587 || 9600 <= D && D <= 9615 || 9618 <= D && D <= 9621 || 9632 <= D && D <= 9633 || 9635 <= D && D <= 9641 || 9650 <= D && D <= 9651 || 9654 <= D && D <= 9655 || 9660 <= D && D <= 9661 || 9664 <= D && D <= 9665 || 9670 <= D && D <= 9672 || D == 9675 || 9678 <= D && D <= 9681 || 9698 <= D && D <= 9701 || D == 9711 || 9733 <= D && D <= 9734 || D == 9737 || 9742 <= D && D <= 9743 || 9748 <= D && D <= 9749 || D == 9756 || D == 9758 || D == 9792 || D == 9794 || 9824 <= D && D <= 9825 || 9827 <= D && D <= 9829 || 9831 <= D && D <= 9834 || 9836 <= D && D <= 9837 || D == 9839 || 9886 <= D && D <= 9887 || 9918 <= D && D <= 9919 || 9924 <= D && D <= 9933 || 9935 <= D && D <= 9953 || D == 9955 || 9960 <= D && D <= 9983 || D == 10045 || D == 10071 || 10102 <= D && D <= 10111 || 11093 <= D && D <= 11097 || 12872 <= D && D <= 12879 || 57344 <= D && D <= 63743 || 65024 <= D && D <= 65039 || D == 65533 || 127232 <= D && D <= 127242 || 127248 <= D && D <= 127277 || 127280 <= D && D <= 127337 || 127344 <= D && D <= 127386 || 917760 <= D && D <= 917999 || 983040 <= D && D <= 1048573 || 1048576 <= D && D <= 1114109 ? "A" : "N";
    }, u.characterLength = function(e2) {
      var s = this.eastAsianWidth(e2);
      return s == "F" || s == "W" || s == "A" ? 2 : 1;
    };
    function F(e2) {
      return e2.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || [];
    }
    u.length = function(e2) {
      for (var s = F(e2), i = 0, D = 0;D < s.length; D++)
        i = i + this.characterLength(s[D]);
      return i;
    }, u.slice = function(e2, s, i) {
      textLen = u.length(e2), s = s || 0, i = i || 1, s < 0 && (s = textLen + s), i < 0 && (i = textLen + i);
      for (var D = "", C = 0, o = F(e2), E = 0;E < o.length; E++) {
        var a = o[E], n = u.length(a);
        if (C >= s - (n == 2 ? 1 : 0))
          if (C + n <= i)
            D += a;
          else
            break;
        C += n;
      }
      return D;
    };
  })(P$1);
  X = P$1.exports;
  DD = O(X);
  FD = O(uD);
  r = { modifier: { reset: [0, 0], bold: [1, 22], dim: [2, 22], italic: [3, 23], underline: [4, 24], overline: [53, 55], inverse: [7, 27], hidden: [8, 28], strikethrough: [9, 29] }, color: { black: [30, 39], red: [31, 39], green: [32, 39], yellow: [33, 39], blue: [34, 39], magenta: [35, 39], cyan: [36, 39], white: [37, 39], blackBright: [90, 39], gray: [90, 39], grey: [90, 39], redBright: [91, 39], greenBright: [92, 39], yellowBright: [93, 39], blueBright: [94, 39], magentaBright: [95, 39], cyanBright: [96, 39], whiteBright: [97, 39] }, bgColor: { bgBlack: [40, 49], bgRed: [41, 49], bgGreen: [42, 49], bgYellow: [43, 49], bgBlue: [44, 49], bgMagenta: [45, 49], bgCyan: [46, 49], bgWhite: [47, 49], bgBlackBright: [100, 49], bgGray: [100, 49], bgGrey: [100, 49], bgRedBright: [101, 49], bgGreenBright: [102, 49], bgYellowBright: [103, 49], bgBlueBright: [104, 49], bgMagentaBright: [105, 49], bgCyanBright: [106, 49], bgWhiteBright: [107, 49] } };
  Object.keys(r.modifier);
  tD = Object.keys(r.color);
  eD = Object.keys(r.bgColor);
  [...tD, ...eD];
  iD = sD();
  v = new Set(["\x1B", ""]);
  y = `${rD}8;;`;
  aD = ["up", "down", "left", "right", "space", "enter", "cancel"];
  c = { actions: new Set(aD), aliases: new Map([["k", "up"], ["j", "down"], ["h", "left"], ["l", "right"], ["\x03", "cancel"], ["escape", "cancel"]]) };
  globalThis.process.platform.startsWith("win");
  S = Symbol("clack:cancel");
  AD = Object.defineProperty;
  fD = class fD extends x {
    get cursor() {
      return this.value ? 0 : 1;
    }
    get _value() {
      return this.cursor === 0;
    }
    constructor(u) {
      super(u, false), this.value = !!u.initialValue, this.on("value", () => {
        this.value = this._value;
      }), this.on("confirm", (F) => {
        this.output.write(srcExports.cursor.move(0, -1)), this.value = F, this.state = "submit", this.close();
      }), this.on("cursor", () => {
        this.value = !this.value;
      });
    }
  };
  bD = Object.defineProperty;
  wD = class extends x {
    constructor(u) {
      super(u, false), Y(this, "options"), Y(this, "cursor", 0), this.options = u.options, this.value = [...u.initialValues ?? []], this.cursor = Math.max(this.options.findIndex(({ value: F }) => F === u.cursorAt), 0), this.on("key", (F) => {
        F === "a" && this.toggleAll();
      }), this.on("cursor", (F) => {
        switch (F) {
          case "left":
          case "up":
            this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
            break;
          case "down":
          case "right":
            this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
            break;
          case "space":
            this.toggleValue();
            break;
        }
      });
    }
    get _value() {
      return this.options[this.cursor].value;
    }
    toggleAll() {
      const u = this.value.length === this.options.length;
      this.value = u ? [] : this.options.map((F) => F.value);
    }
    toggleValue() {
      const u = this.value.includes(this._value);
      this.value = u ? this.value.filter((F) => F !== this._value) : [...this.value, this._value];
    }
  };
  SD = Object.defineProperty;
  jD = class jD extends x {
    constructor(u) {
      super(u, false), q(this, "options"), q(this, "cursor", 0), this.options = u.options, this.cursor = this.options.findIndex(({ value: F }) => F === u.initialValue), this.cursor === -1 && (this.cursor = 0), this.changeValue(), this.on("cursor", (F) => {
        switch (F) {
          case "left":
          case "up":
            this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
            break;
          case "down":
          case "right":
            this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
            break;
        }
        this.changeValue();
      });
    }
    get _value() {
      return this.options[this.cursor];
    }
    changeValue() {
      this.value = this._value.value;
    }
  };
  PD = class PD extends x {
    get valueWithCursor() {
      if (this.state === "submit")
        return this.value;
      if (this.cursor >= this.value.length)
        return `${this.value}█`;
      const u = this.value.slice(0, this.cursor), [F, ...e$1] = this.value.slice(this.cursor);
      return `${u}${e.inverse(F)}${e$1.join("")}`;
    }
    get cursor() {
      return this._cursor;
    }
    constructor(u) {
      super(u), this.on("finalize", () => {
        this.value || (this.value = u.defaultValue);
      });
    }
  };
  V = ce();
  le = u("❯", ">");
  L = u("■", "x");
  W = u("▲", "x");
  C = u("✔", "√");
  o = u("");
  d = u("");
  k = u("●", ">");
  P = u("○", " ");
  A = u("◻", "[•]");
  T = u("◼", "[+]");
  F = u("◻", "[ ]");
  `${e.gray(o)}  `;
  kCancel = Symbol.for("cancel");
});

// ../../node_modules/.pnpm/picocolors@1.1.1/node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS((exports, module) => {
  var p = process || {};
  var argv2 = p.argv || [];
  var env2 = p.env || {};
  var isColorSupported2 = !(!!env2.NO_COLOR || argv2.includes("--no-color")) && (!!env2.FORCE_COLOR || argv2.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env2.TERM !== "dumb" || !!env2.CI);
  var formatter = (open, close, replace = open) => (input) => {
    let string = "" + input, index = string.indexOf(close, open.length);
    return ~index ? open + replaceClose2(string, close, replace, index) + close : open + string + close;
  };
  var replaceClose2 = (string, close, replace, index) => {
    let result = "", cursor = 0;
    do {
      result += string.substring(cursor, index) + replace;
      cursor = index + close.length;
      index = string.indexOf(close, cursor);
    } while (~index);
    return result + string.substring(cursor);
  };
  var createColors2 = (enabled = isColorSupported2) => {
    let f3 = enabled ? formatter : () => String;
    return {
      isColorSupported: enabled,
      reset: f3("\x1B[0m", "\x1B[0m"),
      bold: f3("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
      dim: f3("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
      italic: f3("\x1B[3m", "\x1B[23m"),
      underline: f3("\x1B[4m", "\x1B[24m"),
      inverse: f3("\x1B[7m", "\x1B[27m"),
      hidden: f3("\x1B[8m", "\x1B[28m"),
      strikethrough: f3("\x1B[9m", "\x1B[29m"),
      black: f3("\x1B[30m", "\x1B[39m"),
      red: f3("\x1B[31m", "\x1B[39m"),
      green: f3("\x1B[32m", "\x1B[39m"),
      yellow: f3("\x1B[33m", "\x1B[39m"),
      blue: f3("\x1B[34m", "\x1B[39m"),
      magenta: f3("\x1B[35m", "\x1B[39m"),
      cyan: f3("\x1B[36m", "\x1B[39m"),
      white: f3("\x1B[37m", "\x1B[39m"),
      gray: f3("\x1B[90m", "\x1B[39m"),
      bgBlack: f3("\x1B[40m", "\x1B[49m"),
      bgRed: f3("\x1B[41m", "\x1B[49m"),
      bgGreen: f3("\x1B[42m", "\x1B[49m"),
      bgYellow: f3("\x1B[43m", "\x1B[49m"),
      bgBlue: f3("\x1B[44m", "\x1B[49m"),
      bgMagenta: f3("\x1B[45m", "\x1B[49m"),
      bgCyan: f3("\x1B[46m", "\x1B[49m"),
      bgWhite: f3("\x1B[47m", "\x1B[49m"),
      blackBright: f3("\x1B[90m", "\x1B[39m"),
      redBright: f3("\x1B[91m", "\x1B[39m"),
      greenBright: f3("\x1B[92m", "\x1B[39m"),
      yellowBright: f3("\x1B[93m", "\x1B[39m"),
      blueBright: f3("\x1B[94m", "\x1B[39m"),
      magentaBright: f3("\x1B[95m", "\x1B[39m"),
      cyanBright: f3("\x1B[96m", "\x1B[39m"),
      whiteBright: f3("\x1B[97m", "\x1B[39m"),
      bgBlackBright: f3("\x1B[100m", "\x1B[49m"),
      bgRedBright: f3("\x1B[101m", "\x1B[49m"),
      bgGreenBright: f3("\x1B[102m", "\x1B[49m"),
      bgYellowBright: f3("\x1B[103m", "\x1B[49m"),
      bgBlueBright: f3("\x1B[104m", "\x1B[49m"),
      bgMagentaBright: f3("\x1B[105m", "\x1B[49m"),
      bgCyanBright: f3("\x1B[106m", "\x1B[49m"),
      bgWhiteBright: f3("\x1B[107m", "\x1B[49m")
    };
  };
  module.exports = createColors2();
  module.exports.createColors = createColors2;
});

// ../../node_modules/.pnpm/sisteransi@1.0.5/node_modules/sisteransi/src/index.js
var require_src = __commonJS((exports, module) => {
  var ESC = "\x1B";
  var CSI = `${ESC}[`;
  var beep = "\x07";
  var cursor = {
    to(x2, y3) {
      if (!y3)
        return `${CSI}${x2 + 1}G`;
      return `${CSI}${y3 + 1};${x2 + 1}H`;
    },
    move(x2, y3) {
      let ret = "";
      if (x2 < 0)
        ret += `${CSI}${-x2}D`;
      else if (x2 > 0)
        ret += `${CSI}${x2}C`;
      if (y3 < 0)
        ret += `${CSI}${-y3}A`;
      else if (y3 > 0)
        ret += `${CSI}${y3}B`;
      return ret;
    },
    up: (count = 1) => `${CSI}${count}A`,
    down: (count = 1) => `${CSI}${count}B`,
    forward: (count = 1) => `${CSI}${count}C`,
    backward: (count = 1) => `${CSI}${count}D`,
    nextLine: (count = 1) => `${CSI}E`.repeat(count),
    prevLine: (count = 1) => `${CSI}F`.repeat(count),
    left: `${CSI}G`,
    hide: `${CSI}?25l`,
    show: `${CSI}?25h`,
    save: `${ESC}7`,
    restore: `${ESC}8`
  };
  var scroll = {
    up: (count = 1) => `${CSI}S`.repeat(count),
    down: (count = 1) => `${CSI}T`.repeat(count)
  };
  var erase = {
    screen: `${CSI}2J`,
    up: (count = 1) => `${CSI}1J`.repeat(count),
    down: (count = 1) => `${CSI}J`.repeat(count),
    line: `${CSI}2K`,
    lineEnd: `${CSI}K`,
    lineStart: `${CSI}1K`,
    lines(count) {
      let clear = "";
      for (let i2 = 0;i2 < count; i2++)
        clear += this.line + (i2 < count - 1 ? cursor.up() : "");
      if (count)
        clear += cursor.left;
      return clear;
    }
  };
  module.exports = { cursor, scroll, erase, beep };
});

// ../../node_modules/.pnpm/consola@3.4.2/node_modules/consola/dist/core.mjs
var LogLevels = {
  silent: Number.NEGATIVE_INFINITY,
  fatal: 0,
  error: 0,
  warn: 1,
  log: 2,
  info: 3,
  success: 3,
  fail: 3,
  ready: 3,
  start: 3,
  box: 3,
  debug: 4,
  trace: 5,
  verbose: Number.POSITIVE_INFINITY
};
var LogTypes = {
  silent: {
    level: -1
  },
  fatal: {
    level: LogLevels.fatal
  },
  error: {
    level: LogLevels.error
  },
  warn: {
    level: LogLevels.warn
  },
  log: {
    level: LogLevels.log
  },
  info: {
    level: LogLevels.info
  },
  success: {
    level: LogLevels.success
  },
  fail: {
    level: LogLevels.fail
  },
  ready: {
    level: LogLevels.info
  },
  start: {
    level: LogLevels.info
  },
  box: {
    level: LogLevels.info
  },
  debug: {
    level: LogLevels.debug
  },
  trace: {
    level: LogLevels.trace
  },
  verbose: {
    level: LogLevels.verbose
  }
};
function isPlainObject$1(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  if (Symbol.iterator in value) {
    return false;
  }
  if (Symbol.toStringTag in value) {
    return Object.prototype.toString.call(value) === "[object Module]";
  }
  return true;
}
function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isPlainObject$1(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = Object.assign({}, defaults);
  for (const key in baseObject) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === undefined) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isPlainObject$1(value) && isPlainObject$1(object[key])) {
      object[key] = _defu(value, object[key], (namespace ? `${namespace}.` : "") + key.toString(), merger);
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => arguments_.reduce((p, c) => _defu(p, c, "", merger), {});
}
var defu = createDefu();
function isPlainObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}
function isLogObj(arg) {
  if (!isPlainObject(arg)) {
    return false;
  }
  if (!arg.message && !arg.args) {
    return false;
  }
  if (arg.stack) {
    return false;
  }
  return true;
}
var paused = false;
var queue = [];

class Consola {
  options;
  _lastLog;
  _mockFn;
  constructor(options = {}) {
    const types = options.types || LogTypes;
    this.options = defu({
      ...options,
      defaults: { ...options.defaults },
      level: _normalizeLogLevel(options.level, types),
      reporters: [...options.reporters || []]
    }, {
      types: LogTypes,
      throttle: 1000,
      throttleMin: 5,
      formatOptions: {
        date: true,
        colors: false,
        compact: true
      }
    });
    for (const type in types) {
      const defaults = {
        type,
        ...this.options.defaults,
        ...types[type]
      };
      this[type] = this._wrapLogFn(defaults);
      this[type].raw = this._wrapLogFn(defaults, true);
    }
    if (this.options.mockFn) {
      this.mockTypes();
    }
    this._lastLog = {};
  }
  get level() {
    return this.options.level;
  }
  set level(level) {
    this.options.level = _normalizeLogLevel(level, this.options.types, this.options.level);
  }
  prompt(message, opts) {
    if (!this.options.prompt) {
      throw new Error("prompt is not supported!");
    }
    return this.options.prompt(message, opts);
  }
  create(options) {
    const instance = new Consola({
      ...this.options,
      ...options
    });
    if (this._mockFn) {
      instance.mockTypes(this._mockFn);
    }
    return instance;
  }
  withDefaults(defaults) {
    return this.create({
      ...this.options,
      defaults: {
        ...this.options.defaults,
        ...defaults
      }
    });
  }
  withTag(tag) {
    return this.withDefaults({
      tag: this.options.defaults.tag ? this.options.defaults.tag + ":" + tag : tag
    });
  }
  addReporter(reporter) {
    this.options.reporters.push(reporter);
    return this;
  }
  removeReporter(reporter) {
    if (reporter) {
      const i = this.options.reporters.indexOf(reporter);
      if (i !== -1) {
        return this.options.reporters.splice(i, 1);
      }
    } else {
      this.options.reporters.splice(0);
    }
    return this;
  }
  setReporters(reporters) {
    this.options.reporters = Array.isArray(reporters) ? reporters : [reporters];
    return this;
  }
  wrapAll() {
    this.wrapConsole();
    this.wrapStd();
  }
  restoreAll() {
    this.restoreConsole();
    this.restoreStd();
  }
  wrapConsole() {
    for (const type in this.options.types) {
      if (!console["__" + type]) {
        console["__" + type] = console[type];
      }
      console[type] = this[type].raw;
    }
  }
  restoreConsole() {
    for (const type in this.options.types) {
      if (console["__" + type]) {
        console[type] = console["__" + type];
        delete console["__" + type];
      }
    }
  }
  wrapStd() {
    this._wrapStream(this.options.stdout, "log");
    this._wrapStream(this.options.stderr, "log");
  }
  _wrapStream(stream, type) {
    if (!stream) {
      return;
    }
    if (!stream.__write) {
      stream.__write = stream.write;
    }
    stream.write = (data) => {
      this[type].raw(String(data).trim());
    };
  }
  restoreStd() {
    this._restoreStream(this.options.stdout);
    this._restoreStream(this.options.stderr);
  }
  _restoreStream(stream) {
    if (!stream) {
      return;
    }
    if (stream.__write) {
      stream.write = stream.__write;
      delete stream.__write;
    }
  }
  pauseLogs() {
    paused = true;
  }
  resumeLogs() {
    paused = false;
    const _queue = queue.splice(0);
    for (const item of _queue) {
      item[0]._logFn(item[1], item[2]);
    }
  }
  mockTypes(mockFn) {
    const _mockFn = mockFn || this.options.mockFn;
    this._mockFn = _mockFn;
    if (typeof _mockFn !== "function") {
      return;
    }
    for (const type in this.options.types) {
      this[type] = _mockFn(type, this.options.types[type]) || this[type];
      this[type].raw = this[type];
    }
  }
  _wrapLogFn(defaults, isRaw) {
    return (...args) => {
      if (paused) {
        queue.push([this, defaults, args, isRaw]);
        return;
      }
      return this._logFn(defaults, args, isRaw);
    };
  }
  _logFn(defaults, args, isRaw) {
    if ((defaults.level || 0) > this.level) {
      return false;
    }
    const logObj = {
      date: /* @__PURE__ */ new Date,
      args: [],
      ...defaults,
      level: _normalizeLogLevel(defaults.level, this.options.types)
    };
    if (!isRaw && args.length === 1 && isLogObj(args[0])) {
      Object.assign(logObj, args[0]);
    } else {
      logObj.args = [...args];
    }
    if (logObj.message) {
      logObj.args.unshift(logObj.message);
      delete logObj.message;
    }
    if (logObj.additional) {
      if (!Array.isArray(logObj.additional)) {
        logObj.additional = logObj.additional.split(`
`);
      }
      logObj.args.push(`
` + logObj.additional.join(`
`));
      delete logObj.additional;
    }
    logObj.type = typeof logObj.type === "string" ? logObj.type.toLowerCase() : "log";
    logObj.tag = typeof logObj.tag === "string" ? logObj.tag : "";
    const resolveLog = (newLog = false) => {
      const repeated = (this._lastLog.count || 0) - this.options.throttleMin;
      if (this._lastLog.object && repeated > 0) {
        const args2 = [...this._lastLog.object.args];
        if (repeated > 1) {
          args2.push(`(repeated ${repeated} times)`);
        }
        this._log({ ...this._lastLog.object, args: args2 });
        this._lastLog.count = 1;
      }
      if (newLog) {
        this._lastLog.object = logObj;
        this._log(logObj);
      }
    };
    clearTimeout(this._lastLog.timeout);
    const diffTime = this._lastLog.time && logObj.date ? logObj.date.getTime() - this._lastLog.time.getTime() : 0;
    this._lastLog.time = logObj.date;
    if (diffTime < this.options.throttle) {
      try {
        const serializedLog = JSON.stringify([
          logObj.type,
          logObj.tag,
          logObj.args
        ]);
        const isSameLog = this._lastLog.serialized === serializedLog;
        this._lastLog.serialized = serializedLog;
        if (isSameLog) {
          this._lastLog.count = (this._lastLog.count || 0) + 1;
          if (this._lastLog.count > this.options.throttleMin) {
            this._lastLog.timeout = setTimeout(resolveLog, this.options.throttle);
            return;
          }
        }
      } catch {}
    }
    resolveLog(true);
  }
  _log(logObj) {
    for (const reporter of this.options.reporters) {
      reporter.log(logObj, {
        options: this.options
      });
    }
  }
}
function _normalizeLogLevel(input, types = {}, defaultLevel = 3) {
  if (input === undefined) {
    return defaultLevel;
  }
  if (typeof input === "number") {
    return input;
  }
  if (types[input] && types[input].level !== undefined) {
    return types[input].level;
  }
  return defaultLevel;
}
Consola.prototype.add = Consola.prototype.addReporter;
Consola.prototype.remove = Consola.prototype.removeReporter;
Consola.prototype.clear = Consola.prototype.removeReporter;
Consola.prototype.withScope = Consola.prototype.withTag;
Consola.prototype.mock = Consola.prototype.mockTypes;
Consola.prototype.pause = Consola.prototype.pauseLogs;
Consola.prototype.resume = Consola.prototype.resumeLogs;
function createConsola(options = {}) {
  return new Consola(options);
}
// ../../node_modules/.pnpm/consola@3.4.2/node_modules/consola/dist/shared/consola.DRwqZj3T.mjs
import { formatWithOptions } from "node:util";
import { sep } from "node:path";
function parseStack(stack, message) {
  const cwd = process.cwd() + sep;
  const lines = stack.split(`
`).splice(message.split(`
`).length).map((l) => l.trim().replace("file://", "").replace(cwd, ""));
  return lines;
}
function writeStream(data, stream) {
  const write = stream.__write || stream.write;
  return write.call(stream, data);
}
var bracket = (x) => x ? `[${x}]` : "";

class BasicReporter {
  formatStack(stack, message, opts) {
    const indent = "  ".repeat((opts?.errorLevel || 0) + 1);
    return indent + parseStack(stack, message).join(`
${indent}`);
  }
  formatError(err, opts) {
    const message = err.message ?? formatWithOptions(opts, err);
    const stack = err.stack ? this.formatStack(err.stack, message, opts) : "";
    const level = opts?.errorLevel || 0;
    const causedPrefix = level > 0 ? `${"  ".repeat(level)}[cause]: ` : "";
    const causedError = err.cause ? `

` + this.formatError(err.cause, { ...opts, errorLevel: level + 1 }) : "";
    return causedPrefix + message + `
` + stack + causedError;
  }
  formatArgs(args, opts) {
    const _args = args.map((arg) => {
      if (arg && typeof arg.stack === "string") {
        return this.formatError(arg, opts);
      }
      return arg;
    });
    return formatWithOptions(opts, ..._args);
  }
  formatDate(date, opts) {
    return opts.date ? date.toLocaleTimeString() : "";
  }
  filterAndJoin(arr) {
    return arr.filter(Boolean).join(" ");
  }
  formatLogObj(logObj, opts) {
    const message = this.formatArgs(logObj.args, opts);
    if (logObj.type === "box") {
      return `
` + [
        bracket(logObj.tag),
        logObj.title && logObj.title,
        ...message.split(`
`)
      ].filter(Boolean).map((l) => " > " + l).join(`
`) + `
`;
    }
    return this.filterAndJoin([
      bracket(logObj.type),
      bracket(logObj.tag),
      message
    ]);
  }
  log(logObj, ctx) {
    const line = this.formatLogObj(logObj, {
      columns: ctx.options.stdout.columns || 0,
      ...ctx.options.formatOptions
    });
    return writeStream(line + `
`, logObj.level < 2 ? ctx.options.stderr || process.stderr : ctx.options.stdout || process.stdout);
  }
}

// ../../node_modules/.pnpm/consola@3.4.2/node_modules/consola/dist/index.mjs
import g$1 from "node:process";

// ../../node_modules/.pnpm/consola@3.4.2/node_modules/consola/dist/shared/consola.DXBYu-KD.mjs
import * as tty from "node:tty";
var {
  env = {},
  argv = [],
  platform = ""
} = typeof process === "undefined" ? {} : process;
var isDisabled = "NO_COLOR" in env || argv.includes("--no-color");
var isForced = "FORCE_COLOR" in env || argv.includes("--color");
var isWindows = platform === "win32";
var isDumbTerminal = env.TERM === "dumb";
var isCompatibleTerminal = tty && tty.isatty && tty.isatty(1) && env.TERM && !isDumbTerminal;
var isCI = "CI" in env && (("GITHUB_ACTIONS" in env) || ("GITLAB_CI" in env) || ("CIRCLECI" in env));
var isColorSupported = !isDisabled && (isForced || isWindows && !isDumbTerminal || isCompatibleTerminal || isCI);
function replaceClose(index, string, close, replace, head = string.slice(0, Math.max(0, index)) + replace, tail = string.slice(Math.max(0, index + close.length)), next = tail.indexOf(close)) {
  return head + (next < 0 ? tail : replaceClose(next, tail, close, replace));
}
function clearBleed(index, string, open, close, replace) {
  return index < 0 ? open + string + close : open + replaceClose(index, string, close, replace) + close;
}
function filterEmpty(open, close, replace = open, at = open.length + 1) {
  return (string) => string || !(string === "" || string === undefined) ? clearBleed(("" + string).indexOf(close, at), string, open, close, replace) : "";
}
function init(open, close, replace) {
  return filterEmpty(`\x1B[${open}m`, `\x1B[${close}m`, replace);
}
var colorDefs = {
  reset: init(0, 0),
  bold: init(1, 22, "\x1B[22m\x1B[1m"),
  dim: init(2, 22, "\x1B[22m\x1B[2m"),
  italic: init(3, 23),
  underline: init(4, 24),
  inverse: init(7, 27),
  hidden: init(8, 28),
  strikethrough: init(9, 29),
  black: init(30, 39),
  red: init(31, 39),
  green: init(32, 39),
  yellow: init(33, 39),
  blue: init(34, 39),
  magenta: init(35, 39),
  cyan: init(36, 39),
  white: init(37, 39),
  gray: init(90, 39),
  bgBlack: init(40, 49),
  bgRed: init(41, 49),
  bgGreen: init(42, 49),
  bgYellow: init(43, 49),
  bgBlue: init(44, 49),
  bgMagenta: init(45, 49),
  bgCyan: init(46, 49),
  bgWhite: init(47, 49),
  blackBright: init(90, 39),
  redBright: init(91, 39),
  greenBright: init(92, 39),
  yellowBright: init(93, 39),
  blueBright: init(94, 39),
  magentaBright: init(95, 39),
  cyanBright: init(96, 39),
  whiteBright: init(97, 39),
  bgBlackBright: init(100, 49),
  bgRedBright: init(101, 49),
  bgGreenBright: init(102, 49),
  bgYellowBright: init(103, 49),
  bgBlueBright: init(104, 49),
  bgMagentaBright: init(105, 49),
  bgCyanBright: init(106, 49),
  bgWhiteBright: init(107, 49)
};
function createColors(useColor = isColorSupported) {
  return useColor ? colorDefs : Object.fromEntries(Object.keys(colorDefs).map((key) => [key, String]));
}
var colors = createColors();
function getColor(color, fallback = "reset") {
  return colors[color] || colors[fallback];
}
var ansiRegex = [
  String.raw`[\u001B\u009B][[\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\d\/#&.:=?%@~_]+)*|[a-zA-Z\d]+(?:;[-a-zA-Z\d\/#&.:=?%@~_]*)*)?\u0007)`,
  String.raw`(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))`
].join("|");
function stripAnsi(text) {
  return text.replace(new RegExp(ansiRegex, "g"), "");
}
var boxStylePresets = {
  solid: {
    tl: "┌",
    tr: "┐",
    bl: "└",
    br: "┘",
    h: "─",
    v: "│"
  },
  double: {
    tl: "╔",
    tr: "╗",
    bl: "╚",
    br: "╝",
    h: "═",
    v: "║"
  },
  doubleSingle: {
    tl: "╓",
    tr: "╖",
    bl: "╙",
    br: "╜",
    h: "─",
    v: "║"
  },
  doubleSingleRounded: {
    tl: "╭",
    tr: "╮",
    bl: "╰",
    br: "╯",
    h: "─",
    v: "║"
  },
  singleThick: {
    tl: "┏",
    tr: "┓",
    bl: "┗",
    br: "┛",
    h: "━",
    v: "┃"
  },
  singleDouble: {
    tl: "╒",
    tr: "╕",
    bl: "╘",
    br: "╛",
    h: "═",
    v: "│"
  },
  singleDoubleRounded: {
    tl: "╭",
    tr: "╮",
    bl: "╰",
    br: "╯",
    h: "═",
    v: "│"
  },
  rounded: {
    tl: "╭",
    tr: "╮",
    bl: "╰",
    br: "╯",
    h: "─",
    v: "│"
  }
};
var defaultStyle = {
  borderColor: "white",
  borderStyle: "rounded",
  valign: "center",
  padding: 2,
  marginLeft: 1,
  marginTop: 1,
  marginBottom: 1
};
function box(text, _opts = {}) {
  const opts = {
    ..._opts,
    style: {
      ...defaultStyle,
      ..._opts.style
    }
  };
  const textLines = text.split(`
`);
  const boxLines = [];
  const _color = getColor(opts.style.borderColor);
  const borderStyle = {
    ...typeof opts.style.borderStyle === "string" ? boxStylePresets[opts.style.borderStyle] || boxStylePresets.solid : opts.style.borderStyle
  };
  if (_color) {
    for (const key in borderStyle) {
      borderStyle[key] = _color(borderStyle[key]);
    }
  }
  const paddingOffset = opts.style.padding % 2 === 0 ? opts.style.padding : opts.style.padding + 1;
  const height = textLines.length + paddingOffset;
  const width = Math.max(...textLines.map((line) => stripAnsi(line).length), opts.title ? stripAnsi(opts.title).length : 0) + paddingOffset;
  const widthOffset = width + paddingOffset;
  const leftSpace = opts.style.marginLeft > 0 ? " ".repeat(opts.style.marginLeft) : "";
  if (opts.style.marginTop > 0) {
    boxLines.push("".repeat(opts.style.marginTop));
  }
  if (opts.title) {
    const title = _color ? _color(opts.title) : opts.title;
    const left = borderStyle.h.repeat(Math.floor((width - stripAnsi(opts.title).length) / 2));
    const right = borderStyle.h.repeat(width - stripAnsi(opts.title).length - stripAnsi(left).length + paddingOffset);
    boxLines.push(`${leftSpace}${borderStyle.tl}${left}${title}${right}${borderStyle.tr}`);
  } else {
    boxLines.push(`${leftSpace}${borderStyle.tl}${borderStyle.h.repeat(widthOffset)}${borderStyle.tr}`);
  }
  const valignOffset = opts.style.valign === "center" ? Math.floor((height - textLines.length) / 2) : opts.style.valign === "top" ? height - textLines.length - paddingOffset : height - textLines.length;
  for (let i = 0;i < height; i++) {
    if (i < valignOffset || i >= valignOffset + textLines.length) {
      boxLines.push(`${leftSpace}${borderStyle.v}${" ".repeat(widthOffset)}${borderStyle.v}`);
    } else {
      const line = textLines[i - valignOffset];
      const left = " ".repeat(paddingOffset);
      const right = " ".repeat(width - stripAnsi(line).length);
      boxLines.push(`${leftSpace}${borderStyle.v}${left}${line}${right}${borderStyle.v}`);
    }
  }
  boxLines.push(`${leftSpace}${borderStyle.bl}${borderStyle.h.repeat(widthOffset)}${borderStyle.br}`);
  if (opts.style.marginBottom > 0) {
    boxLines.push("".repeat(opts.style.marginBottom));
  }
  return boxLines.join(`
`);
}

// ../../node_modules/.pnpm/consola@3.4.2/node_modules/consola/dist/index.mjs
var r2 = Object.create(null);
var i = (e2) => globalThis.process?.env || import.meta.env || globalThis.Deno?.env.toObject() || globalThis.__env__ || (e2 ? r2 : globalThis);
var o2 = new Proxy(r2, { get(e2, s) {
  return i()[s] ?? r2[s];
}, has(e2, s) {
  const E = i();
  return s in E || s in r2;
}, set(e2, s, E) {
  const B2 = i(true);
  return B2[s] = E, true;
}, deleteProperty(e2, s) {
  if (!s)
    return false;
  const E = i(true);
  return delete E[s], true;
}, ownKeys() {
  const e2 = i(true);
  return Object.keys(e2);
} });
var t = typeof process < "u" && process.env && "production" || "";
var f2 = [["APPVEYOR"], ["AWS_AMPLIFY", "AWS_APP_ID", { ci: true }], ["AZURE_PIPELINES", "SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"], ["AZURE_STATIC", "INPUT_AZURE_STATIC_WEB_APPS_API_TOKEN"], ["APPCIRCLE", "AC_APPCIRCLE"], ["BAMBOO", "bamboo_planKey"], ["BITBUCKET", "BITBUCKET_COMMIT"], ["BITRISE", "BITRISE_IO"], ["BUDDY", "BUDDY_WORKSPACE_ID"], ["BUILDKITE"], ["CIRCLE", "CIRCLECI"], ["CIRRUS", "CIRRUS_CI"], ["CLOUDFLARE_PAGES", "CF_PAGES", { ci: true }], ["CODEBUILD", "CODEBUILD_BUILD_ARN"], ["CODEFRESH", "CF_BUILD_ID"], ["DRONE"], ["DRONE", "DRONE_BUILD_EVENT"], ["DSARI"], ["GITHUB_ACTIONS"], ["GITLAB", "GITLAB_CI"], ["GITLAB", "CI_MERGE_REQUEST_ID"], ["GOCD", "GO_PIPELINE_LABEL"], ["LAYERCI"], ["HUDSON", "HUDSON_URL"], ["JENKINS", "JENKINS_URL"], ["MAGNUM"], ["NETLIFY"], ["NETLIFY", "NETLIFY_LOCAL", { ci: false }], ["NEVERCODE"], ["RENDER"], ["SAIL", "SAILCI"], ["SEMAPHORE"], ["SCREWDRIVER"], ["SHIPPABLE"], ["SOLANO", "TDDIUM"], ["STRIDER"], ["TEAMCITY", "TEAMCITY_VERSION"], ["TRAVIS"], ["VERCEL", "NOW_BUILDER"], ["VERCEL", "VERCEL", { ci: false }], ["VERCEL", "VERCEL_ENV", { ci: false }], ["APPCENTER", "APPCENTER_BUILD_ID"], ["CODESANDBOX", "CODESANDBOX_SSE", { ci: false }], ["CODESANDBOX", "CODESANDBOX_HOST", { ci: false }], ["STACKBLITZ"], ["STORMKIT"], ["CLEAVR"], ["ZEABUR"], ["CODESPHERE", "CODESPHERE_APP_ID", { ci: true }], ["RAILWAY", "RAILWAY_PROJECT_ID"], ["RAILWAY", "RAILWAY_SERVICE_ID"], ["DENO-DEPLOY", "DENO_DEPLOYMENT_ID"], ["FIREBASE_APP_HOSTING", "FIREBASE_APP_HOSTING", { ci: true }]];
function b() {
  if (globalThis.process?.env)
    for (const e2 of f2) {
      const s = e2[1] || e2[0];
      if (globalThis.process?.env[s])
        return { name: e2[0].toLowerCase(), ...e2[2] };
    }
  return globalThis.process?.env?.SHELL === "/bin/jsh" && globalThis.process?.versions?.webcontainer ? { name: "stackblitz", ci: false } : { name: "", ci: false };
}
var l = b();
l.name;
function n(e2) {
  return e2 ? e2 !== "false" : false;
}
var I2 = globalThis.process?.platform || "";
var T2 = n(o2.CI) || l.ci !== false;
var a = n(globalThis.process?.stdout && globalThis.process?.stdout.isTTY);
var g2 = n(o2.DEBUG);
var R2 = t === "test" || n(o2.TEST);
n(o2.MINIMAL);
var A2 = /^win/i.test(I2);
!n(o2.NO_COLOR) && (n(o2.FORCE_COLOR) || (a || A2) && o2.TERM);
var C2 = (globalThis.process?.versions?.node || "").replace(/^v/, "") || null;
Number(C2?.split(".")[0]);
var y2 = globalThis.process || Object.create(null);
var _2 = { versions: {} };
new Proxy(y2, { get(e2, s) {
  if (s === "env")
    return o2;
  if (s in e2)
    return e2[s];
  if (s in _2)
    return _2[s];
} });
var c2 = globalThis.process?.release?.name === "node";
var O2 = !!globalThis.Bun || !!globalThis.process?.versions?.bun;
var D = !!globalThis.Deno;
var L2 = !!globalThis.fastly;
var S2 = !!globalThis.Netlify;
var u2 = !!globalThis.EdgeRuntime;
var N2 = globalThis.navigator?.userAgent === "Cloudflare-Workers";
var F2 = [[S2, "netlify"], [u2, "edge-light"], [N2, "workerd"], [L2, "fastly"], [D, "deno"], [O2, "bun"], [c2, "node"]];
function G2() {
  const e2 = F2.find((s) => s[0]);
  if (e2)
    return { name: e2[1] };
}
var P2 = G2();
P2?.name;
function ansiRegex2({ onlyFirst = false } = {}) {
  const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
  const pattern = [
    `[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?${ST})`,
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
  ].join("|");
  return new RegExp(pattern, onlyFirst ? undefined : "g");
}
var regex = ansiRegex2();
function stripAnsi2(string) {
  if (typeof string !== "string") {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }
  return string.replace(regex, "");
}
function isAmbiguous(x2) {
  return x2 === 161 || x2 === 164 || x2 === 167 || x2 === 168 || x2 === 170 || x2 === 173 || x2 === 174 || x2 >= 176 && x2 <= 180 || x2 >= 182 && x2 <= 186 || x2 >= 188 && x2 <= 191 || x2 === 198 || x2 === 208 || x2 === 215 || x2 === 216 || x2 >= 222 && x2 <= 225 || x2 === 230 || x2 >= 232 && x2 <= 234 || x2 === 236 || x2 === 237 || x2 === 240 || x2 === 242 || x2 === 243 || x2 >= 247 && x2 <= 250 || x2 === 252 || x2 === 254 || x2 === 257 || x2 === 273 || x2 === 275 || x2 === 283 || x2 === 294 || x2 === 295 || x2 === 299 || x2 >= 305 && x2 <= 307 || x2 === 312 || x2 >= 319 && x2 <= 322 || x2 === 324 || x2 >= 328 && x2 <= 331 || x2 === 333 || x2 === 338 || x2 === 339 || x2 === 358 || x2 === 359 || x2 === 363 || x2 === 462 || x2 === 464 || x2 === 466 || x2 === 468 || x2 === 470 || x2 === 472 || x2 === 474 || x2 === 476 || x2 === 593 || x2 === 609 || x2 === 708 || x2 === 711 || x2 >= 713 && x2 <= 715 || x2 === 717 || x2 === 720 || x2 >= 728 && x2 <= 731 || x2 === 733 || x2 === 735 || x2 >= 768 && x2 <= 879 || x2 >= 913 && x2 <= 929 || x2 >= 931 && x2 <= 937 || x2 >= 945 && x2 <= 961 || x2 >= 963 && x2 <= 969 || x2 === 1025 || x2 >= 1040 && x2 <= 1103 || x2 === 1105 || x2 === 8208 || x2 >= 8211 && x2 <= 8214 || x2 === 8216 || x2 === 8217 || x2 === 8220 || x2 === 8221 || x2 >= 8224 && x2 <= 8226 || x2 >= 8228 && x2 <= 8231 || x2 === 8240 || x2 === 8242 || x2 === 8243 || x2 === 8245 || x2 === 8251 || x2 === 8254 || x2 === 8308 || x2 === 8319 || x2 >= 8321 && x2 <= 8324 || x2 === 8364 || x2 === 8451 || x2 === 8453 || x2 === 8457 || x2 === 8467 || x2 === 8470 || x2 === 8481 || x2 === 8482 || x2 === 8486 || x2 === 8491 || x2 === 8531 || x2 === 8532 || x2 >= 8539 && x2 <= 8542 || x2 >= 8544 && x2 <= 8555 || x2 >= 8560 && x2 <= 8569 || x2 === 8585 || x2 >= 8592 && x2 <= 8601 || x2 === 8632 || x2 === 8633 || x2 === 8658 || x2 === 8660 || x2 === 8679 || x2 === 8704 || x2 === 8706 || x2 === 8707 || x2 === 8711 || x2 === 8712 || x2 === 8715 || x2 === 8719 || x2 === 8721 || x2 === 8725 || x2 === 8730 || x2 >= 8733 && x2 <= 8736 || x2 === 8739 || x2 === 8741 || x2 >= 8743 && x2 <= 8748 || x2 === 8750 || x2 >= 8756 && x2 <= 8759 || x2 === 8764 || x2 === 8765 || x2 === 8776 || x2 === 8780 || x2 === 8786 || x2 === 8800 || x2 === 8801 || x2 >= 8804 && x2 <= 8807 || x2 === 8810 || x2 === 8811 || x2 === 8814 || x2 === 8815 || x2 === 8834 || x2 === 8835 || x2 === 8838 || x2 === 8839 || x2 === 8853 || x2 === 8857 || x2 === 8869 || x2 === 8895 || x2 === 8978 || x2 >= 9312 && x2 <= 9449 || x2 >= 9451 && x2 <= 9547 || x2 >= 9552 && x2 <= 9587 || x2 >= 9600 && x2 <= 9615 || x2 >= 9618 && x2 <= 9621 || x2 === 9632 || x2 === 9633 || x2 >= 9635 && x2 <= 9641 || x2 === 9650 || x2 === 9651 || x2 === 9654 || x2 === 9655 || x2 === 9660 || x2 === 9661 || x2 === 9664 || x2 === 9665 || x2 >= 9670 && x2 <= 9672 || x2 === 9675 || x2 >= 9678 && x2 <= 9681 || x2 >= 9698 && x2 <= 9701 || x2 === 9711 || x2 === 9733 || x2 === 9734 || x2 === 9737 || x2 === 9742 || x2 === 9743 || x2 === 9756 || x2 === 9758 || x2 === 9792 || x2 === 9794 || x2 === 9824 || x2 === 9825 || x2 >= 9827 && x2 <= 9829 || x2 >= 9831 && x2 <= 9834 || x2 === 9836 || x2 === 9837 || x2 === 9839 || x2 === 9886 || x2 === 9887 || x2 === 9919 || x2 >= 9926 && x2 <= 9933 || x2 >= 9935 && x2 <= 9939 || x2 >= 9941 && x2 <= 9953 || x2 === 9955 || x2 === 9960 || x2 === 9961 || x2 >= 9963 && x2 <= 9969 || x2 === 9972 || x2 >= 9974 && x2 <= 9977 || x2 === 9979 || x2 === 9980 || x2 === 9982 || x2 === 9983 || x2 === 10045 || x2 >= 10102 && x2 <= 10111 || x2 >= 11094 && x2 <= 11097 || x2 >= 12872 && x2 <= 12879 || x2 >= 57344 && x2 <= 63743 || x2 >= 65024 && x2 <= 65039 || x2 === 65533 || x2 >= 127232 && x2 <= 127242 || x2 >= 127248 && x2 <= 127277 || x2 >= 127280 && x2 <= 127337 || x2 >= 127344 && x2 <= 127373 || x2 === 127375 || x2 === 127376 || x2 >= 127387 && x2 <= 127404 || x2 >= 917760 && x2 <= 917999 || x2 >= 983040 && x2 <= 1048573 || x2 >= 1048576 && x2 <= 1114109;
}
function isFullWidth(x2) {
  return x2 === 12288 || x2 >= 65281 && x2 <= 65376 || x2 >= 65504 && x2 <= 65510;
}
function isWide(x2) {
  return x2 >= 4352 && x2 <= 4447 || x2 === 8986 || x2 === 8987 || x2 === 9001 || x2 === 9002 || x2 >= 9193 && x2 <= 9196 || x2 === 9200 || x2 === 9203 || x2 === 9725 || x2 === 9726 || x2 === 9748 || x2 === 9749 || x2 >= 9776 && x2 <= 9783 || x2 >= 9800 && x2 <= 9811 || x2 === 9855 || x2 >= 9866 && x2 <= 9871 || x2 === 9875 || x2 === 9889 || x2 === 9898 || x2 === 9899 || x2 === 9917 || x2 === 9918 || x2 === 9924 || x2 === 9925 || x2 === 9934 || x2 === 9940 || x2 === 9962 || x2 === 9970 || x2 === 9971 || x2 === 9973 || x2 === 9978 || x2 === 9981 || x2 === 9989 || x2 === 9994 || x2 === 9995 || x2 === 10024 || x2 === 10060 || x2 === 10062 || x2 >= 10067 && x2 <= 10069 || x2 === 10071 || x2 >= 10133 && x2 <= 10135 || x2 === 10160 || x2 === 10175 || x2 === 11035 || x2 === 11036 || x2 === 11088 || x2 === 11093 || x2 >= 11904 && x2 <= 11929 || x2 >= 11931 && x2 <= 12019 || x2 >= 12032 && x2 <= 12245 || x2 >= 12272 && x2 <= 12287 || x2 >= 12289 && x2 <= 12350 || x2 >= 12353 && x2 <= 12438 || x2 >= 12441 && x2 <= 12543 || x2 >= 12549 && x2 <= 12591 || x2 >= 12593 && x2 <= 12686 || x2 >= 12688 && x2 <= 12773 || x2 >= 12783 && x2 <= 12830 || x2 >= 12832 && x2 <= 12871 || x2 >= 12880 && x2 <= 42124 || x2 >= 42128 && x2 <= 42182 || x2 >= 43360 && x2 <= 43388 || x2 >= 44032 && x2 <= 55203 || x2 >= 63744 && x2 <= 64255 || x2 >= 65040 && x2 <= 65049 || x2 >= 65072 && x2 <= 65106 || x2 >= 65108 && x2 <= 65126 || x2 >= 65128 && x2 <= 65131 || x2 >= 94176 && x2 <= 94180 || x2 === 94192 || x2 === 94193 || x2 >= 94208 && x2 <= 100343 || x2 >= 100352 && x2 <= 101589 || x2 >= 101631 && x2 <= 101640 || x2 >= 110576 && x2 <= 110579 || x2 >= 110581 && x2 <= 110587 || x2 === 110589 || x2 === 110590 || x2 >= 110592 && x2 <= 110882 || x2 === 110898 || x2 >= 110928 && x2 <= 110930 || x2 === 110933 || x2 >= 110948 && x2 <= 110951 || x2 >= 110960 && x2 <= 111355 || x2 >= 119552 && x2 <= 119638 || x2 >= 119648 && x2 <= 119670 || x2 === 126980 || x2 === 127183 || x2 === 127374 || x2 >= 127377 && x2 <= 127386 || x2 >= 127488 && x2 <= 127490 || x2 >= 127504 && x2 <= 127547 || x2 >= 127552 && x2 <= 127560 || x2 === 127568 || x2 === 127569 || x2 >= 127584 && x2 <= 127589 || x2 >= 127744 && x2 <= 127776 || x2 >= 127789 && x2 <= 127797 || x2 >= 127799 && x2 <= 127868 || x2 >= 127870 && x2 <= 127891 || x2 >= 127904 && x2 <= 127946 || x2 >= 127951 && x2 <= 127955 || x2 >= 127968 && x2 <= 127984 || x2 === 127988 || x2 >= 127992 && x2 <= 128062 || x2 === 128064 || x2 >= 128066 && x2 <= 128252 || x2 >= 128255 && x2 <= 128317 || x2 >= 128331 && x2 <= 128334 || x2 >= 128336 && x2 <= 128359 || x2 === 128378 || x2 === 128405 || x2 === 128406 || x2 === 128420 || x2 >= 128507 && x2 <= 128591 || x2 >= 128640 && x2 <= 128709 || x2 === 128716 || x2 >= 128720 && x2 <= 128722 || x2 >= 128725 && x2 <= 128727 || x2 >= 128732 && x2 <= 128735 || x2 === 128747 || x2 === 128748 || x2 >= 128756 && x2 <= 128764 || x2 >= 128992 && x2 <= 129003 || x2 === 129008 || x2 >= 129292 && x2 <= 129338 || x2 >= 129340 && x2 <= 129349 || x2 >= 129351 && x2 <= 129535 || x2 >= 129648 && x2 <= 129660 || x2 >= 129664 && x2 <= 129673 || x2 >= 129679 && x2 <= 129734 || x2 >= 129742 && x2 <= 129756 || x2 >= 129759 && x2 <= 129769 || x2 >= 129776 && x2 <= 129784 || x2 >= 131072 && x2 <= 196605 || x2 >= 196608 && x2 <= 262141;
}
function validate(codePoint) {
  if (!Number.isSafeInteger(codePoint)) {
    throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
  }
}
function eastAsianWidth(codePoint, { ambiguousAsWide = false } = {}) {
  validate(codePoint);
  if (isFullWidth(codePoint) || isWide(codePoint) || ambiguousAsWide && isAmbiguous(codePoint)) {
    return 2;
  }
  return 1;
}
var emojiRegex = () => {
  return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE])))?))?|\uDC6F(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE89\uDE8F-\uDEC2\uDEC6\uDECE-\uDEDC\uDEDF-\uDEE9]|\uDD3C(?:\u200D[\u2640\u2642]\uFE0F?|\uD83C[\uDFFB-\uDFFF])?|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
};
var segmenter = globalThis.Intl?.Segmenter ? new Intl.Segmenter : { segment: (str) => str.split("") };
var defaultIgnorableCodePointRegex = /^\p{Default_Ignorable_Code_Point}$/u;
function stringWidth$1(string, options = {}) {
  if (typeof string !== "string" || string.length === 0) {
    return 0;
  }
  const {
    ambiguousIsNarrow = true,
    countAnsiEscapeCodes = false
  } = options;
  if (!countAnsiEscapeCodes) {
    string = stripAnsi2(string);
  }
  if (string.length === 0) {
    return 0;
  }
  let width = 0;
  const eastAsianWidthOptions = { ambiguousAsWide: !ambiguousIsNarrow };
  for (const { segment: character } of segmenter.segment(string)) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159) {
      continue;
    }
    if (codePoint >= 8203 && codePoint <= 8207 || codePoint === 65279) {
      continue;
    }
    if (codePoint >= 768 && codePoint <= 879 || codePoint >= 6832 && codePoint <= 6911 || codePoint >= 7616 && codePoint <= 7679 || codePoint >= 8400 && codePoint <= 8447 || codePoint >= 65056 && codePoint <= 65071) {
      continue;
    }
    if (codePoint >= 55296 && codePoint <= 57343) {
      continue;
    }
    if (codePoint >= 65024 && codePoint <= 65039) {
      continue;
    }
    if (defaultIgnorableCodePointRegex.test(character)) {
      continue;
    }
    if (emojiRegex().test(character)) {
      width += 2;
      continue;
    }
    width += eastAsianWidth(codePoint, eastAsianWidthOptions);
  }
  return width;
}
function isUnicodeSupported() {
  const { env: env2 } = g$1;
  const { TERM, TERM_PROGRAM } = env2;
  if (g$1.platform !== "win32") {
    return TERM !== "linux";
  }
  return Boolean(env2.WT_SESSION) || Boolean(env2.TERMINUS_SUBLIME) || env2.ConEmuTask === "{cmd::Cmder}" || TERM_PROGRAM === "Terminus-Sublime" || TERM_PROGRAM === "vscode" || TERM === "xterm-256color" || TERM === "alacritty" || TERM === "rxvt-unicode" || TERM === "rxvt-unicode-256color" || env2.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var TYPE_COLOR_MAP = {
  info: "cyan",
  fail: "red",
  success: "green",
  ready: "green",
  start: "magenta"
};
var LEVEL_COLOR_MAP = {
  0: "red",
  1: "yellow"
};
var unicode = isUnicodeSupported();
var s = (c3, fallback) => unicode ? c3 : fallback;
var TYPE_ICONS = {
  error: s("✖", "×"),
  fatal: s("✖", "×"),
  ready: s("✔", "√"),
  warn: s("⚠", "‼"),
  info: s("ℹ", "i"),
  success: s("✔", "√"),
  debug: s("⚙", "D"),
  trace: s("→", "→"),
  fail: s("✖", "×"),
  start: s("◐", "o"),
  log: ""
};
function stringWidth(str) {
  const hasICU = typeof Intl === "object";
  if (!hasICU || !Intl.Segmenter) {
    return stripAnsi(str).length;
  }
  return stringWidth$1(str);
}

class FancyReporter extends BasicReporter {
  formatStack(stack, message, opts) {
    const indent = "  ".repeat((opts?.errorLevel || 0) + 1);
    return `
${indent}` + parseStack(stack, message).map((line) => "  " + line.replace(/^at +/, (m2) => colors.gray(m2)).replace(/\((.+)\)/, (_3, m2) => `(${colors.cyan(m2)})`)).join(`
${indent}`);
  }
  formatType(logObj, isBadge, opts) {
    const typeColor = TYPE_COLOR_MAP[logObj.type] || LEVEL_COLOR_MAP[logObj.level] || "gray";
    if (isBadge) {
      return getBgColor(typeColor)(colors.black(` ${logObj.type.toUpperCase()} `));
    }
    const _type = typeof TYPE_ICONS[logObj.type] === "string" ? TYPE_ICONS[logObj.type] : logObj.icon || logObj.type;
    return _type ? getColor2(typeColor)(_type) : "";
  }
  formatLogObj(logObj, opts) {
    const [message, ...additional] = this.formatArgs(logObj.args, opts).split(`
`);
    if (logObj.type === "box") {
      return box(characterFormat(message + (additional.length > 0 ? `
` + additional.join(`
`) : "")), {
        title: logObj.title ? characterFormat(logObj.title) : undefined,
        style: logObj.style
      });
    }
    const date = this.formatDate(logObj.date, opts);
    const coloredDate = date && colors.gray(date);
    const isBadge = logObj.badge ?? logObj.level < 2;
    const type = this.formatType(logObj, isBadge, opts);
    const tag = logObj.tag ? colors.gray(logObj.tag) : "";
    let line;
    const left = this.filterAndJoin([type, characterFormat(message)]);
    const right = this.filterAndJoin(opts.columns ? [tag, coloredDate] : [tag]);
    const space = (opts.columns || 0) - stringWidth(left) - stringWidth(right) - 2;
    line = space > 0 && (opts.columns || 0) >= 80 ? left + " ".repeat(space) + right : (right ? `${colors.gray(`[${right}]`)} ` : "") + left;
    line += characterFormat(additional.length > 0 ? `
` + additional.join(`
`) : "");
    if (logObj.type === "trace") {
      const _err = new Error("Trace: " + logObj.message);
      line += this.formatStack(_err.stack || "", _err.message);
    }
    return isBadge ? `
` + line + `
` : line;
  }
}
function characterFormat(str) {
  return str.replace(/`([^`]+)`/gm, (_3, m2) => colors.cyan(m2)).replace(/\s+_([^_]+)_\s+/gm, (_3, m2) => ` ${colors.underline(m2)} `);
}
function getColor2(color = "white") {
  return colors[color] || colors.white;
}
function getBgColor(color = "bgWhite") {
  return colors[`bg${color[0].toUpperCase()}${color.slice(1)}`] || colors.bgWhite;
}
function createConsola2(options = {}) {
  let level = _getDefaultLogLevel();
  if (process.env.CONSOLA_LEVEL) {
    level = Number.parseInt(process.env.CONSOLA_LEVEL) ?? level;
  }
  const consola2 = createConsola({
    level,
    defaults: { level },
    stdout: process.stdout,
    stderr: process.stderr,
    prompt: (...args) => Promise.resolve().then(() => (init_prompt(), exports_prompt)).then((m2) => m2.prompt(...args)),
    reporters: options.reporters || [
      options.fancy ?? !(T2 || R2) ? new FancyReporter : new BasicReporter
    ],
    ...options
  });
  return consola2;
}
function _getDefaultLogLevel() {
  if (g2) {
    return LogLevels.debug;
  }
  if (R2) {
    return LogLevels.warn;
  }
  return LogLevels.info;
}
var consola = createConsola2();
// ../../node_modules/.pnpm/citty@0.1.6/node_modules/citty/dist/index.mjs
function toArray(val) {
  if (Array.isArray(val)) {
    return val;
  }
  return val === undefined ? [] : [val];
}
function formatLineColumns(lines, linePrefix = "") {
  const maxLengh = [];
  for (const line of lines) {
    for (const [i2, element] of line.entries()) {
      maxLengh[i2] = Math.max(maxLengh[i2] || 0, element.length);
    }
  }
  return lines.map((l2) => l2.map((c3, i2) => linePrefix + c3[i2 === 0 ? "padStart" : "padEnd"](maxLengh[i2])).join("  ")).join(`
`);
}
function resolveValue(input) {
  return typeof input === "function" ? input() : input;
}

class CLIError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = "CLIError";
  }
}
var NUMBER_CHAR_RE = /\d/;
var STR_SPLITTERS = ["-", "_", "/", "."];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char)) {
    return;
  }
  return char !== char.toLowerCase();
}
function splitByCase(str, separators) {
  const splitters = separators ?? STR_SPLITTERS;
  const parts = [];
  if (!str || typeof str !== "string") {
    return parts;
  }
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of str) {
    const isSplitter = splitters.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = undefined;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function upperFirst(str) {
  return str ? str[0].toUpperCase() + str.slice(1) : "";
}
function lowerFirst(str) {
  return str ? str[0].toLowerCase() + str.slice(1) : "";
}
function pascalCase(str, opts) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => upperFirst(opts?.normalize ? p.toLowerCase() : p)).join("") : "";
}
function camelCase(str, opts) {
  return lowerFirst(pascalCase(str || "", opts));
}
function kebabCase(str, joiner) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => p.toLowerCase()).join(joiner ?? "-") : "";
}
function toArr(any) {
  return any == undefined ? [] : Array.isArray(any) ? any : [any];
}
function toVal(out, key, val, opts) {
  let x2;
  const old = out[key];
  const nxt = ~opts.string.indexOf(key) ? val == undefined || val === true ? "" : String(val) : typeof val === "boolean" ? val : ~opts.boolean.indexOf(key) ? val === "false" ? false : val === "true" || (out._.push((x2 = +val, x2 * 0 === 0) ? x2 : val), !!val) : (x2 = +val, x2 * 0 === 0) ? x2 : val;
  out[key] = old == undefined ? nxt : Array.isArray(old) ? old.concat(nxt) : [old, nxt];
}
function parseRawArgs(args = [], opts = {}) {
  let k2;
  let arr;
  let arg;
  let name;
  let val;
  const out = { _: [] };
  let i2 = 0;
  let j = 0;
  let idx = 0;
  const len = args.length;
  const alibi = opts.alias !== undefined;
  const strict = opts.unknown !== undefined;
  const defaults = opts.default !== undefined;
  opts.alias = opts.alias || {};
  opts.string = toArr(opts.string);
  opts.boolean = toArr(opts.boolean);
  if (alibi) {
    for (k2 in opts.alias) {
      arr = opts.alias[k2] = toArr(opts.alias[k2]);
      for (i2 = 0;i2 < arr.length; i2++) {
        (opts.alias[arr[i2]] = arr.concat(k2)).splice(i2, 1);
      }
    }
  }
  for (i2 = opts.boolean.length;i2-- > 0; ) {
    arr = opts.alias[opts.boolean[i2]] || [];
    for (j = arr.length;j-- > 0; ) {
      opts.boolean.push(arr[j]);
    }
  }
  for (i2 = opts.string.length;i2-- > 0; ) {
    arr = opts.alias[opts.string[i2]] || [];
    for (j = arr.length;j-- > 0; ) {
      opts.string.push(arr[j]);
    }
  }
  if (defaults) {
    for (k2 in opts.default) {
      name = typeof opts.default[k2];
      arr = opts.alias[k2] = opts.alias[k2] || [];
      if (opts[name] !== undefined) {
        opts[name].push(k2);
        for (i2 = 0;i2 < arr.length; i2++) {
          opts[name].push(arr[i2]);
        }
      }
    }
  }
  const keys = strict ? Object.keys(opts.alias) : [];
  for (i2 = 0;i2 < len; i2++) {
    arg = args[i2];
    if (arg === "--") {
      out._ = out._.concat(args.slice(++i2));
      break;
    }
    for (j = 0;j < arg.length; j++) {
      if (arg.charCodeAt(j) !== 45) {
        break;
      }
    }
    if (j === 0) {
      out._.push(arg);
    } else if (arg.substring(j, j + 3) === "no-") {
      name = arg.slice(Math.max(0, j + 3));
      if (strict && !~keys.indexOf(name)) {
        return opts.unknown(arg);
      }
      out[name] = false;
    } else {
      for (idx = j + 1;idx < arg.length; idx++) {
        if (arg.charCodeAt(idx) === 61) {
          break;
        }
      }
      name = arg.substring(j, idx);
      val = arg.slice(Math.max(0, ++idx)) || i2 + 1 === len || ("" + args[i2 + 1]).charCodeAt(0) === 45 || args[++i2];
      arr = j === 2 ? [name] : name;
      for (idx = 0;idx < arr.length; idx++) {
        name = arr[idx];
        if (strict && !~keys.indexOf(name)) {
          return opts.unknown("-".repeat(j) + name);
        }
        toVal(out, name, idx + 1 < arr.length || val, opts);
      }
    }
  }
  if (defaults) {
    for (k2 in opts.default) {
      if (out[k2] === undefined) {
        out[k2] = opts.default[k2];
      }
    }
  }
  if (alibi) {
    for (k2 in out) {
      arr = opts.alias[k2] || [];
      while (arr.length > 0) {
        out[arr.shift()] = out[k2];
      }
    }
  }
  return out;
}
function parseArgs(rawArgs, argsDef) {
  const parseOptions = {
    boolean: [],
    string: [],
    mixed: [],
    alias: {},
    default: {}
  };
  const args = resolveArgs(argsDef);
  for (const arg of args) {
    if (arg.type === "positional") {
      continue;
    }
    if (arg.type === "string") {
      parseOptions.string.push(arg.name);
    } else if (arg.type === "boolean") {
      parseOptions.boolean.push(arg.name);
    }
    if (arg.default !== undefined) {
      parseOptions.default[arg.name] = arg.default;
    }
    if (arg.alias) {
      parseOptions.alias[arg.name] = arg.alias;
    }
  }
  const parsed = parseRawArgs(rawArgs, parseOptions);
  const [...positionalArguments] = parsed._;
  const parsedArgsProxy = new Proxy(parsed, {
    get(target, prop) {
      return target[prop] ?? target[camelCase(prop)] ?? target[kebabCase(prop)];
    }
  });
  for (const [, arg] of args.entries()) {
    if (arg.type === "positional") {
      const nextPositionalArgument = positionalArguments.shift();
      if (nextPositionalArgument !== undefined) {
        parsedArgsProxy[arg.name] = nextPositionalArgument;
      } else if (arg.default === undefined && arg.required !== false) {
        throw new CLIError(`Missing required positional argument: ${arg.name.toUpperCase()}`, "EARG");
      } else {
        parsedArgsProxy[arg.name] = arg.default;
      }
    } else if (arg.required && parsedArgsProxy[arg.name] === undefined) {
      throw new CLIError(`Missing required argument: --${arg.name}`, "EARG");
    }
  }
  return parsedArgsProxy;
}
function resolveArgs(argsDef) {
  const args = [];
  for (const [name, argDef] of Object.entries(argsDef || {})) {
    args.push({
      ...argDef,
      name,
      alias: toArray(argDef.alias)
    });
  }
  return args;
}
function defineCommand(def) {
  return def;
}
async function runCommand(cmd, opts) {
  const cmdArgs = await resolveValue(cmd.args || {});
  const parsedArgs = parseArgs(opts.rawArgs, cmdArgs);
  const context = {
    rawArgs: opts.rawArgs,
    args: parsedArgs,
    data: opts.data,
    cmd
  };
  if (typeof cmd.setup === "function") {
    await cmd.setup(context);
  }
  let result;
  try {
    const subCommands = await resolveValue(cmd.subCommands);
    if (subCommands && Object.keys(subCommands).length > 0) {
      const subCommandArgIndex = opts.rawArgs.findIndex((arg) => !arg.startsWith("-"));
      const subCommandName = opts.rawArgs[subCommandArgIndex];
      if (subCommandName) {
        if (!subCommands[subCommandName]) {
          throw new CLIError(`Unknown command \`${subCommandName}\``, "E_UNKNOWN_COMMAND");
        }
        const subCommand = await resolveValue(subCommands[subCommandName]);
        if (subCommand) {
          await runCommand(subCommand, {
            rawArgs: opts.rawArgs.slice(subCommandArgIndex + 1)
          });
        }
      } else if (!cmd.run) {
        throw new CLIError(`No command specified.`, "E_NO_COMMAND");
      }
    }
    if (typeof cmd.run === "function") {
      result = await cmd.run(context);
    }
  } finally {
    if (typeof cmd.cleanup === "function") {
      await cmd.cleanup(context);
    }
  }
  return { result };
}
async function resolveSubCommand(cmd, rawArgs, parent) {
  const subCommands = await resolveValue(cmd.subCommands);
  if (subCommands && Object.keys(subCommands).length > 0) {
    const subCommandArgIndex = rawArgs.findIndex((arg) => !arg.startsWith("-"));
    const subCommandName = rawArgs[subCommandArgIndex];
    const subCommand = await resolveValue(subCommands[subCommandName]);
    if (subCommand) {
      return resolveSubCommand(subCommand, rawArgs.slice(subCommandArgIndex + 1), cmd);
    }
  }
  return [cmd, parent];
}
async function showUsage(cmd, parent) {
  try {
    consola.log(await renderUsage(cmd, parent) + `
`);
  } catch (error) {
    consola.error(error);
  }
}
async function renderUsage(cmd, parent) {
  const cmdMeta = await resolveValue(cmd.meta || {});
  const cmdArgs = resolveArgs(await resolveValue(cmd.args || {}));
  const parentMeta = await resolveValue(parent?.meta || {});
  const commandName = `${parentMeta.name ? `${parentMeta.name} ` : ""}` + (cmdMeta.name || process.argv[1]);
  const argLines = [];
  const posLines = [];
  const commandsLines = [];
  const usageLine = [];
  for (const arg of cmdArgs) {
    if (arg.type === "positional") {
      const name = arg.name.toUpperCase();
      const isRequired = arg.required !== false && arg.default === undefined;
      const defaultHint = arg.default ? `="${arg.default}"` : "";
      posLines.push([
        "`" + name + defaultHint + "`",
        arg.description || "",
        arg.valueHint ? `<${arg.valueHint}>` : ""
      ]);
      usageLine.push(isRequired ? `<${name}>` : `[${name}]`);
    } else {
      const isRequired = arg.required === true && arg.default === undefined;
      const argStr = (arg.type === "boolean" && arg.default === true ? [
        ...(arg.alias || []).map((a2) => `--no-${a2}`),
        `--no-${arg.name}`
      ].join(", ") : [...(arg.alias || []).map((a2) => `-${a2}`), `--${arg.name}`].join(", ")) + (arg.type === "string" && (arg.valueHint || arg.default) ? `=${arg.valueHint ? `<${arg.valueHint}>` : `"${arg.default || ""}"`}` : "");
      argLines.push([
        "`" + argStr + (isRequired ? " (required)" : "") + "`",
        arg.description || ""
      ]);
      if (isRequired) {
        usageLine.push(argStr);
      }
    }
  }
  if (cmd.subCommands) {
    const commandNames = [];
    const subCommands = await resolveValue(cmd.subCommands);
    for (const [name, sub] of Object.entries(subCommands)) {
      const subCmd = await resolveValue(sub);
      const meta = await resolveValue(subCmd?.meta);
      commandsLines.push([`\`${name}\``, meta?.description || ""]);
      commandNames.push(name);
    }
    usageLine.push(commandNames.join("|"));
  }
  const usageLines = [];
  const version = cmdMeta.version || parentMeta.version;
  usageLines.push(colors.gray(`${cmdMeta.description} (${commandName + (version ? ` v${version}` : "")})`), "");
  const hasOptions = argLines.length > 0 || posLines.length > 0;
  usageLines.push(`${colors.underline(colors.bold("USAGE"))} \`${commandName}${hasOptions ? " [OPTIONS]" : ""} ${usageLine.join(" ")}\``, "");
  if (posLines.length > 0) {
    usageLines.push(colors.underline(colors.bold("ARGUMENTS")), "");
    usageLines.push(formatLineColumns(posLines, "  "));
    usageLines.push("");
  }
  if (argLines.length > 0) {
    usageLines.push(colors.underline(colors.bold("OPTIONS")), "");
    usageLines.push(formatLineColumns(argLines, "  "));
    usageLines.push("");
  }
  if (commandsLines.length > 0) {
    usageLines.push(colors.underline(colors.bold("COMMANDS")), "");
    usageLines.push(formatLineColumns(commandsLines, "  "));
    usageLines.push("", `Use \`${commandName} <command> --help\` for more information about a command.`);
  }
  return usageLines.filter((l2) => typeof l2 === "string").join(`
`);
}
async function runMain(cmd, opts = {}) {
  const rawArgs = opts.rawArgs || process.argv.slice(2);
  const showUsage$1 = opts.showUsage || showUsage;
  try {
    if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
      await showUsage$1(...await resolveSubCommand(cmd, rawArgs));
      process.exit(0);
    } else if (rawArgs.length === 1 && rawArgs[0] === "--version") {
      const meta = typeof cmd.meta === "function" ? await cmd.meta() : await cmd.meta;
      if (!meta?.version) {
        throw new CLIError("No version specified", "E_NO_VERSION");
      }
      consola.log(meta.version);
    } else {
      await runCommand(cmd, { rawArgs });
    }
  } catch (error) {
    const isCLIError = error instanceof CLIError;
    if (!isCLIError) {
      consola.error(error, `
`);
    }
    if (isCLIError) {
      await showUsage$1(...await resolveSubCommand(cmd, rawArgs));
    }
    consola.error(error.message);
    process.exit(1);
  }
}

// src/index.ts
var import_picocolors7 = __toESM(require_picocolors(), 1);

// src/command/command-discovery.ts
function stripAnsi3(value) {
  const sgrPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
  return value.replace(sgrPattern, "");
}
function filterUsageCommandChoices(line, hiddenCommands) {
  const match = /^(\s*USAGE\s+\S+\s+)([A-Za-z0-9_-]+(?:\|[A-Za-z0-9_-]+)+)(.*)$/.exec(stripAnsi3(line));
  if (!match) {
    return line;
  }
  const [, prefix, choices, suffix] = match;
  const visibleChoices = choices.split("|").filter((choice) => !hiddenCommands.has(choice));
  return `${prefix}${visibleChoices.join("|")}${suffix}`;
}
var registrationsByCommand = new WeakMap;
var positionalCandidatesByCommand = new WeakMap;
var helpAppendixByCommand = new WeakMap;
function buildRegisteredSubCommands(registrations) {
  return Object.fromEntries(registrations.map((registration) => [
    registration.name,
    registration.command
  ]));
}
function registerCommandGroup(command, registrations) {
  registrationsByCommand.set(command, registrations);
  return command;
}
function getCommandRegistrations(command) {
  return registrationsByCommand.get(command);
}
function getCommandRegistration(command, name) {
  return getCommandRegistrations(command)?.find((registration) => registration.name === name);
}
function normalizeRegisteredArgs(rootCommand, rawArgs) {
  const [name, ...commandArgs] = rawArgs;
  if (!name) {
    return [...rawArgs];
  }
  const registration = getCommandRegistration(rootCommand, name);
  if (!registration?.normalizeArgs) {
    return [...rawArgs];
  }
  return [name, ...registration.normalizeArgs(commandArgs)];
}
function registerPositionalCandidates(command, provider) {
  positionalCandidatesByCommand.set(command, provider);
  return command;
}
function getPositionalCandidateProvider(command) {
  return positionalCandidatesByCommand.get(command);
}
function registerCommandHelpAppendix(command, provider) {
  helpAppendixByCommand.set(command, provider);
  return command;
}
function getCommandHelpAppendixProvider(command) {
  return helpAppendixByCommand.get(command);
}

// ../../node_modules/.pnpm/@clack+core@0.3.5/node_modules/@clack/core/dist/index.mjs
var import_sisteransi = __toESM(require_src(), 1);
import { stdin as $, stdout as k2 } from "node:process";
import * as f3 from "node:readline";
import _3 from "node:readline";
import { WriteStream as U } from "node:tty";
function q2({ onlyFirst: e2 = false } = {}) {
  const F3 = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?(?:\\u0007|\\u001B\\u005C|\\u009C))", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"].join("|");
  return new RegExp(F3, e2 ? undefined : "g");
}
var J2 = q2();
function S3(e2) {
  if (typeof e2 != "string")
    throw new TypeError(`Expected a \`string\`, got \`${typeof e2}\``);
  return e2.replace(J2, "");
}
function T3(e2) {
  return e2 && e2.__esModule && Object.prototype.hasOwnProperty.call(e2, "default") ? e2.default : e2;
}
var j = { exports: {} };
(function(e2) {
  var u3 = {};
  e2.exports = u3, u3.eastAsianWidth = function(t2) {
    var s2 = t2.charCodeAt(0), C3 = t2.length == 2 ? t2.charCodeAt(1) : 0, D2 = s2;
    return 55296 <= s2 && s2 <= 56319 && 56320 <= C3 && C3 <= 57343 && (s2 &= 1023, C3 &= 1023, D2 = s2 << 10 | C3, D2 += 65536), D2 == 12288 || 65281 <= D2 && D2 <= 65376 || 65504 <= D2 && D2 <= 65510 ? "F" : D2 == 8361 || 65377 <= D2 && D2 <= 65470 || 65474 <= D2 && D2 <= 65479 || 65482 <= D2 && D2 <= 65487 || 65490 <= D2 && D2 <= 65495 || 65498 <= D2 && D2 <= 65500 || 65512 <= D2 && D2 <= 65518 ? "H" : 4352 <= D2 && D2 <= 4447 || 4515 <= D2 && D2 <= 4519 || 4602 <= D2 && D2 <= 4607 || 9001 <= D2 && D2 <= 9002 || 11904 <= D2 && D2 <= 11929 || 11931 <= D2 && D2 <= 12019 || 12032 <= D2 && D2 <= 12245 || 12272 <= D2 && D2 <= 12283 || 12289 <= D2 && D2 <= 12350 || 12353 <= D2 && D2 <= 12438 || 12441 <= D2 && D2 <= 12543 || 12549 <= D2 && D2 <= 12589 || 12593 <= D2 && D2 <= 12686 || 12688 <= D2 && D2 <= 12730 || 12736 <= D2 && D2 <= 12771 || 12784 <= D2 && D2 <= 12830 || 12832 <= D2 && D2 <= 12871 || 12880 <= D2 && D2 <= 13054 || 13056 <= D2 && D2 <= 19903 || 19968 <= D2 && D2 <= 42124 || 42128 <= D2 && D2 <= 42182 || 43360 <= D2 && D2 <= 43388 || 44032 <= D2 && D2 <= 55203 || 55216 <= D2 && D2 <= 55238 || 55243 <= D2 && D2 <= 55291 || 63744 <= D2 && D2 <= 64255 || 65040 <= D2 && D2 <= 65049 || 65072 <= D2 && D2 <= 65106 || 65108 <= D2 && D2 <= 65126 || 65128 <= D2 && D2 <= 65131 || 110592 <= D2 && D2 <= 110593 || 127488 <= D2 && D2 <= 127490 || 127504 <= D2 && D2 <= 127546 || 127552 <= D2 && D2 <= 127560 || 127568 <= D2 && D2 <= 127569 || 131072 <= D2 && D2 <= 194367 || 177984 <= D2 && D2 <= 196605 || 196608 <= D2 && D2 <= 262141 ? "W" : 32 <= D2 && D2 <= 126 || 162 <= D2 && D2 <= 163 || 165 <= D2 && D2 <= 166 || D2 == 172 || D2 == 175 || 10214 <= D2 && D2 <= 10221 || 10629 <= D2 && D2 <= 10630 ? "Na" : D2 == 161 || D2 == 164 || 167 <= D2 && D2 <= 168 || D2 == 170 || 173 <= D2 && D2 <= 174 || 176 <= D2 && D2 <= 180 || 182 <= D2 && D2 <= 186 || 188 <= D2 && D2 <= 191 || D2 == 198 || D2 == 208 || 215 <= D2 && D2 <= 216 || 222 <= D2 && D2 <= 225 || D2 == 230 || 232 <= D2 && D2 <= 234 || 236 <= D2 && D2 <= 237 || D2 == 240 || 242 <= D2 && D2 <= 243 || 247 <= D2 && D2 <= 250 || D2 == 252 || D2 == 254 || D2 == 257 || D2 == 273 || D2 == 275 || D2 == 283 || 294 <= D2 && D2 <= 295 || D2 == 299 || 305 <= D2 && D2 <= 307 || D2 == 312 || 319 <= D2 && D2 <= 322 || D2 == 324 || 328 <= D2 && D2 <= 331 || D2 == 333 || 338 <= D2 && D2 <= 339 || 358 <= D2 && D2 <= 359 || D2 == 363 || D2 == 462 || D2 == 464 || D2 == 466 || D2 == 468 || D2 == 470 || D2 == 472 || D2 == 474 || D2 == 476 || D2 == 593 || D2 == 609 || D2 == 708 || D2 == 711 || 713 <= D2 && D2 <= 715 || D2 == 717 || D2 == 720 || 728 <= D2 && D2 <= 731 || D2 == 733 || D2 == 735 || 768 <= D2 && D2 <= 879 || 913 <= D2 && D2 <= 929 || 931 <= D2 && D2 <= 937 || 945 <= D2 && D2 <= 961 || 963 <= D2 && D2 <= 969 || D2 == 1025 || 1040 <= D2 && D2 <= 1103 || D2 == 1105 || D2 == 8208 || 8211 <= D2 && D2 <= 8214 || 8216 <= D2 && D2 <= 8217 || 8220 <= D2 && D2 <= 8221 || 8224 <= D2 && D2 <= 8226 || 8228 <= D2 && D2 <= 8231 || D2 == 8240 || 8242 <= D2 && D2 <= 8243 || D2 == 8245 || D2 == 8251 || D2 == 8254 || D2 == 8308 || D2 == 8319 || 8321 <= D2 && D2 <= 8324 || D2 == 8364 || D2 == 8451 || D2 == 8453 || D2 == 8457 || D2 == 8467 || D2 == 8470 || 8481 <= D2 && D2 <= 8482 || D2 == 8486 || D2 == 8491 || 8531 <= D2 && D2 <= 8532 || 8539 <= D2 && D2 <= 8542 || 8544 <= D2 && D2 <= 8555 || 8560 <= D2 && D2 <= 8569 || D2 == 8585 || 8592 <= D2 && D2 <= 8601 || 8632 <= D2 && D2 <= 8633 || D2 == 8658 || D2 == 8660 || D2 == 8679 || D2 == 8704 || 8706 <= D2 && D2 <= 8707 || 8711 <= D2 && D2 <= 8712 || D2 == 8715 || D2 == 8719 || D2 == 8721 || D2 == 8725 || D2 == 8730 || 8733 <= D2 && D2 <= 8736 || D2 == 8739 || D2 == 8741 || 8743 <= D2 && D2 <= 8748 || D2 == 8750 || 8756 <= D2 && D2 <= 8759 || 8764 <= D2 && D2 <= 8765 || D2 == 8776 || D2 == 8780 || D2 == 8786 || 8800 <= D2 && D2 <= 8801 || 8804 <= D2 && D2 <= 8807 || 8810 <= D2 && D2 <= 8811 || 8814 <= D2 && D2 <= 8815 || 8834 <= D2 && D2 <= 8835 || 8838 <= D2 && D2 <= 8839 || D2 == 8853 || D2 == 8857 || D2 == 8869 || D2 == 8895 || D2 == 8978 || 9312 <= D2 && D2 <= 9449 || 9451 <= D2 && D2 <= 9547 || 9552 <= D2 && D2 <= 9587 || 9600 <= D2 && D2 <= 9615 || 9618 <= D2 && D2 <= 9621 || 9632 <= D2 && D2 <= 9633 || 9635 <= D2 && D2 <= 9641 || 9650 <= D2 && D2 <= 9651 || 9654 <= D2 && D2 <= 9655 || 9660 <= D2 && D2 <= 9661 || 9664 <= D2 && D2 <= 9665 || 9670 <= D2 && D2 <= 9672 || D2 == 9675 || 9678 <= D2 && D2 <= 9681 || 9698 <= D2 && D2 <= 9701 || D2 == 9711 || 9733 <= D2 && D2 <= 9734 || D2 == 9737 || 9742 <= D2 && D2 <= 9743 || 9748 <= D2 && D2 <= 9749 || D2 == 9756 || D2 == 9758 || D2 == 9792 || D2 == 9794 || 9824 <= D2 && D2 <= 9825 || 9827 <= D2 && D2 <= 9829 || 9831 <= D2 && D2 <= 9834 || 9836 <= D2 && D2 <= 9837 || D2 == 9839 || 9886 <= D2 && D2 <= 9887 || 9918 <= D2 && D2 <= 9919 || 9924 <= D2 && D2 <= 9933 || 9935 <= D2 && D2 <= 9953 || D2 == 9955 || 9960 <= D2 && D2 <= 9983 || D2 == 10045 || D2 == 10071 || 10102 <= D2 && D2 <= 10111 || 11093 <= D2 && D2 <= 11097 || 12872 <= D2 && D2 <= 12879 || 57344 <= D2 && D2 <= 63743 || 65024 <= D2 && D2 <= 65039 || D2 == 65533 || 127232 <= D2 && D2 <= 127242 || 127248 <= D2 && D2 <= 127277 || 127280 <= D2 && D2 <= 127337 || 127344 <= D2 && D2 <= 127386 || 917760 <= D2 && D2 <= 917999 || 983040 <= D2 && D2 <= 1048573 || 1048576 <= D2 && D2 <= 1114109 ? "A" : "N";
  }, u3.characterLength = function(t2) {
    var s2 = this.eastAsianWidth(t2);
    return s2 == "F" || s2 == "W" || s2 == "A" ? 2 : 1;
  };
  function F3(t2) {
    return t2.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || [];
  }
  u3.length = function(t2) {
    for (var s2 = F3(t2), C3 = 0, D2 = 0;D2 < s2.length; D2++)
      C3 = C3 + this.characterLength(s2[D2]);
    return C3;
  }, u3.slice = function(t2, s2, C3) {
    textLen = u3.length(t2), s2 = s2 || 0, C3 = C3 || 1, s2 < 0 && (s2 = textLen + s2), C3 < 0 && (C3 = textLen + C3);
    for (var D2 = "", i2 = 0, n2 = F3(t2), E = 0;E < n2.length; E++) {
      var h2 = n2[E], o3 = u3.length(h2);
      if (i2 >= s2 - (o3 == 2 ? 1 : 0))
        if (i2 + o3 <= C3)
          D2 += h2;
        else
          break;
      i2 += o3;
    }
    return D2;
  };
})(j);
var Q2 = j.exports;
var X2 = T3(Q2);
var DD2 = function() {
  return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|(?:\uD83E\uDDD1\uD83C\uDFFF\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFC-\uDFFF])|\uD83D\uDC68(?:\uD83C\uDFFB(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|[\u2695\u2696\u2708]\uFE0F|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))?|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC)?|(?:\uD83D\uDC69(?:\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC69(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83E\uDDD1(?:\u200D(?:\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDE36\u200D\uD83C\uDF2B|\uD83C\uDFF3\uFE0F\u200D\u26A7|\uD83D\uDC3B\u200D\u2744|(?:(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\uD83C\uDFF4\u200D\u2620|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]|\uD83D[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])\uFE0F|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDE35\u200D\uD83D\uDCAB|\uD83D\uDE2E\u200D\uD83D\uDCA8|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83E\uDDD1(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83D\uDC69(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83D\uDC08\u200D\u2B1B|\u2764\uFE0F\u200D(?:\uD83D\uDD25|\uD83E\uDE79)|\uD83D\uDC41\uFE0F|\uD83C\uDFF3\uFE0F|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|[#\*0-9]\uFE0F\u20E3|\u2764\uFE0F|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF4|(?:[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270C\u270D]|\uD83D[\uDD74\uDD90])(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC08\uDC15\uDC3B\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE2E\uDE35\uDE36\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5]|\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD]|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0D\uDD0E\uDD10-\uDD17\uDD1D\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78\uDD7A-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCB\uDDD0\uDDE0-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6]|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDD77\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
};
var uD2 = T3(DD2);
function A3(e2, u3 = {}) {
  if (typeof e2 != "string" || e2.length === 0 || (u3 = { ambiguousIsNarrow: true, ...u3 }, e2 = S3(e2), e2.length === 0))
    return 0;
  e2 = e2.replace(uD2(), "  ");
  const F3 = u3.ambiguousIsNarrow ? 1 : 2;
  let t2 = 0;
  for (const s2 of e2) {
    const C3 = s2.codePointAt(0);
    if (C3 <= 31 || C3 >= 127 && C3 <= 159 || C3 >= 768 && C3 <= 879)
      continue;
    switch (X2.eastAsianWidth(s2)) {
      case "F":
      case "W":
        t2 += 2;
        break;
      case "A":
        t2 += F3;
        break;
      default:
        t2 += 1;
    }
  }
  return t2;
}
var d2 = 10;
var M = (e2 = 0) => (u3) => `\x1B[${u3 + e2}m`;
var P3 = (e2 = 0) => (u3) => `\x1B[${38 + e2};5;${u3}m`;
var W2 = (e2 = 0) => (u3, F3, t2) => `\x1B[${38 + e2};2;${u3};${F3};${t2}m`;
var r3 = { modifier: { reset: [0, 0], bold: [1, 22], dim: [2, 22], italic: [3, 23], underline: [4, 24], overline: [53, 55], inverse: [7, 27], hidden: [8, 28], strikethrough: [9, 29] }, color: { black: [30, 39], red: [31, 39], green: [32, 39], yellow: [33, 39], blue: [34, 39], magenta: [35, 39], cyan: [36, 39], white: [37, 39], blackBright: [90, 39], gray: [90, 39], grey: [90, 39], redBright: [91, 39], greenBright: [92, 39], yellowBright: [93, 39], blueBright: [94, 39], magentaBright: [95, 39], cyanBright: [96, 39], whiteBright: [97, 39] }, bgColor: { bgBlack: [40, 49], bgRed: [41, 49], bgGreen: [42, 49], bgYellow: [43, 49], bgBlue: [44, 49], bgMagenta: [45, 49], bgCyan: [46, 49], bgWhite: [47, 49], bgBlackBright: [100, 49], bgGray: [100, 49], bgGrey: [100, 49], bgRedBright: [101, 49], bgGreenBright: [102, 49], bgYellowBright: [103, 49], bgBlueBright: [104, 49], bgMagentaBright: [105, 49], bgCyanBright: [106, 49], bgWhiteBright: [107, 49] } };
Object.keys(r3.modifier);
var FD2 = Object.keys(r3.color);
var eD2 = Object.keys(r3.bgColor);
[...FD2, ...eD2];
function tD2() {
  const e2 = new Map;
  for (const [u3, F3] of Object.entries(r3)) {
    for (const [t2, s2] of Object.entries(F3))
      r3[t2] = { open: `\x1B[${s2[0]}m`, close: `\x1B[${s2[1]}m` }, F3[t2] = r3[t2], e2.set(s2[0], s2[1]);
    Object.defineProperty(r3, u3, { value: F3, enumerable: false });
  }
  return Object.defineProperty(r3, "codes", { value: e2, enumerable: false }), r3.color.close = "\x1B[39m", r3.bgColor.close = "\x1B[49m", r3.color.ansi = M(), r3.color.ansi256 = P3(), r3.color.ansi16m = W2(), r3.bgColor.ansi = M(d2), r3.bgColor.ansi256 = P3(d2), r3.bgColor.ansi16m = W2(d2), Object.defineProperties(r3, { rgbToAnsi256: { value: (u3, F3, t2) => u3 === F3 && F3 === t2 ? u3 < 8 ? 16 : u3 > 248 ? 231 : Math.round((u3 - 8) / 247 * 24) + 232 : 16 + 36 * Math.round(u3 / 255 * 5) + 6 * Math.round(F3 / 255 * 5) + Math.round(t2 / 255 * 5), enumerable: false }, hexToRgb: { value: (u3) => {
    const F3 = /[a-f\d]{6}|[a-f\d]{3}/i.exec(u3.toString(16));
    if (!F3)
      return [0, 0, 0];
    let [t2] = F3;
    t2.length === 3 && (t2 = [...t2].map((C3) => C3 + C3).join(""));
    const s2 = Number.parseInt(t2, 16);
    return [s2 >> 16 & 255, s2 >> 8 & 255, s2 & 255];
  }, enumerable: false }, hexToAnsi256: { value: (u3) => r3.rgbToAnsi256(...r3.hexToRgb(u3)), enumerable: false }, ansi256ToAnsi: { value: (u3) => {
    if (u3 < 8)
      return 30 + u3;
    if (u3 < 16)
      return 90 + (u3 - 8);
    let F3, t2, s2;
    if (u3 >= 232)
      F3 = ((u3 - 232) * 10 + 8) / 255, t2 = F3, s2 = F3;
    else {
      u3 -= 16;
      const i2 = u3 % 36;
      F3 = Math.floor(u3 / 36) / 5, t2 = Math.floor(i2 / 6) / 5, s2 = i2 % 6 / 5;
    }
    const C3 = Math.max(F3, t2, s2) * 2;
    if (C3 === 0)
      return 30;
    let D2 = 30 + (Math.round(s2) << 2 | Math.round(t2) << 1 | Math.round(F3));
    return C3 === 2 && (D2 += 60), D2;
  }, enumerable: false }, rgbToAnsi: { value: (u3, F3, t2) => r3.ansi256ToAnsi(r3.rgbToAnsi256(u3, F3, t2)), enumerable: false }, hexToAnsi: { value: (u3) => r3.ansi256ToAnsi(r3.hexToAnsi256(u3)), enumerable: false } }), r3;
}
var sD2 = tD2();
var g3 = new Set(["\x1B", ""]);
var CD2 = 39;
var b2 = "\x07";
var O3 = "[";
var iD2 = "]";
var I3 = "m";
var w2 = `${iD2}8;;`;
var N3 = (e2) => `${g3.values().next().value}${O3}${e2}${I3}`;
var L3 = (e2) => `${g3.values().next().value}${w2}${e2}${b2}`;
var rD2 = (e2) => e2.split(" ").map((u3) => A3(u3));
var y3 = (e2, u3, F3) => {
  const t2 = [...u3];
  let s2 = false, C3 = false, D2 = A3(S3(e2[e2.length - 1]));
  for (const [i2, n2] of t2.entries()) {
    const E = A3(n2);
    if (D2 + E <= F3 ? e2[e2.length - 1] += n2 : (e2.push(n2), D2 = 0), g3.has(n2) && (s2 = true, C3 = t2.slice(i2 + 1).join("").startsWith(w2)), s2) {
      C3 ? n2 === b2 && (s2 = false, C3 = false) : n2 === I3 && (s2 = false);
      continue;
    }
    D2 += E, D2 === F3 && i2 < t2.length - 1 && (e2.push(""), D2 = 0);
  }
  !D2 && e2[e2.length - 1].length > 0 && e2.length > 1 && (e2[e2.length - 2] += e2.pop());
};
var ED2 = (e2) => {
  const u3 = e2.split(" ");
  let F3 = u3.length;
  for (;F3 > 0 && !(A3(u3[F3 - 1]) > 0); )
    F3--;
  return F3 === u3.length ? e2 : u3.slice(0, F3).join(" ") + u3.slice(F3).join("");
};
var oD2 = (e2, u3, F3 = {}) => {
  if (F3.trim !== false && e2.trim() === "")
    return "";
  let t2 = "", s2, C3;
  const D2 = rD2(e2);
  let i2 = [""];
  for (const [E, h2] of e2.split(" ").entries()) {
    F3.trim !== false && (i2[i2.length - 1] = i2[i2.length - 1].trimStart());
    let o3 = A3(i2[i2.length - 1]);
    if (E !== 0 && (o3 >= u3 && (F3.wordWrap === false || F3.trim === false) && (i2.push(""), o3 = 0), (o3 > 0 || F3.trim === false) && (i2[i2.length - 1] += " ", o3++)), F3.hard && D2[E] > u3) {
      const B2 = u3 - o3, p = 1 + Math.floor((D2[E] - B2 - 1) / u3);
      Math.floor((D2[E] - 1) / u3) < p && i2.push(""), y3(i2, h2, u3);
      continue;
    }
    if (o3 + D2[E] > u3 && o3 > 0 && D2[E] > 0) {
      if (F3.wordWrap === false && o3 < u3) {
        y3(i2, h2, u3);
        continue;
      }
      i2.push("");
    }
    if (o3 + D2[E] > u3 && F3.wordWrap === false) {
      y3(i2, h2, u3);
      continue;
    }
    i2[i2.length - 1] += h2;
  }
  F3.trim !== false && (i2 = i2.map((E) => ED2(E)));
  const n2 = [...i2.join(`
`)];
  for (const [E, h2] of n2.entries()) {
    if (t2 += h2, g3.has(h2)) {
      const { groups: B2 } = new RegExp(`(?:\\${O3}(?<code>\\d+)m|\\${w2}(?<uri>.*)${b2})`).exec(n2.slice(E).join("")) || { groups: {} };
      if (B2.code !== undefined) {
        const p = Number.parseFloat(B2.code);
        s2 = p === CD2 ? undefined : p;
      } else
        B2.uri !== undefined && (C3 = B2.uri.length === 0 ? undefined : B2.uri);
    }
    const o3 = sD2.codes.get(Number(s2));
    n2[E + 1] === `
` ? (C3 && (t2 += L3("")), s2 && o3 && (t2 += N3(o3))) : h2 === `
` && (s2 && o3 && (t2 += N3(s2)), C3 && (t2 += L3(C3)));
  }
  return t2;
};
function R3(e2, u3, F3) {
  return String(e2).normalize().replace(/\r\n/g, `
`).split(`
`).map((t2) => oD2(t2, u3, F3)).join(`
`);
}
var nD2 = Object.defineProperty;
var aD2 = (e2, u3, F3) => (u3 in e2) ? nD2(e2, u3, { enumerable: true, configurable: true, writable: true, value: F3 }) : e2[u3] = F3;
var a2 = (e2, u3, F3) => (aD2(e2, typeof u3 != "symbol" ? u3 + "" : u3, F3), F3);
function hD(e2, u3) {
  if (e2 === u3)
    return;
  const F3 = e2.split(`
`), t2 = u3.split(`
`), s2 = [];
  for (let C3 = 0;C3 < Math.max(F3.length, t2.length); C3++)
    F3[C3] !== t2[C3] && s2.push(C3);
  return s2;
}
var V2 = Symbol("clack:cancel");
function lD2(e2) {
  return e2 === V2;
}
function v2(e2, u3) {
  e2.isTTY && e2.setRawMode(u3);
}
var z2 = new Map([["k", "up"], ["j", "down"], ["h", "left"], ["l", "right"]]);
var xD = new Set(["up", "down", "left", "right", "space", "enter"]);

class x2 {
  constructor({ render: u3, input: F3 = $, output: t2 = k2, ...s2 }, C3 = true) {
    a2(this, "input"), a2(this, "output"), a2(this, "rl"), a2(this, "opts"), a2(this, "_track", false), a2(this, "_render"), a2(this, "_cursor", 0), a2(this, "state", "initial"), a2(this, "value"), a2(this, "error", ""), a2(this, "subscribers", new Map), a2(this, "_prevFrame", ""), this.opts = s2, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = u3.bind(this), this._track = C3, this.input = F3, this.output = t2;
  }
  prompt() {
    const u3 = new U(0);
    return u3._write = (F3, t2, s2) => {
      this._track && (this.value = this.rl.line.replace(/\t/g, ""), this._cursor = this.rl.cursor, this.emit("value", this.value)), s2();
    }, this.input.pipe(u3), this.rl = _3.createInterface({ input: this.input, output: u3, tabSize: 2, prompt: "", escapeCodeTimeout: 50 }), _3.emitKeypressEvents(this.input, this.rl), this.rl.prompt(), this.opts.initialValue !== undefined && this._track && this.rl.write(this.opts.initialValue), this.input.on("keypress", this.onKeypress), v2(this.input, true), this.output.on("resize", this.render), this.render(), new Promise((F3, t2) => {
      this.once("submit", () => {
        this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), v2(this.input, false), F3(this.value);
      }), this.once("cancel", () => {
        this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), v2(this.input, false), F3(V2);
      });
    });
  }
  on(u3, F3) {
    const t2 = this.subscribers.get(u3) ?? [];
    t2.push({ cb: F3 }), this.subscribers.set(u3, t2);
  }
  once(u3, F3) {
    const t2 = this.subscribers.get(u3) ?? [];
    t2.push({ cb: F3, once: true }), this.subscribers.set(u3, t2);
  }
  emit(u3, ...F3) {
    const t2 = this.subscribers.get(u3) ?? [], s2 = [];
    for (const C3 of t2)
      C3.cb(...F3), C3.once && s2.push(() => t2.splice(t2.indexOf(C3), 1));
    for (const C3 of s2)
      C3();
  }
  unsubscribe() {
    this.subscribers.clear();
  }
  onKeypress(u3, F3) {
    if (this.state === "error" && (this.state = "active"), F3?.name && !this._track && z2.has(F3.name) && this.emit("cursor", z2.get(F3.name)), F3?.name && xD.has(F3.name) && this.emit("cursor", F3.name), u3 && (u3.toLowerCase() === "y" || u3.toLowerCase() === "n") && this.emit("confirm", u3.toLowerCase() === "y"), u3 === "\t" && this.opts.placeholder && (this.value || (this.rl.write(this.opts.placeholder), this.emit("value", this.opts.placeholder))), u3 && this.emit("key", u3.toLowerCase()), F3?.name === "return") {
      if (this.opts.validate) {
        const t2 = this.opts.validate(this.value);
        t2 && (this.error = t2, this.state = "error", this.rl.write(this.value));
      }
      this.state !== "error" && (this.state = "submit");
    }
    u3 === "\x03" && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
  }
  close() {
    this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), v2(this.input, false), this.rl.close(), this.emit(`${this.state}`, this.value), this.unsubscribe();
  }
  restoreCursor() {
    const u3 = R3(this._prevFrame, process.stdout.columns, { hard: true }).split(`
`).length - 1;
    this.output.write(import_sisteransi.cursor.move(-999, u3 * -1));
  }
  render() {
    const u3 = R3(this._render(this) ?? "", process.stdout.columns, { hard: true });
    if (u3 !== this._prevFrame) {
      if (this.state === "initial")
        this.output.write(import_sisteransi.cursor.hide);
      else {
        const F3 = hD(this._prevFrame, u3);
        if (this.restoreCursor(), F3 && F3?.length === 1) {
          const t2 = F3[0];
          this.output.write(import_sisteransi.cursor.move(0, t2)), this.output.write(import_sisteransi.erase.lines(1));
          const s2 = u3.split(`
`);
          this.output.write(s2[t2]), this._prevFrame = u3, this.output.write(import_sisteransi.cursor.move(0, s2.length - t2 - 1));
          return;
        } else if (F3 && F3?.length > 1) {
          const t2 = F3[0];
          this.output.write(import_sisteransi.cursor.move(0, t2)), this.output.write(import_sisteransi.erase.down());
          const s2 = u3.split(`
`).slice(t2);
          this.output.write(s2.join(`
`)), this._prevFrame = u3;
          return;
        }
        this.output.write(import_sisteransi.erase.down());
      }
      this.output.write(u3), this.state === "initial" && (this.state = "active"), this._prevFrame = u3;
    }
  }
}

class BD extends x2 {
  get cursor() {
    return this.value ? 0 : 1;
  }
  get _value() {
    return this.cursor === 0;
  }
  constructor(u3) {
    super(u3, false), this.value = !!u3.initialValue, this.on("value", () => {
      this.value = this._value;
    }), this.on("confirm", (F3) => {
      this.output.write(import_sisteransi.cursor.move(0, -1)), this.value = F3, this.state = "submit", this.close();
    }), this.on("cursor", () => {
      this.value = !this.value;
    });
  }
}
var wD2 = Object.defineProperty;
var yD = (e2, u3, F3) => (u3 in e2) ? wD2(e2, u3, { enumerable: true, configurable: true, writable: true, value: F3 }) : e2[u3] = F3;
var Z = (e2, u3, F3) => (yD(e2, typeof u3 != "symbol" ? u3 + "" : u3, F3), F3);
var $D2 = class extends x2 {
  constructor(u3) {
    super(u3, false), Z(this, "options"), Z(this, "cursor", 0), this.options = u3.options, this.cursor = this.options.findIndex(({ value: F3 }) => F3 === u3.initialValue), this.cursor === -1 && (this.cursor = 0), this.changeValue(), this.on("cursor", (F3) => {
      switch (F3) {
        case "left":
        case "up":
          this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
          break;
        case "down":
        case "right":
          this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
          break;
      }
      this.changeValue();
    });
  }
  get _value() {
    return this.options[this.cursor];
  }
  changeValue() {
    this.value = this._value.value;
  }
};
var WD = globalThis.process.platform.startsWith("win");
function OD({ input: e2 = $, output: u3 = k2, overwrite: F3 = true, hideCursor: t2 = true } = {}) {
  const s2 = f3.createInterface({ input: e2, output: u3, prompt: "", tabSize: 1 });
  f3.emitKeypressEvents(e2, s2), e2.isTTY && e2.setRawMode(true);
  const C3 = (D2, { name: i2 }) => {
    if (String(D2) === "\x03") {
      t2 && u3.write(import_sisteransi.cursor.show), process.exit(0);
      return;
    }
    if (!F3)
      return;
    let n2 = i2 === "return" ? 0 : -1, E = i2 === "return" ? -1 : 0;
    f3.moveCursor(u3, n2, E, () => {
      f3.clearLine(u3, 1, () => {
        e2.once("keypress", C3);
      });
    });
  };
  return t2 && u3.write(import_sisteransi.cursor.hide), e2.once("keypress", C3), () => {
    e2.off("keypress", C3), t2 && u3.write(import_sisteransi.cursor.show), e2.isTTY && !WD && e2.setRawMode(false), s2.terminal = false, s2.close();
  };
}

// ../../node_modules/.pnpm/@clack+prompts@0.8.2/node_modules/@clack/prompts/dist/index.mjs
var import_picocolors = __toESM(require_picocolors(), 1);
var import_sisteransi2 = __toESM(require_src(), 1);
import h2 from "node:process";
function K() {
  return h2.platform !== "win32" ? h2.env.TERM !== "linux" : !!h2.env.CI || !!h2.env.WT_SESSION || !!h2.env.TERMINUS_SUBLIME || h2.env.ConEmuTask === "{cmd::Cmder}" || h2.env.TERM_PROGRAM === "Terminus-Sublime" || h2.env.TERM_PROGRAM === "vscode" || h2.env.TERM === "xterm-256color" || h2.env.TERM === "alacritty" || h2.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var C3 = K();
var u3 = (s2, n2) => C3 ? s2 : n2;
var Y2 = u3("◆", "*");
var P4 = u3("■", "x");
var V3 = u3("▲", "x");
var M2 = u3("◇", "o");
var Q3 = u3("┌", "T");
var a3 = u3("│", "|");
var $2 = u3("└", "—");
var I4 = u3("●", ">");
var T4 = u3("○", " ");
var j2 = u3("◻", "[•]");
var b3 = u3("◼", "[+]");
var B2 = u3("◻", "[ ]");
var X3 = u3("▪", "•");
var G3 = u3("─", "-");
var H = u3("╮", "+");
var ee = u3("├", "+");
var te = u3("╯", "+");
var se = u3("●", "•");
var re = u3("◆", "*");
var ie = u3("▲", "!");
var ne = u3("■", "x");
var y4 = (s2) => {
  switch (s2) {
    case "initial":
    case "active":
      return import_picocolors.default.cyan(Y2);
    case "cancel":
      return import_picocolors.default.red(P4);
    case "error":
      return import_picocolors.default.yellow(V3);
    case "submit":
      return import_picocolors.default.green(M2);
  }
};
var E = (s2) => {
  const { cursor: n2, options: t2, style: i2 } = s2, r4 = s2.maxItems ?? 1 / 0, o3 = Math.max(process.stdout.rows - 4, 0), c3 = Math.min(o3, Math.max(r4, 5));
  let l3 = 0;
  n2 >= l3 + c3 - 3 ? l3 = Math.max(Math.min(n2 - c3 + 3, t2.length - c3), 0) : n2 < l3 + 2 && (l3 = Math.max(n2 - 2, 0));
  const d3 = c3 < t2.length && l3 > 0, p = c3 < t2.length && l3 + c3 < t2.length;
  return t2.slice(l3, l3 + c3).map((S4, f4, x3) => {
    const g4 = f4 === 0 && d3, m3 = f4 === x3.length - 1 && p;
    return g4 || m3 ? import_picocolors.default.dim("...") : i2(S4, f4 + l3 === n2);
  });
};
var ce2 = (s2) => {
  const n2 = s2.active ?? "Yes", t2 = s2.inactive ?? "No";
  return new BD({ active: n2, inactive: t2, initialValue: s2.initialValue ?? true, render() {
    const i2 = `${import_picocolors.default.gray(a3)}
${y4(this.state)}  ${s2.message}
`, r4 = this.value ? n2 : t2;
    switch (this.state) {
      case "submit":
        return `${i2}${import_picocolors.default.gray(a3)}  ${import_picocolors.default.dim(r4)}`;
      case "cancel":
        return `${i2}${import_picocolors.default.gray(a3)}  ${import_picocolors.default.strikethrough(import_picocolors.default.dim(r4))}
${import_picocolors.default.gray(a3)}`;
      default:
        return `${i2}${import_picocolors.default.cyan(a3)}  ${this.value ? `${import_picocolors.default.green(I4)} ${n2}` : `${import_picocolors.default.dim(T4)} ${import_picocolors.default.dim(n2)}`} ${import_picocolors.default.dim("/")} ${this.value ? `${import_picocolors.default.dim(T4)} ${import_picocolors.default.dim(t2)}` : `${import_picocolors.default.green(I4)} ${t2}`}
${import_picocolors.default.cyan($2)}
`;
    }
  } }).prompt();
};
var le2 = (s2) => {
  const n2 = (t2, i2) => {
    const r4 = t2.label ?? String(t2.value);
    switch (i2) {
      case "selected":
        return `${import_picocolors.default.dim(r4)}`;
      case "active":
        return `${import_picocolors.default.green(I4)} ${r4} ${t2.hint ? import_picocolors.default.dim(`(${t2.hint})`) : ""}`;
      case "cancelled":
        return `${import_picocolors.default.strikethrough(import_picocolors.default.dim(r4))}`;
      default:
        return `${import_picocolors.default.dim(T4)} ${import_picocolors.default.dim(r4)}`;
    }
  };
  return new $D2({ options: s2.options, initialValue: s2.initialValue, render() {
    const t2 = `${import_picocolors.default.gray(a3)}
${y4(this.state)}  ${s2.message}
`;
    switch (this.state) {
      case "submit":
        return `${t2}${import_picocolors.default.gray(a3)}  ${n2(this.options[this.cursor], "selected")}`;
      case "cancel":
        return `${t2}${import_picocolors.default.gray(a3)}  ${n2(this.options[this.cursor], "cancelled")}
${import_picocolors.default.gray(a3)}`;
      default:
        return `${t2}${import_picocolors.default.cyan(a3)}  ${E({ cursor: this.cursor, options: this.options, maxItems: s2.maxItems, style: (i2, r4) => n2(i2, r4 ? "active" : "inactive") }).join(`
${import_picocolors.default.cyan(a3)}  `)}
${import_picocolors.default.cyan($2)}
`;
    }
  } }).prompt();
};
var pe = (s2 = "") => {
  process.stdout.write(`${import_picocolors.default.gray(Q3)}  ${s2}
`);
};
var _4 = () => {
  const s2 = C3 ? ["◒", "◐", "◓", "◑"] : ["•", "o", "O", "0"], n2 = C3 ? 80 : 120;
  let t2, i2, r4 = false, o3 = "";
  const c3 = (g4) => {
    const m3 = g4 > 1 ? "Something went wrong" : "Canceled";
    r4 && x3(m3, g4);
  }, l3 = () => c3(2), d3 = () => c3(1), p = () => {
    process.on("uncaughtExceptionMonitor", l3), process.on("unhandledRejection", l3), process.on("SIGINT", d3), process.on("SIGTERM", d3), process.on("exit", c3);
  }, S4 = () => {
    process.removeListener("uncaughtExceptionMonitor", l3), process.removeListener("unhandledRejection", l3), process.removeListener("SIGINT", d3), process.removeListener("SIGTERM", d3), process.removeListener("exit", c3);
  }, f4 = (g4 = "") => {
    r4 = true, t2 = OD(), o3 = g4.replace(/\.+$/, ""), process.stdout.write(`${import_picocolors.default.gray(a3)}
`);
    let m3 = 0, w3 = 0;
    p(), i2 = setInterval(() => {
      const L4 = import_picocolors.default.magenta(s2[m3]), O4 = ".".repeat(Math.floor(w3)).slice(0, 3);
      process.stdout.write(import_sisteransi2.cursor.move(-999, 0)), process.stdout.write(import_sisteransi2.erase.down(1)), process.stdout.write(`${L4}  ${o3}${O4}`), m3 = m3 + 1 < s2.length ? m3 + 1 : 0, w3 = w3 < s2.length ? w3 + 0.125 : 0;
    }, n2);
  }, x3 = (g4 = "", m3 = 0) => {
    o3 = g4 ?? o3, r4 = false, clearInterval(i2);
    const w3 = m3 === 0 ? import_picocolors.default.green(M2) : m3 === 1 ? import_picocolors.default.red(P4) : import_picocolors.default.red(V3);
    process.stdout.write(import_sisteransi2.cursor.move(-999, 0)), process.stdout.write(import_sisteransi2.erase.down(1)), process.stdout.write(`${w3}  ${o3}
`), S4(), t2();
  };
  return { start: f4, stop: x3, message: (g4 = "") => {
    o3 = g4 ?? o3;
  } };
};

// src/command/codex.command.ts
var import_picocolors2 = __toESM(require_picocolors(), 1);

// src/domain/codex-config-manager.ts
import {
  cp as cp2,
  mkdir as mkdir2,
  readdir as readdir2,
  readFile as readFile2,
  rm as rm2,
  stat,
  writeFile as writeFile2
} from "node:fs/promises";
import { basename, dirname as dirname3, join as join2, posix, relative as relative3, resolve as resolve3 } from "node:path";

// src/infra/codex-config-paths.ts
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
function createCodexConfigPaths(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? getDefaultRepoRoot());
  const homeRoot = resolve(options.homeRoot ?? homedir());
  const localCodexRoot = resolve(options.codexHome ?? join(homeRoot, ".codex"));
  return {
    repoRoot,
    repoCodexRoot: resolve(repoRoot, "codex"),
    homeRoot,
    localCodexRoot,
    marketplacePath: resolve(options.marketplace ?? join(homeRoot, ".agents", "plugins", "marketplace.json")),
    pluginsRoot: resolve(options.pluginsRoot ?? join(repoRoot, "codex", "plugins")),
    cacheRoot: resolve(options.cacheRoot ?? join(homeRoot, ".codex", "plugins", "cache", "personal"))
  };
}
function assertPathInside(parent, child) {
  const parentPath = resolve(parent);
  const childPath = resolve(child);
  const childRelative = relative(parentPath, childPath);
  if (childRelative.startsWith("..") || isAbsolute(childRelative)) {
    throw new Error(`Refusing to write outside ${parentPath}: ${childPath}`);
  }
}
function getDefaultRepoRoot() {
  const start = resolve(process.cwd());
  let current = start;
  while (true) {
    if (isWorkspaceRoot(current)) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return start;
    }
    current = parent;
  }
}
function isWorkspaceRoot(path) {
  if (existsSync(join(path, "pnpm-workspace.yaml"))) {
    return true;
  }
  try {
    const pkg = JSON.parse(readFileSync(join(path, "package.json"), "utf8"));
    return pkg.name === "cthutool";
  } catch {
    return false;
  }
}

// src/domain/codex-plugin-manager.ts
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname as dirname2, isAbsolute as isAbsolute2, relative as relative2, resolve as resolve2 } from "node:path";
async function discoverCodexPlugins(pluginsRoot) {
  let entries;
  try {
    entries = await readdir(pluginsRoot, { withFileTypes: true });
  } catch {
    return [];
  }
  const plugins = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const root = resolve2(pluginsRoot, entry.name);
    const manifest = await readPluginManifest(root);
    if (!manifest?.name) {
      continue;
    }
    plugins.push({
      name: manifest.name,
      displayName: manifest.displayName ?? manifest.name,
      root,
      marketplacePath: ""
    });
  }
  return plugins.sort((a4, b4) => a4.name.localeCompare(b4.name));
}
async function readMarketplace(marketplacePath) {
  try {
    const raw = await readFile(marketplacePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      name: typeof parsed.name === "string" ? parsed.name : "personal",
      interface: parsed.interface && typeof parsed.interface === "object" ? parsed.interface : { displayName: "Personal" },
      plugins: Array.isArray(parsed.plugins) ? parsed.plugins : []
    };
  } catch {
    return {
      name: "personal",
      interface: { displayName: "Personal" },
      plugins: []
    };
  }
}
async function installCodexPlugins(options) {
  const plugins = options.plugins.map((plugin) => ({
    ...plugin,
    marketplacePath: plugin.marketplacePath || toHomeRelativeMarketplacePath(plugin.root, options.homeRoot)
  }));
  const marketplace = await readMarketplace(options.marketplacePath);
  const results = [];
  for (const plugin of plugins) {
    if (!options.selectedNames.includes(plugin.name)) {
      continue;
    }
    const existing = marketplace.plugins.find((p) => p.name === plugin.name);
    const entry = createMarketplaceEntry(plugin);
    if (existing) {
      existing.source = entry.source;
      existing.policy = entry.policy;
      existing.category = entry.category;
      results.push({ name: plugin.name, action: "updated" });
    } else {
      marketplace.plugins.push(entry);
      results.push({ name: plugin.name, action: "installed" });
    }
  }
  await mkdir(dirname2(options.marketplacePath), { recursive: true });
  await writeFile(options.marketplacePath, `${JSON.stringify(marketplace, null, 2)}
`, "utf8");
  await enableCodexPlugins(options.configPath, results.map((result) => `${result.name}@personal`));
  return results;
}
async function readEnabledCodexPluginIds(configPath) {
  let raw;
  try {
    raw = await readFile(configPath, "utf8");
  } catch {
    return new Set;
  }
  const enabled = new Set;
  let currentPlugin;
  for (const line of raw.split(/\r?\n/)) {
    const section = /^\s*\[plugins\."([^"]+)"\]\s*$/.exec(line);
    if (section) {
      currentPlugin = section[1];
      continue;
    }
    if (/^\s*\[/.test(line)) {
      currentPlugin = undefined;
      continue;
    }
    if (currentPlugin && /^\s*enabled\s*=\s*true\s*$/.test(line)) {
      enabled.add(currentPlugin);
    }
  }
  return enabled;
}
async function syncCodexPluginCache(options) {
  const version = options.bumpPatch ? await bumpPluginPatchVersion(options.plugin.root) : await readPluginVersion(options.plugin.root);
  const cacheRoot = resolve2(options.cacheRoot);
  const pluginCacheRoot = resolve2(cacheRoot, options.plugin.name);
  const versionCacheRoot = resolve2(pluginCacheRoot, version);
  assertPathInside2(cacheRoot, pluginCacheRoot);
  assertPathInside2(pluginCacheRoot, versionCacheRoot);
  await mkdir(cacheRoot, { recursive: true });
  await rm(pluginCacheRoot, { recursive: true, force: true });
  await mkdir(pluginCacheRoot, { recursive: true });
  await cp(options.plugin.root, versionCacheRoot, {
    recursive: true,
    force: true
  });
  await normalizePluginHookCommands(versionCacheRoot, options.plugin.root);
  await normalizePluginMcpServers(versionCacheRoot);
  return {
    name: options.plugin.name,
    version,
    action: "synced"
  };
}
function createMarketplaceEntry(plugin) {
  return {
    name: plugin.name,
    source: {
      source: "local",
      path: plugin.marketplacePath
    },
    policy: {
      installation: "AVAILABLE",
      authentication: "ON_INSTALL"
    },
    category: "Productivity"
  };
}
function toHomeRelativeMarketplacePath(pluginRoot, homeRoot) {
  const absolutePluginRoot = resolve2(pluginRoot);
  const absoluteHomeRoot = resolve2(homeRoot);
  const homeRelative = relative2(absoluteHomeRoot, absolutePluginRoot);
  if (!homeRelative.startsWith("..") && !isAbsolute2(homeRelative)) {
    return `./${homeRelative.replaceAll("\\", "/")}`;
  }
  return absolutePluginRoot.replaceAll("\\", "/");
}
async function bumpPluginPatchVersion(pluginRoot) {
  const manifestPath = resolve2(pluginRoot, ".codex-plugin", "plugin.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const nextVersion = incrementPatchVersion(typeof manifest.version === "string" ? manifest.version : "0.0.0");
  manifest.version = nextVersion;
  await writeJsonFile(manifestPath, manifest);
  const packageJsonPath = resolve2(pluginRoot, "package.json");
  try {
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    packageJson.version = nextVersion;
    await writeJsonFile(packageJsonPath, packageJson);
  } catch {}
  return nextVersion;
}
function incrementPatchVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Unsupported plugin version: ${version}`);
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]) + 1;
  return `${major}.${minor}.${patch}`;
}
async function readPluginVersion(pluginRoot) {
  const raw = await readFile(resolve2(pluginRoot, ".codex-plugin", "plugin.json"), "utf8");
  const parsed = JSON.parse(raw);
  if (typeof parsed.version !== "string" || parsed.version.trim() === "") {
    throw new Error(`Plugin manifest is missing a version: ${pluginRoot}`);
  }
  return parsed.version;
}
async function writeJsonFile(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}
`, "utf8");
}
async function enableCodexPlugins(configPath, pluginIds) {
  if (pluginIds.length === 0) {
    return;
  }
  let raw;
  try {
    raw = await readFile(configPath, "utf8");
  } catch {
    raw = "";
  }
  let lines = raw.length > 0 ? raw.split(/\r?\n/) : [];
  if (lines.length > 0 && lines.at(-1) === "") {
    lines = lines.slice(0, -1);
  }
  for (const pluginId of pluginIds) {
    lines = upsertEnabledPluginSection(lines, pluginId);
  }
  await mkdir(dirname2(configPath), { recursive: true });
  await writeFile(configPath, `${lines.join(`
`)}
`, "utf8");
}
function upsertEnabledPluginSection(lines, pluginId) {
  const heading = `[plugins."${escapeTomlString(pluginId)}"]`;
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return [
      ...lines,
      ...lines.length > 0 ? [""] : [],
      heading,
      "enabled = true"
    ];
  }
  let end = lines.length;
  for (let index = start + 1;index < lines.length; index += 1) {
    if (/^\s*\[/.test(lines[index] ?? "")) {
      end = index;
      break;
    }
  }
  const enabledIndex = lines.findIndex((line, index) => index > start && index < end && /^\s*enabled\s*=/.test(line));
  const next = [...lines];
  if (enabledIndex === -1) {
    next.splice(start + 1, 0, "enabled = true");
  } else {
    next[enabledIndex] = "enabled = true";
  }
  return next;
}
function escapeTomlString(value) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', "\\\"");
}
async function normalizePluginHookCommands(runtimePluginRoot, sourcePluginRoot) {
  const hooksPath = resolve2(runtimePluginRoot, "hooks", "hooks.json");
  let raw;
  try {
    raw = await readFile(hooksPath, "utf8");
  } catch {
    return;
  }
  const normalizedRoot = resolve2(sourcePluginRoot).replaceAll("\\", "/");
  await writeFile(hooksPath, raw.replaceAll("<PLUGIN_ROOT>", normalizedRoot), "utf8");
}
async function normalizePluginMcpServers(runtimePluginRoot) {
  const mcpPath = resolve2(runtimePluginRoot, ".mcp.json");
  let raw;
  try {
    raw = await readFile(mcpPath, "utf8");
  } catch {
    return;
  }
  const parsed = JSON.parse(raw);
  if (!parsed.mcpServers || typeof parsed.mcpServers !== "object") {
    return;
  }
  const normalizedRoot = resolve2(runtimePluginRoot).replaceAll("\\", "/");
  let changed = false;
  for (const [name, server] of Object.entries(parsed.mcpServers)) {
    if (!server || typeof server !== "object" || Array.isArray(server)) {
      continue;
    }
    const normalizedServer = server;
    if (typeof normalizedServer.cwd !== "string") {
      normalizedServer.cwd = normalizedRoot;
      changed = true;
    } else if (normalizedServer.cwd.includes("<PLUGIN_ROOT>")) {
      normalizedServer.cwd = normalizedServer.cwd.replaceAll("<PLUGIN_ROOT>", normalizedRoot);
      changed = true;
    }
    parsed.mcpServers[name] = normalizedServer;
  }
  if (changed) {
    await writeJsonFile(mcpPath, parsed);
  }
}
function assertPathInside2(parent, child) {
  const parentPath = resolve2(parent);
  const childPath = resolve2(child);
  const childRelative = relative2(parentPath, childPath);
  if (childRelative.startsWith("..") || isAbsolute2(childRelative)) {
    throw new Error(`Refusing to write outside ${parentPath}: ${childPath}`);
  }
}
async function readPluginManifest(pluginRoot) {
  try {
    const raw = await readFile(resolve2(pluginRoot, ".codex-plugin", "plugin.json"), "utf8");
    const parsed = JSON.parse(raw);
    if (typeof parsed.name !== "string" || parsed.name.trim().length === 0) {
      return;
    }
    const displayName = parsed.interface?.displayName;
    return {
      name: parsed.name,
      displayName: typeof displayName === "string" ? displayName : undefined
    };
  } catch {
    return;
  }
}

// src/domain/codex-config-manager.ts
var managedAreas = ["prompts", "rules"];
var officialSkillsRepository = {
  owner: "openai",
  repo: "skills",
  ref: "main"
};
var officialSkillCollections = ["skills/.curated", "skills/.experimental"];
function getManagedAreaExclude(area) {
  return area === "prompts" ? isGeneratedPromptAdapter : undefined;
}
function isGeneratedPromptAdapter(relativePath) {
  return /^opsx-[a-z0-9-]+\.md$/i.test(relativePath);
}
async function compareCodexConfig(paths) {
  return {
    areas: {
      prompts: await compareManagedArea(paths, "prompts"),
      rules: await compareManagedArea(paths, "rules")
    },
    unmanagedSkills: await findUnmanagedSkills(paths),
    unmanagedPlugins: await findUnmanagedPlugins(paths),
    repoPlugins: await findRepoPluginStatuses(paths),
    missingRepoSkills: await findMissingRepoSkills(paths),
    missingRepoPlugins: await findMissingRepoPlugins(paths),
    unsupportedSkills: await findUnsupportedSkills(paths),
    unsupportedPlugins: await findUnsupportedPlugins(paths),
    unsafeRepoPaths: await findUnsafeRepoPaths(paths)
  };
}
async function exportCodexConfig(paths) {
  const exportedAreas = [];
  for (const area of managedAreas) {
    await mirrorDirectory({
      sourceRoot: join2(paths.localCodexRoot, area),
      targetRoot: join2(paths.repoCodexRoot, area),
      writeRoot: paths.repoCodexRoot,
      excludeRelativePath: getManagedAreaExclude(area)
    });
    exportedAreas.push(area);
  }
  const skillsManifest = await generateSkillsManifest(paths);
  const pluginsManifest = await generatePluginsManifest(paths);
  const unmanagedSkills = await findUnmanagedSkills(paths, skillsManifest);
  const unmanagedPlugins = await findUnmanagedPlugins(paths, pluginsManifest);
  await writeJsonFile2(join2(paths.repoCodexRoot, "skills.manifest.json"), skillsManifest, paths.repoCodexRoot);
  await writeJsonFile2(join2(paths.repoCodexRoot, "plugins.manifest.json"), pluginsManifest, paths.repoCodexRoot);
  return {
    exportedAreas,
    skillsManifest,
    pluginsManifest,
    unmanagedSkills,
    unmanagedPlugins
  };
}
async function applyCodexConfig(paths) {
  const appliedAreas = [];
  for (const area of managedAreas) {
    await mirrorDirectory({
      sourceRoot: join2(paths.repoCodexRoot, area),
      targetRoot: join2(paths.localCodexRoot, area),
      writeRoot: paths.localCodexRoot,
      excludeRelativePath: getManagedAreaExclude(area)
    });
    appliedAreas.push(area);
  }
  const skillsManifest = await readSkillsManifest(paths);
  const skillResult = await applySkillsManifest(paths, {
    version: 1,
    skills: skillsManifest.skills.filter((skill) => skill.source !== "repo")
  });
  const pluginsManifest = await readPluginsManifest(paths);
  const pluginResult = await applyPluginsManifest(paths, {
    version: 1,
    plugins: pluginsManifest.plugins.filter((plugin) => plugin.source !== "repo")
  });
  return {
    appliedAreas,
    installedPlugins: pluginResult.installed,
    syncedPluginCaches: pluginResult.synced,
    installedSkills: skillResult.installed,
    unsupportedSkills: skillResult.unsupported,
    unsupportedPlugins: pluginResult.unsupported
  };
}
async function installCodexAssets(paths) {
  const repoSkillsManifest = await withRepositorySkills(paths, {
    version: 1,
    skills: (await readSkillsManifest(paths)).skills.filter((skill) => skill.source === "repo")
  });
  const skillResult = await applySkillsManifest(paths, repoSkillsManifest);
  const repoPluginsManifest = await withRepositoryPlugins(paths, {
    version: 1,
    plugins: (await readPluginsManifest(paths)).plugins.filter((plugin) => plugin.source === "repo")
  });
  const pluginResult = await applyPluginsManifest(paths, repoPluginsManifest);
  return {
    installedPlugins: pluginResult.installed,
    syncedPluginCaches: pluginResult.synced,
    installedSkills: skillResult.installed,
    unsupportedSkills: skillResult.unsupported,
    unsupportedPlugins: pluginResult.unsupported
  };
}
async function findUnsafeRepoPaths(paths) {
  const unsafe = new Set;
  await walkRepoCodex(paths.repoCodexRoot, async (absolutePath, entry) => {
    const relativePath = toSlash(relative3(paths.repoCodexRoot, absolutePath));
    if (entry.isDirectory()) {
      if (isUnsafeDirectory(relativePath)) {
        unsafe.add(relativePath);
      }
      return;
    }
    if (isUnsafeFile(relativePath)) {
      unsafe.add(relativePath);
    }
  });
  return [...unsafe].sort();
}
async function compareManagedArea(paths, area) {
  const excludeRelativePath = getManagedAreaExclude(area);
  const localFiles = await readFileTree(join2(paths.localCodexRoot, area), excludeRelativePath);
  const repoFiles = await readFileTree(join2(paths.repoCodexRoot, area), excludeRelativePath);
  const names = new Set([...localFiles.keys(), ...repoFiles.keys()]);
  const files = {
    added: [],
    removed: [],
    modified: [],
    unchanged: []
  };
  for (const name of [...names].sort()) {
    const local = localFiles.get(name);
    const repo = repoFiles.get(name);
    if (local !== undefined && repo === undefined) {
      files.added.push(name);
    } else if (local === undefined && repo !== undefined) {
      files.removed.push(name);
    } else if (local !== repo) {
      files.modified.push(name);
    } else {
      files.unchanged.push(name);
    }
  }
  return {
    counts: {
      added: files.added.length,
      removed: files.removed.length,
      modified: files.modified.length,
      unchanged: files.unchanged.length
    },
    files
  };
}
async function readFileTree(root, excludeRelativePath) {
  const files = new Map;
  await walkFiles(root, async (path) => {
    const relativePath = toSlash(relative3(root, path));
    if (excludeRelativePath?.(relativePath)) {
      return;
    }
    files.set(relativePath, await readFile2(path, "utf8"));
  });
  return files;
}
async function generateSkillsManifest(paths) {
  const existing = await readSkillsManifest(paths);
  const skills = existing.skills.filter((skill) => skill.source !== "repo" || skill.enabled === false);
  const existingNames = new Set(skills.map((skill) => skill.name));
  for (const skill of await discoverLocalExternalSkills(paths)) {
    if (!existingNames.has(skill.name)) {
      skills.push(skill);
      existingNames.add(skill.name);
    }
  }
  return {
    version: 1,
    skills: skills.sort((a4, b4) => a4.name.localeCompare(b4.name))
  };
}
async function discoverRepositorySkills(paths) {
  const skillsRoot = join2(paths.repoCodexRoot, "skills");
  const skills = [];
  for (const entry of await readDirectorySafe(skillsRoot)) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) {
      continue;
    }
    skills.push({
      name: entry.name,
      source: "repo",
      path: `codex/skills/${entry.name}`,
      enabled: true
    });
  }
  return skills;
}
async function discoverLocalExternalSkills(paths) {
  const skillsRoot = join2(paths.localCodexRoot, "skills");
  const skills = [];
  const repoSkills = new Set((await discoverRepositorySkills(paths)).map((skill) => skill.name));
  for (const entry of await readDirectorySafe(skillsRoot)) {
    if (!entry.isDirectory() || entry.name.startsWith(".") || repoSkills.has(entry.name) || !await isLocalSkillDirectory(paths, entry.name)) {
      continue;
    }
    skills.push({
      name: entry.name,
      source: "external",
      path: `skill:${entry.name}`,
      enabled: true
    });
  }
  return skills.sort((a4, b4) => a4.name.localeCompare(b4.name));
}
async function withRepositorySkills(paths, manifest) {
  const skills = [...manifest.skills];
  const existingNames = new Set(skills.map((skill) => skill.name));
  for (const skill of await discoverRepositorySkills(paths)) {
    if (!existingNames.has(skill.name)) {
      skills.push(skill);
    }
  }
  return {
    version: 1,
    skills: skills.sort((a4, b4) => a4.name.localeCompare(b4.name))
  };
}
async function generatePluginsManifest(paths) {
  const existing = await readPluginsManifest(paths);
  const plugins = existing.plugins.filter((plugin) => plugin.source !== "repo" || plugin.enabled === false);
  const existingNames = new Set(plugins.map((plugin) => plugin.name));
  for (const plugin of await discoverLocalMarketplacePlugins(paths)) {
    if (!existingNames.has(plugin.name)) {
      plugins.push(plugin);
      existingNames.add(plugin.name);
    }
  }
  return {
    version: 1,
    plugins: plugins.sort((a4, b4) => a4.name.localeCompare(b4.name))
  };
}
async function discoverRepositoryPlugins(paths) {
  return (await discoverCodexPlugins(paths.pluginsRoot)).map((plugin) => ({
    name: plugin.name,
    source: "repo",
    path: toSlash(relative3(paths.repoRoot, plugin.root)),
    enabled: true
  }));
}
async function discoverLocalMarketplacePlugins(paths) {
  const repoPlugins = new Set((await discoverRepositoryPlugins(paths)).map((plugin) => plugin.name));
  return (await readMarketplaceEntries(paths)).map((plugin) => plugin.name).filter((name) => typeof name === "string").filter((name) => !repoPlugins.has(name)).map((name) => ({
    name,
    source: "marketplace",
    path: `marketplace:${name}`,
    enabled: true
  })).sort((a4, b4) => a4.name.localeCompare(b4.name));
}
async function withRepositoryPlugins(paths, manifest) {
  const plugins = [...manifest.plugins];
  const existingNames = new Set(plugins.map((plugin) => plugin.name));
  for (const plugin of await discoverRepositoryPlugins(paths)) {
    if (!existingNames.has(plugin.name)) {
      plugins.push(plugin);
    }
  }
  return {
    version: 1,
    plugins: plugins.sort((a4, b4) => a4.name.localeCompare(b4.name))
  };
}
async function findUnmanagedSkills(paths, manifest) {
  const resolvedManifest = manifest ?? await readSkillsManifest(paths);
  const managed = new Set([
    ...resolvedManifest.skills.map((skill) => skill.name),
    ...(await discoverRepositorySkills(paths)).map((skill) => skill.name)
  ]);
  const names = [];
  for (const entry of await readDirectorySafe(join2(paths.localCodexRoot, "skills"))) {
    if (entry.isDirectory() && !entry.name.startsWith(".") && !managed.has(entry.name) && await isLocalSkillDirectory(paths, entry.name)) {
      names.push(entry.name);
    }
  }
  return names.sort();
}
async function findUnmanagedPlugins(paths, manifest) {
  const resolvedManifest = manifest ?? await readPluginsManifest(paths);
  const managed = new Set([
    ...resolvedManifest.plugins.map((plugin) => plugin.name),
    ...(await discoverRepositoryPlugins(paths)).map((plugin) => plugin.name)
  ]);
  try {
    const raw = await readFile2(paths.marketplacePath, "utf8");
    const parsed = JSON.parse(raw);
    return (parsed.plugins ?? []).map((plugin) => plugin.name).filter((name) => typeof name === "string").filter((name) => !managed.has(name)).sort();
  } catch {
    return [];
  }
}
async function findMissingRepoSkills(paths) {
  const manifest = await withRepositorySkills(paths, await readSkillsManifest(paths));
  const missing = [];
  for (const skill of manifest.skills) {
    if (skill.enabled === false || skill.source !== "repo" || !isRepoManagedPath(paths, skill.path, "skills")) {
      continue;
    }
    if (!await exists(join2(paths.localCodexRoot, "skills", skill.name))) {
      missing.push(skill.name);
    }
  }
  return missing.sort();
}
async function findMissingRepoPlugins(paths) {
  const manifest = await withRepositoryPlugins(paths, await readPluginsManifest(paths));
  const marketplace = await readMarketplaceEntries(paths);
  const enabledPluginIds = await readEnabledCodexPluginIds(join2(paths.localCodexRoot, "config.toml"));
  const missing = [];
  for (const plugin of manifest.plugins) {
    if (!plugin.enabled || plugin.source !== "repo" || !isRepoManagedPath(paths, plugin.path, "plugins")) {
      continue;
    }
    const expectedRoot = resolve3(paths.repoRoot, plugin.path);
    const installed = marketplace.find((entry) => entry.name === plugin.name);
    if (!installed?.source?.path || !enabledPluginIds.has(`${plugin.name}@personal`) || !sameResolvedPath(resolveMarketplacePath(paths.homeRoot, installed.source.path), expectedRoot)) {
      missing.push(plugin.name);
    }
  }
  return missing.sort();
}
async function findRepoPluginStatuses(paths) {
  const manifest = await readPluginsManifest(paths);
  const marketplace = await readMarketplaceEntries(paths);
  const enabledPluginIds = await readEnabledCodexPluginIds(join2(paths.localCodexRoot, "config.toml"));
  const entriesByName = new Map(manifest.plugins.map((plugin) => [plugin.name, plugin]));
  const statuses = [];
  for (const plugin of await discoverCodexPlugins(paths.pluginsRoot)) {
    const path = toSlash(relative3(paths.repoRoot, plugin.root));
    const manifestEntry = entriesByName.get(plugin.name);
    if (manifestEntry?.enabled === false) {
      statuses.push({
        name: plugin.name,
        path,
        status: "disabled"
      });
      continue;
    }
    const expectedRoot = manifestEntry?.source === "repo" && isRepoManagedPath(paths, manifestEntry.path, "plugins") ? resolve3(paths.repoRoot, manifestEntry.path) : plugin.root;
    const installed = marketplace.find((entry) => entry.name === plugin.name);
    statuses.push({
      name: plugin.name,
      path,
      status: installed?.source?.path && enabledPluginIds.has(`${plugin.name}@personal`) && sameResolvedPath(resolveMarketplacePath(paths.homeRoot, installed.source.path), expectedRoot) ? "applied" : "not_applied"
    });
  }
  return statuses.sort((a4, b4) => a4.name.localeCompare(b4.name));
}
async function findUnsupportedSkills(paths) {
  const manifest = await readSkillsManifest(paths);
  const unsupported = [];
  for (const skill of manifest.skills) {
    if (skill.enabled === false || skill.source === "repo") {
      continue;
    }
    if (skill.source === "external" && (await isLocalSkillDirectory(paths, skill.name) || await findOfficialSkillSource(paths, skill))) {
      continue;
    }
    unsupported.push(skill.name);
  }
  return unsupported.sort();
}
async function findUnsupportedPlugins(paths) {
  const manifest = await readPluginsManifest(paths);
  const marketplace = await readMarketplaceEntries(paths);
  const installedMarketplaceNames = new Set(marketplace.map((plugin) => plugin.name).filter((name) => typeof name === "string"));
  return manifest.plugins.filter((plugin) => plugin.enabled && plugin.source !== "repo" && !installedMarketplaceNames.has(plugin.name)).map((plugin) => plugin.name).sort();
}
async function readMarketplaceEntries(paths) {
  try {
    const raw = await readFile2(paths.marketplacePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.plugins) ? parsed.plugins : [];
  } catch {
    return [];
  }
}
async function readSkillsManifest(paths) {
  try {
    const parsed = JSON.parse(await readFile2(join2(paths.repoCodexRoot, "skills.manifest.json"), "utf8"));
    return {
      version: 1,
      skills: Array.isArray(parsed.skills) ? parsed.skills.map((skill) => ({
        ...skill,
        enabled: skill.enabled !== false
      })) : []
    };
  } catch {
    return { version: 1, skills: [] };
  }
}
async function readPluginsManifest(paths) {
  try {
    const parsed = JSON.parse(await readFile2(join2(paths.repoCodexRoot, "plugins.manifest.json"), "utf8"));
    return {
      version: 1,
      plugins: Array.isArray(parsed.plugins) ? parsed.plugins : []
    };
  } catch {
    return { version: 1, plugins: [] };
  }
}
async function applySkillsManifest(paths, manifest) {
  const installed = [];
  const unsupported = [];
  for (const skill of manifest.skills) {
    if (skill.enabled === false) {
      continue;
    }
    if (skill.source === "external") {
      if (await isLocalSkillDirectory(paths, skill.name)) {
        installed.push(skill.name);
        continue;
      }
      const sourceRoot2 = await findOfficialSkillSource(paths, skill);
      if (!sourceRoot2) {
        if (!await installOfficialSkill(paths, skill)) {
          unsupported.push(skill.name);
          continue;
        }
        installed.push(skill.name);
        continue;
      }
      const targetRoot2 = resolve3(paths.localCodexRoot, "skills", skill.name);
      await mirrorDirectory({
        sourceRoot: sourceRoot2,
        targetRoot: targetRoot2,
        writeRoot: paths.localCodexRoot
      });
      installed.push(skill.name);
      continue;
    }
    if (skill.source !== "repo") {
      unsupported.push(skill.name);
      continue;
    }
    const sourceRoot = resolve3(paths.repoRoot, skill.path);
    const targetRoot = resolve3(paths.localCodexRoot, "skills", skill.name);
    assertPathInside(paths.repoCodexRoot, sourceRoot);
    await mirrorDirectory({
      sourceRoot,
      targetRoot,
      writeRoot: paths.localCodexRoot
    });
    installed.push(skill.name);
  }
  return { installed, unsupported };
}
async function installOfficialSkill(paths, skill) {
  const requestedName = getRequestedOfficialSkillName(skill);
  if (!requestedName) {
    return false;
  }
  for (const collection of officialSkillCollections) {
    const sourcePath = `${collection}/${requestedName}`;
    const tempRoot = resolve3(paths.localCodexRoot, ".cthutool-install", `${requestedName}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const targetRoot = resolve3(paths.localCodexRoot, "skills", skill.name);
    assertPathInside(paths.localCodexRoot, tempRoot);
    assertPathInside(paths.localCodexRoot, targetRoot);
    try {
      await downloadGitHubDirectory({
        owner: officialSkillsRepository.owner,
        repo: officialSkillsRepository.repo,
        ref: officialSkillsRepository.ref,
        sourcePath,
        sourceRootPath: sourcePath,
        targetRoot: tempRoot
      });
      if (!await exists(join2(tempRoot, "SKILL.md"))) {
        await rm2(tempRoot, { recursive: true, force: true });
        continue;
      }
      await mirrorDirectory({
        sourceRoot: tempRoot,
        targetRoot,
        writeRoot: paths.localCodexRoot
      });
      await rm2(tempRoot, { recursive: true, force: true });
      return true;
    } catch {
      await rm2(tempRoot, { recursive: true, force: true });
    }
  }
  return false;
}
async function downloadGitHubDirectory(input) {
  const entries = await fetchGitHubContentEntries(input);
  for (const entry of entries) {
    if (entry.type === "dir" && typeof entry.path === "string") {
      await downloadGitHubDirectory({
        ...input,
        sourcePath: entry.path
      });
      continue;
    }
    if (entry.type !== "file" || typeof entry.path !== "string" || typeof entry.download_url !== "string") {
      continue;
    }
    const relativePath = posix.relative(input.sourceRootPath, entry.path);
    if (relativePath.length === 0 || relativePath.startsWith("..") || relativePath.includes("\\")) {
      throw new Error(`Unsafe skill file path from GitHub: ${entry.path}`);
    }
    const outputPath = resolve3(input.targetRoot, ...relativePath.split("/"));
    assertPathInside(input.targetRoot, outputPath);
    const response = await fetch(entry.download_url);
    if (!response.ok) {
      throw new Error(`Failed to download ${entry.download_url}`);
    }
    await mkdir2(dirname3(outputPath), { recursive: true });
    await writeFile2(outputPath, new Uint8Array(await response.arrayBuffer()));
  }
}
async function fetchGitHubContentEntries(input) {
  const encodedPath = input.sourcePath.split("/").map((part) => encodeURIComponent(part)).join("/");
  const url = `https://api.github.com/repos/${input.owner}/${input.repo}/contents/${encodedPath}?ref=${encodeURIComponent(input.ref)}`;
  const response = await fetch(url, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": "cthutool-cli"
    }
  });
  if (!response.ok) {
    throw new Error(`GitHub content request failed: ${response.status}`);
  }
  const value = await response.json();
  if (!Array.isArray(value)) {
    throw new Error(`GitHub content path is not a directory: ${input.sourcePath}`);
  }
  return value;
}
async function findOfficialSkillSource(paths, skill) {
  const requestedName = getRequestedOfficialSkillName(skill);
  if (!requestedName) {
    return;
  }
  const candidates = [
    join2(paths.localCodexRoot, "vendor_imports", "skills", "skills", ".curated", requestedName),
    join2(paths.localCodexRoot, "vendor_imports", "skills", "skills", ".experimental", requestedName)
  ];
  for (const candidate of candidates) {
    if (await exists(join2(candidate, "SKILL.md"))) {
      return candidate;
    }
  }
  return;
}
function getRequestedOfficialSkillName(skill) {
  const requestedName = skill.path.startsWith("skill:") ? skill.path.slice("skill:".length) : skill.name;
  if (!requestedName || requestedName.includes("/") || requestedName.includes("\\")) {
    return;
  }
  return requestedName;
}
async function applyPluginsManifest(paths, manifest) {
  const marketplace = await readMarketplaceEntries(paths);
  const installedMarketplaceNames = new Set(marketplace.map((plugin) => plugin.name).filter((name) => typeof name === "string"));
  const unsupported = manifest.plugins.filter((plugin) => plugin.enabled && plugin.source !== "repo" && !installedMarketplaceNames.has(plugin.name)).map((plugin) => plugin.name);
  const enabled = manifest.plugins.filter((plugin) => plugin.enabled && plugin.source === "repo");
  const plugins = await Promise.all(enabled.map(async (plugin) => {
    const root = resolve3(paths.repoRoot, plugin.path);
    assertPathInside(paths.repoCodexRoot, root);
    const metadata = await readPluginMetadata(root);
    return {
      name: plugin.name,
      displayName: metadata.displayName,
      root,
      marketplacePath: ""
    };
  }));
  const installed = await installCodexPlugins({
    homeRoot: paths.homeRoot,
    configPath: join2(paths.localCodexRoot, "config.toml"),
    marketplacePath: paths.marketplacePath,
    plugins,
    selectedNames: enabled.map((plugin) => plugin.name)
  });
  const synced = await Promise.all(plugins.map((plugin) => syncCodexPluginCache({
    cacheRoot: paths.cacheRoot,
    plugin
  })));
  return { installed, synced, unsupported };
}
async function readPluginMetadata(pluginRoot) {
  try {
    const raw = await readFile2(join2(pluginRoot, ".codex-plugin", "plugin.json"), "utf8");
    const parsed = JSON.parse(raw);
    return {
      displayName: typeof parsed.interface?.displayName === "string" ? parsed.interface.displayName : basename(pluginRoot)
    };
  } catch {
    return { displayName: basename(pluginRoot) };
  }
}
async function mirrorDirectory(input) {
  const targetRoot = resolve3(input.targetRoot);
  assertPathInside(input.writeRoot, targetRoot);
  if (input.excludeRelativePath) {
    await mirrorDirectoryWithExcludes({
      ...input,
      targetRoot,
      excludeRelativePath: input.excludeRelativePath
    });
    return;
  }
  await rm2(targetRoot, { recursive: true, force: true });
  if (!await exists(input.sourceRoot)) {
    return;
  }
  await mkdir2(dirname3(targetRoot), { recursive: true });
  await cp2(input.sourceRoot, targetRoot, { recursive: true, force: true });
}
async function mirrorDirectoryWithExcludes(input) {
  await walkFiles(input.targetRoot, async (path) => {
    const relativePath = toSlash(relative3(input.targetRoot, path));
    if (input.excludeRelativePath(relativePath)) {
      return;
    }
    assertPathInside(input.writeRoot, path);
    await rm2(path, { force: true });
  });
  if (!await exists(input.sourceRoot)) {
    return;
  }
  await walkFiles(input.sourceRoot, async (sourcePath) => {
    const relativePath = toSlash(relative3(input.sourceRoot, sourcePath));
    if (input.excludeRelativePath(relativePath)) {
      return;
    }
    const targetPath = resolve3(input.targetRoot, relativePath);
    assertPathInside(input.writeRoot, targetPath);
    await mkdir2(dirname3(targetPath), { recursive: true });
    await rm2(targetPath, { recursive: true, force: true });
    await cp2(sourcePath, targetPath, { force: true });
  });
}
async function writeJsonFile2(path, value, writeRoot) {
  assertPathInside(writeRoot, path);
  await mkdir2(dirname3(path), { recursive: true });
  await writeFile2(path, `${JSON.stringify(value, null, 2)}
`, "utf8");
}
async function walkFiles(root, visit) {
  for (const entry of await readDirectorySafe(root)) {
    const path = join2(root, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(path, visit);
    } else if (entry.isFile()) {
      await visit(path);
    }
  }
}
async function walkRepoCodex(root, visit) {
  for (const entry of await readDirectorySafe(root)) {
    const path = join2(root, entry.name);
    await visit(path, entry);
    if (entry.isDirectory()) {
      await walkRepoCodex(path, visit);
    }
  }
}
async function readDirectorySafe(path) {
  try {
    return await readdir2(path, { withFileTypes: true });
  } catch {
    return [];
  }
}
async function isLocalSkillDirectory(paths, name) {
  return exists(join2(paths.localCodexRoot, "skills", name, "SKILL.md"));
}
async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
function isUnsafeFile(relativePath) {
  const name = basename(relativePath);
  return name === "auth.json" || name === "cap_sid" || name === "config.toml" || name.endsWith(".sqlite") || name.endsWith(".sqlite-shm") || name.endsWith(".sqlite-wal");
}
function isUnsafeDirectory(relativePath) {
  return [
    "cache",
    "plugins/cache",
    "logs",
    "log",
    "tmp",
    ".tmp",
    "sessions",
    "archived_sessions",
    "memories"
  ].includes(relativePath);
}
function isRepoManagedPath(paths, path, area) {
  const sourceRoot = resolve3(paths.repoRoot, path);
  try {
    assertPathInside(join2(paths.repoCodexRoot, area), sourceRoot);
    return true;
  } catch {
    return false;
  }
}
function resolveMarketplacePath(homeRoot, path) {
  if (typeof path !== "string" || path.trim().length === 0) {
    return "";
  }
  if (path.startsWith("./")) {
    return resolve3(homeRoot, path.slice(2));
  }
  return resolve3(path);
}
function sameResolvedPath(left, right) {
  return resolve3(left).toLowerCase() === resolve3(right).toLowerCase();
}
function toSlash(path) {
  return path.replaceAll("\\", "/");
}

// src/runtime/cli-context.ts
var cliContractArgs = {
  json: {
    type: "boolean",
    description: "Print one machine-readable JSON value to stdout"
  },
  noInteractive: {
    type: "boolean",
    description: "Disable prompts even when stdin is a TTY"
  },
  quiet: {
    type: "boolean",
    description: "Suppress non-essential human status output"
  }
};
function createCliContext(args, deps = {
  isTty: () => process.stdin.isTTY === true
}) {
  const isTty = deps.isTty();
  return {
    isTty,
    interactive: isTty && args.noInteractive !== true,
    json: args.json === true,
    quiet: args.quiet === true
  };
}

// src/runtime/cli-error.ts
class CliCommandError extends Error {
  code;
  exitCode;
  constructor(code, message, exitCode = 1) {
    super(message);
    this.name = "CliCommandError";
    this.code = code;
    this.exitCode = exitCode;
  }
}
function createCliError(code, message, exitCode = 1) {
  return new CliCommandError(code, message, exitCode);
}
function isCliCommandError(value) {
  return value instanceof CliCommandError;
}

// src/runtime/observability.ts
import { basename as basename2, dirname as dirname4, sep as sep2 } from "node:path";
var CLI_DIAGNOSTICS_ENV = "CHC_CLI_DIAGNOSTICS";
var REDACTED = "[redacted]";
var MAX_STRING_LENGTH = 160;
var MAX_OBJECT_KEYS = 16;
function isCliDiagnosticsEnabled(env2 = process.env) {
  const raw = env2[CLI_DIAGNOSTICS_ENV];
  return raw === "1" || raw === "true" || raw === "yes";
}
function createCliDiagnostics(context, output, base = {}, deps = {}) {
  const now = deps.now ?? (() => new Date);
  const isEnabled = deps.isEnabled ?? (() => isCliDiagnosticsEnabled());
  const diagnostics = {
    isEnabled,
    child: (childBase) => createCliDiagnostics(context, output, { ...base, ...childBase }, { isEnabled, now }),
    emit: (input) => {
      if (!isEnabled() || isSuppressed(context, input.level)) {
        return;
      }
      const event = {
        source: "cthutool.cli",
        timestamp: now().toISOString(),
        ...base,
        ...input,
        message: input.message === undefined ? undefined : sanitizeDiagnosticMessage(input.message),
        details: input.details ? sanitizeDiagnosticDetails(input.details) : undefined
      };
      output.stderr.write(`${JSON.stringify(dropUndefined(event))}
`);
    }
  };
  return diagnostics;
}
function createCliCommandDiagnostics(context, output, base, deps = {}) {
  const nowMs = deps.nowMs ?? (() => Date.now());
  const startedAt = nowMs();
  const diagnostics = createCliDiagnostics(context, output, base, deps);
  diagnostics.emit({
    level: "debug",
    event: "cli.command_started",
    phase: "start",
    details: modeDetails(context)
  });
  return {
    complete: (input = {}) => {
      diagnostics.emit({
        level: "info",
        event: "cli.command_completed",
        phase: "complete",
        durationMs: Math.max(0, nowMs() - startedAt),
        exitCode: input.exitCode ?? 0,
        details: { ...modeDetails(context), ...input.details }
      });
    },
    fail: (error, input = {}) => {
      diagnostics.emit({
        level: "error",
        event: "cli.command_failed",
        phase: "failure",
        durationMs: Math.max(0, nowMs() - startedAt),
        exitCode: error.exitCode,
        errorCode: error.code,
        message: error.message,
        details: { ...modeDetails(context), ...input.details }
      });
    }
  };
}
function summarizeScriptArgs(args) {
  const keys = Object.keys(args).sort();
  return {
    argumentCount: keys.length,
    argumentKeys: keys
  };
}
function sanitizeDiagnosticDetails(details) {
  return sanitizeObject(details, 0);
}
function modeDetails(context) {
  return {
    interactive: context.interactive,
    isTty: context.isTty,
    json: context.json,
    quiet: context.quiet
  };
}
function isSuppressed(context, level) {
  return context.quiet && (level === "debug" || level === "info");
}
function sanitizeObject(value, depth) {
  const entries = Object.entries(value).slice(0, MAX_OBJECT_KEYS);
  return Object.fromEntries(entries.map(([key, item]) => [key, sanitizeValue(key, item, depth)]));
}
function sanitizeValue(key, value, depth) {
  if (isSensitiveKey(key)) {
    return REDACTED;
  }
  if (typeof value === "string") {
    return isPathKey(key) ? summarizePath(value) : truncate(value);
  }
  if (typeof value === "number" || typeof value === "boolean" || value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length <= 8 && value.every((item) => ["string", "number", "boolean"].includes(typeof item))) {
      return value.map((item, index) => sanitizeValue(`${key}.${index}`, item, depth + 1));
    }
    return {
      itemCount: value.length,
      items: value.slice(0, 8).map((item, index) => sanitizeValue(`${key}.${index}`, item, depth + 1))
    };
  }
  if (typeof value === "object") {
    if (depth >= 2) {
      return "[object]";
    }
    return sanitizeObject(value, depth + 1);
  }
  return String(value);
}
function isSensitiveKey(key) {
  return /token|secret|password|passwd|cookie|authorization|credential|storage.?state/i.test(key);
}
function isPathKey(key) {
  return /path|dir|directory|root|file/i.test(key);
}
function summarizePath(value) {
  const normalized = value.replaceAll("\\", sep2);
  const name = basename2(normalized);
  const parent = basename2(dirname4(normalized));
  return parent && parent !== "." ? `${parent}${sep2}${name}` : name;
}
function truncate(value) {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_STRING_LENGTH - 3)}...`;
}
function sanitizeDiagnosticMessage(value) {
  return truncate(value.replace(/(token|secret|password|passwd|cookie|authorization|credential)=([^&\s]+)/gi, "$1=[redacted]"));
}
function dropUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

// src/runtime/output.ts
var processOutput = {
  stdout: process.stdout,
  stderr: process.stderr
};
function writeJsonValue(output, value) {
  output.stdout.write(`${JSON.stringify(value)}
`);
}
function writeCommandError(context, output, error) {
  if (context.json) {
    writeJsonValue(output, {
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }
  output.stderr.write(`${error.message}
`);
}
function writeWarning(output, message) {
  output.stderr.write(`${message}
`);
}
function writeHumanStatus(context, output, message = "") {
  if (context.json || context.quiet) {
    return;
  }
  output.stdout.write(`${message}
`);
}

// src/runtime/command-diagnostics.ts
async function runObservedCliCommand(args, base, run, deps = {}) {
  const context = createCliContext(args, deps.isTty ? { isTty: deps.isTty } : undefined);
  const diagnostics = deps.diagnostics ?? createCliCommandDiagnostics(context, processOutput, base);
  let finalized = false;
  const scope = {
    context,
    complete: (input = {}) => {
      diagnostics.complete({
        ...input,
        exitCode: input.exitCode ?? numericProcessExitCode()
      });
      finalized = true;
    },
    fail: (error, input = {}) => {
      diagnostics.fail(error, input);
      finalized = true;
    }
  };
  try {
    await run(scope);
    if (!finalized) {
      scope.complete();
    }
  } catch (error) {
    if (!finalized) {
      scope.fail(toDiagnosticCliError(error));
    }
    throw error;
  }
}
function numericProcessExitCode() {
  return typeof process.exitCode === "number" ? process.exitCode : 0;
}
function toDiagnosticCliError(error) {
  if (isCliCommandError(error)) {
    return error;
  }
  return createCliError("invalid_option", error instanceof Error ? error.message : "command failed unexpectedly");
}

// src/command/codex.command.ts
var configArgs = {
  ...cliContractArgs,
  repoRoot: {
    type: "string",
    description: "Override the repository root"
  },
  home: {
    type: "string",
    description: "Override the home directory"
  },
  codexHome: {
    type: "string",
    description: "Override the local Codex home directory"
  },
  marketplace: {
    type: "string",
    description: "Override the personal marketplace.json path"
  },
  pluginsRoot: {
    type: "string",
    description: "Override the repository-managed codex/plugins directory"
  },
  cacheRoot: {
    type: "string",
    description: "Override the Codex personal plugin cache directory"
  }
};
var applyArgs = {
  ...configArgs,
  yes: {
    type: "boolean",
    description: "Confirm overwriting local Codex prompts and rules"
  }
};
function getStringArg(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
function createPaths(args) {
  return createCodexConfigPaths({
    repoRoot: getStringArg(args.repoRoot),
    homeRoot: getStringArg(args.home),
    codexHome: getStringArg(args.codexHome),
    marketplace: getStringArg(args.marketplace),
    pluginsRoot: getStringArg(args.pluginsRoot),
    cacheRoot: getStringArg(args.cacheRoot)
  });
}
function writeDetailedStatusHuman(comparison, paths, args) {
  const context = createCliContext(args);
  writeHumanStatus(context, processOutput, import_picocolors2.default.bold(import_picocolors2.default.cyan("Codex Status Details")));
  writeHumanStatus(context, processOutput, `local: ${paths.localCodexRoot}`);
  writeHumanStatus(context, processOutput, `repo:  ${paths.repoCodexRoot}`);
  writeHumanStatus(context, processOutput);
  writeHumanStatus(context, processOutput, import_picocolors2.default.bold("Area      Added  Removed  Modified  Unchanged"));
  for (const area of ["prompts", "rules"]) {
    const counts = comparison.areas[area].counts;
    writeHumanStatus(context, processOutput, `${area.padEnd(9)} ${formatCount(counts.added, "+")} ${formatCount(counts.removed, "-")} ${formatCount(counts.modified, "~")} ${formatCount(counts.unchanged, "=")}`);
  }
  for (const area of ["prompts", "rules"]) {
    writeAreaDiff(context, area, comparison.areas[area].files);
  }
  writeIntentSection(context, "Repository-owned assets not installed locally", [
    ["skills", comparison.missingRepoSkills],
    ["plugins", comparison.missingRepoPlugins]
  ]);
  writeRepoPluginStatusSection(context, comparison.repoPlugins);
  writeIntentSection(context, "Local backup intent not tracked", [
    ["skills", comparison.unmanagedSkills],
    ["plugins", comparison.unmanagedPlugins]
  ]);
  writeIntentSection(context, "Unsupported restore intent", [
    ["skills", comparison.unsupportedSkills],
    ["plugins", comparison.unsupportedPlugins]
  ]);
  writeIntentSection(context, "Unsafe repository content", [
    ["paths", comparison.unsafeRepoPaths]
  ]);
  const next = chooseNextHint(comparison);
  if (next) {
    writeHumanStatus(context, processOutput);
    writeHumanStatus(context, processOutput, import_picocolors2.default.bold("Next"));
    writeHumanStatus(context, processOutput, next);
  }
}
async function runComparison(args) {
  const paths = createPaths(args);
  const comparison = await compareCodexConfig(paths);
  const ok = comparison.unsafeRepoPaths.length === 0;
  if (args.json === true) {
    writeJsonValue(processOutput, {
      ok,
      command: "codex status",
      comparison
    });
  } else {
    writeDetailedStatusHuman(comparison, paths, args);
  }
  process.exitCode = ok ? 0 : 1;
}
var maxDiffPathsPerState = 5;
function formatCount(count, state) {
  const value = `${state}${count}`.padStart(7);
  if (count === 0) {
    return import_picocolors2.default.dim(value);
  }
  if (state === "+") {
    return import_picocolors2.default.green(value);
  }
  if (state === "-") {
    return import_picocolors2.default.red(value);
  }
  if (state === "~") {
    return import_picocolors2.default.yellow(value);
  }
  return import_picocolors2.default.dim(value);
}
function writeAreaDiff(context, area, files) {
  const rows = [
    ["+", "added", import_picocolors2.default.green],
    ["-", "removed", import_picocolors2.default.red],
    ["~", "modified", import_picocolors2.default.yellow]
  ];
  const hasChanges = rows.some(([, state]) => files[state].length > 0);
  if (!hasChanges) {
    return;
  }
  writeHumanStatus(context, processOutput);
  writeHumanStatus(context, processOutput, import_picocolors2.default.bold(area));
  for (const [prefix, state, color] of rows) {
    const paths = files[state];
    if (paths.length === 0) {
      continue;
    }
    for (const path of paths.slice(0, maxDiffPathsPerState)) {
      writeHumanStatus(context, processOutput, color(`${prefix} ${path}`));
    }
    const omitted = paths.length - maxDiffPathsPerState;
    if (omitted > 0) {
      writeHumanStatus(context, processOutput, import_picocolors2.default.dim(`... ${omitted} more ${state} paths`));
    }
  }
}
function writeIntentSection(context, title, rows) {
  const visible = rows.filter(([, values]) => values.length > 0);
  if (visible.length === 0) {
    return;
  }
  writeHumanStatus(context, processOutput);
  writeHumanStatus(context, processOutput, import_picocolors2.default.bold(title));
  for (const [label, values] of visible) {
    writeHumanStatus(context, processOutput, `${label}: ${values.join(", ")}`);
  }
}
function writeRepoPluginStatusSection(context, plugins) {
  if (plugins.length === 0) {
    return;
  }
  writeHumanStatus(context, processOutput);
  writeHumanStatus(context, processOutput, import_picocolors2.default.bold("Repository plugins"));
  for (const plugin of plugins) {
    writeHumanStatus(context, processOutput, `${plugin.name}: ${formatRepoPluginStatus(plugin.status)}`);
  }
}
function formatRepoPluginStatus(status) {
  if (status === "applied") {
    return import_picocolors2.default.green("applied");
  }
  if (status === "not_applied") {
    return import_picocolors2.default.yellow("not applied");
  }
  return import_picocolors2.default.dim("disabled");
}
function chooseNextHint(comparison) {
  if (comparison.missingRepoSkills.length > 0 || comparison.missingRepoPlugins.length > 0) {
    return "Next: run `chc codex install` to install repository-owned assets locally.";
  }
  const hasLocalOnlyChanges = ["prompts", "rules"].some((area) => {
    const files = comparison.areas[area].files;
    return files.added.length > 0 || files.modified.length > 0;
  });
  if (hasLocalOnlyChanges || comparison.unmanagedSkills.length > 0 || comparison.unmanagedPlugins.length > 0) {
    return "Next: run `chc codex export` after reviewing local changes.";
  }
  if (comparison.unsupportedSkills.length > 0 || comparison.unsupportedPlugins.length > 0) {
    return "Next: edit manifests or install unsupported entries manually.";
  }
  if (comparison.unsafeRepoPaths.length > 0) {
    return "Next: remove unsafe runtime state from repository codex/.";
  }
  return;
}
function writeManualInstallHint(context, result) {
  if (result.unsupportedSkills.length === 0 && result.unsupportedPlugins.length === 0) {
    return;
  }
  writeHumanStatus(context, processOutput);
  writeHumanStatus(context, processOutput, import_picocolors2.default.bold("Manual install needed"));
  if (result.unsupportedSkills.length > 0) {
    writeHumanStatus(context, processOutput, `skills: ${result.unsupportedSkills.join(", ")}`);
  }
  if (result.unsupportedPlugins.length > 0) {
    writeHumanStatus(context, processOutput, `plugins: ${result.unsupportedPlugins.join(", ")}`);
  }
}
function getApplyOverwritePaths(comparison) {
  return {
    prompts: [
      ...comparison.areas.prompts.files.added,
      ...comparison.areas.prompts.files.modified
    ].sort(),
    rules: [
      ...comparison.areas.rules.files.added,
      ...comparison.areas.rules.files.modified
    ].sort()
  };
}
function hasApplyOverwriteRisk(paths) {
  return paths.prompts.length > 0 || paths.rules.length > 0;
}
async function confirmApplyOverwrite(context, paths, args, fail) {
  if (!hasApplyOverwriteRisk(paths) || args.yes === true) {
    return true;
  }
  const error = createCliError("invalid_option", "codex apply would overwrite or delete local prompts/rules; rerun with --yes to confirm.");
  if (context.json || !context.interactive) {
    fail?.(error, { details: { phase: "confirmation" } });
    writeCommandError(context, processOutput, error);
    process.exitCode = error.exitCode;
    return false;
  }
  writeHumanStatus(context, processOutput, import_picocolors2.default.yellow(error.message));
  for (const area of ["prompts", "rules"]) {
    if (paths[area].length === 0) {
      continue;
    }
    writeHumanStatus(context, processOutput, import_picocolors2.default.bold(area));
    for (const path of paths[area].slice(0, maxDiffPathsPerState)) {
      writeHumanStatus(context, processOutput, import_picocolors2.default.yellow(`! ${path}`));
    }
    const omitted = paths[area].length - maxDiffPathsPerState;
    if (omitted > 0) {
      writeHumanStatus(context, processOutput, import_picocolors2.default.dim(`... ${omitted} more affected paths`));
    }
  }
  const answer = await ce2({
    message: "Overwrite local Codex prompts/rules from the repository?",
    initialValue: false
  });
  if (lD2(answer) || answer !== true) {
    const cancelError = createCliError("invalid_option", "codex apply cancelled.");
    fail?.(cancelError, { details: { phase: "confirmation" } });
    writeCommandError(context, processOutput, cancelError);
    process.exitCode = cancelError.exitCode;
    return false;
  }
  return true;
}
async function runObservedCodexSubcommand(subcommand, args, run) {
  await runObservedCliCommand(args, { command: "codex", subcommand }, run);
}
var codexCommand = defineCommand({
  meta: {
    name: "codex",
    description: "Manage reproducible Codex configuration."
  },
  subCommands: {
    status: defineCommand({
      meta: {
        name: "status",
        description: "Summarize local-versus-repository Codex config state."
      },
      args: configArgs,
      async run({ args }) {
        await runObservedCodexSubcommand("status", args, async () => {
          await runComparison(args);
        });
      }
    }),
    export: defineCommand({
      meta: {
        name: "export",
        description: "Export safe local Codex config into the repository."
      },
      args: configArgs,
      async run({ args }) {
        await runObservedCodexSubcommand("export", args, async ({ context }) => {
          const result = await exportCodexConfig(createPaths(args));
          if (context.json) {
            writeJsonValue(processOutput, {
              ok: true,
              command: "codex export",
              result
            });
          } else {
            writeHumanStatus(context, processOutput, import_picocolors2.default.cyan("Codex export"));
            writeHumanStatus(context, processOutput, `exported: ${result.exportedAreas.join(", ")}`);
          }
          process.exitCode = 0;
        });
      }
    }),
    apply: defineCommand({
      meta: {
        name: "apply",
        description: "Restore repository Codex config locally."
      },
      args: applyArgs,
      async run({ args }) {
        await runObservedCodexSubcommand("apply", args, async ({ context, fail }) => {
          const paths = createPaths(args);
          const comparison = await compareCodexConfig(paths);
          if (!await confirmApplyOverwrite(context, getApplyOverwritePaths(comparison), args, fail)) {
            return;
          }
          const result = await applyCodexConfig(paths);
          if (context.json) {
            writeJsonValue(processOutput, {
              ok: true,
              command: "codex apply",
              result
            });
          } else {
            writeHumanStatus(context, processOutput, import_picocolors2.default.cyan("Codex apply"));
            writeHumanStatus(context, processOutput, `applied: ${result.appliedAreas.join(", ")}`);
            writeManualInstallHint(context, result);
          }
          process.exitCode = 0;
        });
      }
    }),
    install: defineCommand({
      meta: {
        name: "install",
        description: "Install repository-owned Codex skills and plugins locally."
      },
      args: configArgs,
      async run({ args }) {
        await runObservedCodexSubcommand("install", args, async ({ context }) => {
          const result = await installCodexAssets(createPaths(args));
          if (context.json) {
            writeJsonValue(processOutput, {
              ok: true,
              command: "codex install",
              result
            });
          } else {
            writeHumanStatus(context, processOutput, import_picocolors2.default.cyan("Codex install"));
            writeHumanStatus(context, processOutput, `installed skills: ${result.installedSkills.join(", ") || "(none)"}`);
            writeHumanStatus(context, processOutput, `installed plugins: ${result.installedPlugins.map((plugin) => plugin.name).join(", ") || "(none)"}`);
            writeManualInstallHint(context, result);
          }
          process.exitCode = 0;
        });
      }
    })
  }
});

// src/command/completion.command.ts
import { execFile } from "node:child_process";
import { mkdir as mkdir3, readFile as readFile3, writeFile as writeFile3 } from "node:fs/promises";
import { homedir as homedir2, platform as platform2 } from "node:os";
import { dirname as dirname5, join as join3 } from "node:path";
import { promisify } from "node:util";

// src/domain/completion-candidates.ts
async function resolveValue2(value) {
  if (typeof value === "function") {
    return await value();
  }
  return await value;
}
function toKebabCase(value) {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}
async function getSubCommands(command) {
  const subCommands = await resolveValue2(command.subCommands);
  if (!subCommands) {
    return {};
  }
  const entries = await Promise.all(Object.entries(subCommands).map(async ([name, value]) => [
    name,
    await resolveValue2(value)
  ]));
  const publicNames = new Set(getCommandRegistrations(command)?.filter((registration) => registration.visibility === "public").map((registration) => registration.name));
  return Object.fromEntries(publicNames.size === 0 ? entries : entries.filter(([name]) => publicNames.has(name)));
}
async function getArgs(command) {
  return await resolveValue2(command.args) ?? {};
}
function isFlag(word) {
  return word.startsWith("-");
}
function isCompleteFlag(word) {
  return word.startsWith("--") && word.length > 2 && !word.includes("=");
}
function flagName(name, _arg) {
  return `--${toKebabCase(name)}`;
}
async function traverseCommand(rootCommand, completedWords) {
  let command = rootCommand;
  const path = [];
  let skipFlagValue = false;
  for (const word of completedWords) {
    if (skipFlagValue) {
      skipFlagValue = false;
      continue;
    }
    if (isFlag(word)) {
      const args = await getArgs(command);
      const arg = Object.entries(args).find(([name]) => flagName(name, args[name]) === word)?.[1];
      skipFlagValue = arg?.type === "string";
      continue;
    }
    const subCommands = await getSubCommands(command);
    const next = subCommands[word];
    if (!next) {
      return { command, path };
    }
    command = next;
    path.push(word);
  }
  return { command, path };
}
function filterByPrefix(candidates, prefix) {
  return [...new Set(candidates)].filter((candidate) => candidate.startsWith(prefix)).sort((a4, b4) => a4.localeCompare(b4));
}
async function getFlagCandidates(command, completedWords, prefix) {
  const args = await getArgs(command);
  const used = new Set(completedWords.filter(isCompleteFlag));
  const candidates = Object.entries(args).filter(([, arg]) => arg.type !== "positional").map(([name, arg]) => flagName(name, arg)).filter((candidate) => !used.has(candidate));
  return filterByPrefix(candidates, prefix);
}
async function getCompletionCandidates({
  rootCommand,
  words
}) {
  const currentWord = words.at(-1) ?? "";
  const completedWords = words.slice(0, -1);
  const state = await traverseCommand(rootCommand, completedWords);
  if (!state) {
    return [];
  }
  if (currentWord.startsWith("-")) {
    return getFlagCandidates(state.command, completedWords, currentWord);
  }
  const positionalCandidates = getPositionalCandidateProvider(state.command);
  const subCommands = await getSubCommands(state.command);
  const dynamicCandidates = positionalCandidates ? await positionalCandidates({
    currentWord,
    completedWords,
    path: state.path
  }) : [];
  const staticCandidates = completedWords.length === state.path.length ? Object.keys(subCommands) : [];
  return filterByPrefix([...staticCandidates, ...dynamicCandidates], currentWord);
}

// src/command/completion.command.ts
var supportedCompletionShells = ["powershell", "zsh"];
var emptyCompletionWord = "__cthutool_empty_completion_word__";
var powershellProfileEnv = "CHC_COMPLETION_POWERSHELL_PROFILE";
var zshProfileEnv = "CHC_COMPLETION_ZSH_PROFILE";
var powershellCompletionLoadLine = "chc completion powershell | Out-String | Invoke-Expression";
var powershellCompletionReloadHint = `Restart PowerShell to load it, or run: ${powershellCompletionLoadLine}`;
var legacyPowerShellCompletionComment = "# CthuTool CLI completion";
var completionStartMarker = "# >>> cthutool chc completion >>>";
var completionEndMarker = "# <<< cthutool chc completion <<<";
var powershellCompletionBlock = `${completionStartMarker}
${powershellCompletionLoadLine}
${completionEndMarker}`;
var zshCompletionLoadLine = "source <(chc completion zsh)";
var zshCompletionBlock = `${completionStartMarker}
if (( ! $+functions[compdef] )); then
  autoload -Uz compinit
  compinit
fi
${zshCompletionLoadLine}
${completionEndMarker}`;
var execFileAsync = promisify(execFile);
var powershellScript = `Register-ArgumentCompleter -Native -CommandName chc -ScriptBlock {
  param($wordToComplete, $commandAst, $cursorPosition)
  $words = @($commandAst.CommandElements | Select-Object -Skip 1 | ForEach-Object { $_.Extent.Text })
  if ($words.Count -eq 0 -or $words[-1] -ne $wordToComplete) {
    if ($wordToComplete -eq '') {
      $words += '__cthutool_empty_completion_word__'
    } else {
      $words += $wordToComplete
    }
  }
  chc __complete @words | ForEach-Object {
    $completionText = if ($_.StartsWith('-')) { $_ } else { "$_ " }
    [System.Management.Automation.CompletionResult]::new($completionText, $_, 'ParameterValue', $_)
  }
}
`;
var zshScript = `#compdef chc
_chc_completion() {
  local -a candidates
  candidates=("\${(@f)$(chc __complete "\${words[@]:1}")}")
  compadd -- "\${candidates[@]}"
}
compdef _chc_completion chc
`;
var completionShellScripts = {
  powershell: powershellScript,
  zsh: zshScript
};
function isCompletionShell(value) {
  return supportedCompletionShells.some((shell) => shell === value);
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function removeManagedCompletionBlock(content) {
  const pattern = new RegExp(`${escapeRegExp(completionStartMarker)}\\r?\\n[\\s\\S]*?\\r?\\n${escapeRegExp(completionEndMarker)}\\r?\\n?`, "g");
  const nextContent = content.replace(pattern, "");
  return { content: nextContent, removed: nextContent !== content };
}
function removeLegacyCompletionBlock(content) {
  const legacyBlockPattern = new RegExp(`${escapeRegExp(legacyPowerShellCompletionComment)}\\r?\\n${escapeRegExp(powershellCompletionLoadLine)}\\r?\\n?`, "g");
  return content.replace(legacyBlockPattern, "");
}
function removeLegacyZshCompletionLine(content) {
  const legacyLinePattern = new RegExp(`^${escapeRegExp(zshCompletionLoadLine)}\\r?\\n?`, "gm");
  return content.replace(legacyLinePattern, "");
}
async function readTextIfExists(path) {
  try {
    return await readFile3(path, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return "";
    }
    throw error;
  }
}
async function resolvePowerShellProfilePath() {
  const override = process.env[powershellProfileEnv]?.trim();
  if (override) {
    return override;
  }
  for (const executable of ["pwsh", "powershell"]) {
    try {
      const { stdout: stdout2 } = await execFileAsync(executable, [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "$PROFILE.CurrentUserCurrentHost"
      ]);
      const profilePath = stdout2.trim();
      if (profilePath.length > 0) {
        return profilePath;
      }
    } catch {}
  }
  if (platform2() === "win32") {
    return join3(process.env.USERPROFILE || homedir2(), "Documents", "PowerShell", "Microsoft.PowerShell_profile.ps1");
  }
  return join3(homedir2(), ".config", "powershell", "Microsoft.PowerShell_profile.ps1");
}
function resolveZshProfilePath() {
  const override = process.env[zshProfileEnv]?.trim();
  if (override) {
    return override;
  }
  const zdotdir = process.env.ZDOTDIR?.trim();
  return join3(zdotdir || homedir2(), ".zshrc");
}
async function handlePowerShellProfileAction(action) {
  const profilePath = await resolvePowerShellProfilePath();
  const content = await readTextIfExists(profilePath);
  const installed = content.includes(completionStartMarker) && content.includes(completionEndMarker);
  if (action === "status") {
    process.stdout.write(`PowerShell completion ${installed ? "enabled" : "disabled"}: ${profilePath}
`);
    if (installed) {
      process.stdout.write(`${powershellCompletionReloadHint}
`);
    }
    process.exitCode = 0;
    return;
  }
  if (action === "disable") {
    const cleaned2 = removeManagedCompletionBlock(content);
    if (cleaned2.removed) {
      await writeFile3(profilePath, cleaned2.content);
    }
    process.stdout.write(`PowerShell completion disabled: ${profilePath}
`);
    process.exitCode = 0;
    return;
  }
  const cleaned = removeManagedCompletionBlock(content);
  const migratedContent = removeLegacyCompletionBlock(cleaned.content);
  const prefix = migratedContent.length === 0 || migratedContent.endsWith(`
`) ? migratedContent : `${migratedContent}
`;
  await mkdir3(dirname5(profilePath), { recursive: true });
  await writeFile3(profilePath, `${prefix}${powershellCompletionBlock}
`);
  process.stdout.write(`PowerShell completion ${installed ? "already enabled" : "enabled"}: ${profilePath}
`);
  process.stdout.write(`${powershellCompletionReloadHint}
`);
  process.exitCode = 0;
}
async function handleZshProfileAction(action) {
  const profilePath = resolveZshProfilePath();
  const content = await readTextIfExists(profilePath);
  const installed = content.includes(completionStartMarker) && content.includes(completionEndMarker);
  const reloadHint = `Restart zsh to load it, or run: source ${profilePath}`;
  if (action === "status") {
    process.stdout.write(`zsh completion ${installed ? "enabled" : "disabled"}: ${profilePath}
`);
    if (installed) {
      process.stdout.write(`${reloadHint}
`);
    }
    process.exitCode = 0;
    return;
  }
  if (action === "disable") {
    const cleaned2 = removeManagedCompletionBlock(content);
    if (cleaned2.removed) {
      await writeFile3(profilePath, cleaned2.content);
    }
    process.stdout.write(`zsh completion disabled: ${profilePath}
`);
    process.exitCode = 0;
    return;
  }
  const cleaned = removeManagedCompletionBlock(content);
  const migratedContent = removeLegacyZshCompletionLine(cleaned.content);
  const prefix = migratedContent.length === 0 || migratedContent.endsWith(`
`) ? migratedContent : `${migratedContent}
`;
  await mkdir3(dirname5(profilePath), { recursive: true });
  await writeFile3(profilePath, `${prefix}${zshCompletionBlock}
`);
  process.stdout.write(`zsh completion ${installed ? "already enabled" : "enabled"}: ${profilePath}
`);
  process.stdout.write(`${reloadHint}
`);
  process.exitCode = 0;
}
function createCompletionShellCommand(shell) {
  return defineCommand({
    meta: {
      name: shell,
      description: `Print the ${shell} completion adapter.`
    },
    async run({ args }) {
      await runObservedCliCommand(args, { command: "completion", subcommand: shell }, async () => {
        process.stdout.write(completionShellScripts[shell]);
        process.exitCode = 0;
      });
    }
  });
}
function createCompletionProfileCommand(action) {
  const command = defineCommand({
    meta: {
      name: action,
      description: `${action[0]?.toUpperCase()}${action.slice(1)} persistent shell completion.`
    },
    args: {
      shell: {
        type: "positional",
        description: "Shell profile to manage (powershell or zsh)",
        required: true
      }
    },
    async run({ args }) {
      await runObservedCliCommand(args, { command: "completion", subcommand: action }, async ({ fail }) => {
        const shell = typeof args.shell === "string" ? args.shell : "";
        if (!isCompletionShell(shell)) {
          const error = createCliError("invalid_option", `unsupported managed completion shell: ${shell || "<missing>"}`);
          fail(error, { details: { action, shell } });
          process.stderr.write(`${error.message}
`);
          process.exitCode = error.exitCode;
          return;
        }
        try {
          if (shell === "powershell") {
            await handlePowerShellProfileAction(action);
          } else {
            await handleZshProfileAction(action);
          }
        } catch (error) {
          const cliError = createCliError("invalid_option", error instanceof Error ? error.message : String(error));
          fail(cliError, { details: { action, shell } });
          process.stderr.write(`${cliError.message}
`);
          process.exitCode = cliError.exitCode;
        }
      });
    }
  });
  return registerPositionalCandidates(command, ({ completedWords, path }) => completedWords.length === path.length ? supportedCompletionShells : []);
}
function createCompletionCommand() {
  const registrations = [
    ...supportedCompletionShells.map((shell) => ({
      name: shell,
      command: createCompletionShellCommand(shell),
      visibility: "public",
      bareBehavior: "run"
    })),
    ...["enable", "disable", "status"].map((action) => ({
      name: action,
      command: createCompletionProfileCommand(action),
      visibility: "public",
      bareBehavior: "run"
    }))
  ];
  return registerCommandGroup(defineCommand({
    meta: {
      name: "completion",
      description: "Print or manage shell completion setup."
    },
    subCommands: buildRegisteredSubCommands(registrations)
  }), registrations);
}
function createInternalCompleteCommand(resolveRootCommand) {
  return defineCommand({
    meta: {
      name: "__complete",
      description: "Internal shell completion protocol."
    },
    async run({ rawArgs }) {
      try {
        const words = rawArgs.map((word) => word === emptyCompletionWord ? "" : word);
        const candidates = await getCompletionCandidates({
          rootCommand: resolveRootCommand(),
          words
        });
        if (candidates.length > 0) {
          process.stdout.write(`${candidates.join(`
`)}
`);
        }
        process.exitCode = 0;
      } catch {
        process.exitCode = 0;
      }
    }
  });
}

// src/command/run-scripts.command.ts
var import_picocolors4 = __toESM(require_picocolors(), 1);

// ../../node_modules/.pnpm/neverthrow@8.2.0/node_modules/neverthrow/dist/index.cjs.js
var defaultErrorConfig = {
  withStackTrace: false
};
var createNeverThrowError = (message, result, config = defaultErrorConfig) => {
  const data = result.isOk() ? { type: "Ok", value: result.value } : { type: "Err", value: result.error };
  const maybeStack = config.withStackTrace ? new Error().stack : undefined;
  return {
    data,
    message,
    stack: maybeStack
  };
};
function __awaiter(thisArg, _arguments, P5, generator) {
  function adopt(value) {
    return value instanceof P5 ? value : new P5(function(resolve4) {
      resolve4(value);
    });
  }
  return new (P5 || (P5 = Promise))(function(resolve4, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e3) {
        reject(e3);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e3) {
        reject(e3);
      }
    }
    function step(result) {
      result.done ? resolve4(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __values(o3) {
  var s2 = typeof Symbol === "function" && Symbol.iterator, m3 = s2 && o3[s2], i2 = 0;
  if (m3)
    return m3.call(o3);
  if (o3 && typeof o3.length === "number")
    return {
      next: function() {
        if (o3 && i2 >= o3.length)
          o3 = undefined;
        return { value: o3 && o3[i2++], done: !o3 };
      }
    };
  throw new TypeError(s2 ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __await(v3) {
  return this instanceof __await ? (this.v = v3, this) : new __await(v3);
}
function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator)
    throw new TypeError("Symbol.asyncIterator is not defined.");
  var g4 = generator.apply(thisArg, _arguments || []), i2, q3 = [];
  return i2 = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i2[Symbol.asyncIterator] = function() {
    return this;
  }, i2;
  function awaitReturn(f4) {
    return function(v3) {
      return Promise.resolve(v3).then(f4, reject);
    };
  }
  function verb(n2, f4) {
    if (g4[n2]) {
      i2[n2] = function(v3) {
        return new Promise(function(a4, b4) {
          q3.push([n2, v3, a4, b4]) > 1 || resume(n2, v3);
        });
      };
      if (f4)
        i2[n2] = f4(i2[n2]);
    }
  }
  function resume(n2, v3) {
    try {
      step(g4[n2](v3));
    } catch (e3) {
      settle(q3[0][3], e3);
    }
  }
  function step(r4) {
    r4.value instanceof __await ? Promise.resolve(r4.value.v).then(fulfill, reject) : settle(q3[0][2], r4);
  }
  function fulfill(value) {
    resume("next", value);
  }
  function reject(value) {
    resume("throw", value);
  }
  function settle(f4, v3) {
    if (f4(v3), q3.shift(), q3.length)
      resume(q3[0][0], q3[0][1]);
  }
}
function __asyncDelegator(o3) {
  var i2, p;
  return i2 = {}, verb("next"), verb("throw", function(e3) {
    throw e3;
  }), verb("return"), i2[Symbol.iterator] = function() {
    return this;
  }, i2;
  function verb(n2, f4) {
    i2[n2] = o3[n2] ? function(v3) {
      return (p = !p) ? { value: __await(o3[n2](v3)), done: false } : f4 ? f4(v3) : v3;
    } : f4;
  }
}
function __asyncValues(o3) {
  if (!Symbol.asyncIterator)
    throw new TypeError("Symbol.asyncIterator is not defined.");
  var m3 = o3[Symbol.asyncIterator], i2;
  return m3 ? m3.call(o3) : (o3 = typeof __values === "function" ? __values(o3) : o3[Symbol.iterator](), i2 = {}, verb("next"), verb("throw"), verb("return"), i2[Symbol.asyncIterator] = function() {
    return this;
  }, i2);
  function verb(n2) {
    i2[n2] = o3[n2] && function(v3) {
      return new Promise(function(resolve4, reject) {
        v3 = o3[n2](v3), settle(resolve4, reject, v3.done, v3.value);
      });
    };
  }
  function settle(resolve4, reject, d3, v3) {
    Promise.resolve(v3).then(function(v4) {
      resolve4({ value: v4, done: d3 });
    }, reject);
  }
}
class ResultAsync {
  constructor(res) {
    this._promise = res;
  }
  static fromSafePromise(promise) {
    const newPromise = promise.then((value) => new Ok(value));
    return new ResultAsync(newPromise);
  }
  static fromPromise(promise, errorFn) {
    const newPromise = promise.then((value) => new Ok(value)).catch((e3) => new Err(errorFn(e3)));
    return new ResultAsync(newPromise);
  }
  static fromThrowable(fn, errorFn) {
    return (...args) => {
      return new ResultAsync((() => __awaiter(this, undefined, undefined, function* () {
        try {
          return new Ok(yield fn(...args));
        } catch (error) {
          return new Err(errorFn ? errorFn(error) : error);
        }
      }))());
    };
  }
  static combine(asyncResultList) {
    return combineResultAsyncList(asyncResultList);
  }
  static combineWithAllErrors(asyncResultList) {
    return combineResultAsyncListWithAllErrors(asyncResultList);
  }
  map(f4) {
    return new ResultAsync(this._promise.then((res) => __awaiter(this, undefined, undefined, function* () {
      if (res.isErr()) {
        return new Err(res.error);
      }
      return new Ok(yield f4(res.value));
    })));
  }
  andThrough(f4) {
    return new ResultAsync(this._promise.then((res) => __awaiter(this, undefined, undefined, function* () {
      if (res.isErr()) {
        return new Err(res.error);
      }
      const newRes = yield f4(res.value);
      if (newRes.isErr()) {
        return new Err(newRes.error);
      }
      return new Ok(res.value);
    })));
  }
  andTee(f4) {
    return new ResultAsync(this._promise.then((res) => __awaiter(this, undefined, undefined, function* () {
      if (res.isErr()) {
        return new Err(res.error);
      }
      try {
        yield f4(res.value);
      } catch (e3) {}
      return new Ok(res.value);
    })));
  }
  orTee(f4) {
    return new ResultAsync(this._promise.then((res) => __awaiter(this, undefined, undefined, function* () {
      if (res.isOk()) {
        return new Ok(res.value);
      }
      try {
        yield f4(res.error);
      } catch (e3) {}
      return new Err(res.error);
    })));
  }
  mapErr(f4) {
    return new ResultAsync(this._promise.then((res) => __awaiter(this, undefined, undefined, function* () {
      if (res.isOk()) {
        return new Ok(res.value);
      }
      return new Err(yield f4(res.error));
    })));
  }
  andThen(f4) {
    return new ResultAsync(this._promise.then((res) => {
      if (res.isErr()) {
        return new Err(res.error);
      }
      const newValue = f4(res.value);
      return newValue instanceof ResultAsync ? newValue._promise : newValue;
    }));
  }
  orElse(f4) {
    return new ResultAsync(this._promise.then((res) => __awaiter(this, undefined, undefined, function* () {
      if (res.isErr()) {
        return f4(res.error);
      }
      return new Ok(res.value);
    })));
  }
  match(ok, _err) {
    return this._promise.then((res) => res.match(ok, _err));
  }
  unwrapOr(t2) {
    return this._promise.then((res) => res.unwrapOr(t2));
  }
  safeUnwrap() {
    return __asyncGenerator(this, arguments, function* safeUnwrap_1() {
      return yield __await(yield __await(yield* __asyncDelegator(__asyncValues(yield __await(this._promise.then((res) => res.safeUnwrap()))))));
    });
  }
  then(successCallback, failureCallback) {
    return this._promise.then(successCallback, failureCallback);
  }
  [Symbol.asyncIterator]() {
    return __asyncGenerator(this, arguments, function* _a() {
      const result = yield __await(this._promise);
      if (result.isErr()) {
        yield yield __await(errAsync(result.error));
      }
      return yield __await(result.value);
    });
  }
}
function errAsync(err) {
  return new ResultAsync(Promise.resolve(new Err(err)));
}
var fromPromise = ResultAsync.fromPromise;
var fromSafePromise = ResultAsync.fromSafePromise;
var fromAsyncThrowable = ResultAsync.fromThrowable;
var combineResultList = (resultList) => {
  let acc = ok([]);
  for (const result of resultList) {
    if (result.isErr()) {
      acc = err(result.error);
      break;
    } else {
      acc.map((list) => list.push(result.value));
    }
  }
  return acc;
};
var combineResultAsyncList = (asyncResultList) => ResultAsync.fromSafePromise(Promise.all(asyncResultList)).andThen(combineResultList);
var combineResultListWithAllErrors = (resultList) => {
  let acc = ok([]);
  for (const result of resultList) {
    if (result.isErr() && acc.isErr()) {
      acc.error.push(result.error);
    } else if (result.isErr() && acc.isOk()) {
      acc = err([result.error]);
    } else if (result.isOk() && acc.isOk()) {
      acc.value.push(result.value);
    }
  }
  return acc;
};
var combineResultAsyncListWithAllErrors = (asyncResultList) => ResultAsync.fromSafePromise(Promise.all(asyncResultList)).andThen(combineResultListWithAllErrors);
var $Result = undefined;
(function(Result) {
  function fromThrowable(fn, errorFn) {
    return (...args) => {
      try {
        const result = fn(...args);
        return ok(result);
      } catch (e3) {
        return err(errorFn ? errorFn(e3) : e3);
      }
    };
  }
  Result.fromThrowable = fromThrowable;
  function combine(resultList) {
    return combineResultList(resultList);
  }
  Result.combine = combine;
  function combineWithAllErrors(resultList) {
    return combineResultListWithAllErrors(resultList);
  }
  Result.combineWithAllErrors = combineWithAllErrors;
})($Result || ($Result = {}));
function ok(value) {
  return new Ok(value);
}
function err(err2) {
  return new Err(err2);
}
class Ok {
  constructor(value) {
    this.value = value;
  }
  isOk() {
    return true;
  }
  isErr() {
    return !this.isOk();
  }
  map(f4) {
    return ok(f4(this.value));
  }
  mapErr(_f) {
    return ok(this.value);
  }
  andThen(f4) {
    return f4(this.value);
  }
  andThrough(f4) {
    return f4(this.value).map((_value) => this.value);
  }
  andTee(f4) {
    try {
      f4(this.value);
    } catch (e3) {}
    return ok(this.value);
  }
  orTee(_f) {
    return ok(this.value);
  }
  orElse(_f) {
    return ok(this.value);
  }
  asyncAndThen(f4) {
    return f4(this.value);
  }
  asyncAndThrough(f4) {
    return f4(this.value).map(() => this.value);
  }
  asyncMap(f4) {
    return ResultAsync.fromSafePromise(f4(this.value));
  }
  unwrapOr(_v) {
    return this.value;
  }
  match(ok2, _err) {
    return ok2(this.value);
  }
  safeUnwrap() {
    const value = this.value;
    return function* () {
      return value;
    }();
  }
  _unsafeUnwrap(_5) {
    return this.value;
  }
  _unsafeUnwrapErr(config) {
    throw createNeverThrowError("Called `_unsafeUnwrapErr` on an Ok", this, config);
  }
  *[Symbol.iterator]() {
    return this.value;
  }
}

class Err {
  constructor(error) {
    this.error = error;
  }
  isOk() {
    return false;
  }
  isErr() {
    return !this.isOk();
  }
  map(_f) {
    return err(this.error);
  }
  mapErr(f4) {
    return err(f4(this.error));
  }
  andThrough(_f) {
    return err(this.error);
  }
  andTee(_f) {
    return err(this.error);
  }
  orTee(f4) {
    try {
      f4(this.error);
    } catch (e3) {}
    return err(this.error);
  }
  andThen(_f) {
    return err(this.error);
  }
  orElse(f4) {
    return f4(this.error);
  }
  asyncAndThen(_f) {
    return errAsync(this.error);
  }
  asyncAndThrough(_f) {
    return errAsync(this.error);
  }
  asyncMap(_f) {
    return errAsync(this.error);
  }
  unwrapOr(v3) {
    return v3;
  }
  match(_ok, err2) {
    return err2(this.error);
  }
  safeUnwrap() {
    const error = this.error;
    return function* () {
      yield err(error);
      throw new Error("Do not use this generator out of `safeTry`");
    }();
  }
  _unsafeUnwrap(config) {
    throw createNeverThrowError("Called `_unsafeUnwrap` on an Err", this, config);
  }
  _unsafeUnwrapErr(_5) {
    return this.error;
  }
  *[Symbol.iterator]() {
    const self = this;
    yield self;
    return self;
  }
}
var fromThrowable = $Result.fromThrowable;
var $ResultAsync = ResultAsync;
var $err = err;
var $errAsync = errAsync;
var $ok = ok;

// src/domain/script-catalog.ts
var ENTRY_FILE = "index.ts";
var listSelectable = (catalog) => [...catalog.packages].sort((a4, b4) => a4.id.localeCompare(b4.id)).map((p) => ({
  id: p.id,
  title: p.manifest.title,
  description: p.manifest.description
}));
var resolvePackage = (catalog, id) => {
  const matches = catalog.packages.filter((p) => p.id === id);
  if (matches.length === 0) {
    return $err({ kind: "not_found", id });
  }
  if (matches.length > 1) {
    return $err({ kind: "ambiguous", id });
  }
  const [first] = matches;
  return $ok(first);
};

// src/flow/run-bundled-script.ts
import { join as join4 } from "node:path";
import { pathToFileURL } from "node:url";
function runBundledScript(pkg, args, context) {
  const entryPath = join4(pkg.rootPath, pkg.entryRelative);
  const href = pathToFileURL(entryPath).href;
  const startedAt = Date.now();
  const diagnostics = context.diagnostics?.child({ scriptId: pkg.id });
  diagnostics?.emit({
    level: "info",
    event: "cli.script_started",
    phase: "start",
    scriptId: pkg.id,
    details: {
      entryPath,
      scriptArgs: summarizeScriptArgs(args)
    }
  });
  return $ResultAsync.fromPromise(import(href), (e3) => ({
    kind: "load",
    message: e3 instanceof Error ? e3.message : String(e3)
  })).andThen((mod) => {
    const fn = mod.default;
    if (typeof fn !== "function") {
      return $errAsync({
        kind: "no_default_export",
        message: "script entry must default-export a function (see script-package contract)"
      });
    }
    const run = fn;
    return $ResultAsync.fromPromise(Promise.resolve(run(args, context)), (e3) => {
      if (isCliCommandError(e3)) {
        return {
          kind: "execution",
          message: e3.message,
          cliError: e3
        };
      }
      return {
        kind: "execution",
        message: e3 instanceof Error ? e3.message : String(e3)
      };
    });
  }).map(() => {
    diagnostics?.emit({
      level: "info",
      event: "cli.script_completed",
      phase: "complete",
      scriptId: pkg.id,
      durationMs: Math.max(0, Date.now() - startedAt)
    });
    return;
  }).mapErr((error) => {
    if (error.kind === "execution" && error.cliError) {
      diagnostics?.emit({
        level: "error",
        event: "cli.script_failed",
        phase: "execution",
        scriptId: pkg.id,
        durationMs: Math.max(0, Date.now() - startedAt),
        exitCode: error.cliError.exitCode,
        errorCode: error.cliError.code,
        message: error.cliError.message,
        details: { scriptArgs: summarizeScriptArgs(args) }
      });
      return error;
    }
    diagnostics?.emit({
      level: "error",
      event: "cli.script_failed",
      phase: error.kind,
      scriptId: pkg.id,
      durationMs: Math.max(0, Date.now() - startedAt),
      message: error.message,
      details: { scriptArgs: summarizeScriptArgs(args) }
    });
    return error;
  });
}

// src/infra/bundled-script-catalog.ts
var import_picocolors3 = __toESM(require_picocolors(), 1);

// src/infra/bundled-scripts-root.ts
import { existsSync as existsSync2 } from "node:fs";
import { dirname as dirname6, join as join5 } from "node:path";
import { fileURLToPath } from "node:url";
function getBundledScriptsRoot() {
  const moduleDir = dirname6(fileURLToPath(import.meta.url));
  const candidates = [
    join5(moduleDir, "../scripts"),
    join5(moduleDir, "../src/scripts")
  ];
  return candidates.find((candidate) => existsSync2(candidate)) ?? candidates[0];
}

// src/infra/discover-scripts.ts
import { readdir as readdir3, readFile as readFile4, stat as stat2 } from "node:fs/promises";
import { join as join6 } from "node:path";

// src/domain/script-id.ts
var KEBAB_CASE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var normalizeScriptId = (raw) => raw.trim();
var validateScriptId = (raw) => {
  const id = normalizeScriptId(raw);
  if (id.length === 0) {
    return $err({ message: "script id cannot be empty" });
  }
  if (!KEBAB_CASE_RE.test(id)) {
    return $err({
      message: "script id must be kebab-case (lowercase letters, digits, single hyphens between segments)"
    });
  }
  return $ok(id);
};

// ../../node_modules/.pnpm/valibot@1.3.1_typescript@6.0.3/node_modules/valibot/dist/index.mjs
var store$4;
function getGlobalConfig(config$1) {
  return {
    lang: config$1?.lang ?? store$4?.lang,
    message: config$1?.message,
    abortEarly: config$1?.abortEarly ?? store$4?.abortEarly,
    abortPipeEarly: config$1?.abortPipeEarly ?? store$4?.abortPipeEarly
  };
}
var store$3;
function getGlobalMessage(lang) {
  return store$3?.get(lang);
}
var store$2;
function getSchemaMessage(lang) {
  return store$2?.get(lang);
}
var store$1;
function getSpecificMessage(reference, lang) {
  return store$1?.get(reference)?.get(lang);
}
function _stringify(input) {
  const type = typeof input;
  if (type === "string")
    return `"${input}"`;
  if (type === "number" || type === "bigint" || type === "boolean")
    return `${input}`;
  if (type === "object" || type === "function")
    return (input && Object.getPrototypeOf(input)?.constructor?.name) ?? "null";
  return type;
}
function _addIssue(context, label, dataset, config$1, other) {
  const input = other && "input" in other ? other.input : dataset.value;
  const expected = other?.expected ?? context.expects ?? null;
  const received = other?.received ?? /* @__PURE__ */ _stringify(input);
  const issue = {
    kind: context.kind,
    type: context.type,
    input,
    expected,
    received,
    message: `Invalid ${label}: ${expected ? `Expected ${expected} but r` : "R"}eceived ${received}`,
    requirement: context.requirement,
    path: other?.path,
    issues: other?.issues,
    lang: config$1.lang,
    abortEarly: config$1.abortEarly,
    abortPipeEarly: config$1.abortPipeEarly
  };
  const isSchema = context.kind === "schema";
  const message$1 = other?.message ?? context.message ?? /* @__PURE__ */ getSpecificMessage(context.reference, issue.lang) ?? (isSchema ? /* @__PURE__ */ getSchemaMessage(issue.lang) : null) ?? config$1.message ?? /* @__PURE__ */ getGlobalMessage(issue.lang);
  if (message$1 !== undefined)
    issue.message = typeof message$1 === "function" ? message$1(issue) : message$1;
  if (isSchema)
    dataset.typed = false;
  if (dataset.issues)
    dataset.issues.push(issue);
  else
    dataset.issues = [issue];
}
function _getStandardProps(context) {
  return {
    version: 1,
    vendor: "valibot",
    validate(value$1) {
      return context["~run"]({ value: value$1 }, /* @__PURE__ */ getGlobalConfig());
    }
  };
}
function minLength(requirement, message$1) {
  return {
    kind: "validation",
    type: "min_length",
    reference: minLength,
    async: false,
    expects: `>=${requirement}`,
    requirement,
    message: message$1,
    "~run"(dataset, config$1) {
      if (dataset.typed && dataset.value.length < this.requirement)
        _addIssue(this, "length", dataset, config$1, { received: `${dataset.value.length}` });
      return dataset;
    }
  };
}
var _LruCache = class {
  constructor(config$1) {
    this.refCount = 0;
    this.maxSize = config$1?.maxSize ?? 1000;
    this.maxAge = config$1?.maxAge ?? Infinity;
    this.hasMaxAge = isFinite(this.maxAge);
  }
  #stringify(input) {
    const type = typeof input;
    if (type === "string")
      return `"${input}"`;
    if (type === "number" || type === "boolean")
      return `${input}`;
    if (type === "bigint")
      return `${input}n`;
    if (type === "object" || type === "function") {
      if (input) {
        this.refIds ??= /* @__PURE__ */ new WeakMap;
        let id = this.refIds.get(input);
        if (!id) {
          id = ++this.refCount;
          this.refIds.set(input, id);
        }
        return `#${id}`;
      }
      return "null";
    }
    return type;
  }
  key(input, config$1 = {}) {
    return `${this.#stringify(input)}|${this.#stringify(config$1.lang)}|${this.#stringify(config$1.message)}|${this.#stringify(config$1.abortEarly)}|${this.#stringify(config$1.abortPipeEarly)}`;
  }
  get(key) {
    if (!this.store)
      return;
    const entry = this.store.get(key);
    if (!entry)
      return;
    if (this.hasMaxAge && Date.now() - entry[1] > this.maxAge) {
      this.store.delete(key);
      return;
    }
    this.store.delete(key);
    this.store.set(key, entry);
    return entry[0];
  }
  set(key, value$1) {
    this.store ??= /* @__PURE__ */ new Map;
    this.store.delete(key);
    const timestamp = this.hasMaxAge ? Date.now() : 0;
    this.store.set(key, [value$1, timestamp]);
    if (this.store.size > this.maxSize)
      this.store.delete(this.store.keys().next().value);
  }
  clear() {
    this.store?.clear();
  }
};
function getFallback(schema, dataset, config$1) {
  return typeof schema.fallback === "function" ? schema.fallback(dataset, config$1) : schema.fallback;
}
function getDefault(schema, dataset, config$1) {
  return typeof schema.default === "function" ? schema.default(dataset, config$1) : schema.default;
}
function object(entries$1, message$1) {
  return {
    kind: "schema",
    type: "object",
    reference: object,
    expects: "Object",
    async: false,
    entries: entries$1,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      const input = dataset.value;
      if (input && typeof input === "object") {
        dataset.typed = true;
        dataset.value = {};
        for (const key in this.entries) {
          const valueSchema = this.entries[key];
          if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== undefined) {
            const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
            const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
            if (valueDataset.issues) {
              const pathItem = {
                type: "object",
                origin: "value",
                input,
                key,
                value: value$1
              };
              for (const issue of valueDataset.issues) {
                if (issue.path)
                  issue.path.unshift(pathItem);
                else
                  issue.path = [pathItem];
                dataset.issues?.push(issue);
              }
              if (!dataset.issues)
                dataset.issues = valueDataset.issues;
              if (config$1.abortEarly) {
                dataset.typed = false;
                break;
              }
            }
            if (!valueDataset.typed)
              dataset.typed = false;
            dataset.value[key] = valueDataset.value;
          } else if (valueSchema.fallback !== undefined)
            dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
          else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
            _addIssue(this, "key", dataset, config$1, {
              input: undefined,
              expected: `"${key}"`,
              path: [{
                type: "object",
                origin: "key",
                input,
                key,
                value: input[key]
              }]
            });
            if (config$1.abortEarly)
              break;
          }
        }
      } else
        _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
function optional(wrapped, default_) {
  return {
    kind: "schema",
    type: "optional",
    reference: optional,
    expects: `(${wrapped.expects} | undefined)`,
    async: false,
    wrapped,
    default: default_,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (dataset.value === undefined) {
        if (this.default !== undefined)
          dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
        if (dataset.value === undefined) {
          dataset.typed = true;
          return dataset;
        }
      }
      return this.wrapped["~run"](dataset, config$1);
    }
  };
}
function string(message$1) {
  return {
    kind: "schema",
    type: "string",
    reference: string,
    expects: "string",
    async: false,
    message: message$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      if (typeof dataset.value === "string")
        dataset.typed = true;
      else
        _addIssue(this, "type", dataset, config$1);
      return dataset;
    }
  };
}
function pipe(...pipe$1) {
  return {
    ...pipe$1[0],
    pipe: pipe$1,
    get "~standard"() {
      return /* @__PURE__ */ _getStandardProps(this);
    },
    "~run"(dataset, config$1) {
      for (const item of pipe$1)
        if (item.kind !== "metadata") {
          if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
            dataset.typed = false;
            break;
          }
          if (!dataset.issues || !config$1.abortEarly && !config$1.abortPipeEarly)
            dataset = item["~run"](dataset, config$1);
        }
      return dataset;
    }
  };
}
function safeParse(schema, input, config$1) {
  const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
  return {
    typed: dataset.typed,
    success: !dataset.issues,
    output: dataset.value,
    issues: dataset.issues
  };
}

// src/domain/script-manifest-schema.ts
var scriptManifestSchema = object({
  id: pipe(string(), minLength(1)),
  title: pipe(string(), minLength(1)),
  description: optional(pipe(string()))
});
var parseScriptManifest = (raw) => {
  const result = safeParse(scriptManifestSchema, raw);
  if (!result.success) {
    const message = result.issues.map((i2) => i2.message).join("; ");
    return $err({ message });
  }
  return $ok(result.output);
};

// src/infra/discover-scripts.ts
var MANIFEST_FILE = "script.json";
var reservedScriptIds = new Set(["list", "run"]);
var pushWarning = (warnings, path, message) => {
  warnings.push({ path, message });
};
function discoverScripts(scriptsRoot) {
  return $ResultAsync.fromPromise(scanScriptsRoot(scriptsRoot), (e3) => ({
    message: e3 instanceof Error ? e3.message : String(e3)
  }));
}
async function scanScriptsRoot(scriptsRoot) {
  const warnings = [];
  const packages = [];
  const seenIds = new Set;
  let entries;
  try {
    entries = await readdir3(scriptsRoot, { withFileTypes: true });
  } catch (e3) {
    const msg = e3 instanceof Error ? e3.message : String(e3);
    throw new Error(`cannot read bundled scripts directory (${scriptsRoot}): ${msg}`);
  }
  const names = entries.filter((e3) => e3.isDirectory()).map((e3) => e3.name).sort((a4, b4) => a4.localeCompare(b4));
  for (const name of names) {
    const dirPath = join6(scriptsRoot, name);
    const dirIdResult = validateScriptId(name);
    if (dirIdResult.isErr()) {
      pushWarning(warnings, dirPath, `skip non-kebab-case script folder: ${dirIdResult.error.message}`);
      continue;
    }
    const manifestPath = join6(dirPath, MANIFEST_FILE);
    const entryPath = join6(dirPath, ENTRY_FILE);
    let manifestStat;
    let entryStat;
    try {
      [manifestStat, entryStat] = await Promise.all([
        stat2(manifestPath),
        stat2(entryPath)
      ]);
    } catch {
      pushWarning(warnings, dirPath, `missing ${MANIFEST_FILE} or ${ENTRY_FILE} under script package`);
      continue;
    }
    if (!manifestStat.isFile() || !entryStat.isFile()) {
      pushWarning(warnings, dirPath, `${MANIFEST_FILE} and ${ENTRY_FILE} must be files`);
      continue;
    }
    let rawJson;
    try {
      rawJson = await readFile4(manifestPath, "utf8");
    } catch (e3) {
      const msg = e3 instanceof Error ? e3.message : String(e3);
      pushWarning(warnings, manifestPath, `cannot read manifest: ${msg}`);
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(rawJson);
    } catch (e3) {
      const msg = e3 instanceof Error ? e3.message : String(e3);
      pushWarning(warnings, manifestPath, `invalid JSON: ${msg}`);
      continue;
    }
    const manifestResult = parseScriptManifest(parsed);
    if (manifestResult.isErr()) {
      pushWarning(warnings, manifestPath, `manifest validation failed: ${manifestResult.error.message}`);
      continue;
    }
    const manifest = manifestResult.value;
    if (manifest.id !== name) {
      pushWarning(warnings, manifestPath, `manifest id "${manifest.id}" does not match folder name "${name}"`);
      continue;
    }
    if (reservedScriptIds.has(manifest.id)) {
      pushWarning(warnings, manifestPath, `script id "${manifest.id}" is reserved for a scripts command operation`);
      continue;
    }
    if (seenIds.has(manifest.id)) {
      pushWarning(warnings, dirPath, `duplicate script id "${manifest.id}" ignored (keep first in discovery order)`);
      continue;
    }
    seenIds.add(manifest.id);
    packages.push({
      id: manifest.id,
      rootPath: dirPath,
      manifest,
      entryRelative: ENTRY_FILE
    });
  }
  return { packages, warnings };
}

// src/infra/bundled-script-catalog.ts
var maxDescriptionLength = 160;
var maxWarnings = 5;
function boundedDescription(value) {
  if (!value) {
    return;
  }
  return value.length <= maxDescriptionLength ? value : `${value.slice(0, maxDescriptionLength - 1)}…`;
}
function toBundledScriptCatalogRows(catalog) {
  return listSelectable(catalog).map((row) => ({
    ...row,
    description: boundedDescription(row.description)
  }));
}
function loadBundledScriptCatalog() {
  return discoverScripts(getBundledScriptsRoot());
}
async function getBundledScriptIdCandidates() {
  const discovered = await loadBundledScriptCatalog();
  return discovered.isOk() ? toBundledScriptCatalogRows(discovered.value).map((row) => row.id) : [];
}
function formatBundledScriptCatalog(catalog, heading = "AVAILABLE SCRIPTS") {
  const rows = toBundledScriptCatalogRows(catalog);
  const width = Math.max(0, ...rows.map((row) => row.id.length));
  const lines = [heading, ""];
  if (rows.length === 0) {
    lines.push("  No bundled scripts available.");
  } else {
    for (const row of rows) {
      const detail = row.description ? `${row.title} — ${row.description}` : row.title;
      lines.push(`  ${import_picocolors3.default.cyan(row.id.padEnd(width + 2))}${detail}`);
    }
  }
  if (catalog.warnings.length > 0) {
    lines.push("", "WARNINGS", "");
    for (const warning of catalog.warnings.slice(0, maxWarnings)) {
      lines.push(`  ${warning.path}: ${warning.message}`);
    }
    const omitted = catalog.warnings.length - maxWarnings;
    if (omitted > 0) {
      lines.push(`  ... ${omitted} more warnings`);
    }
  }
  return lines.join(`
`);
}
async function renderBundledScriptHelpAppendix() {
  const discovered = await loadBundledScriptCatalog();
  if (discovered.isErr()) {
    return [
      "AVAILABLE SCRIPTS",
      "",
      `  Unavailable: ${discovered.error.message}`
    ].join(`
`);
  }
  return formatBundledScriptCatalog(discovered.value);
}

// src/command/run-scripts.command.ts
var defaultDeps = {
  isInteractive: () => process.stdin.isTTY === true,
  pickScriptId: async (rows) => {
    pe(import_picocolors4.default.cyan("▶ Script Selection"));
    const choice = await le2({
      message: "Choose a bundled script to run",
      options: rows.map((o3) => ({
        value: o3.id,
        label: `${o3.title} (${o3.id})`
      }))
    });
    if (lD2(choice)) {
      return;
    }
    return choice;
  }
};
var scriptRunnerArgs = {
  ...cliContractArgs,
  id: {
    type: "positional",
    description: "Script id (folder name under apps/cli/src/scripts/)",
    required: false
  },
  script: {
    type: "string",
    description: "Same as positional id (for non-interactive CI)",
    alias: "s",
    valueHint: "id"
  }
};
function resolveExplicitId(args) {
  const fromFlag = typeof args.script === "string" ? args.script.trim() : "";
  const fromPos = typeof args.id === "string" ? args.id.trim() : "";
  const resolved = fromFlag || fromPos;
  return resolved.length > 0 ? resolved : undefined;
}
function toScriptArgs(args) {
  const skipped = new Set([
    "_",
    "id",
    "script",
    "json",
    "quiet",
    "noInteractive",
    "no-interactive"
  ]);
  return Object.fromEntries(Object.entries(args).filter(([key]) => !skipped.has(key)));
}
function shouldOfferScriptIds({
  completedWords,
  path
}) {
  const tail = completedWords.slice(path.length);
  const last = tail.at(-1);
  if (last === "--script" || last === "-s") {
    return true;
  }
  return !tail.some((word) => !word.startsWith("-"));
}
async function scriptIdCandidates(context) {
  return shouldOfferScriptIds(context) ? await getBundledScriptIdCandidates() : [];
}
function normalizeScriptsArgs(args) {
  const [first] = args;
  if (!first || first === "list" || first === "run" || first === "--help" || first === "-h") {
    return args;
  }
  return ["run", ...args];
}
async function executeBundledScript(args, deps) {
  const context = createCliContext(args, { isTty: deps.isInteractive });
  const commandDiagnostics = createCliCommandDiagnostics(context, processOutput, { command: "scripts" });
  const diagnostics = createCliDiagnostics(context, processOutput, {
    command: "scripts"
  });
  const fail = (error, details) => {
    commandDiagnostics.fail(error, { details });
    writeCommandError(context, processOutput, error);
    process.exitCode = error.exitCode;
  };
  const root = getBundledScriptsRoot();
  const discovered = await loadBundledScriptCatalog();
  if (discovered.isErr()) {
    const error = createCliError("discovery_failed", discovered.error.message);
    fail(error, { phase: "discovery", scriptsRoot: root });
    return;
  }
  const catalog = discovered.value;
  diagnostics.emit({
    level: "debug",
    event: "cli.scripts_discovered",
    phase: "discovery",
    details: {
      packageCount: catalog.packages.length,
      warningCount: catalog.warnings.length
    }
  });
  for (const warning of catalog.warnings) {
    writeWarning(processOutput, import_picocolors4.default.yellow(`${warning.path}: ${warning.message}`));
    diagnostics.emit({
      level: "warn",
      event: "cli.script_discovery_warning",
      phase: "discovery",
      details: {
        message: warning.message,
        path: warning.path
      }
    });
  }
  if (catalog.packages.length === 0) {
    const error = createCliError("discovery_failed", "no valid bundled script packages found (see apps/cli/src/scripts/)");
    fail(error, { phase: "discovery", scriptsRoot: root });
    return;
  }
  const explicitId = resolveExplicitId(args);
  let targetId = explicitId;
  if (!targetId) {
    if (!context.interactive) {
      const error = createCliError("missing_required_argument", "script id is required in non-interactive mode (use: chc scripts run <id>, chc scripts <id>, or --script <id>)");
      fail(error, { phase: "selection" });
      return;
    }
    const options = listSelectable(catalog);
    if (options.length === 1) {
      const [only] = options;
      targetId = only.id;
      diagnostics.emit({
        level: "info",
        event: "cli.script_selected",
        phase: "selection",
        scriptId: targetId,
        details: { selectionMode: "single-option" }
      });
    } else {
      const choice = await deps.pickScriptId(options);
      if (choice === undefined) {
        const error = createCliError("invalid_option", "selection cancelled");
        fail(error, { phase: "selection" });
        return;
      }
      targetId = choice;
      diagnostics.emit({
        level: "info",
        event: "cli.script_selected",
        phase: "selection",
        scriptId: targetId,
        details: { selectionMode: "interactive" }
      });
    }
  } else {
    diagnostics.emit({
      level: "info",
      event: "cli.script_selected",
      phase: "selection",
      scriptId: targetId,
      details: {
        selectionMode: explicitId === args.script ? "flag" : "positional"
      }
    });
  }
  const resolved = resolvePackage(catalog, targetId);
  if (resolved.isErr()) {
    const error = resolved.error.kind === "not_found" ? createCliError("unknown_selection", `unknown script id: ${resolved.error.id}`) : createCliError("ambiguous_selection", `ambiguous script id: ${resolved.error.id}`);
    fail(error, {
      phase: "selection",
      requestedScriptId: resolved.error.id
    });
    return;
  }
  const executed = await runBundledScript(resolved.value, toScriptArgs(args), {
    cli: context,
    diagnostics: diagnostics.child({
      scriptId: resolved.value.id
    })
  });
  if (executed.isErr()) {
    const error = executed.error.kind === "load" || executed.error.kind === "no_default_export" ? createCliError("script_load_failed", executed.error.message) : executed.error.cliError ?? createCliError("script_execution_failed", executed.error.message);
    fail(error, {
      phase: executed.error.kind,
      scriptId: resolved.value.id,
      scriptArgs: summarizeScriptArgs(toScriptArgs(args))
    });
    return;
  }
  commandDiagnostics.complete({
    details: {
      scriptId: resolved.value.id,
      scriptArgs: summarizeScriptArgs(toScriptArgs(args))
    }
  });
  process.exitCode = 0;
}
function createScriptListCommand() {
  return defineCommand({
    meta: {
      name: "list",
      description: "List discovered bundled scripts."
    },
    args: cliContractArgs,
    async run({ args }) {
      await runObservedCliCommand(args, { command: "scripts", subcommand: "list" }, async ({ context, fail }) => {
        const discovered = await loadBundledScriptCatalog();
        if (discovered.isErr()) {
          const error = createCliError("discovery_failed", discovered.error.message);
          fail(error, { details: { phase: "discovery" } });
          writeCommandError(context, processOutput, error);
          process.exitCode = error.exitCode;
          return;
        }
        if (context.json) {
          writeJsonValue(processOutput, {
            ok: true,
            command: "scripts list",
            scripts: toBundledScriptCatalogRows(discovered.value)
          });
        } else {
          writeHumanStatus(context, processOutput, formatBundledScriptCatalog(discovered.value));
        }
        process.exitCode = 0;
      });
    }
  });
}
function createScriptRunCommand(deps) {
  const command = defineCommand({
    meta: {
      name: "run",
      description: "Run a discovered bundled script."
    },
    args: scriptRunnerArgs,
    async run({ args }) {
      await executeBundledScript(args, deps);
    }
  });
  return registerPositionalCandidates(command, scriptIdCandidates);
}
var createScriptsCommand = (deps = defaultDeps) => {
  const registrations = [
    {
      name: "list",
      command: createScriptListCommand(),
      visibility: "public",
      bareBehavior: "run"
    },
    {
      name: "run",
      command: createScriptRunCommand(deps),
      visibility: "public",
      bareBehavior: "run"
    }
  ];
  const command = registerCommandGroup(defineCommand({
    meta: {
      name: "scripts",
      description: "Discover, list, and run bundled scripts under apps/cli/src/scripts/<id>/."
    },
    subCommands: buildRegisteredSubCommands(registrations)
  }), registrations);
  registerPositionalCandidates(command, scriptIdCandidates);
  return registerCommandHelpAppendix(command, renderBundledScriptHelpAppendix);
};
var scriptsCommand = createScriptsCommand();

// src/command/self-update.command.ts
var import_picocolors6 = __toESM(require_picocolors(), 1);

// src/domain/self-update-manager.ts
import { spawn } from "node:child_process";
import { existsSync as existsSync3, readFileSync as readFileSync2 } from "node:fs";
import { mkdir as mkdir4 } from "node:fs/promises";
import { homedir as homedir3 } from "node:os";
import { dirname as dirname7, join as join7, resolve as resolve4 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
var defaultSelfUpdateRepo = "https://github.com/mickmetalholic/CthuTool.git";
var defaultSelfUpdateRef = "main";
var committedCliBundlePath = "apps/cli/dist/index.js";
var maxChangeHighlights = 5;
var maxSubjectLength = 120;
var maxDetailLines = 8;
var maxDetailLineLength = 240;

class SelfUpdateError extends Error {
  phase;
  summary;
  causeText;
  hint;
  result;
  constructor(options) {
    const cause = options.cause ? `
Cause: ${options.cause}` : "";
    super(`${options.summary}${cause}
Next: ${options.hint}`);
    this.name = "SelfUpdateError";
    this.phase = options.phase;
    this.summary = options.summary;
    this.causeText = options.cause;
    this.hint = options.hint;
    this.result = options.result;
  }
}
function getDefaultSelfUpdateInstallDir(home = homedir3()) {
  return join7(home, ".cthutool", "source", "CthuTool");
}
function createSelfUpdateDeps(onEvent) {
  return {
    exists: existsSync3,
    mkdir: async (path) => {
      await mkdir4(path, { recursive: true });
    },
    run: runCommand2,
    env: process.env,
    home: homedir3,
    onEvent
  };
}
function getCliVersion() {
  return readPackageVersion(findRepoRootFromModule());
}
function resolveSelfUpdateOptions(options, deps) {
  const home = deps.home();
  return {
    repo: options.repo ?? deps.env.CHC_REPO_URL ?? deps.env.CHC_REPO ?? defaultSelfUpdateRepo,
    ref: options.ref ?? deps.env.CHC_REF ?? defaultSelfUpdateRef,
    installDir: options.installDir ?? deps.env.CHC_INSTALL_DIR ?? getDefaultSelfUpdateInstallDir(home)
  };
}
function emit(deps, event) {
  deps.onEvent?.(event);
}
async function runPhase(deps, phase, action) {
  emit(deps, { type: "phase_started", phase });
  try {
    const value = await action();
    emit(deps, { type: "phase_completed", phase });
    return value;
  } catch (error) {
    const failure = toPhaseError(error, phase);
    emit(deps, {
      type: "failure",
      phase: failure.phase,
      summary: failure.summary,
      cause: failure.causeText,
      hint: failure.hint
    });
    throw failure;
  }
}
function phaseHint(phase) {
  switch (phase) {
    case "preflight":
      return "Check the selected directory and local Git state, then retry.";
    case "check_remote":
      return "Check the repository URL, ref, network access, and Git credentials.";
    case "clone":
      return "Check repository access and permissions for the managed source directory.";
    case "fetch":
      return "Check network access and the configured origin, then retry.";
    case "checkout":
      return "Inspect the checkout state and selected ref before retrying.";
    case "verify_bundle":
      return `Select a ref containing ${committedCliBundlePath}.`;
    case "install_global":
      return "Check npm global-install permissions, then retry the update.";
  }
}
function toPhaseError(error, phase) {
  if (error instanceof SelfUpdateError) {
    return error;
  }
  return new SelfUpdateError({
    phase,
    summary: `Update failed during ${formatPhase(phase)}.`,
    cause: boundedText(error instanceof Error ? error.message : String(error)),
    hint: phaseHint(phase)
  });
}
function commandFailure(phase, result) {
  return new SelfUpdateError({
    phase,
    summary: `Update failed during ${formatPhase(phase)}.`,
    cause: boundedCommandOutput(result) || `Command exited with code ${result.code}.`,
    hint: phaseHint(phase),
    result
  });
}
async function execute(deps, phase, command, args, options = {}) {
  let result;
  try {
    result = await deps.run(command, args, options);
  } catch (error) {
    throw new SelfUpdateError({
      phase,
      summary: `Unable to start ${command} during ${formatPhase(phase)}.`,
      cause: boundedText(error instanceof Error ? error.message : String(error)),
      hint: phaseHint(phase)
    });
  }
  emit(deps, {
    type: "command",
    phase,
    command,
    args: redactArgs(args),
    cwd: options.cwd,
    code: result.code,
    stdout: boundedText(result.stdout),
    stderr: boundedText(result.stderr)
  });
  if (result.code !== 0 && options.allowFailure !== true) {
    throw commandFailure(phase, result);
  }
  return result;
}
async function requiredOutput(deps, phase, args, cwd) {
  const result = await execute(deps, phase, "git", args, { cwd });
  const value = result.stdout.trim();
  if (value.length === 0) {
    throw new SelfUpdateError({
      phase,
      summary: `Git returned no identity during ${formatPhase(phase)}.`,
      hint: phaseHint(phase)
    });
  }
  return value;
}
async function readIdentity(deps, phase, cwd, fallbackRef, revision = "HEAD") {
  const commit = await requiredOutput(deps, phase, ["rev-parse", "--verify", `${revision}^{commit}`], cwd);
  const refResult = revision === "HEAD" ? await execute(deps, phase, "git", ["symbolic-ref", "--quiet", "--short", "HEAD"], { cwd, allowFailure: true }) : undefined;
  return {
    ref: refResult?.code === 0 ? refResult.stdout.trim() || fallbackRef : fallbackRef,
    commit,
    shortCommit: commit.slice(0, 7)
  };
}
function finishPlan(deps, plan) {
  emit(deps, { type: "plan", plan });
  return plan;
}
async function planSelfUpdate(options = {}, deps = createSelfUpdateDeps()) {
  const resolved = resolveSelfUpdateOptions(options, deps);
  const publicResolved = {
    ...resolved,
    repo: redactValue(resolved.repo)
  };
  const phases = [];
  const gitRoot = join7(resolved.installDir, ".git");
  const initial = await runPhase(deps, "preflight", async () => {
    if (!deps.exists(gitRoot)) {
      return;
    }
    const status = await execute(deps, "preflight", "git", ["status", "--porcelain", "--untracked-files=normal"], { cwd: resolved.installDir });
    if (status.stdout.trim().length > 0) {
      return "dirty";
    }
    return readIdentity(deps, "preflight", resolved.installDir, resolved.ref);
  });
  phases.push("preflight");
  if (initial === undefined) {
    return finishPlan(deps, {
      status: "install_required",
      ...publicResolved,
      phases
    });
  }
  if (initial === "dirty") {
    return finishPlan(deps, {
      status: "blocked",
      ...publicResolved,
      block: {
        kind: "dirty_checkout",
        message: "The selected checkout has uncommitted or untracked changes.",
        hint: "Commit, stash, or remove the local changes, then retry."
      },
      phases
    });
  }
  const remote = await runPhase(deps, "check_remote", async () => {
    await execute(deps, "check_remote", "git", ["fetch", "--no-tags", resolved.repo, resolved.ref], { cwd: resolved.installDir });
    const target = await readIdentity(deps, "check_remote", resolved.installDir, resolved.ref, "FETCH_HEAD");
    const branch = await execute(deps, "check_remote", "git", ["ls-remote", "--exit-code", "--heads", resolved.repo, resolved.ref], { cwd: resolved.installDir, allowFailure: true });
    return {
      target,
      isBranch: branch.code === 0 && branch.stdout.trim().length > 0
    };
  });
  phases.push("check_remote");
  if (initial.commit === remote.target.commit) {
    return finishPlan(deps, {
      status: "up_to_date",
      ...publicResolved,
      before: initial,
      target: remote.target,
      phases
    });
  }
  if (remote.isBranch) {
    const ancestor = await execute(deps, "check_remote", "git", ["merge-base", "--is-ancestor", initial.commit, remote.target.commit], { cwd: resolved.installDir, allowFailure: true });
    if (ancestor.code === 1) {
      return finishPlan(deps, {
        status: "blocked",
        ...publicResolved,
        before: initial,
        target: remote.target,
        block: {
          kind: "diverged_branch",
          message: "The selected checkout cannot fast-forward to the remote branch.",
          hint: "Reconcile the local branch manually, then retry."
        },
        phases
      });
    }
    if (ancestor.code !== 0) {
      throw commandFailure("check_remote", ancestor);
    }
  }
  const changes = await loadChangeSummary(deps, resolved.installDir, initial.commit, remote.target.commit);
  return finishPlan(deps, {
    status: "update_available",
    ...publicResolved,
    before: initial,
    target: remote.target,
    changes,
    phases
  });
}
async function loadChangeSummary(deps, cwd, before, target) {
  const countResult = await execute(deps, "check_remote", "git", ["rev-list", "--count", `${before}..${target}`], { cwd, allowFailure: true });
  const parsedCount = Number.parseInt(countResult.stdout.trim(), 10);
  const count = countResult.code === 0 && Number.isFinite(parsedCount) ? parsedCount : 0;
  const logResult = await execute(deps, "check_remote", "git", [
    "log",
    `--max-count=${maxChangeHighlights}`,
    "--format=%h%x09%s",
    `${before}..${target}`
  ], { cwd, allowFailure: true });
  const highlights = logResult.code === 0 ? logResult.stdout.split(/\r?\n/).filter(Boolean).slice(0, maxChangeHighlights).map((line) => {
    const [commit = "", ...subject] = line.split("\t");
    return {
      commit: commit.slice(0, 12),
      subject: boundedLine(subject.join("\t"), maxSubjectLength)
    };
  }) : [];
  return {
    count: Math.max(count, highlights.length),
    highlights,
    omitted: Math.max(0, count - highlights.length)
  };
}
function blockedError(plan) {
  return new SelfUpdateError({
    phase: "preflight",
    summary: `Update blocked: ${plan.block?.message ?? "The selected checkout is not safe to update."}`,
    hint: plan.block?.hint ?? phaseHint("preflight")
  });
}
function assertSelfUpdatePlanReady(plan) {
  if (plan.status === "blocked") {
    throw blockedError(plan);
  }
}
async function runSelfUpdate(options = {}, deps = createSelfUpdateDeps()) {
  const resolved = resolveSelfUpdateOptions(options, deps);
  const plan = await planSelfUpdate(options, deps);
  assertSelfUpdatePlanReady(plan);
  if (plan.status === "up_to_date") {
    return {
      status: "up_to_date",
      repo: plan.repo,
      ref: plan.ref,
      installDir: plan.installDir,
      before: plan.before,
      target: plan.target,
      after: plan.before,
      phases: plan.phases,
      steps: []
    };
  }
  const phases = [...plan.phases];
  const steps = [];
  const isInstall = plan.status === "install_required";
  if (isInstall) {
    await runPhase(deps, "clone", async () => {
      await deps.mkdir(dirname7(plan.installDir));
      await execute(deps, "clone", "git", [
        "clone",
        resolved.repo,
        plan.installDir
      ]);
    });
    phases.push("clone");
    steps.push("clone");
  } else {
    await runPhase(deps, "preflight", async () => {
      const status = await execute(deps, "preflight", "git", ["status", "--porcelain", "--untracked-files=normal"], { cwd: plan.installDir });
      if (status.stdout.trim().length > 0) {
        throw new SelfUpdateError({
          phase: "preflight",
          summary: "Update blocked: the checkout changed after preflight.",
          hint: "Preserve the new local changes, then retry."
        });
      }
    });
  }
  if (!isInstall) {
    await runPhase(deps, "fetch", async () => {
      await execute(deps, "fetch", "git", ["remote", "set-url", "origin", resolved.repo], { cwd: plan.installDir });
      await execute(deps, "fetch", "git", ["fetch", "--tags", "origin"], {
        cwd: plan.installDir
      });
    });
    phases.push("fetch");
    steps.push("fetch");
  }
  await runPhase(deps, "checkout", async () => {
    await execute(deps, "checkout", "git", ["checkout", plan.ref], {
      cwd: plan.installDir
    });
    steps.push("checkout");
    const remoteBranch = await execute(deps, "checkout", "git", ["rev-parse", "--verify", `origin/${plan.ref}`], { cwd: plan.installDir, allowFailure: true });
    if (remoteBranch.code === 0) {
      await execute(deps, "checkout", "git", ["pull", "--ff-only", "origin", plan.ref], { cwd: plan.installDir });
      steps.push("pull");
    }
  });
  phases.push("checkout");
  await runPhase(deps, "verify_bundle", async () => {
    verifyCommittedBundle(deps, plan.installDir);
  });
  phases.push("verify_bundle");
  steps.push("verify-bundle");
  await runPhase(deps, "install_global", async () => {
    await execute(deps, "install_global", "npm", [
      "install",
      "-g",
      "--ignore-scripts",
      plan.installDir
    ]);
  });
  phases.push("install_global");
  steps.push("install-global");
  const after = await readIdentity(deps, "checkout", plan.installDir, plan.ref);
  return {
    status: isInstall ? "installed" : "updated",
    repo: plan.repo,
    ref: plan.ref,
    installDir: plan.installDir,
    before: plan.before,
    target: plan.target ?? after,
    after,
    changes: plan.changes,
    phases,
    steps
  };
}
async function getCliInstallationStatus(options = {}, deps = createSelfUpdateDeps()) {
  const installDir = options.installDir ?? deps.env.CHC_INSTALL_DIR ?? findRepoRootFromModule();
  const resolved = resolveSelfUpdateOptions({ ...options, installDir }, deps);
  const bundlePath = join7(resolved.installDir, committedCliBundlePath);
  const gitRoot = join7(resolved.installDir, ".git");
  const repo = deps.exists(gitRoot) ? await runOptional(deps, "git", ["remote", "get-url", "origin"], {
    cwd: resolved.installDir
  }) ?? resolved.repo : resolved.repo;
  const ref = deps.exists(gitRoot) ? await runOptional(deps, "git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: resolved.installDir
  }) ?? resolved.ref : resolved.ref;
  const commit = deps.exists(gitRoot) ? await runOptional(deps, "git", ["rev-parse", "--short", "HEAD"], {
    cwd: resolved.installDir
  }) : undefined;
  return {
    version: getCliVersion(),
    mode: resolve4(resolved.installDir) === resolve4(getDefaultSelfUpdateInstallDir(deps.home())) ? "remote" : "local",
    installDir: resolved.installDir,
    repo,
    ref,
    commit,
    bundlePath,
    bundlePresent: deps.exists(bundlePath)
  };
}
async function runOptional(deps, command, args, options) {
  const result = await deps.run(command, args, {
    ...options,
    allowFailure: true
  });
  if (result.code !== 0) {
    return;
  }
  const value = result.stdout.trim();
  return value.length > 0 ? value : undefined;
}
function verifyCommittedBundle(deps, installDir) {
  const bundlePath = join7(installDir, committedCliBundlePath);
  if (!deps.exists(bundlePath)) {
    throw new SelfUpdateError({
      phase: "verify_bundle",
      summary: "The selected ref does not contain the committed CLI bundle.",
      cause: `Missing ${bundlePath}.`,
      hint: phaseHint("verify_bundle")
    });
  }
}
function formatPhase(phase) {
  return phase.replaceAll("_", " ");
}
function boundedLine(value, maxLength) {
  const normalized = value.replaceAll(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1)}…`;
}
function boundedText(value) {
  const lines = value.split(/\r?\n/).map((line) => boundedLine(line, maxDetailLineLength)).filter(Boolean).slice(0, maxDetailLines);
  return lines.length > 0 ? lines.join(`
`) : undefined;
}
function boundedCommandOutput(result) {
  return boundedText(`${result.stderr}
${result.stdout}`);
}
function redactArgs(args) {
  return args.map(redactValue);
}
function redactValue(value) {
  return value.replace(/:\/\/[^/@\s]+@/g, "://***@");
}
function runCommand2(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, [...args], {
      cwd: options.cwd,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout2 = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout2 += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      reject(error);
    });
    child.on("close", (code) => {
      resolvePromise({
        command,
        args,
        cwd: options.cwd,
        code: code ?? 1,
        stdout: stdout2,
        stderr
      });
    });
  });
}
function findRepoRootFromModule() {
  let current = dirname7(fileURLToPath2(import.meta.url));
  while (true) {
    if (isCthuToolRoot(current)) {
      return current;
    }
    const parent = dirname7(current);
    if (parent === current) {
      throw new Error("Unable to locate CthuTool package root.");
    }
    current = parent;
  }
}
function isCthuToolRoot(path) {
  try {
    const pkg = JSON.parse(readFileSync2(join7(path, "package.json"), "utf8"));
    return pkg.name === "cthutool";
  } catch {
    return false;
  }
}
function readPackageVersion(root) {
  const pkg = JSON.parse(readFileSync2(join7(root, "package.json"), "utf8"));
  if (typeof pkg.version !== "string" || pkg.version.trim().length === 0) {
    throw new Error(`Package version is missing: ${join7(root, "package.json")}`);
  }
  return pkg.version;
}

// src/command/self-update-output.ts
var import_picocolors5 = __toESM(require_picocolors(), 1);
var defaultDeps2 = {
  output: processOutput,
  isOutputTty: () => process.stdout.isTTY === true,
  createSpinner: _4
};
var phaseLabels = {
  preflight: "Checking local update state",
  check_remote: "Checking the selected remote ref",
  clone: "Cloning the managed source checkout",
  fetch: "Fetching repository updates",
  checkout: "Checking out the selected ref",
  verify_bundle: "Verifying the committed CLI bundle",
  install_global: "Installing the global command"
};
function identity(value) {
  return `${value.ref}@${value.shortCommit}`;
}
function createSelfUpdateRenderer(context, options, deps = defaultDeps2) {
  const human = !context.json && !context.quiet;
  const interactiveOutput = human && context.isTty && deps.isOutputTty();
  const colors2 = import_picocolors5.default.createColors(interactiveOutput);
  let activeSpinner;
  let activePhase;
  let headerWritten = false;
  const writeHeader = () => {
    if (!human || headerWritten)
      return;
    headerWritten = true;
    deps.output.stdout.write(`${colors2.cyan("CthuTool update")}
`);
  };
  const stopSpinner = (message, code) => {
    if (!activeSpinner)
      return;
    activeSpinner.stop(message, code);
    activeSpinner = undefined;
    activePhase = undefined;
  };
  const renderPlan = (plan) => {
    if (!human)
      return;
    writeHeader();
    deps.output.stdout.write(`source: ${plan.installDir}
`);
    deps.output.stdout.write(`target: ${plan.repo}#${plan.ref}
`);
    if (plan.before) {
      deps.output.stdout.write(`current: ${identity(plan.before)}
`);
    }
    if (plan.target) {
      deps.output.stdout.write(`latest:  ${identity(plan.target)}
`);
    }
    if (plan.changes && plan.changes.count > 0) {
      deps.output.stdout.write(`changes: ${plan.changes.count} commit(s)
`);
      for (const change of plan.changes.highlights) {
        deps.output.stdout.write(`  ${change.commit}  ${change.subject}
`);
      }
      if (plan.changes.omitted > 0) {
        deps.output.stdout.write(`  … ${plan.changes.omitted} more commit(s)
`);
      }
    }
  };
  const renderVerboseCommand = (event) => {
    if (!options.verbose)
      return;
    const cwd = event.cwd ? ` (cwd: ${event.cwd})` : "";
    deps.output.stderr.write(`${colors2.dim(`$ ${event.command} ${event.args.join(" ")}${cwd}`)}
`);
    for (const detail of [event.stderr, event.stdout]) {
      if (detail)
        deps.output.stderr.write(`${colors2.dim(detail)}
`);
    }
  };
  return {
    onEvent(event) {
      if (event.type === "command") {
        renderVerboseCommand(event);
        return;
      }
      if (event.type === "plan") {
        renderPlan(event.plan);
        return;
      }
      if (event.type === "failure") {
        if (activeSpinner) {
          stopSpinner(`${phaseLabels[event.phase]} failed`, 1);
        }
        return;
      }
      if (!human)
        return;
      writeHeader();
      const label = phaseLabels[event.phase];
      if (event.type === "phase_started") {
        if (interactiveOutput) {
          if (activeSpinner)
            stopSpinner(phaseLabels[activePhase ?? event.phase]);
          activeSpinner = deps.createSpinner();
          activePhase = event.phase;
          activeSpinner.start(label);
        } else {
          deps.output.stdout.write(`- ${label}
`);
        }
        return;
      }
      if (interactiveOutput) {
        stopSpinner(`${label} complete`);
      } else {
        deps.output.stdout.write(`${colors2.green("✓")} ${label}
`);
      }
    },
    renderCheckResult(plan) {
      if (!human)
        return;
      if (plan.status === "up_to_date" && plan.target) {
        deps.output.stdout.write(`${colors2.green("✓")} chc is already up to date · ${identity(plan.target)}
`);
      } else if (plan.status === "update_available" && plan.target) {
        deps.output.stdout.write(`${colors2.cyan("Update available")} · ${identity(plan.target)}
`);
      } else if (plan.status === "install_required") {
        deps.output.stdout.write(`${colors2.yellow("Managed installation required")} · run chc update
`);
      }
    },
    renderApplyResult(result) {
      if (!human)
        return;
      const after = result.after ?? result.target;
      if (result.status === "up_to_date" && after) {
        deps.output.stdout.write(`${colors2.green("✓")} chc is already up to date · ${identity(after)}
`);
        return;
      }
      const before = result.before ? `${identity(result.before)} → ` : "";
      const target = after ? identity(after) : result.ref;
      const verb = result.status === "installed" ? "Installed" : "Updated";
      deps.output.stdout.write(`${colors2.green("✓")} ${verb} chc successfully · ${before}${target}
`);
      deps.output.stdout.write("  Run `chc status` for installation details.\n");
    },
    stopForError(error) {
      if (!activeSpinner)
        return;
      const phase = error && typeof error === "object" && "phase" in error ? error.phase : activePhase;
      stopSpinner(phase ? `${phaseLabels[phase]} failed` : "Update failed", 1);
    }
  };
}

// src/command/self-update.command.ts
var selfUpdateSourceArgs = {
  repo: {
    type: "string",
    description: "Git repository URL to install from"
  },
  ref: {
    type: "string",
    description: "Git branch, tag, or commit to install"
  },
  "install-dir": {
    type: "string",
    description: "Local source checkout directory"
  }
};
var selfUpdateArgs = {
  ...cliContractArgs,
  ...selfUpdateSourceArgs,
  check: {
    type: "boolean",
    description: "Check update availability without applying changes"
  },
  verbose: {
    type: "boolean",
    description: "Show bounded Git and npm command details"
  }
};
function getStringArg2(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
function toUpdateCliError(error) {
  return error instanceof SelfUpdateError ? createCliError("update_failed", error.message) : createCliError("update_failed", error instanceof Error ? error.message : "update failed");
}
function writeFailure(context, cliError, error) {
  if (context.json && error instanceof SelfUpdateError) {
    writeJsonValue(processOutput, {
      ok: false,
      error: {
        code: cliError.code,
        message: error.summary,
        phase: error.phase,
        cause: error.causeText,
        hint: error.hint
      }
    });
  } else {
    writeCommandError(context, processOutput, cliError);
  }
  process.exitCode = cliError.exitCode;
}
function createUpdateCommand() {
  return defineCommand({
    meta: {
      name: "update",
      description: "Update the global chc command from the CthuTool Git repository."
    },
    args: selfUpdateArgs,
    async run({ args }) {
      await runObservedCliCommand(args, { command: "update" }, async ({ context, fail }) => {
        const repo = getStringArg2(args.repo);
        const ref = getStringArg2(args.ref);
        const installDir = getStringArg2(args["install-dir"]);
        const renderer = createSelfUpdateRenderer(context, {
          verbose: args.verbose === true
        });
        const managerDeps = createSelfUpdateDeps(renderer.onEvent);
        try {
          if (args.check === true) {
            const result2 = await planSelfUpdate({ repo, ref, installDir }, managerDeps);
            assertSelfUpdatePlanReady(result2);
            if (context.json) {
              writeJsonValue(processOutput, {
                ok: true,
                command: "update",
                result: result2
              });
            } else {
              renderer.renderCheckResult(result2);
            }
            process.exitCode = 0;
            return;
          }
          const result = await runSelfUpdate({ repo, ref, installDir }, managerDeps);
          if (context.json) {
            writeJsonValue(processOutput, {
              ok: true,
              command: "update",
              result
            });
          } else {
            renderer.renderApplyResult(result);
          }
          process.exitCode = 0;
        } catch (error) {
          renderer.stopForError(error);
          const cliError = toUpdateCliError(error);
          fail(cliError, {
            details: {
              installDir,
              ref,
              repo,
              phase: error instanceof SelfUpdateError ? error.phase : undefined
            }
          });
          writeFailure(context, cliError, error);
        }
      });
    }
  });
}
var versionCommand = defineCommand({
  meta: {
    name: "version",
    description: "Print the current chc CLI version."
  },
  args: cliContractArgs,
  async run({ args }) {
    await runObservedCliCommand(args, { command: "version" }, ({ context }) => {
      const version = getCliVersion();
      if (context.json) {
        writeJsonValue(processOutput, {
          ok: true,
          command: "version",
          version
        });
      } else {
        processOutput.stdout.write(`chc ${version}
`);
      }
      process.exitCode = 0;
    });
  }
});
var statusCommand = defineCommand({
  meta: {
    name: "status",
    description: "Show chc CLI installation status."
  },
  args: { ...cliContractArgs, ...selfUpdateSourceArgs },
  async run({ args }) {
    await runObservedCliCommand(args, { command: "status" }, async ({ context, fail }) => {
      try {
        const status = await getCliInstallationStatus({
          repo: getStringArg2(args.repo),
          ref: getStringArg2(args.ref),
          installDir: getStringArg2(args["install-dir"])
        });
        if (context.json) {
          writeJsonValue(processOutput, {
            ok: true,
            command: "status",
            status
          });
        } else {
          writeHumanStatus(context, processOutput, import_picocolors6.default.cyan("CthuTool status"));
          writeHumanStatus(context, processOutput, `version:     ${status.version}`);
          writeHumanStatus(context, processOutput, `mode:        ${status.mode}`);
          writeHumanStatus(context, processOutput, `install dir: ${status.installDir}`);
          writeHumanStatus(context, processOutput, `repo:        ${status.repo}`);
          writeHumanStatus(context, processOutput, `ref:         ${status.ref}`);
          writeHumanStatus(context, processOutput, `commit:      ${status.commit ?? "unavailable"}`);
          writeHumanStatus(context, processOutput, `bundle:      ${status.bundlePresent ? "present" : "missing"} (${status.bundlePath})`);
        }
        process.exitCode = 0;
      } catch (error) {
        const cliError = toUpdateCliError(error);
        fail(cliError);
        writeFailure(context, cliError, error);
      }
    });
  }
});
var updateCommand = createUpdateCommand();

// src/command/root.command.ts
var rootCommand;
var rootCommandRegistrations = [
  {
    name: "codex",
    command: codexCommand,
    visibility: "public",
    bareBehavior: "help"
  },
  {
    name: "version",
    command: versionCommand,
    visibility: "compat",
    bareBehavior: "run"
  },
  {
    name: "status",
    command: statusCommand,
    visibility: "public",
    bareBehavior: "run"
  },
  {
    name: "update",
    command: updateCommand,
    visibility: "public",
    bareBehavior: "run"
  },
  {
    name: "completion",
    command: createCompletionCommand(),
    visibility: "public",
    bareBehavior: "help"
  },
  {
    name: "__complete",
    command: createInternalCompleteCommand(() => rootCommand),
    visibility: "internal",
    bareBehavior: "run"
  },
  {
    name: "scripts",
    command: scriptsCommand,
    visibility: "public",
    bareBehavior: "help",
    normalizeArgs: normalizeScriptsArgs
  }
];
rootCommand = registerCommandGroup(defineCommand({
  meta: {
    name: "chc",
    description: "CthuTool monorepo CLI"
  },
  subCommands: buildRegisteredSubCommands(rootCommandRegistrations)
}), rootCommandRegistrations);

// src/index.ts
function formatUsageForStdout(value, hiddenCommands = new Set) {
  return normalizeCommandRows(value.replace(/`([^`]+)`/g, "$1").replace(/[ \t]+$/gm, ""), hiddenCommands);
}
function normalizeCommandRows(value, hiddenCommands) {
  const lines = value.split(`
`);
  const normalized = [];
  let inCommands = false;
  let pendingRows = [];
  const flushRows = () => {
    if (pendingRows.length === 0) {
      return;
    }
    const visibleRows = pendingRows.filter((row) => row.name !== "__complete" && !hiddenCommands.has(row.name));
    if (visibleRows.length === 0) {
      pendingRows = [];
      return;
    }
    const width = Math.max(...visibleRows.map((row) => row.name.length));
    for (const row of visibleRows) {
      normalized.push(`  ${import_picocolors7.default.bold(import_picocolors7.default.cyan(row.name.padEnd(width + 2)))}${row.description}`);
    }
    pendingRows = [];
  };
  for (const line of lines) {
    const visibleLine = filterUsageCommandChoices(line, hiddenCommands);
    const plain = stripAnsi3(visibleLine).trim();
    if (plain === "COMMANDS") {
      flushRows();
      inCommands = true;
      normalized.push(visibleLine);
      continue;
    }
    const commandRow = inCommands ? stripAnsi3(visibleLine).match(/^\s{2,}([A-Za-z0-9_-]+)\s{2,}(.+)$/) : null;
    if (commandRow) {
      pendingRows.push({
        name: commandRow[1],
        description: commandRow[2]
      });
      continue;
    }
    flushRows();
    if (inCommands && plain.length > 0) {
      inCommands = false;
    }
    normalized.push(visibleLine);
  }
  flushRows();
  return normalized.join(`
`);
}
async function showNativeUsage(command, parent) {
  const hiddenCommands = new Set(getCommandRegistrations(command)?.filter((registration) => registration.visibility !== "public").map((registration) => registration.name) ?? []);
  const appendix = await getCommandHelpAppendixProvider(command)?.();
  const rendered = formatUsageForStdout(await renderUsage(command, parent), hiddenCommands);
  process.stdout.write(`${rendered}${appendix ? `

${appendix}` : ""}
`);
}
async function resolveBareTopLevelHelpCommand(rawArgs) {
  if (rawArgs.length !== 1) {
    return;
  }
  const [name] = rawArgs;
  if (!name || name.startsWith("-") || name === "__complete") {
    return;
  }
  const registration = getCommandRegistration(rootCommand, name);
  return registration?.bareBehavior === "help" ? registration.command : undefined;
}
var rawArgs = normalizeRegisteredArgs(rootCommand, process.argv.slice(2));
var bareTopLevelHelpCommand = await resolveBareTopLevelHelpCommand(rawArgs);
if (rawArgs.length === 1 && rawArgs[0] === "--version") {
  process.stdout.write(`chc ${getCliVersion()}
`);
  process.exitCode = 0;
} else if (rawArgs.length === 0) {
  await showNativeUsage(rootCommand);
  process.exitCode = 0;
} else if (bareTopLevelHelpCommand) {
  await showNativeUsage(bareTopLevelHelpCommand, rootCommand);
  process.exitCode = 0;
} else {
  await runMain(rootCommand, { rawArgs, showUsage: showNativeUsage }).catch(() => {
    process.exitCode = 1;
  });
}
