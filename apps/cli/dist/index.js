import { createRequire } from "node:module";
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
var __require = /* @__PURE__ */ createRequire(import.meta.url);

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

// ../../packages/agent-data-migration/dist/legacy-desktop-migration.js
var require_legacy_desktop_migration = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.LEGACY_DESKTOP_MIGRATION_VERSION = undefined;
  exports.resolveLegacyDesktopDataRoot = resolveLegacyDesktopDataRoot;
  exports.inspectLegacyDesktopMigration = inspectLegacyDesktopMigration;
  exports.readLegacyDesktopMigrationStatus = readLegacyDesktopMigrationStatus;
  exports.migrateLegacyDesktopData = migrateLegacyDesktopData;
  exports.legacyDesktopMigrationMarkerPath = legacyDesktopMigrationMarkerPath;
  var node_crypto_1 = __require("node:crypto");
  var node_fs_1 = __require("node:fs");
  var promises_1 = __require("node:fs/promises");
  var node_os_1 = __require("node:os");
  var node_path_1 = __require("node:path");
  exports.LEGACY_DESKTOP_MIGRATION_VERSION = 1;
  var MARKER_NAME = ".legacy-desktop-migration-v1.json";
  var LOCK_NAME = ".legacy-desktop-migration-v1.lock";
  var PROFILE_LOCK_NAME = ".cthutool-agent.lock";
  var STATUS_PATH = (0, node_path_1.join)("migration", "legacy-desktop-status.json");
  function resolveLegacyDesktopDataRoot(options = {}) {
    const platform2 = options.platform ?? process.platform;
    const home = (0, node_path_1.resolve)(options.homeDir ?? (0, node_os_1.homedir)());
    const environment = options.env ?? process.env;
    if (platform2 === "darwin") {
      return (0, node_path_1.join)(home, "Library", "Application Support", "CthuDesktop");
    }
    if (platform2 === "win32") {
      return (0, node_path_1.join)(environment.APPDATA ?? (0, node_path_1.join)(home, "AppData", "Roaming"), "CthuDesktop");
    }
    return (0, node_path_1.join)(environment.XDG_CONFIG_HOME ?? (0, node_path_1.join)(home, ".config"), "CthuDesktop");
  }
  async function inspectLegacyDesktopMigration(input) {
    return publicReport(await createMigrationPlan(input));
  }
  async function readLegacyDesktopMigrationStatus(agentRootDir) {
    try {
      return parseReport(JSON.parse(await (0, promises_1.readFile)((0, node_path_1.join)(agentRootDir, STATUS_PATH), "utf8")));
    } catch (error) {
      if (error.code === "ENOENT")
        return;
      return;
    }
  }
  async function migrateLegacyDesktopData(input) {
    const plan = await createMigrationPlan(input);
    if (plan.status !== "ready" || !plan.target || !plan.targetRootDir) {
      const report2 = publicReport(plan);
      await persistReport(input.agentRootDir, report2);
      return report2;
    }
    await (0, promises_1.mkdir)(plan.targetRootDir, { mode: 448, recursive: true });
    const profileLockPath = (0, node_path_1.join)(plan.targetRootDir, "browser-profiles", PROFILE_LOCK_NAME);
    if (await isActiveLock(profileLockPath)) {
      return persistAndReturn(input.agentRootDir, report({
        status: "locked",
        reason: "migration-active-lock",
        message: "Legacy data migration is blocked by an active Agent profile lock; stop the Agent and retry.",
        environmentId: plan.target.environmentId,
        retryCommand: "chc agent stop && chc agent start"
      }));
    }
    const lockPath = (0, node_path_1.join)(plan.targetRootDir, LOCK_NAME);
    const lock = await acquireMigrationLock(lockPath);
    if (!lock) {
      return persistAndReturn(input.agentRootDir, report({
        status: "locked",
        reason: "migration-active-lock",
        message: "Another legacy data migration owns the environment lock; retry after it finishes.",
        environmentId: plan.target.environmentId,
        retryCommand: "chc agent doctor"
      }));
    }
    const stagingRoot = (0, node_path_1.join)(plan.targetRootDir, `.legacy-desktop-staging-${(0, node_crypto_1.randomUUID)()}`);
    try {
      await (0, promises_1.mkdir)(stagingRoot, { mode: 448, recursive: false });
      const sourceEntries = plan.legacyProfilesDir ? await collectTree(plan.legacyProfilesDir) : [];
      const stagedProfiles = (0, node_path_1.join)(stagingRoot, "browser-profiles");
      await copyTreeEntries(plan.legacyProfilesDir, stagedProfiles, sourceEntries);
      await assertTreeMatches(stagedProfiles, sourceEntries);
      const transformedConfig = transformLegacyConfig(plan.legacyConfig);
      const stagedConfigPath = (0, node_path_1.join)(stagingRoot, "config.json");
      if (transformedConfig) {
        await writePrivateJson(stagedConfigPath, transformedConfig);
      }
      await input.hooks?.afterStaging?.();
      const targetProfiles = (0, node_path_1.join)(plan.targetRootDir, "browser-profiles");
      await assertDestinationCompatible(targetProfiles, sourceEntries);
      await copyTreeEntries(stagedProfiles, targetProfiles, sourceEntries);
      await assertTreeContains(targetProfiles, sourceEntries);
      const sourceAfterCommit = plan.legacyProfilesDir ? await collectTree(plan.legacyProfilesDir) : [];
      if (treeDigest(sourceAfterCommit) !== treeDigest(sourceEntries)) {
        throw new Error("Legacy browser profiles changed during migration");
      }
      let configApplied = false;
      const targetConfigPath = (0, node_path_1.join)(plan.targetRootDir, "config.json");
      if (transformedConfig && !await pathExists(targetConfigPath)) {
        await (0, promises_1.copyFile)(stagedConfigPath, targetConfigPath, node_fs_1.constants.COPYFILE_EXCL);
        await chmodPrivate(targetConfigPath);
        configApplied = true;
      }
      const marker = {
        schemaVersion: exports.LEGACY_DESKTOP_MIGRATION_VERSION,
        environmentId: plan.target.environmentId,
        legacyRootDir: (0, node_path_1.resolve)(input.legacyRootDir),
        sourceProfileDigest: treeDigest(sourceEntries),
        sourceProfileFiles: sourceEntries.filter((entry) => entry.kind === "file").length,
        configApplied,
        completedAt: new Date().toISOString()
      };
      await writePrivateJson((0, node_path_1.join)(plan.targetRootDir, MARKER_NAME), marker);
      return persistAndReturn(input.agentRootDir, report({
        status: "migrated",
        reason: "migration-complete",
        message: "Legacy Desktop settings and browser profiles were copied without changing the originals.",
        environmentId: plan.target.environmentId,
        copiedProfileFiles: marker.sourceProfileFiles,
        configApplied
      }));
    } catch (error) {
      return persistAndReturn(input.agentRootDir, report({
        status: "failed",
        reason: "migration-failed",
        message: safeErrorMessage(error),
        environmentId: plan.target.environmentId,
        retryCommand: "chc agent doctor"
      }));
    } finally {
      await (0, promises_1.rm)(stagingRoot, { force: true, recursive: true });
      await lock.close().catch(() => {
        return;
      });
      await (0, promises_1.rm)(lockPath, { force: true });
    }
  }
  function legacyDesktopMigrationMarkerPath(agentRootDir, environment) {
    return (0, node_path_1.join)(agentRootDir, "environments", environment.namespace, MARKER_NAME);
  }
  async function createMigrationPlan(input) {
    const legacyRootDir = (0, node_path_1.resolve)(input.legacyRootDir);
    const configPath = (0, node_path_1.join)(legacyRootDir, "config.json");
    const profilesDir = (0, node_path_1.join)(legacyRootDir, "browser-profiles");
    const [hasConfig, hasProfiles] = await Promise.all([
      pathExists(configPath),
      directoryHasEntries(profilesDir)
    ]);
    if (!hasConfig && !hasProfiles) {
      return report({
        status: "absent",
        reason: "legacy-data-absent",
        message: "No legacy Electron Desktop settings or profiles were found."
      });
    }
    let legacyConfig;
    if (hasConfig) {
      try {
        const parsed = JSON.parse(await (0, promises_1.readFile)(configPath, "utf8"));
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Legacy Desktop config is not a JSON object");
        }
        legacyConfig = parsed;
      } catch (error) {
        return report({
          status: "failed",
          reason: "migration-failed",
          message: safeErrorMessage(error),
          retryCommand: "chc agent doctor"
        });
      }
    }
    const trusted = input.environments.filter(isTrustedMigrationEnvironment);
    const legacyBackend = legacyBackendUrl(legacyConfig);
    const exactMatches = legacyBackend ? trusted.filter((environment) => comparableUrl(environment.backendHttpUrl) === comparableUrl(legacyBackend)) : [];
    let target;
    let selectionReason;
    if (exactMatches.length === 1) {
      target = exactMatches[0];
      selectionReason = "exact-backend-match";
    } else if (input.explicitEnvironmentId) {
      target = trusted.find((environment) => environment.environmentId === input.explicitEnvironmentId);
      if (!target) {
        return report({
          status: "selection-required",
          reason: "explicit-environment-untrusted-or-unknown",
          message: "The explicitly selected environment is not present in the trusted release catalog.",
          retryCommand: "chc agent env list && chc agent env set <id>"
        });
      }
      selectionReason = "explicit-environment-selection";
    } else {
      const reason = !legacyBackend ? "legacy-backend-missing" : exactMatches.length > 1 ? "legacy-backend-ambiguous" : "legacy-backend-unmatched";
      return report({
        status: "selection-required",
        reason,
        message: "Legacy data cannot be assigned to exactly one trusted environment; select it explicitly before retrying.",
        retryCommand: "chc agent env list && chc agent env set <id>"
      });
    }
    const targetRootDir = (0, node_path_1.join)((0, node_path_1.resolve)(input.agentRootDir), "environments", target.namespace);
    let marker;
    try {
      marker = await readMarker((0, node_path_1.join)(targetRootDir, MARKER_NAME));
    } catch (error) {
      return report({
        status: "failed",
        reason: "migration-failed",
        message: safeErrorMessage(error),
        environmentId: target.environmentId,
        retryCommand: "chc agent doctor"
      });
    }
    if (marker) {
      if (marker.environmentId !== target.environmentId || marker.legacyRootDir !== legacyRootDir) {
        return report({
          status: "failed",
          reason: "migration-failed",
          message: "The environment migration marker belongs to a different legacy root or environment.",
          environmentId: target.environmentId,
          retryCommand: "chc agent doctor"
        });
      }
      return {
        ...report({
          status: "already-migrated",
          reason: "migration-already-complete",
          message: "Legacy Desktop data was already migrated; the original data remains available for rollback.",
          environmentId: target.environmentId,
          copiedProfileFiles: marker.sourceProfileFiles,
          configApplied: marker.configApplied
        }),
        legacyConfig,
        legacyProfilesDir: hasProfiles ? profilesDir : undefined,
        target,
        targetRootDir
      };
    }
    return {
      ...report({
        status: "ready",
        reason: selectionReason,
        message: "Legacy Desktop data is ready for non-destructive migration.",
        environmentId: target.environmentId
      }),
      legacyConfig,
      legacyProfilesDir: hasProfiles ? profilesDir : undefined,
      target,
      targetRootDir
    };
  }
  function legacyBackendUrl(config) {
    const activeId = text(config?.activeEnvironmentId);
    const activeProfile = config?.environmentProfiles?.find((profile) => text(profile.id) === activeId);
    return text(activeProfile?.backendUrl) ?? text(config?.activeEnvironment?.backendUrl) ?? text(config?.backendUrl);
  }
  function transformLegacyConfig(config) {
    if (!config)
      return;
    const deviceName = text(config.deviceName);
    const browserExecutablePath = text(config.browserRuntime?.executablePath);
    const connectionEnabled = typeof config.connectionEnabled === "boolean" ? config.connectionEnabled : undefined;
    const transformed = {
      ...deviceName ? { deviceName } : {},
      ...connectionEnabled === undefined ? {} : { connectionEnabled },
      ...browserExecutablePath ? { browserExecutablePath } : {}
    };
    return Object.keys(transformed).length > 0 ? transformed : undefined;
  }
  function comparableUrl(value) {
    try {
      const url = new URL(value.trim());
      if (url.username || url.password || url.search || url.hash)
        return;
      return url.href.replace(/\/+$/, "");
    } catch {
      return;
    }
  }
  function isTrustedMigrationEnvironment(environment) {
    if (environment.trust === "custom-development" || !/^[a-z][a-z0-9-]{0,63}$/.test(environment.environmentId) || !/^[a-z][a-z0-9_-]{0,63}$/.test(environment.namespace)) {
      return false;
    }
    const backend = comparableUrl(environment.backendHttpUrl);
    return Boolean(backend && new URL(backend).protocol === "https:");
  }
  async function collectTree(root) {
    if (!await pathExists(root))
      return [];
    const output = [];
    await walkTree((0, node_path_1.resolve)(root), (0, node_path_1.resolve)(root), output);
    return output.sort((left, right) => left.path.localeCompare(right.path));
  }
  async function walkTree(root, directory, output) {
    for (const entry of await (0, promises_1.readdir)(directory, { withFileTypes: true })) {
      if (entry.name === PROFILE_LOCK_NAME)
        continue;
      const absolutePath = (0, node_path_1.join)(directory, entry.name);
      const relativePath = portablePath((0, node_path_1.relative)(root, absolutePath));
      if (entry.isDirectory()) {
        await walkTree(root, absolutePath, output);
      } else if (entry.isFile()) {
        const metadata = await (0, promises_1.stat)(absolutePath);
        output.push({
          kind: "file",
          path: relativePath,
          sha256: await sha256File(absolutePath),
          mode: metadata.mode & 511
        });
      } else if (entry.isSymbolicLink()) {
        const rawTarget = await (0, promises_1.readlink)(absolutePath);
        const resolvedTarget = (0, node_path_1.resolve)((0, node_path_1.dirname)(absolutePath), rawTarget);
        assertInside(root, resolvedTarget);
        output.push({
          kind: "symlink",
          path: relativePath,
          targetPath: portablePath((0, node_path_1.relative)(root, resolvedTarget))
        });
      } else {
        throw new Error(`Unsupported legacy profile entry: ${relativePath}`);
      }
    }
  }
  async function copyTreeEntries(sourceRoot, destinationRoot, entries) {
    if (!sourceRoot || entries.length === 0)
      return;
    await (0, promises_1.mkdir)(destinationRoot, { mode: 448, recursive: true });
    for (const entry of entries) {
      const source = joinPortable(sourceRoot, entry.path);
      const destination = joinPortable(destinationRoot, entry.path);
      await (0, promises_1.mkdir)((0, node_path_1.dirname)(destination), { mode: 448, recursive: true });
      if (await pathExists(destination))
        continue;
      if (entry.kind === "file") {
        await (0, promises_1.copyFile)(source, destination, node_fs_1.constants.COPYFILE_EXCL);
        if (process.platform !== "win32")
          await (0, promises_1.chmod)(destination, entry.mode);
      } else {
        const target = joinPortable(destinationRoot, entry.targetPath);
        const linkTarget = (0, node_path_1.relative)((0, node_path_1.dirname)(destination), target) || ".";
        await (0, promises_1.symlink)(linkTarget, destination);
      }
    }
  }
  async function assertDestinationCompatible(destinationRoot, entries) {
    for (const entry of entries) {
      const destination = joinPortable(destinationRoot, entry.path);
      if (!await pathExists(destination))
        continue;
      if (entry.kind === "file") {
        const metadata = await (0, promises_1.lstat)(destination);
        if (!metadata.isFile() || await sha256File(destination) !== entry.sha256) {
          throw new Error(`Agent profile destination conflicts at ${entry.path}`);
        }
      } else {
        const metadata = await (0, promises_1.lstat)(destination);
        if (!metadata.isSymbolicLink()) {
          throw new Error(`Agent profile destination conflicts at ${entry.path}`);
        }
        const actual = (0, node_path_1.resolve)((0, node_path_1.dirname)(destination), await (0, promises_1.readlink)(destination));
        const expected = joinPortable(destinationRoot, entry.targetPath);
        if (actual !== expected) {
          throw new Error(`Agent profile destination conflicts at ${entry.path}`);
        }
      }
    }
  }
  async function assertTreeMatches(root, expected) {
    const actual = await collectTree(root);
    if (treeDigest(actual) !== treeDigest(expected)) {
      throw new Error("Staged legacy browser profile validation failed");
    }
  }
  async function assertTreeContains(root, expected) {
    await assertDestinationCompatible(root, expected);
  }
  function treeDigest(entries) {
    return (0, node_crypto_1.createHash)("sha256").update(JSON.stringify(entries)).digest("hex");
  }
  async function sha256File(path) {
    const hash = (0, node_crypto_1.createHash)("sha256");
    await new Promise((resolvePromise, reject) => {
      const stream = (0, node_fs_1.createReadStream)(path);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.once("end", resolvePromise);
      stream.once("error", reject);
    });
    return hash.digest("hex");
  }
  async function readMarker(path) {
    try {
      const input = JSON.parse(await (0, promises_1.readFile)(path, "utf8"));
      if (input?.schemaVersion !== exports.LEGACY_DESKTOP_MIGRATION_VERSION || typeof input.environmentId !== "string" || typeof input.legacyRootDir !== "string" || typeof input.sourceProfileDigest !== "string" || typeof input.sourceProfileFiles !== "number" || typeof input.configApplied !== "boolean") {
        throw new Error("Legacy migration marker is invalid");
      }
      return input;
    } catch (error) {
      if (error.code === "ENOENT")
        return;
      throw error;
    }
  }
  async function persistReport(agentRootDir, value) {
    await writePrivateJson((0, node_path_1.join)(agentRootDir, STATUS_PATH), value);
  }
  async function persistAndReturn(agentRootDir, value) {
    await persistReport(agentRootDir, value);
    return value;
  }
  async function writePrivateJson(path, value) {
    await (0, promises_1.mkdir)((0, node_path_1.dirname)(path), { mode: 448, recursive: true });
    const temporary = `${path}.tmp-${(0, node_crypto_1.randomUUID)()}`;
    await (0, promises_1.writeFile)(temporary, `${JSON.stringify(value, null, 2)}
`, {
      mode: 384
    });
    await chmodPrivate(temporary);
    await (0, promises_1.rename)(temporary, path);
  }
  async function chmodPrivate(path) {
    if (process.platform !== "win32")
      await (0, promises_1.chmod)(path, 384);
  }
  async function directoryHasEntries(path) {
    try {
      return (await (0, promises_1.readdir)(path)).some((name) => name !== PROFILE_LOCK_NAME);
    } catch (error) {
      if (error.code === "ENOENT")
        return false;
      throw error;
    }
  }
  async function pathExists(path) {
    try {
      await (0, promises_1.lstat)(path);
      return true;
    } catch (error) {
      if (error.code === "ENOENT")
        return false;
      throw error;
    }
  }
  async function acquireMigrationLock(path) {
    for (let attempt = 0;attempt < 4; attempt += 1) {
      try {
        const handle = await (0, promises_1.open)(path, "wx", 384);
        await handle.writeFile(`${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })}
`);
        return handle;
      } catch (error) {
        if (error.code !== "EEXIST")
          throw error;
        const raw = await (0, promises_1.readFile)(path, "utf8").catch(() => {
          return;
        });
        if (raw === undefined)
          continue;
        const pid = lockPid(raw);
        if (pid && isProcessAlive(pid))
          return;
        if (!pid && await isRecentFile(path))
          return;
        await removeIfUnchanged(path, raw);
      }
    }
    throw new Error("Unable to acquire the legacy data migration lock");
  }
  async function isActiveLock(path) {
    const raw = await (0, promises_1.readFile)(path, "utf8").catch((error) => {
      if (error.code === "ENOENT")
        return;
      throw error;
    });
    if (raw === undefined)
      return false;
    const pid = lockPid(raw);
    if (pid && isProcessAlive(pid))
      return true;
    await removeIfUnchanged(path, raw);
    return false;
  }
  async function removeIfUnchanged(path, expected) {
    const current = await (0, promises_1.readFile)(path, "utf8").catch(() => {
      return;
    });
    if (current === expected)
      await (0, promises_1.rm)(path, { force: true });
  }
  function lockPid(raw) {
    try {
      const value = JSON.parse(raw);
      return typeof value.pid === "number" && Number.isSafeInteger(value.pid) && value.pid > 0 ? value.pid : undefined;
    } catch {
      return;
    }
  }
  function isProcessAlive(pid) {
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return error.code === "EPERM";
    }
  }
  async function isRecentFile(path) {
    try {
      return Date.now() - (await (0, promises_1.stat)(path)).mtimeMs < 60000;
    } catch (error) {
      if (error.code === "ENOENT")
        return false;
      throw error;
    }
  }
  function report(input) {
    return {
      schemaVersion: exports.LEGACY_DESKTOP_MIGRATION_VERSION,
      status: input.status,
      reason: input.reason,
      message: input.message,
      copiedProfileFiles: input.copiedProfileFiles ?? 0,
      configApplied: input.configApplied ?? false,
      ...input.environmentId ? { environmentId: input.environmentId } : {},
      ...input.retryCommand ? { retryCommand: input.retryCommand } : {}
    };
  }
  function publicReport(plan) {
    return {
      schemaVersion: plan.schemaVersion,
      status: plan.status,
      reason: plan.reason,
      message: plan.message,
      copiedProfileFiles: plan.copiedProfileFiles,
      configApplied: plan.configApplied,
      ...plan.environmentId ? { environmentId: plan.environmentId } : {},
      ...plan.retryCommand ? { retryCommand: plan.retryCommand } : {}
    };
  }
  function parseReport(input) {
    if (!input || typeof input !== "object")
      return;
    const value = input;
    return value.schemaVersion === exports.LEGACY_DESKTOP_MIGRATION_VERSION && typeof value.status === "string" && typeof value.reason === "string" && typeof value.message === "string" ? value : undefined;
  }
  function safeErrorMessage(error) {
    const message = error instanceof Error ? error.message : "Migration failed";
    return message.replace(/(secret|token|password)\s*[=:]\s*\S+/gi, "$1=[redacted]").slice(0, 500);
  }
  function text(input) {
    return typeof input === "string" && input.trim() ? input.trim() : undefined;
  }
  function joinPortable(root, path) {
    const segments = path.split("/").filter(Boolean);
    const output = (0, node_path_1.resolve)(root, ...segments);
    assertInside((0, node_path_1.resolve)(root), output);
    return output;
  }
  function portablePath(path) {
    return path.split(node_path_1.sep).join("/");
  }
  function assertInside(root, path) {
    const child = (0, node_path_1.relative)((0, node_path_1.resolve)(root), (0, node_path_1.resolve)(path));
    if (child === ".." || child.startsWith(`..${node_path_1.sep}`) || (0, node_path_1.isAbsolute)(child)) {
      throw new Error("Legacy profile entry escapes its profile root");
    }
  }
});

// ../../packages/agent-data-migration/dist/index.js
var require_dist = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o3, m3, k4, k22) {
    if (k22 === undefined)
      k22 = k4;
    var desc = Object.getOwnPropertyDescriptor(m3, k4);
    if (!desc || ("get" in desc ? !m3.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m3[k4];
      } };
    }
    Object.defineProperty(o3, k22, desc);
  } : function(o3, m3, k4, k22) {
    if (k22 === undefined)
      k22 = k4;
    o3[k22] = m3[k4];
  });
  var __exportStar = exports && exports.__exportStar || function(m3, exports2) {
    for (var p in m3)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m3, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_legacy_desktop_migration(), exports);
});

// ../../packages/agent-release/dist/layout.js
var require_layout = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.BundleLayoutError = exports.MUTABLE_AGENT_PATH_SEGMENTS = exports.REQUIRED_COMMON_BUNDLE_PATHS = undefined;
  exports.createBundleLayout = createBundleLayout;
  exports.validateBundleLayout = validateBundleLayout;
  exports.validateBundleInventory = validateBundleInventory;
  exports.normalizeArchivePath = normalizeArchivePath;
  exports.REQUIRED_COMMON_BUNDLE_PATHS = [
    "layout.json",
    "agent/dist/index.js",
    "agent/environments.json",
    "licenses/NODE_LICENSE",
    "licenses/THIRD_PARTY_NOTICES.txt"
  ];
  exports.MUTABLE_AGENT_PATH_SEGMENTS = [
    "environment.json",
    "browser-profiles",
    "logs",
    "config.json"
  ];
  var FORBIDDEN_VERSION_PATH_SEGMENTS = [
    ...exports.MUTABLE_AGENT_PATH_SEGMENTS,
    "agent-secret"
  ];

  class BundleLayoutError extends Error {
    code;
    constructor(code, message) {
      super(message);
      this.code = code;
      this.name = "BundleLayoutError";
    }
  }
  exports.BundleLayoutError = BundleLayoutError;
  function createBundleLayout(target, releaseVersion) {
    const windows = target === "windows-x64";
    return {
      layoutVersion: 1,
      releaseVersion,
      target,
      entryPoints: {
        tray: windows ? "bin/cthutool-agent-tray.exe" : "bin/CthuTool Agent.app/Contents/MacOS/cthutool-agent-tray",
        node: windows ? "runtime/node/node.exe" : "runtime/node/bin/node",
        agent: "agent/dist/index.js",
        environmentCatalog: "agent/environments.json"
      },
      mutableDataRoot: "external-user-data"
    };
  }
  function validateBundleLayout(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new BundleLayoutError("INVALID_PATH", "Bundle layout must be an object");
    }
    const value = input;
    const keys = Object.keys(value).sort();
    const expectedKeys = [
      "entryPoints",
      "layoutVersion",
      "mutableDataRoot",
      "releaseVersion",
      "target"
    ];
    if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index]) || value.layoutVersion !== 1 || value.mutableDataRoot !== "external-user-data" || !SUPPORTED_TARGET_SET.has(value.target) || typeof value.releaseVersion !== "string") {
      throw new BundleLayoutError("INVALID_PATH", "Bundle layout contract is invalid");
    }
    const expected = createBundleLayout(value.target, value.releaseVersion);
    const entryPoints = value.entryPoints;
    if (!entryPoints || typeof entryPoints !== "object" || Array.isArray(entryPoints) || Object.keys(entryPoints).sort().join(",") !== ["agent", "environmentCatalog", "node", "tray"].join(",") || Object.entries(expected.entryPoints).some(([key, entryPoint]) => entryPoints[key] !== entryPoint)) {
      throw new BundleLayoutError("INVALID_PATH", "Bundle layout entry points do not match the target contract");
    }
    return expected;
  }
  var SUPPORTED_TARGET_SET = new Set([
    "darwin-arm64",
    "darwin-x64",
    "windows-x64"
  ]);
  function validateBundleInventory(target, rawPaths) {
    const paths = [...new Set(rawPaths.map(normalizeArchivePath))].sort();
    const layout = createBundleLayout(target, "0.0.0");
    const required = [
      ...exports.REQUIRED_COMMON_BUNDLE_PATHS,
      layout.entryPoints.tray,
      layout.entryPoints.node,
      ...target.startsWith("darwin-") ? ["bin/CthuTool Agent.app/Contents/Info.plist"] : []
    ];
    for (const expected of required) {
      if (!paths.includes(expected)) {
        throw new BundleLayoutError("MISSING_FILE", `Agent bundle is missing ${expected}`);
      }
    }
    for (const browserDependency of ["playwright", "playwright-core"]) {
      if (!paths.some((path) => path.startsWith("agent/node_modules/") && path.endsWith(`/node_modules/${browserDependency}/package.json`) || path === `agent/node_modules/${browserDependency}/package.json`)) {
        throw new BundleLayoutError("MISSING_FILE", `Agent bundle is missing the ${browserDependency} browser dependency`);
      }
    }
    for (const path of paths) {
      const lower = path.toLowerCase();
      const dependencyAsset = lower.startsWith("agent/node_modules/");
      if (lower.startsWith("electron/") || lower.includes("/node_modules/electron/") || lower.includes("electron framework") || lower.startsWith("webview/") || lower.includes("/embeddedwebview.framework/") || lower.startsWith("desktop/") || lower.includes("/renderer/") || lower.startsWith("web/") || lower.includes("/_next/") || !dependencyAsset && (lower.endsWith(".html") || lower.endsWith(".css")) || lower.endsWith(".js") && !lower.startsWith("agent/")) {
        throw new BundleLayoutError("FORBIDDEN_CONTENT", `Agent bundle contains local UI runtime or assets: ${path}`);
      }
      if (FORBIDDEN_VERSION_PATH_SEGMENTS.some((segment) => path === segment || path.split("/").includes(segment))) {
        throw new BundleLayoutError("MUTABLE_CONTENT", `Mutable Agent data must remain outside version contents: ${path}`);
      }
    }
    return paths;
  }
  function normalizeArchivePath(input) {
    const path = input.replaceAll("\\", "/").replace(/^\.\//, "");
    if (!path || path.startsWith("/") || /^[A-Za-z]:/.test(path) || path.split("/").some((part) => !part || part === "." || part === "..")) {
      throw new BundleLayoutError("INVALID_PATH", `Unsafe Agent archive path: ${input}`);
    }
    return path;
  }
});

// ../../packages/agent-release/dist/activation.js
var require_activation = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.stageVersion = stageVersion;
  exports.activateVersion = activateVersion;
  exports.rollbackActiveVersion = rollbackActiveVersion;
  exports.readActiveVersion = readActiveVersion;
  var node_crypto_1 = __require("node:crypto");
  var promises_1 = __require("node:fs/promises");
  var node_path_1 = __require("node:path");
  var layout_1 = require_layout();
  async function stageVersion(input) {
    assertVersion(input.version);
    const versionsRoot = (0, node_path_1.join)(input.installRoot, "versions");
    const versionRoot = (0, node_path_1.join)(versionsRoot, input.version);
    const stagingRoot = (0, node_path_1.join)(versionsRoot, `.${input.version}.staging-${(0, node_crypto_1.randomUUID)()}`);
    await (0, promises_1.mkdir)(versionsRoot, { recursive: true });
    if (await pathExists(versionRoot)) {
      (0, layout_1.validateBundleInventory)(input.target, await listRelativeFiles(versionRoot));
      return versionRoot;
    }
    try {
      await (0, promises_1.cp)(input.extractedRoot, stagingRoot, {
        errorOnExist: true,
        force: false,
        recursive: true
      });
      (0, layout_1.validateBundleInventory)(input.target, await listRelativeFiles(stagingRoot));
      try {
        await (0, promises_1.rename)(stagingRoot, versionRoot);
      } catch (error) {
        if (error.code !== "EEXIST" && error.code !== "ENOTEMPTY") {
          throw error;
        }
        await (0, promises_1.rm)(stagingRoot, { force: true, recursive: true });
        (0, layout_1.validateBundleInventory)(input.target, await listRelativeFiles(versionRoot));
      }
      return versionRoot;
    } catch (error) {
      await (0, promises_1.rm)(stagingRoot, { force: true, recursive: true });
      throw error;
    }
  }
  async function pathExists(path) {
    try {
      await (0, promises_1.stat)(path);
      return true;
    } catch (error) {
      if (error.code === "ENOENT") {
        return false;
      }
      throw error;
    }
  }
  async function activateVersion(input) {
    assertVersion(input.version);
    const versionRoot = (0, node_path_1.join)(input.installRoot, "versions", input.version);
    const activePath = (0, node_path_1.join)(input.installRoot, "active.json");
    const previous = await readActiveVersion(input.installRoot);
    await input.smokeCheck(versionRoot);
    const pointer = {
      schemaVersion: 1,
      version: input.version,
      activatedAt: (input.now ?? (() => new Date))().toISOString()
    };
    await atomicWrite(activePath, pointer);
    if (previous && previous.version !== pointer.version) {
      await atomicWrite((0, node_path_1.join)(input.installRoot, "previous.json"), previous);
    }
    return pointer;
  }
  async function rollbackActiveVersion(input) {
    const previousPath = (0, node_path_1.join)(input.installRoot, "previous.json");
    const previous = parsePointer(JSON.parse(await (0, promises_1.readFile)(previousPath, "utf8")));
    await input.smokeCheck((0, node_path_1.join)(input.installRoot, "versions", previous.version));
    await atomicWrite((0, node_path_1.join)(input.installRoot, "active.json"), previous);
    return previous;
  }
  async function readActiveVersion(installRoot) {
    try {
      return parsePointer(JSON.parse(await (0, promises_1.readFile)((0, node_path_1.join)(installRoot, "active.json"), "utf8")));
    } catch (error) {
      if (error.code === "ENOENT") {
        return;
      }
      throw error;
    }
  }
  function parsePointer(input) {
    if (!input || typeof input !== "object" || input.schemaVersion !== 1 || typeof input.version !== "string" || typeof input.activatedAt !== "string") {
      throw new Error("Active Agent version pointer is invalid");
    }
    const pointer = input;
    assertVersion(pointer.version);
    return pointer;
  }
  async function atomicWrite(path, value) {
    await (0, promises_1.mkdir)((0, node_path_1.dirname)(path), { recursive: true });
    const temporary = `${path}.tmp-${(0, node_crypto_1.randomUUID)()}`;
    await (0, promises_1.writeFile)(temporary, `${JSON.stringify(value, null, 2)}
`, {
      mode: 384
    });
    await (0, promises_1.rename)(temporary, path);
  }
  async function listRelativeFiles(root, directory = root) {
    const output = [];
    for (const entry of await (0, promises_1.readdir)(directory, { withFileTypes: true })) {
      const path = (0, node_path_1.join)(directory, entry.name);
      if (entry.isDirectory()) {
        output.push(...await listRelativeFiles(root, path));
      } else if (entry.isFile()) {
        output.push(path.slice(root.length + 1).replaceAll("\\", "/"));
      }
    }
    return output;
  }
  function assertVersion(version) {
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
      throw new Error("Agent version directory name is invalid");
    }
  }
});

// ../../node_modules/.pnpm/fflate@0.8.2/node_modules/fflate/lib/node.cjs
var require_node = __commonJS((exports) => {
  var Worker;
  var workerAdd = ";var __w=require('worker_threads');__w.parentPort.on('message',function(m){onmessage({data:m})}),postMessage=function(m,t){__w.parentPort.postMessage(m,t)},close=process.exit;self=global";
  try {
    Worker = __require("worker_threads").Worker;
  } catch (e3) {}
  var node_worker_1 = {};
  node_worker_1["default"] = Worker ? function(c4, _5, msg, transfer, cb) {
    var done = false;
    var w3 = new Worker(c4 + workerAdd, { eval: true }).on("error", function(e3) {
      return cb(e3, null);
    }).on("message", function(m3) {
      return cb(null, m3);
    }).on("exit", function(c5) {
      if (c5 && !done)
        cb(new Error("exited with code " + c5), null);
    });
    w3.postMessage(msg, transfer);
    w3.terminate = function() {
      done = true;
      return Worker.prototype.terminate.call(w3);
    };
    return w3;
  } : function(_5, __, ___, ____, cb) {
    setImmediate(function() {
      return cb(new Error("async operations unsupported - update to Node 12+ (or Node 10-11 with the --experimental-worker CLI flag)"), null);
    });
    var NOP = function() {};
    return {
      terminate: NOP,
      postMessage: NOP
    };
  };
  var u8 = Uint8Array;
  var u16 = Uint16Array;
  var i32 = Int32Array;
  var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]);
  var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]);
  var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var freb = function(eb, start) {
    var b5 = new u16(31);
    for (var i3 = 0;i3 < 31; ++i3) {
      b5[i3] = start += 1 << eb[i3 - 1];
    }
    var r4 = new i32(b5[30]);
    for (var i3 = 1;i3 < 30; ++i3) {
      for (var j3 = b5[i3];j3 < b5[i3 + 1]; ++j3) {
        r4[j3] = j3 - b5[i3] << 5 | i3;
      }
    }
    return { b: b5, r: r4 };
  };
  var _a = freb(fleb, 2);
  var fl = _a.b;
  var revfl = _a.r;
  fl[28] = 258, revfl[258] = 28;
  var _b = freb(fdeb, 0);
  var fd = _b.b;
  var revfd = _b.r;
  var rev = new u16(32768);
  for (i2 = 0;i2 < 32768; ++i2) {
    x3 = (i2 & 43690) >> 1 | (i2 & 21845) << 1;
    x3 = (x3 & 52428) >> 2 | (x3 & 13107) << 2;
    x3 = (x3 & 61680) >> 4 | (x3 & 3855) << 4;
    rev[i2] = ((x3 & 65280) >> 8 | (x3 & 255) << 8) >> 1;
  }
  var x3;
  var i2;
  var hMap = function(cd, mb, r4) {
    var s2 = cd.length;
    var i3 = 0;
    var l3 = new u16(mb);
    for (;i3 < s2; ++i3) {
      if (cd[i3])
        ++l3[cd[i3] - 1];
    }
    var le3 = new u16(mb);
    for (i3 = 1;i3 < mb; ++i3) {
      le3[i3] = le3[i3 - 1] + l3[i3 - 1] << 1;
    }
    var co;
    if (r4) {
      co = new u16(1 << mb);
      var rvb = 15 - mb;
      for (i3 = 0;i3 < s2; ++i3) {
        if (cd[i3]) {
          var sv = i3 << 4 | cd[i3];
          var r_1 = mb - cd[i3];
          var v3 = le3[cd[i3] - 1]++ << r_1;
          for (var m3 = v3 | (1 << r_1) - 1;v3 <= m3; ++v3) {
            co[rev[v3] >> rvb] = sv;
          }
        }
      }
    } else {
      co = new u16(s2);
      for (i3 = 0;i3 < s2; ++i3) {
        if (cd[i3]) {
          co[i3] = rev[le3[cd[i3] - 1]++] >> 15 - cd[i3];
        }
      }
    }
    return co;
  };
  var flt = new u8(288);
  for (i2 = 0;i2 < 144; ++i2)
    flt[i2] = 8;
  var i2;
  for (i2 = 144;i2 < 256; ++i2)
    flt[i2] = 9;
  var i2;
  for (i2 = 256;i2 < 280; ++i2)
    flt[i2] = 7;
  var i2;
  for (i2 = 280;i2 < 288; ++i2)
    flt[i2] = 8;
  var i2;
  var fdt = new u8(32);
  for (i2 = 0;i2 < 32; ++i2)
    fdt[i2] = 5;
  var i2;
  var flm = /* @__PURE__ */ hMap(flt, 9, 0);
  var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
  var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
  var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
  var max = function(a4) {
    var m3 = a4[0];
    for (var i3 = 1;i3 < a4.length; ++i3) {
      if (a4[i3] > m3)
        m3 = a4[i3];
    }
    return m3;
  };
  var bits = function(d3, p, m3) {
    var o3 = p / 8 | 0;
    return (d3[o3] | d3[o3 + 1] << 8) >> (p & 7) & m3;
  };
  var bits16 = function(d3, p) {
    var o3 = p / 8 | 0;
    return (d3[o3] | d3[o3 + 1] << 8 | d3[o3 + 2] << 16) >> (p & 7);
  };
  var shft = function(p) {
    return (p + 7) / 8 | 0;
  };
  var slc = function(v3, s2, e3) {
    if (s2 == null || s2 < 0)
      s2 = 0;
    if (e3 == null || e3 > v3.length)
      e3 = v3.length;
    return new u8(v3.subarray(s2, e3));
  };
  exports.FlateErrorCode = {
    UnexpectedEOF: 0,
    InvalidBlockType: 1,
    InvalidLengthLiteral: 2,
    InvalidDistance: 3,
    StreamFinished: 4,
    NoStreamHandler: 5,
    InvalidHeader: 6,
    NoCallback: 7,
    InvalidUTF8: 8,
    ExtraFieldTooLong: 9,
    InvalidDate: 10,
    FilenameTooLong: 11,
    StreamFinishing: 12,
    InvalidZipData: 13,
    UnknownCompressionMethod: 14
  };
  var ec = [
    "unexpected EOF",
    "invalid block type",
    "invalid length/literal",
    "invalid distance",
    "stream finished",
    "no stream handler",
    ,
    "no callback",
    "invalid UTF-8 data",
    "extra field too long",
    "date not in range 1980-2099",
    "filename too long",
    "stream finishing",
    "invalid zip data"
  ];
  var err = function(ind, msg, nt) {
    var e3 = new Error(msg || ec[ind]);
    e3.code = ind;
    if (Error.captureStackTrace)
      Error.captureStackTrace(e3, err);
    if (!nt)
      throw e3;
    return e3;
  };
  var inflt = function(dat, st, buf, dict) {
    var sl = dat.length, dl = dict ? dict.length : 0;
    if (!sl || st.f && !st.l)
      return buf || new u8(0);
    var noBuf = !buf;
    var resize = noBuf || st.i != 2;
    var noSt = st.i;
    if (noBuf)
      buf = new u8(sl * 3);
    var cbuf = function(l4) {
      var bl = buf.length;
      if (l4 > bl) {
        var nbuf = new u8(Math.max(bl * 2, l4));
        nbuf.set(buf);
        buf = nbuf;
      }
    };
    var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
    var tbts = sl * 8;
    do {
      if (!lm) {
        final = bits(dat, pos, 1);
        var type = bits(dat, pos + 1, 3);
        pos += 3;
        if (!type) {
          var s2 = shft(pos) + 4, l3 = dat[s2 - 4] | dat[s2 - 3] << 8, t2 = s2 + l3;
          if (t2 > sl) {
            if (noSt)
              err(0);
            break;
          }
          if (resize)
            cbuf(bt + l3);
          buf.set(dat.subarray(s2, t2), bt);
          st.b = bt += l3, st.p = pos = t2 * 8, st.f = final;
          continue;
        } else if (type == 1)
          lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
        else if (type == 2) {
          var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
          var tl = hLit + bits(dat, pos + 5, 31) + 1;
          pos += 14;
          var ldt = new u8(tl);
          var clt = new u8(19);
          for (var i3 = 0;i3 < hcLen; ++i3) {
            clt[clim[i3]] = bits(dat, pos + i3 * 3, 7);
          }
          pos += hcLen * 3;
          var clb = max(clt), clbmsk = (1 << clb) - 1;
          var clm = hMap(clt, clb, 1);
          for (var i3 = 0;i3 < tl; ) {
            var r4 = clm[bits(dat, pos, clbmsk)];
            pos += r4 & 15;
            var s2 = r4 >> 4;
            if (s2 < 16) {
              ldt[i3++] = s2;
            } else {
              var c4 = 0, n2 = 0;
              if (s2 == 16)
                n2 = 3 + bits(dat, pos, 3), pos += 2, c4 = ldt[i3 - 1];
              else if (s2 == 17)
                n2 = 3 + bits(dat, pos, 7), pos += 3;
              else if (s2 == 18)
                n2 = 11 + bits(dat, pos, 127), pos += 7;
              while (n2--)
                ldt[i3++] = c4;
            }
          }
          var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
          lbt = max(lt);
          dbt = max(dt);
          lm = hMap(lt, lbt, 1);
          dm = hMap(dt, dbt, 1);
        } else
          err(1);
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
      }
      if (resize)
        cbuf(bt + 131072);
      var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
      var lpos = pos;
      for (;; lpos = pos) {
        var c4 = lm[bits16(dat, pos) & lms], sym = c4 >> 4;
        pos += c4 & 15;
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (!c4)
          err(2);
        if (sym < 256)
          buf[bt++] = sym;
        else if (sym == 256) {
          lpos = pos, lm = null;
          break;
        } else {
          var add = sym - 254;
          if (sym > 264) {
            var i3 = sym - 257, b5 = fleb[i3];
            add = bits(dat, pos, (1 << b5) - 1) + fl[i3];
            pos += b5;
          }
          var d3 = dm[bits16(dat, pos) & dms], dsym = d3 >> 4;
          if (!d3)
            err(3);
          pos += d3 & 15;
          var dt = fd[dsym];
          if (dsym > 3) {
            var b5 = fdeb[dsym];
            dt += bits16(dat, pos) & (1 << b5) - 1, pos += b5;
          }
          if (pos > tbts) {
            if (noSt)
              err(0);
            break;
          }
          if (resize)
            cbuf(bt + 131072);
          var end = bt + add;
          if (bt < dt) {
            var shift = dl - dt, dend = Math.min(dt, end);
            if (shift + bt < 0)
              err(3);
            for (;bt < dend; ++bt)
              buf[bt] = dict[shift + bt];
          }
          for (;bt < end; ++bt)
            buf[bt] = buf[bt - dt];
        }
      }
      st.l = lm, st.p = lpos, st.b = bt, st.f = final;
      if (lm)
        final = 1, st.m = lbt, st.d = dm, st.n = dbt;
    } while (!final);
    return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
  };
  var wbits = function(d3, p, v3) {
    v3 <<= p & 7;
    var o3 = p / 8 | 0;
    d3[o3] |= v3;
    d3[o3 + 1] |= v3 >> 8;
  };
  var wbits16 = function(d3, p, v3) {
    v3 <<= p & 7;
    var o3 = p / 8 | 0;
    d3[o3] |= v3;
    d3[o3 + 1] |= v3 >> 8;
    d3[o3 + 2] |= v3 >> 16;
  };
  var hTree = function(d3, mb) {
    var t2 = [];
    for (var i3 = 0;i3 < d3.length; ++i3) {
      if (d3[i3])
        t2.push({ s: i3, f: d3[i3] });
    }
    var s2 = t2.length;
    var t22 = t2.slice();
    if (!s2)
      return { t: et, l: 0 };
    if (s2 == 1) {
      var v3 = new u8(t2[0].s + 1);
      v3[t2[0].s] = 1;
      return { t: v3, l: 1 };
    }
    t2.sort(function(a4, b5) {
      return a4.f - b5.f;
    });
    t2.push({ s: -1, f: 25001 });
    var l3 = t2[0], r4 = t2[1], i0 = 0, i1 = 1, i22 = 2;
    t2[0] = { s: -1, f: l3.f + r4.f, l: l3, r: r4 };
    while (i1 != s2 - 1) {
      l3 = t2[t2[i0].f < t2[i22].f ? i0++ : i22++];
      r4 = t2[i0 != i1 && t2[i0].f < t2[i22].f ? i0++ : i22++];
      t2[i1++] = { s: -1, f: l3.f + r4.f, l: l3, r: r4 };
    }
    var maxSym = t22[0].s;
    for (var i3 = 1;i3 < s2; ++i3) {
      if (t22[i3].s > maxSym)
        maxSym = t22[i3].s;
    }
    var tr = new u16(maxSym + 1);
    var mbt = ln(t2[i1 - 1], tr, 0);
    if (mbt > mb) {
      var i3 = 0, dt = 0;
      var lft = mbt - mb, cst = 1 << lft;
      t22.sort(function(a4, b5) {
        return tr[b5.s] - tr[a4.s] || a4.f - b5.f;
      });
      for (;i3 < s2; ++i3) {
        var i2_1 = t22[i3].s;
        if (tr[i2_1] > mb) {
          dt += cst - (1 << mbt - tr[i2_1]);
          tr[i2_1] = mb;
        } else
          break;
      }
      dt >>= lft;
      while (dt > 0) {
        var i2_2 = t22[i3].s;
        if (tr[i2_2] < mb)
          dt -= 1 << mb - tr[i2_2]++ - 1;
        else
          ++i3;
      }
      for (;i3 >= 0 && dt; --i3) {
        var i2_3 = t22[i3].s;
        if (tr[i2_3] == mb) {
          --tr[i2_3];
          ++dt;
        }
      }
      mbt = mb;
    }
    return { t: new u8(tr), l: mbt };
  };
  var ln = function(n2, l3, d3) {
    return n2.s == -1 ? Math.max(ln(n2.l, l3, d3 + 1), ln(n2.r, l3, d3 + 1)) : l3[n2.s] = d3;
  };
  var lc = function(c4) {
    var s2 = c4.length;
    while (s2 && !c4[--s2])
      ;
    var cl = new u16(++s2);
    var cli = 0, cln = c4[0], cls = 1;
    var w3 = function(v3) {
      cl[cli++] = v3;
    };
    for (var i3 = 1;i3 <= s2; ++i3) {
      if (c4[i3] == cln && i3 != s2)
        ++cls;
      else {
        if (!cln && cls > 2) {
          for (;cls > 138; cls -= 138)
            w3(32754);
          if (cls > 2) {
            w3(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
            cls = 0;
          }
        } else if (cls > 3) {
          w3(cln), --cls;
          for (;cls > 6; cls -= 6)
            w3(8304);
          if (cls > 2)
            w3(cls - 3 << 5 | 8208), cls = 0;
        }
        while (cls--)
          w3(cln);
        cls = 1;
        cln = c4[i3];
      }
    }
    return { c: cl.subarray(0, cli), n: s2 };
  };
  var clen = function(cf, cl) {
    var l3 = 0;
    for (var i3 = 0;i3 < cl.length; ++i3)
      l3 += cf[i3] * cl[i3];
    return l3;
  };
  var wfblk = function(out, pos, dat) {
    var s2 = dat.length;
    var o3 = shft(pos + 2);
    out[o3] = s2 & 255;
    out[o3 + 1] = s2 >> 8;
    out[o3 + 2] = out[o3] ^ 255;
    out[o3 + 3] = out[o3 + 1] ^ 255;
    for (var i3 = 0;i3 < s2; ++i3)
      out[o3 + i3 + 4] = dat[i3];
    return (o3 + 4 + s2) * 8;
  };
  var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
    wbits(out, p++, final);
    ++lf[256];
    var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
    var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
    var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
    var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
    var lcfreq = new u16(19);
    for (var i3 = 0;i3 < lclt.length; ++i3)
      ++lcfreq[lclt[i3] & 31];
    for (var i3 = 0;i3 < lcdt.length; ++i3)
      ++lcfreq[lcdt[i3] & 31];
    var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
    var nlcc = 19;
    for (;nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
      ;
    var flen = bl + 5 << 3;
    var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
    var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
    if (bs >= 0 && flen <= ftlen && flen <= dtlen)
      return wfblk(out, p, dat.subarray(bs, bs + bl));
    var lm, ll, dm, dl;
    wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
    if (dtlen < ftlen) {
      lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
      var llm = hMap(lct, mlcb, 0);
      wbits(out, p, nlc - 257);
      wbits(out, p + 5, ndc - 1);
      wbits(out, p + 10, nlcc - 4);
      p += 14;
      for (var i3 = 0;i3 < nlcc; ++i3)
        wbits(out, p + 3 * i3, lct[clim[i3]]);
      p += 3 * nlcc;
      var lcts = [lclt, lcdt];
      for (var it = 0;it < 2; ++it) {
        var clct = lcts[it];
        for (var i3 = 0;i3 < clct.length; ++i3) {
          var len = clct[i3] & 31;
          wbits(out, p, llm[len]), p += lct[len];
          if (len > 15)
            wbits(out, p, clct[i3] >> 5 & 127), p += clct[i3] >> 12;
        }
      }
    } else {
      lm = flm, ll = flt, dm = fdm, dl = fdt;
    }
    for (var i3 = 0;i3 < li; ++i3) {
      var sym = syms[i3];
      if (sym > 255) {
        var len = sym >> 18 & 31;
        wbits16(out, p, lm[len + 257]), p += ll[len + 257];
        if (len > 7)
          wbits(out, p, sym >> 23 & 31), p += fleb[len];
        var dst = sym & 31;
        wbits16(out, p, dm[dst]), p += dl[dst];
        if (dst > 3)
          wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
      } else {
        wbits16(out, p, lm[sym]), p += ll[sym];
      }
    }
    wbits16(out, p, lm[256]);
    return p + ll[256];
  };
  var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
  var et = /* @__PURE__ */ new u8(0);
  var dflt = function(dat, lvl, plvl, pre, post, st) {
    var s2 = st.z || dat.length;
    var o3 = new u8(pre + s2 + 5 * (1 + Math.ceil(s2 / 7000)) + post);
    var w3 = o3.subarray(pre, o3.length - post);
    var lst = st.l;
    var pos = (st.r || 0) & 7;
    if (lvl) {
      if (pos)
        w3[0] = st.r >> 3;
      var opt = deo[lvl - 1];
      var n2 = opt >> 13, c4 = opt & 8191;
      var msk_1 = (1 << plvl) - 1;
      var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
      var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
      var hsh = function(i4) {
        return (dat[i4] ^ dat[i4 + 1] << bs1_1 ^ dat[i4 + 2] << bs2_1) & msk_1;
      };
      var syms = new i32(25000);
      var lf = new u16(288), df = new u16(32);
      var lc_1 = 0, eb = 0, i3 = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
      for (;i3 + 2 < s2; ++i3) {
        var hv = hsh(i3);
        var imod = i3 & 32767, pimod = head[hv];
        prev[imod] = pimod;
        head[hv] = imod;
        if (wi <= i3) {
          var rem = s2 - i3;
          if ((lc_1 > 7000 || li > 24576) && (rem > 423 || !lst)) {
            pos = wblk(dat, w3, 0, syms, lf, df, eb, li, bs, i3 - bs, pos);
            li = lc_1 = eb = 0, bs = i3;
            for (var j3 = 0;j3 < 286; ++j3)
              lf[j3] = 0;
            for (var j3 = 0;j3 < 30; ++j3)
              df[j3] = 0;
          }
          var l3 = 2, d3 = 0, ch_1 = c4, dif = imod - pimod & 32767;
          if (rem > 2 && hv == hsh(i3 - dif)) {
            var maxn = Math.min(n2, rem) - 1;
            var maxd = Math.min(32767, i3);
            var ml = Math.min(258, rem);
            while (dif <= maxd && --ch_1 && imod != pimod) {
              if (dat[i3 + l3] == dat[i3 + l3 - dif]) {
                var nl = 0;
                for (;nl < ml && dat[i3 + nl] == dat[i3 + nl - dif]; ++nl)
                  ;
                if (nl > l3) {
                  l3 = nl, d3 = dif;
                  if (nl > maxn)
                    break;
                  var mmd = Math.min(dif, nl - 2);
                  var md = 0;
                  for (var j3 = 0;j3 < mmd; ++j3) {
                    var ti = i3 - dif + j3 & 32767;
                    var pti = prev[ti];
                    var cd = ti - pti & 32767;
                    if (cd > md)
                      md = cd, pimod = ti;
                  }
                }
              }
              imod = pimod, pimod = prev[imod];
              dif += imod - pimod & 32767;
            }
          }
          if (d3) {
            syms[li++] = 268435456 | revfl[l3] << 18 | revfd[d3];
            var lin = revfl[l3] & 31, din = revfd[d3] & 31;
            eb += fleb[lin] + fdeb[din];
            ++lf[257 + lin];
            ++df[din];
            wi = i3 + l3;
            ++lc_1;
          } else {
            syms[li++] = dat[i3];
            ++lf[dat[i3]];
          }
        }
      }
      for (i3 = Math.max(i3, wi);i3 < s2; ++i3) {
        syms[li++] = dat[i3];
        ++lf[dat[i3]];
      }
      pos = wblk(dat, w3, lst, syms, lf, df, eb, li, bs, i3 - bs, pos);
      if (!lst) {
        st.r = pos & 7 | w3[pos / 8 | 0] << 3;
        pos -= 7;
        st.h = head, st.p = prev, st.i = i3, st.w = wi;
      }
    } else {
      for (var i3 = st.w || 0;i3 < s2 + lst; i3 += 65535) {
        var e3 = i3 + 65535;
        if (e3 >= s2) {
          w3[pos / 8 | 0] = lst;
          e3 = s2;
        }
        pos = wfblk(w3, pos + 1, dat.subarray(i3, e3));
      }
      st.i = s2;
    }
    return slc(o3, 0, pre + shft(pos) + post);
  };
  var crct = /* @__PURE__ */ function() {
    var t2 = new Int32Array(256);
    for (var i3 = 0;i3 < 256; ++i3) {
      var c4 = i3, k4 = 9;
      while (--k4)
        c4 = (c4 & 1 && -306674912) ^ c4 >>> 1;
      t2[i3] = c4;
    }
    return t2;
  }();
  var crc = function() {
    var c4 = -1;
    return {
      p: function(d3) {
        var cr = c4;
        for (var i3 = 0;i3 < d3.length; ++i3)
          cr = crct[cr & 255 ^ d3[i3]] ^ cr >>> 8;
        c4 = cr;
      },
      d: function() {
        return ~c4;
      }
    };
  };
  var adler = function() {
    var a4 = 1, b5 = 0;
    return {
      p: function(d3) {
        var n2 = a4, m3 = b5;
        var l3 = d3.length | 0;
        for (var i3 = 0;i3 != l3; ) {
          var e3 = Math.min(i3 + 2655, l3);
          for (;i3 < e3; ++i3)
            m3 += n2 += d3[i3];
          n2 = (n2 & 65535) + 15 * (n2 >> 16), m3 = (m3 & 65535) + 15 * (m3 >> 16);
        }
        a4 = n2, b5 = m3;
      },
      d: function() {
        a4 %= 65521, b5 %= 65521;
        return (a4 & 255) << 24 | (a4 & 65280) << 8 | (b5 & 255) << 8 | b5 >> 8;
      }
    };
  };
  var dopt = function(dat, opt, pre, post, st) {
    if (!st) {
      st = { l: 1 };
      if (opt.dictionary) {
        var dict = opt.dictionary.subarray(-32768);
        var newDat = new u8(dict.length + dat.length);
        newDat.set(dict);
        newDat.set(dat, dict.length);
        dat = newDat;
        st.w = dict.length;
      }
    }
    return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
  };
  var mrg = function(a4, b5) {
    var o3 = {};
    for (var k4 in a4)
      o3[k4] = a4[k4];
    for (var k4 in b5)
      o3[k4] = b5[k4];
    return o3;
  };
  var wcln = function(fn, fnStr, td2) {
    var dt = fn();
    var st = fn.toString();
    var ks = st.slice(st.indexOf("[") + 1, st.lastIndexOf("]")).replace(/\s+/g, "").split(",");
    for (var i3 = 0;i3 < dt.length; ++i3) {
      var v3 = dt[i3], k4 = ks[i3];
      if (typeof v3 == "function") {
        fnStr += ";" + k4 + "=";
        var st_1 = v3.toString();
        if (v3.prototype) {
          if (st_1.indexOf("[native code]") != -1) {
            var spInd = st_1.indexOf(" ", 8) + 1;
            fnStr += st_1.slice(spInd, st_1.indexOf("(", spInd));
          } else {
            fnStr += st_1;
            for (var t2 in v3.prototype)
              fnStr += ";" + k4 + ".prototype." + t2 + "=" + v3.prototype[t2].toString();
          }
        } else
          fnStr += st_1;
      } else
        td2[k4] = v3;
    }
    return fnStr;
  };
  var ch = [];
  var cbfs = function(v3) {
    var tl = [];
    for (var k4 in v3) {
      if (v3[k4].buffer) {
        tl.push((v3[k4] = new v3[k4].constructor(v3[k4])).buffer);
      }
    }
    return tl;
  };
  var wrkr = function(fns, init2, id, cb) {
    if (!ch[id]) {
      var fnStr = "", td_1 = {}, m3 = fns.length - 1;
      for (var i3 = 0;i3 < m3; ++i3)
        fnStr = wcln(fns[i3], fnStr, td_1);
      ch[id] = { c: wcln(fns[m3], fnStr, td_1), e: td_1 };
    }
    var td2 = mrg({}, ch[id].e);
    return (0, node_worker_1.default)(ch[id].c + ";onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage=" + init2.toString() + "}", id, td2, cbfs(td2), cb);
  };
  var bInflt = function() {
    return [u8, u16, i32, fleb, fdeb, clim, fl, fd, flrm, fdrm, rev, ec, hMap, max, bits, bits16, shft, slc, err, inflt, inflateSync, pbf, gopt];
  };
  var bDflt = function() {
    return [u8, u16, i32, fleb, fdeb, clim, revfl, revfd, flm, flt, fdm, fdt, rev, deo, et, hMap, wbits, wbits16, hTree, ln, lc, clen, wfblk, wblk, shft, slc, dflt, dopt, deflateSync, pbf];
  };
  var gze = function() {
    return [gzh, gzhl, wbytes, crc, crct];
  };
  var guze = function() {
    return [gzs, gzl];
  };
  var zle = function() {
    return [zlh, wbytes, adler];
  };
  var zule = function() {
    return [zls];
  };
  var pbf = function(msg) {
    return postMessage(msg, [msg.buffer]);
  };
  var gopt = function(o3) {
    return o3 && {
      out: o3.size && new u8(o3.size),
      dictionary: o3.dictionary
    };
  };
  var cbify = function(dat, opts, fns, init2, id, cb) {
    var w3 = wrkr(fns, init2, id, function(err2, dat2) {
      w3.terminate();
      cb(err2, dat2);
    });
    w3.postMessage([dat, opts], opts.consume ? [dat.buffer] : []);
    return function() {
      w3.terminate();
    };
  };
  var astrm = function(strm) {
    strm.ondata = function(dat, final) {
      return postMessage([dat, final], [dat.buffer]);
    };
    return function(ev) {
      if (ev.data.length) {
        strm.push(ev.data[0], ev.data[1]);
        postMessage([ev.data[0].length]);
      } else
        strm.flush();
    };
  };
  var astrmify = function(fns, strm, opts, init2, id, flush, ext) {
    var t2;
    var w3 = wrkr(fns, init2, id, function(err2, dat) {
      if (err2)
        w3.terminate(), strm.ondata.call(strm, err2);
      else if (!Array.isArray(dat))
        ext(dat);
      else if (dat.length == 1) {
        strm.queuedSize -= dat[0];
        if (strm.ondrain)
          strm.ondrain(dat[0]);
      } else {
        if (dat[1])
          w3.terminate();
        strm.ondata.call(strm, err2, dat[0], dat[1]);
      }
    });
    w3.postMessage(opts);
    strm.queuedSize = 0;
    strm.push = function(d3, f4) {
      if (!strm.ondata)
        err(5);
      if (t2)
        strm.ondata(err(4, 0, 1), null, !!f4);
      strm.queuedSize += d3.length;
      w3.postMessage([d3, t2 = f4], [d3.buffer]);
    };
    strm.terminate = function() {
      w3.terminate();
    };
    if (flush) {
      strm.flush = function() {
        w3.postMessage([]);
      };
    }
  };
  var b22 = function(d3, b5) {
    return d3[b5] | d3[b5 + 1] << 8;
  };
  var b4 = function(d3, b5) {
    return (d3[b5] | d3[b5 + 1] << 8 | d3[b5 + 2] << 16 | d3[b5 + 3] << 24) >>> 0;
  };
  var b8 = function(d3, b5) {
    return b4(d3, b5) + b4(d3, b5 + 4) * 4294967296;
  };
  var wbytes = function(d3, b5, v3) {
    for (;v3; ++b5)
      d3[b5] = v3, v3 >>>= 8;
  };
  var gzh = function(c4, o3) {
    var fn = o3.filename;
    c4[0] = 31, c4[1] = 139, c4[2] = 8, c4[8] = o3.level < 2 ? 4 : o3.level == 9 ? 2 : 0, c4[9] = 3;
    if (o3.mtime != 0)
      wbytes(c4, 4, Math.floor(new Date(o3.mtime || Date.now()) / 1000));
    if (fn) {
      c4[3] = 8;
      for (var i3 = 0;i3 <= fn.length; ++i3)
        c4[i3 + 10] = fn.charCodeAt(i3);
    }
  };
  var gzs = function(d3) {
    if (d3[0] != 31 || d3[1] != 139 || d3[2] != 8)
      err(6, "invalid gzip data");
    var flg = d3[3];
    var st = 10;
    if (flg & 4)
      st += (d3[10] | d3[11] << 8) + 2;
    for (var zs = (flg >> 3 & 1) + (flg >> 4 & 1);zs > 0; zs -= !d3[st++])
      ;
    return st + (flg & 2);
  };
  var gzl = function(d3) {
    var l3 = d3.length;
    return (d3[l3 - 4] | d3[l3 - 3] << 8 | d3[l3 - 2] << 16 | d3[l3 - 1] << 24) >>> 0;
  };
  var gzhl = function(o3) {
    return 10 + (o3.filename ? o3.filename.length + 1 : 0);
  };
  var zlh = function(c4, o3) {
    var lv = o3.level, fl2 = lv == 0 ? 0 : lv < 6 ? 1 : lv == 9 ? 3 : 2;
    c4[0] = 120, c4[1] = fl2 << 6 | (o3.dictionary && 32);
    c4[1] |= 31 - (c4[0] << 8 | c4[1]) % 31;
    if (o3.dictionary) {
      var h3 = adler();
      h3.p(o3.dictionary);
      wbytes(c4, 2, h3.d());
    }
  };
  var zls = function(d3, dict) {
    if ((d3[0] & 15) != 8 || d3[0] >> 4 > 7 || (d3[0] << 8 | d3[1]) % 31)
      err(6, "invalid zlib data");
    if ((d3[1] >> 5 & 1) == +!dict)
      err(6, "invalid zlib data: " + (d3[1] & 32 ? "need" : "unexpected") + " dictionary");
    return (d3[1] >> 3 & 4) + 2;
  };
  function StrmOpt(opts, cb) {
    if (typeof opts == "function")
      cb = opts, opts = {};
    this.ondata = cb;
    return opts;
  }
  var Deflate = /* @__PURE__ */ function() {
    function Deflate2(opts, cb) {
      if (typeof opts == "function")
        cb = opts, opts = {};
      this.ondata = cb;
      this.o = opts || {};
      this.s = { l: 0, i: 32768, w: 32768, z: 32768 };
      this.b = new u8(98304);
      if (this.o.dictionary) {
        var dict = this.o.dictionary.subarray(-32768);
        this.b.set(dict, 32768 - dict.length);
        this.s.i = 32768 - dict.length;
      }
    }
    Deflate2.prototype.p = function(c4, f4) {
      this.ondata(dopt(c4, this.o, 0, 0, this.s), f4);
    };
    Deflate2.prototype.push = function(chunk, final) {
      if (!this.ondata)
        err(5);
      if (this.s.l)
        err(4);
      var endLen = chunk.length + this.s.z;
      if (endLen > this.b.length) {
        if (endLen > 2 * this.b.length - 32768) {
          var newBuf = new u8(endLen & -32768);
          newBuf.set(this.b.subarray(0, this.s.z));
          this.b = newBuf;
        }
        var split = this.b.length - this.s.z;
        this.b.set(chunk.subarray(0, split), this.s.z);
        this.s.z = this.b.length;
        this.p(this.b, false);
        this.b.set(this.b.subarray(-32768));
        this.b.set(chunk.subarray(split), 32768);
        this.s.z = chunk.length - split + 32768;
        this.s.i = 32766, this.s.w = 32768;
      } else {
        this.b.set(chunk, this.s.z);
        this.s.z += chunk.length;
      }
      this.s.l = final & 1;
      if (this.s.z > this.s.w + 8191 || final) {
        this.p(this.b, final || false);
        this.s.w = this.s.i, this.s.i -= 2;
      }
    };
    Deflate2.prototype.flush = function() {
      if (!this.ondata)
        err(5);
      if (this.s.l)
        err(4);
      this.p(this.b, false);
      this.s.w = this.s.i, this.s.i -= 2;
    };
    return Deflate2;
  }();
  exports.Deflate = Deflate;
  var AsyncDeflate = /* @__PURE__ */ function() {
    function AsyncDeflate2(opts, cb) {
      astrmify([
        bDflt,
        function() {
          return [astrm, Deflate];
        }
      ], this, StrmOpt.call(this, opts, cb), function(ev) {
        var strm = new Deflate(ev.data);
        onmessage = astrm(strm);
      }, 6, 1);
    }
    return AsyncDeflate2;
  }();
  exports.AsyncDeflate = AsyncDeflate;
  function deflate(data, opts, cb) {
    if (!cb)
      cb = opts, opts = {};
    if (typeof cb != "function")
      err(7);
    return cbify(data, opts, [
      bDflt
    ], function(ev) {
      return pbf(deflateSync(ev.data[0], ev.data[1]));
    }, 0, cb);
  }
  exports.deflate = deflate;
  function deflateSync(data, opts) {
    return dopt(data, opts || {}, 0, 0);
  }
  exports.deflateSync = deflateSync;
  var Inflate = /* @__PURE__ */ function() {
    function Inflate2(opts, cb) {
      if (typeof opts == "function")
        cb = opts, opts = {};
      this.ondata = cb;
      var dict = opts && opts.dictionary && opts.dictionary.subarray(-32768);
      this.s = { i: 0, b: dict ? dict.length : 0 };
      this.o = new u8(32768);
      this.p = new u8(0);
      if (dict)
        this.o.set(dict);
    }
    Inflate2.prototype.e = function(c4) {
      if (!this.ondata)
        err(5);
      if (this.d)
        err(4);
      if (!this.p.length)
        this.p = c4;
      else if (c4.length) {
        var n2 = new u8(this.p.length + c4.length);
        n2.set(this.p), n2.set(c4, this.p.length), this.p = n2;
      }
    };
    Inflate2.prototype.c = function(final) {
      this.s.i = +(this.d = final || false);
      var bts = this.s.b;
      var dt = inflt(this.p, this.s, this.o);
      this.ondata(slc(dt, bts, this.s.b), this.d);
      this.o = slc(dt, this.s.b - 32768), this.s.b = this.o.length;
      this.p = slc(this.p, this.s.p / 8 | 0), this.s.p &= 7;
    };
    Inflate2.prototype.push = function(chunk, final) {
      this.e(chunk), this.c(final);
    };
    return Inflate2;
  }();
  exports.Inflate = Inflate;
  var AsyncInflate = /* @__PURE__ */ function() {
    function AsyncInflate2(opts, cb) {
      astrmify([
        bInflt,
        function() {
          return [astrm, Inflate];
        }
      ], this, StrmOpt.call(this, opts, cb), function(ev) {
        var strm = new Inflate(ev.data);
        onmessage = astrm(strm);
      }, 7, 0);
    }
    return AsyncInflate2;
  }();
  exports.AsyncInflate = AsyncInflate;
  function inflate(data, opts, cb) {
    if (!cb)
      cb = opts, opts = {};
    if (typeof cb != "function")
      err(7);
    return cbify(data, opts, [
      bInflt
    ], function(ev) {
      return pbf(inflateSync(ev.data[0], gopt(ev.data[1])));
    }, 1, cb);
  }
  exports.inflate = inflate;
  function inflateSync(data, opts) {
    return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
  }
  exports.inflateSync = inflateSync;
  var Gzip = /* @__PURE__ */ function() {
    function Gzip2(opts, cb) {
      this.c = crc();
      this.l = 0;
      this.v = 1;
      Deflate.call(this, opts, cb);
    }
    Gzip2.prototype.push = function(chunk, final) {
      this.c.p(chunk);
      this.l += chunk.length;
      Deflate.prototype.push.call(this, chunk, final);
    };
    Gzip2.prototype.p = function(c4, f4) {
      var raw = dopt(c4, this.o, this.v && gzhl(this.o), f4 && 8, this.s);
      if (this.v)
        gzh(raw, this.o), this.v = 0;
      if (f4)
        wbytes(raw, raw.length - 8, this.c.d()), wbytes(raw, raw.length - 4, this.l);
      this.ondata(raw, f4);
    };
    Gzip2.prototype.flush = function() {
      Deflate.prototype.flush.call(this);
    };
    return Gzip2;
  }();
  exports.Gzip = Gzip;
  exports.Compress = Gzip;
  var AsyncGzip = /* @__PURE__ */ function() {
    function AsyncGzip2(opts, cb) {
      astrmify([
        bDflt,
        gze,
        function() {
          return [astrm, Deflate, Gzip];
        }
      ], this, StrmOpt.call(this, opts, cb), function(ev) {
        var strm = new Gzip(ev.data);
        onmessage = astrm(strm);
      }, 8, 1);
    }
    return AsyncGzip2;
  }();
  exports.AsyncGzip = AsyncGzip;
  exports.AsyncCompress = AsyncGzip;
  function gzip(data, opts, cb) {
    if (!cb)
      cb = opts, opts = {};
    if (typeof cb != "function")
      err(7);
    return cbify(data, opts, [
      bDflt,
      gze,
      function() {
        return [gzipSync];
      }
    ], function(ev) {
      return pbf(gzipSync(ev.data[0], ev.data[1]));
    }, 2, cb);
  }
  exports.gzip = gzip;
  exports.compress = gzip;
  function gzipSync(data, opts) {
    if (!opts)
      opts = {};
    var c4 = crc(), l3 = data.length;
    c4.p(data);
    var d3 = dopt(data, opts, gzhl(opts), 8), s2 = d3.length;
    return gzh(d3, opts), wbytes(d3, s2 - 8, c4.d()), wbytes(d3, s2 - 4, l3), d3;
  }
  exports.gzipSync = gzipSync;
  exports.compressSync = gzipSync;
  var Gunzip = /* @__PURE__ */ function() {
    function Gunzip2(opts, cb) {
      this.v = 1;
      this.r = 0;
      Inflate.call(this, opts, cb);
    }
    Gunzip2.prototype.push = function(chunk, final) {
      Inflate.prototype.e.call(this, chunk);
      this.r += chunk.length;
      if (this.v) {
        var p = this.p.subarray(this.v - 1);
        var s2 = p.length > 3 ? gzs(p) : 4;
        if (s2 > p.length) {
          if (!final)
            return;
        } else if (this.v > 1 && this.onmember) {
          this.onmember(this.r - p.length);
        }
        this.p = p.subarray(s2), this.v = 0;
      }
      Inflate.prototype.c.call(this, final);
      if (this.s.f && !this.s.l && !final) {
        this.v = shft(this.s.p) + 9;
        this.s = { i: 0 };
        this.o = new u8(0);
        this.push(new u8(0), final);
      }
    };
    return Gunzip2;
  }();
  exports.Gunzip = Gunzip;
  var AsyncGunzip = /* @__PURE__ */ function() {
    function AsyncGunzip2(opts, cb) {
      var _this = this;
      astrmify([
        bInflt,
        guze,
        function() {
          return [astrm, Inflate, Gunzip];
        }
      ], this, StrmOpt.call(this, opts, cb), function(ev) {
        var strm = new Gunzip(ev.data);
        strm.onmember = function(offset) {
          return postMessage(offset);
        };
        onmessage = astrm(strm);
      }, 9, 0, function(offset) {
        return _this.onmember && _this.onmember(offset);
      });
    }
    return AsyncGunzip2;
  }();
  exports.AsyncGunzip = AsyncGunzip;
  function gunzip(data, opts, cb) {
    if (!cb)
      cb = opts, opts = {};
    if (typeof cb != "function")
      err(7);
    return cbify(data, opts, [
      bInflt,
      guze,
      function() {
        return [gunzipSync];
      }
    ], function(ev) {
      return pbf(gunzipSync(ev.data[0], ev.data[1]));
    }, 3, cb);
  }
  exports.gunzip = gunzip;
  function gunzipSync(data, opts) {
    var st = gzs(data);
    if (st + 8 > data.length)
      err(6, "invalid gzip data");
    return inflt(data.subarray(st, -8), { i: 2 }, opts && opts.out || new u8(gzl(data)), opts && opts.dictionary);
  }
  exports.gunzipSync = gunzipSync;
  var Zlib = /* @__PURE__ */ function() {
    function Zlib2(opts, cb) {
      this.c = adler();
      this.v = 1;
      Deflate.call(this, opts, cb);
    }
    Zlib2.prototype.push = function(chunk, final) {
      this.c.p(chunk);
      Deflate.prototype.push.call(this, chunk, final);
    };
    Zlib2.prototype.p = function(c4, f4) {
      var raw = dopt(c4, this.o, this.v && (this.o.dictionary ? 6 : 2), f4 && 4, this.s);
      if (this.v)
        zlh(raw, this.o), this.v = 0;
      if (f4)
        wbytes(raw, raw.length - 4, this.c.d());
      this.ondata(raw, f4);
    };
    Zlib2.prototype.flush = function() {
      Deflate.prototype.flush.call(this);
    };
    return Zlib2;
  }();
  exports.Zlib = Zlib;
  var AsyncZlib = /* @__PURE__ */ function() {
    function AsyncZlib2(opts, cb) {
      astrmify([
        bDflt,
        zle,
        function() {
          return [astrm, Deflate, Zlib];
        }
      ], this, StrmOpt.call(this, opts, cb), function(ev) {
        var strm = new Zlib(ev.data);
        onmessage = astrm(strm);
      }, 10, 1);
    }
    return AsyncZlib2;
  }();
  exports.AsyncZlib = AsyncZlib;
  function zlib(data, opts, cb) {
    if (!cb)
      cb = opts, opts = {};
    if (typeof cb != "function")
      err(7);
    return cbify(data, opts, [
      bDflt,
      zle,
      function() {
        return [zlibSync];
      }
    ], function(ev) {
      return pbf(zlibSync(ev.data[0], ev.data[1]));
    }, 4, cb);
  }
  exports.zlib = zlib;
  function zlibSync(data, opts) {
    if (!opts)
      opts = {};
    var a4 = adler();
    a4.p(data);
    var d3 = dopt(data, opts, opts.dictionary ? 6 : 2, 4);
    return zlh(d3, opts), wbytes(d3, d3.length - 4, a4.d()), d3;
  }
  exports.zlibSync = zlibSync;
  var Unzlib = /* @__PURE__ */ function() {
    function Unzlib2(opts, cb) {
      Inflate.call(this, opts, cb);
      this.v = opts && opts.dictionary ? 2 : 1;
    }
    Unzlib2.prototype.push = function(chunk, final) {
      Inflate.prototype.e.call(this, chunk);
      if (this.v) {
        if (this.p.length < 6 && !final)
          return;
        this.p = this.p.subarray(zls(this.p, this.v - 1)), this.v = 0;
      }
      if (final) {
        if (this.p.length < 4)
          err(6, "invalid zlib data");
        this.p = this.p.subarray(0, -4);
      }
      Inflate.prototype.c.call(this, final);
    };
    return Unzlib2;
  }();
  exports.Unzlib = Unzlib;
  var AsyncUnzlib = /* @__PURE__ */ function() {
    function AsyncUnzlib2(opts, cb) {
      astrmify([
        bInflt,
        zule,
        function() {
          return [astrm, Inflate, Unzlib];
        }
      ], this, StrmOpt.call(this, opts, cb), function(ev) {
        var strm = new Unzlib(ev.data);
        onmessage = astrm(strm);
      }, 11, 0);
    }
    return AsyncUnzlib2;
  }();
  exports.AsyncUnzlib = AsyncUnzlib;
  function unzlib(data, opts, cb) {
    if (!cb)
      cb = opts, opts = {};
    if (typeof cb != "function")
      err(7);
    return cbify(data, opts, [
      bInflt,
      zule,
      function() {
        return [unzlibSync];
      }
    ], function(ev) {
      return pbf(unzlibSync(ev.data[0], gopt(ev.data[1])));
    }, 5, cb);
  }
  exports.unzlib = unzlib;
  function unzlibSync(data, opts) {
    return inflt(data.subarray(zls(data, opts && opts.dictionary), -4), { i: 2 }, opts && opts.out, opts && opts.dictionary);
  }
  exports.unzlibSync = unzlibSync;
  var Decompress = /* @__PURE__ */ function() {
    function Decompress2(opts, cb) {
      this.o = StrmOpt.call(this, opts, cb) || {};
      this.G = Gunzip;
      this.I = Inflate;
      this.Z = Unzlib;
    }
    Decompress2.prototype.i = function() {
      var _this = this;
      this.s.ondata = function(dat, final) {
        _this.ondata(dat, final);
      };
    };
    Decompress2.prototype.push = function(chunk, final) {
      if (!this.ondata)
        err(5);
      if (!this.s) {
        if (this.p && this.p.length) {
          var n2 = new u8(this.p.length + chunk.length);
          n2.set(this.p), n2.set(chunk, this.p.length);
        } else
          this.p = chunk;
        if (this.p.length > 2) {
          this.s = this.p[0] == 31 && this.p[1] == 139 && this.p[2] == 8 ? new this.G(this.o) : (this.p[0] & 15) != 8 || this.p[0] >> 4 > 7 || (this.p[0] << 8 | this.p[1]) % 31 ? new this.I(this.o) : new this.Z(this.o);
          this.i();
          this.s.push(this.p, final);
          this.p = null;
        }
      } else
        this.s.push(chunk, final);
    };
    return Decompress2;
  }();
  exports.Decompress = Decompress;
  var AsyncDecompress = /* @__PURE__ */ function() {
    function AsyncDecompress2(opts, cb) {
      Decompress.call(this, opts, cb);
      this.queuedSize = 0;
      this.G = AsyncGunzip;
      this.I = AsyncInflate;
      this.Z = AsyncUnzlib;
    }
    AsyncDecompress2.prototype.i = function() {
      var _this = this;
      this.s.ondata = function(err2, dat, final) {
        _this.ondata(err2, dat, final);
      };
      this.s.ondrain = function(size) {
        _this.queuedSize -= size;
        if (_this.ondrain)
          _this.ondrain(size);
      };
    };
    AsyncDecompress2.prototype.push = function(chunk, final) {
      this.queuedSize += chunk.length;
      Decompress.prototype.push.call(this, chunk, final);
    };
    return AsyncDecompress2;
  }();
  exports.AsyncDecompress = AsyncDecompress;
  function decompress(data, opts, cb) {
    if (!cb)
      cb = opts, opts = {};
    if (typeof cb != "function")
      err(7);
    return data[0] == 31 && data[1] == 139 && data[2] == 8 ? gunzip(data, opts, cb) : (data[0] & 15) != 8 || data[0] >> 4 > 7 || (data[0] << 8 | data[1]) % 31 ? inflate(data, opts, cb) : unzlib(data, opts, cb);
  }
  exports.decompress = decompress;
  function decompressSync(data, opts) {
    return data[0] == 31 && data[1] == 139 && data[2] == 8 ? gunzipSync(data, opts) : (data[0] & 15) != 8 || data[0] >> 4 > 7 || (data[0] << 8 | data[1]) % 31 ? inflateSync(data, opts) : unzlibSync(data, opts);
  }
  exports.decompressSync = decompressSync;
  var fltn = function(d3, p, t2, o3) {
    for (var k4 in d3) {
      var val = d3[k4], n2 = p + k4, op = o3;
      if (Array.isArray(val))
        op = mrg(o3, val[1]), val = val[0];
      if (val instanceof u8)
        t2[n2] = [val, op];
      else {
        t2[n2 += "/"] = [new u8(0), op];
        fltn(val, n2, t2, o3);
      }
    }
  };
  var te2 = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder;
  var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder;
  var tds = 0;
  try {
    td.decode(et, { stream: true });
    tds = 1;
  } catch (e3) {}
  var dutf8 = function(d3) {
    for (var r4 = "", i3 = 0;; ) {
      var c4 = d3[i3++];
      var eb = (c4 > 127) + (c4 > 223) + (c4 > 239);
      if (i3 + eb > d3.length)
        return { s: r4, r: slc(d3, i3 - 1) };
      if (!eb)
        r4 += String.fromCharCode(c4);
      else if (eb == 3) {
        c4 = ((c4 & 15) << 18 | (d3[i3++] & 63) << 12 | (d3[i3++] & 63) << 6 | d3[i3++] & 63) - 65536, r4 += String.fromCharCode(55296 | c4 >> 10, 56320 | c4 & 1023);
      } else if (eb & 1)
        r4 += String.fromCharCode((c4 & 31) << 6 | d3[i3++] & 63);
      else
        r4 += String.fromCharCode((c4 & 15) << 12 | (d3[i3++] & 63) << 6 | d3[i3++] & 63);
    }
  };
  var DecodeUTF8 = /* @__PURE__ */ function() {
    function DecodeUTF82(cb) {
      this.ondata = cb;
      if (tds)
        this.t = new TextDecoder;
      else
        this.p = et;
    }
    DecodeUTF82.prototype.push = function(chunk, final) {
      if (!this.ondata)
        err(5);
      final = !!final;
      if (this.t) {
        this.ondata(this.t.decode(chunk, { stream: true }), final);
        if (final) {
          if (this.t.decode().length)
            err(8);
          this.t = null;
        }
        return;
      }
      if (!this.p)
        err(4);
      var dat = new u8(this.p.length + chunk.length);
      dat.set(this.p);
      dat.set(chunk, this.p.length);
      var _a2 = dutf8(dat), s2 = _a2.s, r4 = _a2.r;
      if (final) {
        if (r4.length)
          err(8);
        this.p = null;
      } else
        this.p = r4;
      this.ondata(s2, final);
    };
    return DecodeUTF82;
  }();
  exports.DecodeUTF8 = DecodeUTF8;
  var EncodeUTF8 = /* @__PURE__ */ function() {
    function EncodeUTF82(cb) {
      this.ondata = cb;
    }
    EncodeUTF82.prototype.push = function(chunk, final) {
      if (!this.ondata)
        err(5);
      if (this.d)
        err(4);
      this.ondata(strToU8(chunk), this.d = final || false);
    };
    return EncodeUTF82;
  }();
  exports.EncodeUTF8 = EncodeUTF8;
  function strToU8(str, latin1) {
    if (latin1) {
      var ar_1 = new u8(str.length);
      for (var i3 = 0;i3 < str.length; ++i3)
        ar_1[i3] = str.charCodeAt(i3);
      return ar_1;
    }
    if (te2)
      return te2.encode(str);
    var l3 = str.length;
    var ar = new u8(str.length + (str.length >> 1));
    var ai = 0;
    var w3 = function(v3) {
      ar[ai++] = v3;
    };
    for (var i3 = 0;i3 < l3; ++i3) {
      if (ai + 5 > ar.length) {
        var n2 = new u8(ai + 8 + (l3 - i3 << 1));
        n2.set(ar);
        ar = n2;
      }
      var c4 = str.charCodeAt(i3);
      if (c4 < 128 || latin1)
        w3(c4);
      else if (c4 < 2048)
        w3(192 | c4 >> 6), w3(128 | c4 & 63);
      else if (c4 > 55295 && c4 < 57344)
        c4 = 65536 + (c4 & 1023 << 10) | str.charCodeAt(++i3) & 1023, w3(240 | c4 >> 18), w3(128 | c4 >> 12 & 63), w3(128 | c4 >> 6 & 63), w3(128 | c4 & 63);
      else
        w3(224 | c4 >> 12), w3(128 | c4 >> 6 & 63), w3(128 | c4 & 63);
    }
    return slc(ar, 0, ai);
  }
  exports.strToU8 = strToU8;
  function strFromU8(dat, latin1) {
    if (latin1) {
      var r4 = "";
      for (var i3 = 0;i3 < dat.length; i3 += 16384)
        r4 += String.fromCharCode.apply(null, dat.subarray(i3, i3 + 16384));
      return r4;
    } else if (td) {
      return td.decode(dat);
    } else {
      var _a2 = dutf8(dat), s2 = _a2.s, r4 = _a2.r;
      if (r4.length)
        err(8);
      return s2;
    }
  }
  exports.strFromU8 = strFromU8;
  var dbf = function(l3) {
    return l3 == 1 ? 3 : l3 < 6 ? 2 : l3 == 9 ? 1 : 0;
  };
  var slzh = function(d3, b5) {
    return b5 + 30 + b22(d3, b5 + 26) + b22(d3, b5 + 28);
  };
  var zh = function(d3, b5, z3) {
    var fnl = b22(d3, b5 + 28), fn = strFromU8(d3.subarray(b5 + 46, b5 + 46 + fnl), !(b22(d3, b5 + 8) & 2048)), es = b5 + 46 + fnl, bs = b4(d3, b5 + 20);
    var _a2 = z3 && bs == 4294967295 ? z64e(d3, es) : [bs, b4(d3, b5 + 24), b4(d3, b5 + 42)], sc = _a2[0], su = _a2[1], off = _a2[2];
    return [b22(d3, b5 + 10), sc, su, fn, es + b22(d3, b5 + 30) + b22(d3, b5 + 32), off];
  };
  var z64e = function(d3, b5) {
    for (;b22(d3, b5) != 1; b5 += 4 + b22(d3, b5 + 2))
      ;
    return [b8(d3, b5 + 12), b8(d3, b5 + 4), b8(d3, b5 + 20)];
  };
  var exfl = function(ex) {
    var le3 = 0;
    if (ex) {
      for (var k4 in ex) {
        var l3 = ex[k4].length;
        if (l3 > 65535)
          err(9);
        le3 += l3 + 4;
      }
    }
    return le3;
  };
  var wzh = function(d3, b5, f4, fn, u4, c4, ce3, co) {
    var fl2 = fn.length, ex = f4.extra, col = co && co.length;
    var exl = exfl(ex);
    wbytes(d3, b5, ce3 != null ? 33639248 : 67324752), b5 += 4;
    if (ce3 != null)
      d3[b5++] = 20, d3[b5++] = f4.os;
    d3[b5] = 20, b5 += 2;
    d3[b5++] = f4.flag << 1 | (c4 < 0 && 8), d3[b5++] = u4 && 8;
    d3[b5++] = f4.compression & 255, d3[b5++] = f4.compression >> 8;
    var dt = new Date(f4.mtime == null ? Date.now() : f4.mtime), y5 = dt.getFullYear() - 1980;
    if (y5 < 0 || y5 > 119)
      err(10);
    wbytes(d3, b5, y5 << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b5 += 4;
    if (c4 != -1) {
      wbytes(d3, b5, f4.crc);
      wbytes(d3, b5 + 4, c4 < 0 ? -c4 - 2 : c4);
      wbytes(d3, b5 + 8, f4.size);
    }
    wbytes(d3, b5 + 12, fl2);
    wbytes(d3, b5 + 14, exl), b5 += 16;
    if (ce3 != null) {
      wbytes(d3, b5, col);
      wbytes(d3, b5 + 6, f4.attrs);
      wbytes(d3, b5 + 10, ce3), b5 += 14;
    }
    d3.set(fn, b5);
    b5 += fl2;
    if (exl) {
      for (var k4 in ex) {
        var exf = ex[k4], l3 = exf.length;
        wbytes(d3, b5, +k4);
        wbytes(d3, b5 + 2, l3);
        d3.set(exf, b5 + 4), b5 += 4 + l3;
      }
    }
    if (col)
      d3.set(co, b5), b5 += col;
    return b5;
  };
  var wzf = function(o3, b5, c4, d3, e3) {
    wbytes(o3, b5, 101010256);
    wbytes(o3, b5 + 8, c4);
    wbytes(o3, b5 + 10, c4);
    wbytes(o3, b5 + 12, d3);
    wbytes(o3, b5 + 16, e3);
  };
  var ZipPassThrough = /* @__PURE__ */ function() {
    function ZipPassThrough2(filename) {
      this.filename = filename;
      this.c = crc();
      this.size = 0;
      this.compression = 0;
    }
    ZipPassThrough2.prototype.process = function(chunk, final) {
      this.ondata(null, chunk, final);
    };
    ZipPassThrough2.prototype.push = function(chunk, final) {
      if (!this.ondata)
        err(5);
      this.c.p(chunk);
      this.size += chunk.length;
      if (final)
        this.crc = this.c.d();
      this.process(chunk, final || false);
    };
    return ZipPassThrough2;
  }();
  exports.ZipPassThrough = ZipPassThrough;
  var ZipDeflate = /* @__PURE__ */ function() {
    function ZipDeflate2(filename, opts) {
      var _this = this;
      if (!opts)
        opts = {};
      ZipPassThrough.call(this, filename);
      this.d = new Deflate(opts, function(dat, final) {
        _this.ondata(null, dat, final);
      });
      this.compression = 8;
      this.flag = dbf(opts.level);
    }
    ZipDeflate2.prototype.process = function(chunk, final) {
      try {
        this.d.push(chunk, final);
      } catch (e3) {
        this.ondata(e3, null, final);
      }
    };
    ZipDeflate2.prototype.push = function(chunk, final) {
      ZipPassThrough.prototype.push.call(this, chunk, final);
    };
    return ZipDeflate2;
  }();
  exports.ZipDeflate = ZipDeflate;
  var AsyncZipDeflate = /* @__PURE__ */ function() {
    function AsyncZipDeflate2(filename, opts) {
      var _this = this;
      if (!opts)
        opts = {};
      ZipPassThrough.call(this, filename);
      this.d = new AsyncDeflate(opts, function(err2, dat, final) {
        _this.ondata(err2, dat, final);
      });
      this.compression = 8;
      this.flag = dbf(opts.level);
      this.terminate = this.d.terminate;
    }
    AsyncZipDeflate2.prototype.process = function(chunk, final) {
      this.d.push(chunk, final);
    };
    AsyncZipDeflate2.prototype.push = function(chunk, final) {
      ZipPassThrough.prototype.push.call(this, chunk, final);
    };
    return AsyncZipDeflate2;
  }();
  exports.AsyncZipDeflate = AsyncZipDeflate;
  var Zip = /* @__PURE__ */ function() {
    function Zip2(cb) {
      this.ondata = cb;
      this.u = [];
      this.d = 1;
    }
    Zip2.prototype.add = function(file) {
      var _this = this;
      if (!this.ondata)
        err(5);
      if (this.d & 2)
        this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, false);
      else {
        var f4 = strToU8(file.filename), fl_1 = f4.length;
        var com = file.comment, o3 = com && strToU8(com);
        var u4 = fl_1 != file.filename.length || o3 && com.length != o3.length;
        var hl_1 = fl_1 + exfl(file.extra) + 30;
        if (fl_1 > 65535)
          this.ondata(err(11, 0, 1), null, false);
        var header = new u8(hl_1);
        wzh(header, 0, file, f4, u4, -1);
        var chks_1 = [header];
        var pAll_1 = function() {
          for (var _i = 0, chks_2 = chks_1;_i < chks_2.length; _i++) {
            var chk = chks_2[_i];
            _this.ondata(null, chk, false);
          }
          chks_1 = [];
        };
        var tr_1 = this.d;
        this.d = 0;
        var ind_1 = this.u.length;
        var uf_1 = mrg(file, {
          f: f4,
          u: u4,
          o: o3,
          t: function() {
            if (file.terminate)
              file.terminate();
          },
          r: function() {
            pAll_1();
            if (tr_1) {
              var nxt = _this.u[ind_1 + 1];
              if (nxt)
                nxt.r();
              else
                _this.d = 1;
            }
            tr_1 = 1;
          }
        });
        var cl_1 = 0;
        file.ondata = function(err2, dat, final) {
          if (err2) {
            _this.ondata(err2, dat, final);
            _this.terminate();
          } else {
            cl_1 += dat.length;
            chks_1.push(dat);
            if (final) {
              var dd = new u8(16);
              wbytes(dd, 0, 134695760);
              wbytes(dd, 4, file.crc);
              wbytes(dd, 8, cl_1);
              wbytes(dd, 12, file.size);
              chks_1.push(dd);
              uf_1.c = cl_1, uf_1.b = hl_1 + cl_1 + 16, uf_1.crc = file.crc, uf_1.size = file.size;
              if (tr_1)
                uf_1.r();
              tr_1 = 1;
            } else if (tr_1)
              pAll_1();
          }
        };
        this.u.push(uf_1);
      }
    };
    Zip2.prototype.end = function() {
      var _this = this;
      if (this.d & 2) {
        this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, true);
        return;
      }
      if (this.d)
        this.e();
      else
        this.u.push({
          r: function() {
            if (!(_this.d & 1))
              return;
            _this.u.splice(-1, 1);
            _this.e();
          },
          t: function() {}
        });
      this.d = 3;
    };
    Zip2.prototype.e = function() {
      var bt = 0, l3 = 0, tl = 0;
      for (var _i = 0, _a2 = this.u;_i < _a2.length; _i++) {
        var f4 = _a2[_i];
        tl += 46 + f4.f.length + exfl(f4.extra) + (f4.o ? f4.o.length : 0);
      }
      var out = new u8(tl + 22);
      for (var _b2 = 0, _c = this.u;_b2 < _c.length; _b2++) {
        var f4 = _c[_b2];
        wzh(out, bt, f4, f4.f, f4.u, -f4.c - 2, l3, f4.o);
        bt += 46 + f4.f.length + exfl(f4.extra) + (f4.o ? f4.o.length : 0), l3 += f4.b;
      }
      wzf(out, bt, this.u.length, tl, l3);
      this.ondata(null, out, true);
      this.d = 2;
    };
    Zip2.prototype.terminate = function() {
      for (var _i = 0, _a2 = this.u;_i < _a2.length; _i++) {
        var f4 = _a2[_i];
        f4.t();
      }
      this.d = 2;
    };
    return Zip2;
  }();
  exports.Zip = Zip;
  function zip(data, opts, cb) {
    if (!cb)
      cb = opts, opts = {};
    if (typeof cb != "function")
      err(7);
    var r4 = {};
    fltn(data, "", r4, opts);
    var k4 = Object.keys(r4);
    var lft = k4.length, o3 = 0, tot = 0;
    var slft = lft, files = new Array(lft);
    var term = [];
    var tAll = function() {
      for (var i4 = 0;i4 < term.length; ++i4)
        term[i4]();
    };
    var cbd = function(a4, b5) {
      mt(function() {
        cb(a4, b5);
      });
    };
    mt(function() {
      cbd = cb;
    });
    var cbf = function() {
      var out = new u8(tot + 22), oe = o3, cdl = tot - o3;
      tot = 0;
      for (var i4 = 0;i4 < slft; ++i4) {
        var f4 = files[i4];
        try {
          var l3 = f4.c.length;
          wzh(out, tot, f4, f4.f, f4.u, l3);
          var badd = 30 + f4.f.length + exfl(f4.extra);
          var loc = tot + badd;
          out.set(f4.c, loc);
          wzh(out, o3, f4, f4.f, f4.u, l3, tot, f4.m), o3 += 16 + badd + (f4.m ? f4.m.length : 0), tot = loc + l3;
        } catch (e3) {
          return cbd(e3, null);
        }
      }
      wzf(out, o3, files.length, cdl, oe);
      cbd(null, out);
    };
    if (!lft)
      cbf();
    var _loop_1 = function(i4) {
      var fn = k4[i4];
      var _a2 = r4[fn], file = _a2[0], p = _a2[1];
      var c4 = crc(), size = file.length;
      c4.p(file);
      var f4 = strToU8(fn), s2 = f4.length;
      var com = p.comment, m3 = com && strToU8(com), ms = m3 && m3.length;
      var exl = exfl(p.extra);
      var compression = p.level == 0 ? 0 : 8;
      var cbl = function(e3, d3) {
        if (e3) {
          tAll();
          cbd(e3, null);
        } else {
          var l3 = d3.length;
          files[i4] = mrg(p, {
            size,
            crc: c4.d(),
            c: d3,
            f: f4,
            m: m3,
            u: s2 != fn.length || m3 && com.length != ms,
            compression
          });
          o3 += 30 + s2 + exl + l3;
          tot += 76 + 2 * (s2 + exl) + (ms || 0) + l3;
          if (!--lft)
            cbf();
        }
      };
      if (s2 > 65535)
        cbl(err(11, 0, 1), null);
      if (!compression)
        cbl(null, file);
      else if (size < 160000) {
        try {
          cbl(null, deflateSync(file, p));
        } catch (e3) {
          cbl(e3, null);
        }
      } else
        term.push(deflate(file, p, cbl));
    };
    for (var i3 = 0;i3 < slft; ++i3) {
      _loop_1(i3);
    }
    return tAll;
  }
  exports.zip = zip;
  function zipSync(data, opts) {
    if (!opts)
      opts = {};
    var r4 = {};
    var files = [];
    fltn(data, "", r4, opts);
    var o3 = 0;
    var tot = 0;
    for (var fn in r4) {
      var _a2 = r4[fn], file = _a2[0], p = _a2[1];
      var compression = p.level == 0 ? 0 : 8;
      var f4 = strToU8(fn), s2 = f4.length;
      var com = p.comment, m3 = com && strToU8(com), ms = m3 && m3.length;
      var exl = exfl(p.extra);
      if (s2 > 65535)
        err(11);
      var d3 = compression ? deflateSync(file, p) : file, l3 = d3.length;
      var c4 = crc();
      c4.p(file);
      files.push(mrg(p, {
        size: file.length,
        crc: c4.d(),
        c: d3,
        f: f4,
        m: m3,
        u: s2 != fn.length || m3 && com.length != ms,
        o: o3,
        compression
      }));
      o3 += 30 + s2 + exl + l3;
      tot += 76 + 2 * (s2 + exl) + (ms || 0) + l3;
    }
    var out = new u8(tot + 22), oe = o3, cdl = tot - o3;
    for (var i3 = 0;i3 < files.length; ++i3) {
      var f4 = files[i3];
      wzh(out, f4.o, f4, f4.f, f4.u, f4.c.length);
      var badd = 30 + f4.f.length + exfl(f4.extra);
      out.set(f4.c, f4.o + badd);
      wzh(out, o3, f4, f4.f, f4.u, f4.c.length, f4.o, f4.m), o3 += 16 + badd + (f4.m ? f4.m.length : 0);
    }
    wzf(out, o3, files.length, cdl, oe);
    return out;
  }
  exports.zipSync = zipSync;
  var UnzipPassThrough = /* @__PURE__ */ function() {
    function UnzipPassThrough2() {}
    UnzipPassThrough2.prototype.push = function(data, final) {
      this.ondata(null, data, final);
    };
    UnzipPassThrough2.compression = 0;
    return UnzipPassThrough2;
  }();
  exports.UnzipPassThrough = UnzipPassThrough;
  var UnzipInflate = /* @__PURE__ */ function() {
    function UnzipInflate2() {
      var _this = this;
      this.i = new Inflate(function(dat, final) {
        _this.ondata(null, dat, final);
      });
    }
    UnzipInflate2.prototype.push = function(data, final) {
      try {
        this.i.push(data, final);
      } catch (e3) {
        this.ondata(e3, null, final);
      }
    };
    UnzipInflate2.compression = 8;
    return UnzipInflate2;
  }();
  exports.UnzipInflate = UnzipInflate;
  var AsyncUnzipInflate = /* @__PURE__ */ function() {
    function AsyncUnzipInflate2(_5, sz) {
      var _this = this;
      if (sz < 320000) {
        this.i = new Inflate(function(dat, final) {
          _this.ondata(null, dat, final);
        });
      } else {
        this.i = new AsyncInflate(function(err2, dat, final) {
          _this.ondata(err2, dat, final);
        });
        this.terminate = this.i.terminate;
      }
    }
    AsyncUnzipInflate2.prototype.push = function(data, final) {
      if (this.i.terminate)
        data = slc(data, 0);
      this.i.push(data, final);
    };
    AsyncUnzipInflate2.compression = 8;
    return AsyncUnzipInflate2;
  }();
  exports.AsyncUnzipInflate = AsyncUnzipInflate;
  var Unzip = /* @__PURE__ */ function() {
    function Unzip2(cb) {
      this.onfile = cb;
      this.k = [];
      this.o = {
        0: UnzipPassThrough
      };
      this.p = et;
    }
    Unzip2.prototype.push = function(chunk, final) {
      var _this = this;
      if (!this.onfile)
        err(5);
      if (!this.p)
        err(4);
      if (this.c > 0) {
        var len = Math.min(this.c, chunk.length);
        var toAdd = chunk.subarray(0, len);
        this.c -= len;
        if (this.d)
          this.d.push(toAdd, !this.c);
        else
          this.k[0].push(toAdd);
        chunk = chunk.subarray(len);
        if (chunk.length)
          return this.push(chunk, final);
      } else {
        var f4 = 0, i3 = 0, is = undefined, buf = undefined;
        if (!this.p.length)
          buf = chunk;
        else if (!chunk.length)
          buf = this.p;
        else {
          buf = new u8(this.p.length + chunk.length);
          buf.set(this.p), buf.set(chunk, this.p.length);
        }
        var l3 = buf.length, oc = this.c, add = oc && this.d;
        var _loop_2 = function() {
          var _a2;
          var sig = b4(buf, i3);
          if (sig == 67324752) {
            f4 = 1, is = i3;
            this_1.d = null;
            this_1.c = 0;
            var bf = b22(buf, i3 + 6), cmp_1 = b22(buf, i3 + 8), u4 = bf & 2048, dd = bf & 8, fnl = b22(buf, i3 + 26), es = b22(buf, i3 + 28);
            if (l3 > i3 + 30 + fnl + es) {
              var chks_3 = [];
              this_1.k.unshift(chks_3);
              f4 = 2;
              var sc_1 = b4(buf, i3 + 18), su_1 = b4(buf, i3 + 22);
              var fn_1 = strFromU8(buf.subarray(i3 + 30, i3 += 30 + fnl), !u4);
              if (sc_1 == 4294967295) {
                _a2 = dd ? [-2] : z64e(buf, i3), sc_1 = _a2[0], su_1 = _a2[1];
              } else if (dd)
                sc_1 = -1;
              i3 += es;
              this_1.c = sc_1;
              var d_1;
              var file_1 = {
                name: fn_1,
                compression: cmp_1,
                start: function() {
                  if (!file_1.ondata)
                    err(5);
                  if (!sc_1)
                    file_1.ondata(null, et, true);
                  else {
                    var ctr = _this.o[cmp_1];
                    if (!ctr)
                      file_1.ondata(err(14, "unknown compression type " + cmp_1, 1), null, false);
                    d_1 = sc_1 < 0 ? new ctr(fn_1) : new ctr(fn_1, sc_1, su_1);
                    d_1.ondata = function(err2, dat3, final2) {
                      file_1.ondata(err2, dat3, final2);
                    };
                    for (var _i = 0, chks_4 = chks_3;_i < chks_4.length; _i++) {
                      var dat2 = chks_4[_i];
                      d_1.push(dat2, false);
                    }
                    if (_this.k[0] == chks_3 && _this.c)
                      _this.d = d_1;
                    else
                      d_1.push(et, true);
                  }
                },
                terminate: function() {
                  if (d_1 && d_1.terminate)
                    d_1.terminate();
                }
              };
              if (sc_1 >= 0)
                file_1.size = sc_1, file_1.originalSize = su_1;
              this_1.onfile(file_1);
            }
            return "break";
          } else if (oc) {
            if (sig == 134695760) {
              is = i3 += 12 + (oc == -2 && 8), f4 = 3, this_1.c = 0;
              return "break";
            } else if (sig == 33639248) {
              is = i3 -= 4, f4 = 3, this_1.c = 0;
              return "break";
            }
          }
        };
        var this_1 = this;
        for (;i3 < l3 - 4; ++i3) {
          var state_1 = _loop_2();
          if (state_1 === "break")
            break;
        }
        this.p = et;
        if (oc < 0) {
          var dat = f4 ? buf.subarray(0, is - 12 - (oc == -2 && 8) - (b4(buf, is - 16) == 134695760 && 4)) : buf.subarray(0, i3);
          if (add)
            add.push(dat, !!f4);
          else
            this.k[+(f4 == 2)].push(dat);
        }
        if (f4 & 2)
          return this.push(buf.subarray(i3), final);
        this.p = buf.subarray(i3);
      }
      if (final) {
        if (this.c)
          err(13);
        this.p = null;
      }
    };
    Unzip2.prototype.register = function(decoder) {
      this.o[decoder.compression] = decoder;
    };
    return Unzip2;
  }();
  exports.Unzip = Unzip;
  var mt = typeof queueMicrotask == "function" ? queueMicrotask : typeof setTimeout == "function" ? setTimeout : function(fn) {
    fn();
  };
  function unzip(data, opts, cb) {
    if (!cb)
      cb = opts, opts = {};
    if (typeof cb != "function")
      err(7);
    var term = [];
    var tAll = function() {
      for (var i4 = 0;i4 < term.length; ++i4)
        term[i4]();
    };
    var files = {};
    var cbd = function(a4, b5) {
      mt(function() {
        cb(a4, b5);
      });
    };
    mt(function() {
      cbd = cb;
    });
    var e3 = data.length - 22;
    for (;b4(data, e3) != 101010256; --e3) {
      if (!e3 || data.length - e3 > 65558) {
        cbd(err(13, 0, 1), null);
        return tAll;
      }
    }
    var lft = b22(data, e3 + 8);
    if (lft) {
      var c4 = lft;
      var o3 = b4(data, e3 + 16);
      var z3 = o3 == 4294967295 || c4 == 65535;
      if (z3) {
        var ze = b4(data, e3 - 12);
        z3 = b4(data, ze) == 101075792;
        if (z3) {
          c4 = lft = b4(data, ze + 32);
          o3 = b4(data, ze + 48);
        }
      }
      var fltr = opts && opts.filter;
      var _loop_3 = function(i4) {
        var _a2 = zh(data, o3, z3), c_1 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b5 = slzh(data, off);
        o3 = no;
        var cbl = function(e4, d3) {
          if (e4) {
            tAll();
            cbd(e4, null);
          } else {
            if (d3)
              files[fn] = d3;
            if (!--lft)
              cbd(null, files);
          }
        };
        if (!fltr || fltr({
          name: fn,
          size: sc,
          originalSize: su,
          compression: c_1
        })) {
          if (!c_1)
            cbl(null, slc(data, b5, b5 + sc));
          else if (c_1 == 8) {
            var infl = data.subarray(b5, b5 + sc);
            if (su < 524288 || sc > 0.8 * su) {
              try {
                cbl(null, inflateSync(infl, { out: new u8(su) }));
              } catch (e4) {
                cbl(e4, null);
              }
            } else
              term.push(inflate(infl, { size: su }, cbl));
          } else
            cbl(err(14, "unknown compression type " + c_1, 1), null);
        } else
          cbl(null, null);
      };
      for (var i3 = 0;i3 < c4; ++i3) {
        _loop_3(i3);
      }
    } else
      cbd(null, {});
    return tAll;
  }
  exports.unzip = unzip;
  function unzipSync(data, opts) {
    var files = {};
    var e3 = data.length - 22;
    for (;b4(data, e3) != 101010256; --e3) {
      if (!e3 || data.length - e3 > 65558)
        err(13);
    }
    var c4 = b22(data, e3 + 8);
    if (!c4)
      return {};
    var o3 = b4(data, e3 + 16);
    var z3 = o3 == 4294967295 || c4 == 65535;
    if (z3) {
      var ze = b4(data, e3 - 12);
      z3 = b4(data, ze) == 101075792;
      if (z3) {
        c4 = b4(data, ze + 32);
        o3 = b4(data, ze + 48);
      }
    }
    var fltr = opts && opts.filter;
    for (var i3 = 0;i3 < c4; ++i3) {
      var _a2 = zh(data, o3, z3), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b5 = slzh(data, off);
      o3 = no;
      if (!fltr || fltr({
        name: fn,
        size: sc,
        originalSize: su,
        compression: c_2
      })) {
        if (!c_2)
          files[fn] = slc(data, b5, b5 + sc);
        else if (c_2 == 8)
          files[fn] = inflateSync(data.subarray(b5, b5 + sc), { out: new u8(su) });
        else
          err(14, "unknown compression type " + c_2);
      }
    }
    return files;
  }
  exports.unzipSync = unzipSync;
});

// ../../packages/agent-release/dist/contracts.js
var require_contracts = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AgentReleaseValidationError = exports.SUPPORTED_AGENT_TARGETS = exports.AGENT_BUNDLE_LAYOUT_VERSION = exports.AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION = exports.AGENT_RELEASE_MANIFEST_SCHEMA_VERSION = undefined;
  exports.validateEnvironmentCatalog = validateEnvironmentCatalog;
  exports.validateReleaseManifest = validateReleaseManifest;
  exports.validateChannelPointer = validateChannelPointer;
  exports.selectReleaseArtifact = selectReleaseArtifact;
  exports.assertCliCompatibility = assertCliCompatibility;
  exports.assertCatalogBinding = assertCatalogBinding;
  exports.assertArchiveBinding = assertArchiveBinding;
  exports.signManifest = signManifest;
  exports.verifyManifestSignature = verifyManifestSignature;
  exports.signReleaseBlob = signReleaseBlob;
  exports.verifyReleaseBlobSignature = verifyReleaseBlobSignature;
  exports.canonicalJson = canonicalJson;
  exports.sha256 = sha256;
  var node_crypto_1 = __require("node:crypto");
  exports.AGENT_RELEASE_MANIFEST_SCHEMA_VERSION = 1;
  exports.AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION = 1;
  exports.AGENT_BUNDLE_LAYOUT_VERSION = 1;
  exports.SUPPORTED_AGENT_TARGETS = [
    "darwin-arm64",
    "darwin-x64",
    "windows-x64"
  ];

  class AgentReleaseValidationError extends Error {
    code;
    constructor(code, message) {
      super(message);
      this.code = code;
      this.name = "AgentReleaseValidationError";
    }
  }
  exports.AgentReleaseValidationError = AgentReleaseValidationError;
  function validateEnvironmentCatalog(input) {
    const catalog = requireObject(input, "environment catalog");
    requireExactKeys(catalog, ["schemaVersion", "profiles"], "catalog");
    if (catalog.schemaVersion !== exports.AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION || !Array.isArray(catalog.profiles) || catalog.profiles.length === 0) {
      invalidCatalog("Catalog schema or environment list is invalid");
    }
    const ids = new Set;
    const namespaces = new Set;
    const profiles = catalog.profiles.map((value, index) => {
      const environment = requireObject(value, `environment ${index}`);
      requireExactKeys(environment, [
        "environmentId",
        "label",
        "webOrigin",
        "webAgentUrl",
        "backendHttpUrl",
        "backendAgentWsUrl",
        "namespace"
      ], `environment ${index}`);
      const environmentId = requirePattern(environment.environmentId, /^[a-z][a-z0-9-]{0,63}$/, "environmentId");
      const namespace = requirePattern(environment.namespace, /^[a-z][a-z0-9_-]{0,63}$/, "namespace");
      if (ids.has(environmentId) || namespaces.has(namespace)) {
        invalidCatalog("Environment ids and namespaces must be unique");
      }
      ids.add(environmentId);
      namespaces.add(namespace);
      const webOrigin = requireExactOrigin(environment.webOrigin, "webOrigin");
      const webAgentUrl = requireHttpsUrl(environment.webAgentUrl, "webAgentUrl");
      if (webAgentUrl.origin !== webOrigin || webAgentUrl.pathname !== "/agent" || webAgentUrl.search || webAgentUrl.hash) {
        invalidCatalog("webAgentUrl must be the same-origin exact /agent console URL");
      }
      const backendHttpUrl = requireHttpsUrl(environment.backendHttpUrl, "backendHttpUrl");
      const backendAgentWsUrl = requireUrl(environment.backendAgentWsUrl, "backendAgentWsUrl");
      if (backendAgentWsUrl.protocol !== "wss:") {
        invalidCatalog("backendAgentWsUrl must use WSS");
      }
      return {
        environmentId,
        label: requireText(environment.label, "label"),
        webOrigin,
        webAgentUrl: webAgentUrl.href,
        backendHttpUrl: trimTrailingSlash(backendHttpUrl.href),
        backendAgentWsUrl: trimTrailingSlash(backendAgentWsUrl.href),
        namespace
      };
    });
    return {
      schemaVersion: exports.AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION,
      profiles
    };
  }
  function validateReleaseManifest(input, options = {}) {
    const manifest = requireObject(input, "release manifest");
    requireExactKeys(manifest, [
      "schemaVersion",
      "releaseVersion",
      "minimumCliVersion",
      "layoutVersion",
      "protocols",
      "environmentCatalog",
      "provenance",
      "artifacts"
    ], "manifest");
    if (manifest.schemaVersion !== exports.AGENT_RELEASE_MANIFEST_SCHEMA_VERSION) {
      throw new AgentReleaseValidationError("INCOMPATIBLE_SCHEMA", "Release manifest schema is unsupported");
    }
    if (manifest.layoutVersion !== exports.AGENT_BUNDLE_LAYOUT_VERSION) {
      invalidManifest("Bundle layout version is unsupported");
    }
    const releaseVersion = requireSemver(manifest.releaseVersion, "releaseVersion");
    const minimumCliVersion = requireSemver(manifest.minimumCliVersion, "minimumCliVersion");
    const protocols = validateProtocolObject(manifest.protocols);
    const environmentCatalog = validateCatalogBinding(manifest.environmentCatalog);
    const provenance = validateProvenance(manifest.provenance);
    if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length === 0) {
      invalidManifest("Release manifest must contain platform artifacts");
    }
    const artifacts = manifest.artifacts.map(validateArtifact);
    const targets = artifacts.map((artifact) => artifact.target);
    if (new Set(targets).size !== targets.length) {
      invalidManifest("Release manifest target entries must be unique");
    }
    const requiresMatrix = options.requireProductionMatrix ?? provenance.kind === "production";
    if (requiresMatrix && !exports.SUPPORTED_AGENT_TARGETS.every((target) => targets.includes(target))) {
      invalidManifest("Production manifest must contain every supported target");
    }
    if (provenance.kind === "production" && !provenance.signed) {
      invalidManifest("Production manifest must be signed");
    }
    if (provenance.kind === "production" && artifacts.some((artifact) => artifact.archiveUrl.includes("-unsigned-pr-"))) {
      invalidManifest("Production manifest cannot reference pull-request artifacts");
    }
    if (provenance.kind === "pull-request-validation" && (provenance.signed || artifacts.some((artifact) => !artifact.archiveUrl.includes("-unsigned-pr-")))) {
      invalidManifest("Pull-request artifacts must be unsigned and marked");
    }
    return {
      schemaVersion: exports.AGENT_RELEASE_MANIFEST_SCHEMA_VERSION,
      releaseVersion,
      minimumCliVersion,
      layoutVersion: exports.AGENT_BUNDLE_LAYOUT_VERSION,
      protocols,
      environmentCatalog,
      provenance,
      artifacts
    };
  }
  function validateChannelPointer(input) {
    const pointer = requireObject(input, "channel pointer");
    requireExactKeys(pointer, [
      "schemaVersion",
      "channel",
      "releaseVersion",
      "manifestUrl",
      "manifestSha256"
    ], "channel pointer");
    if (pointer.schemaVersion !== 1 || pointer.channel !== "stable" && pointer.channel !== "beta") {
      invalidChannel("Channel pointer schema or channel is invalid");
    }
    const releaseVersion = requireSemver(pointer.releaseVersion, "releaseVersion");
    const manifestUrl = requireManifestHttpsUrl(pointer.manifestUrl, "manifestUrl");
    if (!manifestUrl.pathname.includes(`/${releaseVersion}/`)) {
      invalidChannel("Channel pointer must reference an immutable version URL");
    }
    return {
      schemaVersion: 1,
      channel: pointer.channel,
      releaseVersion,
      manifestUrl: manifestUrl.href,
      manifestSha256: requireSha256(pointer.manifestSha256, "manifestSha256")
    };
  }
  function selectReleaseArtifact(manifest, target) {
    const artifact = manifest.artifacts.find((candidate) => candidate.target === target);
    if (!artifact) {
      throw new AgentReleaseValidationError("UNSUPPORTED_TARGET", `Agent release does not support target "${target}"`);
    }
    return artifact;
  }
  function assertCliCompatibility(manifest, cliVersion) {
    const running = parseSemver(requireSemver(cliVersion, "cliVersion"));
    const minimum = parseSemver(manifest.minimumCliVersion);
    if (compareSemver(running, minimum) < 0) {
      throw new AgentReleaseValidationError("INCOMPATIBLE_CLI", `Agent release requires chc ${manifest.minimumCliVersion} or newer`);
    }
  }
  function assertCatalogBinding(manifest, catalogBytes) {
    const catalog = validateEnvironmentCatalog(JSON.parse(Buffer.from(catalogBytes).toString("utf8")));
    if (catalog.schemaVersion !== manifest.environmentCatalog.schemaVersion || sha256(catalogBytes) !== manifest.environmentCatalog.sha256) {
      throw new AgentReleaseValidationError("INTEGRITY_MISMATCH", "Environment catalog does not match the release manifest");
    }
    return catalog;
  }
  function assertArchiveBinding(artifact, archiveBytes) {
    if (archiveBytes.byteLength !== artifact.archiveSize || sha256(archiveBytes) !== artifact.archiveSha256) {
      throw new AgentReleaseValidationError("INTEGRITY_MISMATCH", "Agent archive size or digest does not match the release manifest");
    }
  }
  function signManifest(manifest, privateKeyPem) {
    return (0, node_crypto_1.sign)(null, Buffer.from(canonicalJson(manifest)), (0, node_crypto_1.createPrivateKey)(privateKeyPem)).toString("base64");
  }
  function verifyManifestSignature(manifest, signatureBase64, publicKeyPem) {
    const accepted = (0, node_crypto_1.verify)(null, Buffer.from(canonicalJson(manifest)), (0, node_crypto_1.createPublicKey)(publicKeyPem), Buffer.from(signatureBase64, "base64"));
    if (!accepted) {
      throw new AgentReleaseValidationError("INVALID_SIGNATURE", "Agent release manifest signature is invalid");
    }
  }
  function signReleaseBlob(bytes, privateKeyPem) {
    return (0, node_crypto_1.sign)(null, bytes, (0, node_crypto_1.createPrivateKey)(privateKeyPem)).toString("base64");
  }
  function verifyReleaseBlobSignature(bytes, signatureBase64, publicKeyPem) {
    if (!(0, node_crypto_1.verify)(null, bytes, (0, node_crypto_1.createPublicKey)(publicKeyPem), Buffer.from(signatureBase64, "base64"))) {
      throw new AgentReleaseValidationError("INVALID_SIGNATURE", "Agent release blob signature is invalid");
    }
  }
  function canonicalJson(input) {
    return `${JSON.stringify(sortJson(input))}
`;
  }
  function sha256(bytes) {
    return (0, node_crypto_1.createHash)("sha256").update(bytes).digest("hex");
  }
  function validateArtifact(input) {
    const artifact = requireObject(input, "artifact");
    requireExactKeys(artifact, [
      "target",
      "platform",
      "architecture",
      "archiveUrl",
      "archiveSize",
      "archiveSha256",
      "archiveSignatureUrl",
      "trayEntryPoint",
      "nodeEntryPoint",
      "agentEntryPoint",
      "platformSignature"
    ], "artifact");
    if (!exports.SUPPORTED_AGENT_TARGETS.includes(artifact.target)) {
      invalidManifest("Artifact target is unsupported");
    }
    const expected = targetParts(artifact.target);
    if (artifact.platform !== expected.platform || artifact.architecture !== expected.architecture || !Number.isSafeInteger(artifact.archiveSize) || artifact.archiveSize <= 0) {
      invalidManifest("Artifact platform, architecture, or size is invalid");
    }
    const signature = requireObject(artifact.platformSignature, "platformSignature");
    requireExactKeys(signature, ["required", "notarizationRequired"], "platformSignature");
    if (signature.required !== true || typeof signature.notarizationRequired !== "boolean" || signature.notarizationRequired !== (expected.platform === "darwin")) {
      invalidManifest("Platform signing requirements are invalid");
    }
    const entryPoints = targetEntryPoints(artifact.target);
    const trayEntryPoint = requireRelativePath(artifact.trayEntryPoint, "trayEntryPoint");
    const nodeEntryPoint = requireRelativePath(artifact.nodeEntryPoint, "nodeEntryPoint");
    const agentEntryPoint = requireRelativePath(artifact.agentEntryPoint, "agentEntryPoint");
    if (trayEntryPoint !== entryPoints.tray || nodeEntryPoint !== entryPoints.node || agentEntryPoint !== entryPoints.agent) {
      invalidManifest("Artifact entry points do not match the target layout");
    }
    return {
      target: artifact.target,
      platform: expected.platform,
      architecture: expected.architecture,
      archiveUrl: requireManifestHttpsUrl(artifact.archiveUrl, "archiveUrl").href,
      archiveSize: artifact.archiveSize,
      archiveSha256: requireSha256(artifact.archiveSha256, "archiveSha256"),
      archiveSignatureUrl: requireManifestHttpsUrl(artifact.archiveSignatureUrl, "archiveSignatureUrl").href,
      trayEntryPoint,
      nodeEntryPoint,
      agentEntryPoint,
      platformSignature: {
        required: true,
        notarizationRequired: signature.notarizationRequired
      }
    };
  }
  function targetEntryPoints(target) {
    return {
      tray: target === "windows-x64" ? "bin/cthutool-agent-tray.exe" : "bin/CthuTool Agent.app/Contents/MacOS/cthutool-agent-tray",
      node: target === "windows-x64" ? "runtime/node/node.exe" : "runtime/node/bin/node",
      agent: "agent/dist/index.js"
    };
  }
  function validateProtocolObject(input) {
    const protocols = requireObject(input, "protocols");
    const keys = ["agentBackend", "agentControl", "localBridge", "trayControl"];
    requireExactKeys(protocols, keys, "protocols");
    if (keys.some((key) => !Number.isSafeInteger(protocols[key]) || protocols[key] !== 1)) {
      invalidManifest("Release protocol compatibility is unsupported");
    }
    return protocols;
  }
  function validateCatalogBinding(input) {
    const binding = requireObject(input, "environmentCatalog");
    requireExactKeys(binding, ["schemaVersion", "sha256"], "environmentCatalog");
    if (binding.schemaVersion !== exports.AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION) {
      invalidManifest("Environment catalog schema is unsupported");
    }
    return {
      schemaVersion: exports.AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION,
      sha256: requireSha256(binding.sha256, "environmentCatalog.sha256")
    };
  }
  function validateProvenance(input) {
    const provenance = requireObject(input, "provenance");
    requireExactKeys(provenance, ["kind", "signed"], "provenance");
    if (provenance.kind !== "production" && provenance.kind !== "pull-request-validation" || typeof provenance.signed !== "boolean") {
      invalidManifest("Manifest provenance is invalid");
    }
    return provenance;
  }
  function targetParts(target) {
    const [platform2, architecture] = target.split("-");
    return {
      platform: platform2,
      architecture
    };
  }
  function requireObject(input, label) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new AgentReleaseValidationError(label.includes("catalog") || label.includes("environment") ? "INVALID_CATALOG" : "INVALID_MANIFEST", `${label} must be an object`);
    }
    return input;
  }
  function requireExactKeys(input, keys, label) {
    const actual = Object.keys(input).sort();
    const expected = [...keys].sort();
    if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
      const message = `${label} has unknown or missing fields`;
      if (label.includes("catalog") || label.includes("environment")) {
        invalidCatalog(message);
      }
      invalidManifest(message);
    }
  }
  function requireText(input, label) {
    if (typeof input !== "string" || !input.trim() || input.length > 256) {
      invalidCatalog(`${label} must be non-empty text`);
    }
    return input.trim();
  }
  function requirePattern(input, pattern, label) {
    if (typeof input !== "string" || !pattern.test(input)) {
      invalidCatalog(`${label} is invalid`);
    }
    return input;
  }
  function requireUrl(input, label) {
    if (typeof input !== "string") {
      invalidCatalog(`${label} must be a URL`);
    }
    let url;
    try {
      url = new URL(input);
    } catch {
      invalidCatalog(`${label} must be a URL`);
    }
    if (url.username || url.password || url.hash) {
      invalidCatalog(`${label} must not contain credentials or a fragment`);
    }
    return url;
  }
  function requireHttpsUrl(input, label) {
    const url = requireUrl(input, label);
    if (url.protocol !== "https:") {
      invalidCatalog(`${label} must use HTTPS`);
    }
    return url;
  }
  function requireManifestHttpsUrl(input, label) {
    if (typeof input !== "string") {
      invalidManifest(`${label} must be a URL`);
    }
    let url;
    try {
      url = new URL(input);
    } catch {
      invalidManifest(`${label} must be a URL`);
    }
    if (url.protocol !== "https:" || url.username || url.password || url.hash) {
      invalidManifest(`${label} must be an HTTPS URL without credentials or fragment`);
    }
    return url;
  }
  function requireExactOrigin(input, label) {
    const url = requireHttpsUrl(input, label);
    if (url.href !== `${url.origin}/`) {
      invalidCatalog(`${label} must be an exact origin without path or query`);
    }
    return url.origin;
  }
  function requireSemver(input, label) {
    if (typeof input !== "string" || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(input)) {
      invalidManifest(`${label} must be a semantic version`);
    }
    return input;
  }
  function requireSha256(input, label) {
    if (typeof input !== "string" || !/^[a-f0-9]{64}$/.test(input)) {
      invalidManifest(`${label} must be a lowercase SHA-256 digest`);
    }
    return input;
  }
  function requireRelativePath(input, label) {
    if (typeof input !== "string" || !input || input.startsWith("/") || input.includes("\\") || input.split("/").some((part) => !part || part === "." || part === "..")) {
      invalidManifest(`${label} must be a safe relative path`);
    }
    return input;
  }
  function parseSemver(version) {
    return version.split("-", 1)[0].split(".").map((value) => Number.parseInt(value, 10));
  }
  function compareSemver(left, right) {
    for (let index = 0;index < 3; index += 1) {
      if (left[index] !== right[index]) {
        return (left[index] ?? 0) - (right[index] ?? 0);
      }
    }
    return 0;
  }
  function sortJson(value) {
    if (Array.isArray(value)) {
      return value.map(sortJson);
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => [key, sortJson(child)]));
    }
    return value;
  }
  function trimTrailingSlash(value) {
    return value.endsWith("/") ? value.slice(0, -1) : value;
  }
  function invalidCatalog(message) {
    throw new AgentReleaseValidationError("INVALID_CATALOG", message);
  }
  function invalidManifest(message) {
    throw new AgentReleaseValidationError("INVALID_MANIFEST", message);
  }
  function invalidChannel(message) {
    throw new AgentReleaseValidationError("INVALID_CHANNEL_POINTER", message);
  }
});

// ../../packages/agent-release/dist/assembly.js
var require_assembly = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.assembleAgentBundle = assembleAgentBundle;
  exports.archiveBundleDirectory = archiveBundleDirectory;
  exports.releaseTargetFromPlatform = releaseTargetFromPlatform;
  exports.archiveBasename = archiveBasename;
  var node_crypto_1 = __require("node:crypto");
  var promises_1 = __require("node:fs/promises");
  var node_path_1 = __require("node:path");
  var fflate_1 = require_node();
  var contracts_1 = require_contracts();
  var layout_1 = require_layout();
  var REPRODUCIBLE_TIMESTAMP = new Date("1980-01-01T00:00:00.000Z");
  async function assembleAgentBundle(input) {
    const layout = (0, layout_1.createBundleLayout)(input.target, input.releaseVersion);
    const files = new Map;
    files.set("layout.json", {
      bytes: Buffer.from((0, contracts_1.canonicalJson)(layout)),
      mode: 420
    });
    files.set(layout.entryPoints.tray, {
      bytes: await (0, promises_1.readFile)(input.trayExecutablePath),
      mode: 493
    });
    files.set(layout.entryPoints.node, {
      bytes: await (0, promises_1.readFile)(input.nodeExecutablePath),
      mode: 493
    });
    const catalogBytes = await (0, promises_1.readFile)(input.environmentCatalogPath);
    (0, contracts_1.validateEnvironmentCatalog)(JSON.parse(catalogBytes.toString("utf8")));
    files.set(layout.entryPoints.environmentCatalog, {
      bytes: catalogBytes,
      mode: 420
    });
    files.set("licenses/NODE_LICENSE", {
      bytes: await (0, promises_1.readFile)(input.nodeLicensePath),
      mode: 420
    });
    files.set("licenses/THIRD_PARTY_NOTICES.txt", {
      bytes: await (0, promises_1.readFile)(input.thirdPartyNoticesPath),
      mode: 420
    });
    files.set("agent/package.json", {
      bytes: await (0, promises_1.readFile)((0, node_path_1.join)(input.deployedAgentDir, "package.json")),
      mode: 420
    });
    await collectDirectoryFiles((0, node_path_1.join)(input.deployedAgentDir, "dist"), "agent/dist", files, { exclude: new Set });
    await collectDirectoryFiles((0, node_path_1.join)(input.deployedAgentDir, "node_modules"), "agent/node_modules", files, {
      exclude: new Set([
        "agent/node_modules/.modules.yaml",
        "agent/node_modules/.pnpm"
      ])
    });
    await collectDirectoryFiles((0, node_path_1.join)(input.deployedAgentDir, "node_modules/.pnpm/node_modules"), "agent/node_modules", files, {
      exclude: new Set(["agent/node_modules/@cthutool/agent"]),
      trustedRoot: (0, node_path_1.join)(input.deployedAgentDir, "node_modules")
    });
    if (input.target.startsWith("darwin-")) {
      files.set("bin/CthuTool Agent.app/Contents/Info.plist", {
        bytes: Buffer.from(macInfoPlist(input.releaseVersion)),
        mode: 420
      });
    }
    (0, layout_1.validateBundleInventory)(input.target, [...files.keys()]);
    if (input.stageDir) {
      await materializeBundle(files, input.stageDir);
      return archiveBundleDirectory({
        outputDir: input.outputDir,
        pullRequestMarker: input.pullRequestMarker,
        releaseVersion: input.releaseVersion,
        stageDir: input.stageDir,
        target: input.target
      });
    }
    return archiveBundleFiles(files, {
      outputDir: input.outputDir,
      pullRequestMarker: input.pullRequestMarker,
      releaseVersion: input.releaseVersion,
      target: input.target
    });
  }
  async function archiveBundleDirectory(input) {
    const files = new Map;
    await collectDirectoryFiles(input.stageDir, "", files, {
      exclude: new Set
    });
    return archiveBundleFiles(files, input);
  }
  async function archiveBundleFiles(files, input) {
    const inventory = (0, layout_1.validateBundleInventory)(input.target, [...files.keys()]);
    const zipInput = {};
    for (const path of inventory) {
      const file = files.get(path);
      if (!file) {
        throw new Error(`Bundle assembly lost inventory entry ${path}`);
      }
      zipInput[path] = [
        file.bytes,
        {
          attrs: file.mode << 16,
          mtime: REPRODUCIBLE_TIMESTAMP,
          os: 3
        }
      ];
    }
    const archiveBytes = (0, fflate_1.zipSync)(zipInput, {
      level: 9,
      mtime: REPRODUCIBLE_TIMESTAMP
    });
    await (0, promises_1.mkdir)(input.outputDir, { recursive: true });
    const marker = input.pullRequestMarker ? `-unsigned-pr-${sanitizeMarker(input.pullRequestMarker)}` : "";
    const archiveName = `cthutool-agent-${input.releaseVersion}-${input.target}${marker}.zip`;
    const archivePath = (0, node_path_1.join)(input.outputDir, archiveName);
    await (0, promises_1.writeFile)(archivePath, archiveBytes);
    await (0, promises_1.chmod)(archivePath, 420);
    return {
      archivePath,
      archiveName,
      archiveSize: archiveBytes.byteLength,
      archiveSha256: (0, node_crypto_1.createHash)("sha256").update(archiveBytes).digest("hex"),
      inventory
    };
  }
  async function materializeBundle(files, stageDir) {
    await (0, promises_1.mkdir)(stageDir, { recursive: true });
    if ((await (0, promises_1.readdir)(stageDir)).length > 0) {
      throw new Error(`Agent bundle staging directory must be empty: ${stageDir}`);
    }
    for (const [archivePath, file] of files) {
      const destination = (0, node_path_1.join)(stageDir, ...archivePath.split("/"));
      await (0, promises_1.mkdir)((0, node_path_1.dirname)(destination), { recursive: true });
      await (0, promises_1.writeFile)(destination, file.bytes, { mode: file.mode });
      await (0, promises_1.chmod)(destination, file.mode);
    }
  }
  async function collectDirectoryFiles(root, archiveRoot, files, options) {
    const resolvedRoot = await (0, promises_1.realpath)((0, node_path_1.resolve)(root));
    const trustedRoot = await (0, promises_1.realpath)((0, node_path_1.resolve)(options.trustedRoot ?? root));
    await collectTree(trustedRoot, resolvedRoot, archiveRoot, files, options, new Set);
  }
  async function collectTree(trustedRoot, source, archivePath, files, options, ancestors) {
    const normalizedArchivePath = archivePath ? (0, layout_1.normalizeArchivePath)(archivePath) : "";
    if (normalizedArchivePath && options.exclude.has(normalizedArchivePath)) {
      return;
    }
    const metadata = await (0, promises_1.lstat)(source);
    const resolvedSource = metadata.isSymbolicLink() ? await (0, promises_1.realpath)(source) : source;
    if (metadata.isSymbolicLink()) {
      const targetRelative = (0, node_path_1.relative)(trustedRoot, resolvedSource);
      if (targetRelative === ".." || targetRelative.startsWith(`..${node_path_1.sep}`)) {
        throw new Error(`Agent deployment symlink escapes its root: ${source}`);
      }
    }
    const followed = await (0, promises_1.stat)(source);
    if (followed.isFile()) {
      if (!normalizedArchivePath) {
        throw new Error("Agent bundle file is missing an archive path");
      }
      files.set(normalizedArchivePath, {
        bytes: await (0, promises_1.readFile)(source),
        mode: followed.mode & 73 ? 493 : 420
      });
      return;
    }
    if (!followed.isDirectory()) {
      return;
    }
    const directoryIdentity = await (0, promises_1.realpath)(source);
    if (ancestors.has(directoryIdentity)) {
      throw new Error(`Agent deployment contains a recursive symlink: ${source}`);
    }
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(directoryIdentity);
    for (const entry of (await (0, promises_1.readdir)(source, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name))) {
      await collectTree(trustedRoot, (0, node_path_1.join)(source, entry.name), archivePath ? `${archivePath}/${entry.name}` : entry.name, files, options, nextAncestors);
    }
  }
  function sanitizeMarker(value) {
    const marker = value.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 64);
    if (!marker) {
      throw new Error("Pull-request marker is invalid");
    }
    return marker;
  }
  function macInfoPlist(version) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleDisplayName</key><string>CthuTool Agent</string>
<key>CFBundleExecutable</key><string>cthutool-agent-tray</string>
<key>CFBundleIdentifier</key><string>dev.cthutool.agent</string>
<key>CFBundleName</key><string>CthuTool Agent</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleShortVersionString</key><string>${version}</string>
<key>CFBundleVersion</key><string>${version}</string>
<key>LSUIElement</key><true/>
<key>NSLocalNetworkUsageDescription</key><string>Connect the deployed CthuTool console to this local Agent.</string>
</dict></plist>
`;
  }
  function releaseTargetFromPlatform(platform2, architecture) {
    if (platform2 === "darwin" && architecture === "arm64") {
      return "darwin-arm64";
    }
    if (platform2 === "darwin" && architecture === "x64") {
      return "darwin-x64";
    }
    if (platform2 === "win32" && architecture === "x64") {
      return "windows-x64";
    }
    return;
  }
  function archiveBasename(path) {
    return (0, node_path_1.basename)(path);
  }
});

// ../../packages/agent-release/dist/node-runtime.js
var require_node_runtime = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.preparePinnedNodeRuntime = preparePinnedNodeRuntime;
  exports.validateNodeRuntimeLock = validateNodeRuntimeLock;
  var node_crypto_1 = __require("node:crypto");
  var promises_1 = __require("node:fs/promises");
  var node_path_1 = __require("node:path");
  var fflate_1 = require_node();
  async function preparePinnedNodeRuntime(input) {
    const lock = validateNodeRuntimeLock(JSON.parse(await (0, promises_1.readFile)(input.lockPath, "utf8")));
    const source = lock.sources[input.target];
    const response = await (input.fetchImpl ?? fetch)(source.url, {
      redirect: "error"
    });
    if (!response.ok) {
      throw new Error(`Pinned Node.js download failed with HTTP ${response.status}`);
    }
    const archive = new Uint8Array(await response.arrayBuffer());
    const digest = (0, node_crypto_1.createHash)("sha256").update(archive).digest("hex");
    if (digest !== source.sha256) {
      throw new Error("Pinned Node.js archive digest does not match the lock file");
    }
    const root = source.archive.replace(/\.(?:tar\.gz|zip)$/, "");
    const entries = source.archive.endsWith(".zip") ? unzipEntries(archive) : untarEntries((0, fflate_1.gunzipSync)(archive));
    const executableName = input.target === "windows-x64" ? "node.exe" : "bin/node";
    const executable = entries.get(`${root}/${executableName}`);
    const license = entries.get(`${root}/LICENSE`);
    if (!executable || !license) {
      throw new Error("Pinned Node.js archive is missing its runtime or LICENSE");
    }
    await (0, promises_1.mkdir)(input.outputDir, { recursive: true });
    const executablePath = (0, node_path_1.join)(input.outputDir, input.target === "windows-x64" ? "node.exe" : "node");
    const licensePath = (0, node_path_1.join)(input.outputDir, "LICENSE");
    await (0, promises_1.writeFile)(executablePath, executable, { mode: 493 });
    await (0, promises_1.chmod)(executablePath, 493);
    await (0, promises_1.writeFile)(licensePath, license, { mode: 420 });
    return {
      version: lock.version,
      executablePath,
      licensePath,
      sourceSha256: digest
    };
  }
  function validateNodeRuntimeLock(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new Error("Node.js runtime lock must be an object");
    }
    const value = input;
    if (value.schemaVersion !== 1 || typeof value.version !== "string" || !/^\d+\.\d+\.\d+$/.test(value.version) || !value.sources) {
      throw new Error("Node.js runtime lock contract is invalid");
    }
    const targets = [
      "darwin-arm64",
      "darwin-x64",
      "windows-x64"
    ];
    for (const target of targets) {
      const source = value.sources[target];
      const platformName = target === "windows-x64" ? "win-x64" : target.replace("darwin-", "darwin-");
      const expectedArchive = `node-v${value.version}-${platformName}.${target === "windows-x64" ? "zip" : "tar.gz"}`;
      if (!source || source.archive !== expectedArchive || source.url !== `https://nodejs.org/dist/v${value.version}/${source.archive}` || !/^[a-f0-9]{64}$/.test(source.sha256)) {
        throw new Error(`Node.js runtime lock source is invalid for ${target}`);
      }
    }
    return value;
  }
  function unzipEntries(archive) {
    return new Map(Object.entries((0, fflate_1.unzipSync)(archive)));
  }
  function untarEntries(archive) {
    const entries = new Map;
    for (let offset = 0;offset + 512 <= archive.byteLength; ) {
      const header = archive.subarray(offset, offset + 512);
      if (header.every((byte) => byte === 0)) {
        break;
      }
      const name = readTarString(header.subarray(0, 100));
      const prefix = readTarString(header.subarray(345, 500));
      const path = prefix ? `${prefix}/${name}` : name;
      const sizeText = readTarString(header.subarray(124, 136)).trim();
      const size = Number.parseInt(sizeText || "0", 8);
      if (!Number.isSafeInteger(size) || size < 0) {
        throw new Error("Pinned Node.js tar archive contains an invalid size");
      }
      const contentStart = offset + 512;
      const contentEnd = contentStart + size;
      if (contentEnd > archive.byteLength) {
        throw new Error("Pinned Node.js tar archive is truncated");
      }
      if (header[156] === 0 || header[156] === 48) {
        entries.set(path, archive.slice(contentStart, contentEnd));
      }
      offset = contentStart + Math.ceil(size / 512) * 512;
    }
    return entries;
  }
  function readTarString(bytes) {
    const end = bytes.indexOf(0);
    return Buffer.from(end >= 0 ? bytes.subarray(0, end) : bytes).toString("utf8");
  }
});

// ../../packages/agent-release/dist/publication.js
var require_publication = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createArtifactReceipt = createArtifactReceipt;
  exports.createReleaseManifest = createReleaseManifest;
  exports.createChannelPointer = createChannelPointer;
  exports.verifyProductionReleaseSet = verifyProductionReleaseSet;
  exports.validateReceipt = validateReceipt;
  var promises_1 = __require("node:fs/promises");
  var node_path_1 = __require("node:path");
  var contracts_1 = require_contracts();
  var layout_1 = require_layout();
  async function createArtifactReceipt(input) {
    const layout = (0, layout_1.validateBundleLayout)(JSON.parse(await (0, promises_1.readFile)((0, node_path_1.join)(input.bundleRoot, "layout.json"), "utf8")));
    if (layout.target !== input.target || layout.releaseVersion !== input.releaseVersion) {
      throw new Error("Artifact receipt does not match the staged bundle layout");
    }
    (0, layout_1.validateBundleInventory)(input.target, await listFiles(input.bundleRoot));
    const archiveBytes = await (0, promises_1.readFile)(input.archivePath);
    const archiveName = (0, node_path_1.basename)(input.archivePath);
    const expectedPrefix = `cthutool-agent-${input.releaseVersion}-${input.target}`;
    if (!archiveName.startsWith(expectedPrefix) || !archiveName.endsWith(".zip")) {
      throw new Error("Agent archive name does not match its version and target");
    }
    const baseUrl = requireImmutableBaseUrl(input.immutableBaseUrl, input.releaseVersion);
    const archiveUrl = new URL(archiveName, baseUrl).href;
    const windows = input.target === "windows-x64";
    const receipt = {
      schemaVersion: 1,
      releaseVersion: input.releaseVersion,
      provenance: input.provenance,
      artifact: {
        target: input.target,
        platform: windows ? "windows" : "darwin",
        architecture: input.target.endsWith("arm64") ? "arm64" : "x64",
        archiveUrl,
        archiveSize: archiveBytes.byteLength,
        archiveSha256: (0, contracts_1.sha256)(archiveBytes),
        archiveSignatureUrl: `${archiveUrl}.sig`,
        trayEntryPoint: layout.entryPoints.tray,
        nodeEntryPoint: layout.entryPoints.node,
        agentEntryPoint: layout.entryPoints.agent,
        platformSignature: {
          required: true,
          notarizationRequired: !windows
        }
      },
      validation: {
        cleanHostSmoke: input.cleanHostSmoke,
        platformSigned: input.platformSigned,
        notarizationStapled: input.notarizationStapled
      }
    };
    validateReceipt(receipt);
    return receipt;
  }
  function createReleaseManifest(input) {
    const catalog = (0, contracts_1.validateEnvironmentCatalog)(JSON.parse(Buffer.from(input.catalogBytes).toString("utf8")));
    const receipts = input.receipts.map(validateReceipt);
    if (new Set(receipts.map((receipt) => receipt.artifact.target)).size !== receipts.length) {
      throw new Error("Artifact receipts contain duplicate targets");
    }
    if (receipts.some((receipt) => receipt.releaseVersion !== input.releaseVersion || receipt.provenance !== input.provenance)) {
      throw new Error("Artifact receipts have mixed versions or provenance");
    }
    if (input.provenance === "production" && receipts.some((receipt) => !receipt.validation.cleanHostSmoke || !receipt.validation.platformSigned || receipt.artifact.platform === "darwin" && !receipt.validation.notarizationStapled)) {
      throw new Error("Production artifacts require clean-host smoke, platform signing, and macOS stapling");
    }
    const receiptByTarget = new Map(receipts.map((receipt) => [receipt.artifact.target, receipt]));
    if (input.provenance === "production" && !contracts_1.SUPPORTED_AGENT_TARGETS.every((target) => receiptByTarget.has(target))) {
      throw new Error("Production release is missing a supported target");
    }
    const manifest = {
      schemaVersion: contracts_1.AGENT_RELEASE_MANIFEST_SCHEMA_VERSION,
      releaseVersion: input.releaseVersion,
      minimumCliVersion: input.minimumCliVersion,
      layoutVersion: 1,
      protocols: {
        agentBackend: 1,
        agentControl: 1,
        localBridge: 1,
        trayControl: 1
      },
      environmentCatalog: {
        schemaVersion: catalog.schemaVersion,
        sha256: (0, contracts_1.sha256)(input.catalogBytes)
      },
      provenance: {
        kind: input.provenance,
        signed: input.provenance === "production"
      },
      artifacts: contracts_1.SUPPORTED_AGENT_TARGETS.flatMap((target) => {
        const receipt = receiptByTarget.get(target);
        return receipt ? [receipt.artifact] : [];
      })
    };
    return (0, contracts_1.validateReleaseManifest)(manifest, {
      requireProductionMatrix: input.provenance === "production"
    });
  }
  function createChannelPointer(input) {
    if (input.manifest.provenance.kind !== "production") {
      throw new Error("A channel cannot point to a pull-request manifest");
    }
    const url = new URL(input.manifestUrl);
    if (url.protocol !== "https:" || !url.pathname.includes(`/${input.manifest.releaseVersion}/`)) {
      throw new Error("Channel target must be an immutable HTTPS manifest URL");
    }
    return {
      schemaVersion: 1,
      channel: input.channel,
      releaseVersion: input.manifest.releaseVersion,
      manifestUrl: url.href,
      manifestSha256: (0, contracts_1.sha256)((0, contracts_1.canonicalJson)(input.manifest))
    };
  }
  async function verifyProductionReleaseSet(input) {
    const manifest = (0, contracts_1.validateReleaseManifest)(JSON.parse(await (0, promises_1.readFile)(input.manifestPath, "utf8")), { requireProductionMatrix: true });
    if (manifest.provenance.kind !== "production") {
      throw new Error("Production verification requires a production manifest");
    }
    (0, contracts_1.verifyManifestSignature)(manifest, (await (0, promises_1.readFile)(input.manifestSignaturePath, "utf8")).trim(), input.publicKeyPem);
    (0, contracts_1.assertCatalogBinding)(manifest, await (0, promises_1.readFile)(input.catalogPath));
    for (const artifact of manifest.artifacts) {
      const archivePath = (0, node_path_1.join)(input.archivesDir, (0, node_path_1.basename)(new URL(artifact.archiveUrl).pathname));
      const archiveBytes = await (0, promises_1.readFile)(archivePath);
      (0, contracts_1.assertArchiveBinding)(artifact, archiveBytes);
      (0, contracts_1.verifyReleaseBlobSignature)(archiveBytes, (await (0, promises_1.readFile)(`${archivePath}.sig`, "utf8")).trim(), input.publicKeyPem);
    }
    return manifest;
  }
  function validateReceipt(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new Error("Artifact receipt must be an object");
    }
    const receipt = input;
    if (receipt.schemaVersion !== 1 || typeof receipt.releaseVersion !== "string" || receipt.provenance !== "production" && receipt.provenance !== "pull-request-validation" || !receipt.artifact || !receipt.validation || typeof receipt.validation.cleanHostSmoke !== "boolean" || typeof receipt.validation.platformSigned !== "boolean" || typeof receipt.validation.notarizationStapled !== "boolean") {
      throw new Error("Artifact receipt contract is invalid");
    }
    const validationManifest = (0, contracts_1.validateReleaseManifest)({
      schemaVersion: 1,
      releaseVersion: receipt.releaseVersion,
      minimumCliVersion: "0.0.0",
      layoutVersion: 1,
      protocols: {
        agentBackend: 1,
        agentControl: 1,
        localBridge: 1,
        trayControl: 1
      },
      environmentCatalog: {
        schemaVersion: contracts_1.AGENT_ENVIRONMENT_CATALOG_SCHEMA_VERSION,
        sha256: "0".repeat(64)
      },
      provenance: {
        kind: receipt.provenance,
        signed: receipt.provenance === "production"
      },
      artifacts: [receipt.artifact]
    }, { requireProductionMatrix: false });
    return {
      schemaVersion: 1,
      releaseVersion: receipt.releaseVersion,
      provenance: receipt.provenance,
      artifact: validationManifest.artifacts[0],
      validation: receipt.validation
    };
  }
  async function listFiles(root, directory = root) {
    const output = [];
    for (const entry of await (0, promises_1.readdir)(directory, { withFileTypes: true })) {
      const path = (0, node_path_1.join)(directory, entry.name);
      if (entry.isDirectory()) {
        output.push(...await listFiles(root, path));
      } else if (entry.isFile()) {
        output.push(path.slice(root.length + 1).replaceAll("\\", "/"));
      }
    }
    return output;
  }
  function requireImmutableBaseUrl(value, version) {
    const url = new URL(value.endsWith("/") ? value : `${value}/`);
    if (url.protocol !== "https:" || !url.pathname.includes(`/${version}/`) || url.search || url.hash) {
      throw new Error("Artifact base URL must be immutable, versioned, and HTTPS");
    }
    return url;
  }
});

// ../../packages/agent-release/dist/smoke.js
var require_smoke = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.smokeExtractedAgentBundle = smokeExtractedAgentBundle;
  var node_child_process_1 = __require("node:child_process");
  var promises_1 = __require("node:fs/promises");
  var node_net_1 = __require("node:net");
  var node_path_1 = __require("node:path");
  var contracts_1 = require_contracts();
  var layout_1 = require_layout();
  async function smokeExtractedAgentBundle(input) {
    const timeoutMs = input.timeoutMs ?? 20000;
    const layout = (0, layout_1.validateBundleLayout)(JSON.parse(await (0, promises_1.readFile)((0, node_path_1.join)(input.bundleRoot, "layout.json"), "utf8")));
    (0, layout_1.validateBundleInventory)(layout.target, await listBundleFiles(input.bundleRoot));
    const catalogPath = (0, node_path_1.resolve)(input.bundleRoot, ...layout.entryPoints.environmentCatalog.split("/"));
    const catalog = (0, contracts_1.validateEnvironmentCatalog)(JSON.parse(await (0, promises_1.readFile)(catalogPath, "utf8")));
    const userDataDir = (0, node_path_1.resolve)(input.userDataDir);
    const nodePath = await (0, promises_1.realpath)((0, node_path_1.resolve)(input.bundleRoot, ...layout.entryPoints.node.split("/")));
    const agentPath = await (0, promises_1.realpath)((0, node_path_1.resolve)(input.bundleRoot, ...layout.entryPoints.agent.split("/")));
    const instancePath = (0, node_path_1.join)(userDataDir, "runtime", "instance.json");
    await (0, promises_1.rm)(instancePath, { force: true });
    const stderr = [];
    const child = (0, node_child_process_1.spawn)(nodePath, [agentPath, "--user-data-dir", userDataDir], {
      cwd: input.bundleRoot,
      env: {
        ...process.env,
        ...input.environment,
        CTHUTOOL_AGENT_DISABLED: "1",
        CTHUTOOL_AGENT_ENVIRONMENTS_PATH: catalogPath,
        CTHUTOOL_AGENT_VERSION: layout.releaseVersion,
        NODE_ENV: "production",
        PATH: ""
      },
      stdio: ["ignore", "ignore", "pipe"]
    });
    child.stderr?.on("data", (chunk) => {
      if (Buffer.concat(stderr).byteLength < 64 * 1024) {
        stderr.push(chunk);
      }
    });
    try {
      const record = await waitForInstance(instancePath, child, timeoutMs, stderr);
      if (await (0, promises_1.realpath)(record.executablePath) !== nodePath || await (0, promises_1.realpath)(record.entryPoint) !== agentPath || record.pid !== child.pid) {
        throw new Error("Agent smoke process did not use the bundled entry points");
      }
      const healthResult = await waitForControl(record, child, timeoutMs, stderr);
      if (healthResult.applicationVersion !== layout.releaseVersion || typeof healthResult.bridge?.endpoint !== "string") {
        throw new Error("Agent health did not report the release version and bridge");
      }
      const environments = requireSuccess(await requestControl(record, "environment.list"), "environment.list");
      const environmentId = catalog.profiles[0]?.environmentId;
      if (!environmentId || !environments.environments?.some((item) => item.id === environmentId)) {
        throw new Error("Agent smoke did not load the release environment catalog");
      }
      requireSuccess(await requestControl(record, "environment.switch", environmentId, timeoutMs), "environment.switch");
      const launch = requireSuccess(await requestControl(record, "bridge.launch"), "bridge.launch");
      if (launch.endpoint !== healthResult.bridge.endpoint || launch.environmentId !== environmentId || typeof launch.launchUrl !== "string") {
        throw new Error("Agent bridge launch metadata is inconsistent");
      }
      const bootstrapResponse = await fetch(`${launch.endpoint}/v1/bootstrap`, {
        headers: { origin: catalog.profiles[0].webOrigin },
        signal: AbortSignal.timeout(Math.min(timeoutMs, 5000))
      });
      if (!bootstrapResponse.ok) {
        throw new Error(`Agent bridge readiness returned ${bootstrapResponse.status}`);
      }
      await requestControl(record, "shutdown");
      await waitForExit(child, timeoutMs);
      await waitForRemoval(instancePath, timeoutMs);
      return {
        applicationVersion: layout.releaseVersion,
        bridgeEndpoint: launch.endpoint,
        bundledNodePath: nodePath,
        environmentId
      };
    } catch (error) {
      await terminateExactChild(child);
      const detail = Buffer.concat(stderr).toString("utf8").trim();
      throw new Error(`${error instanceof Error ? error.message : "Agent bundle smoke failed"}${detail ? `
Agent stderr:
${detail}` : ""}`, { cause: error });
    }
  }
  async function listBundleFiles(root, directory = root) {
    const output = [];
    for (const entry of await (0, promises_1.readdir)(directory, { withFileTypes: true })) {
      const path = (0, node_path_1.join)(directory, entry.name);
      if (entry.isDirectory()) {
        output.push(...await listBundleFiles(root, path));
      } else if (entry.isFile()) {
        output.push(path.slice(root.length + 1).replaceAll("\\", "/"));
      }
    }
    return output;
  }
  async function waitForInstance(path, child, timeoutMs, stderr) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) {
        throw new Error(`Agent exited before readiness with code ${child.exitCode}: ${Buffer.concat(stderr).toString("utf8")}`);
      }
      try {
        const value = JSON.parse(await (0, promises_1.readFile)(path, "utf8"));
        if (typeof value.protocolVersion === "number" && typeof value.pid === "number" && typeof value.nonce === "string" && typeof value.controlEndpoint === "string" && typeof value.executablePath === "string" && typeof value.entryPoint === "string") {
          return value;
        }
      } catch {}
      await delay(50);
    }
    throw new Error("Timed out waiting for Agent readiness record");
  }
  async function requestControl(record, operation, environmentId, timeoutMs = 5000) {
    return new Promise((resolvePromise, rejectPromise) => {
      const socket = (0, node_net_1.createConnection)(record.controlEndpoint);
      const timer = setTimeout(() => {
        socket.destroy();
        const error = new Error(`Agent ${operation} request timed out`);
        error.code = "ETIMEDOUT";
        rejectPromise(error);
      }, timeoutMs);
      let payload = "";
      socket.setEncoding("utf8");
      socket.once("connect", () => {
        socket.write(`${JSON.stringify({
          instanceNonce: record.nonce,
          operation,
          protocolVersion: record.protocolVersion,
          ...environmentId ? { environmentId } : {}
        })}
`);
      });
      socket.on("data", (chunk) => {
        payload += chunk;
        const newline = payload.indexOf(`
`);
        if (newline >= 0) {
          clearTimeout(timer);
          socket.end();
          try {
            resolvePromise(JSON.parse(payload.slice(0, newline)));
          } catch (error) {
            rejectPromise(error);
          }
        }
      });
      socket.once("error", (error) => {
        clearTimeout(timer);
        rejectPromise(error);
      });
    });
  }
  async function waitForControl(record, child, timeoutMs, stderr) {
    const deadline = Date.now() + timeoutMs;
    let lastError;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) {
        throw new Error(`Agent exited before control readiness with code ${child.exitCode}: ${Buffer.concat(stderr).toString("utf8")}`);
      }
      try {
        return requireSuccess(await requestControl(record, "health", undefined, Math.max(1, Math.min(500, deadline - Date.now()))), "health");
      } catch (error) {
        if (!isControlNotReadyError(error)) {
          throw error;
        }
        lastError = error;
        await delay(50);
      }
    }
    throw new Error(`Timed out waiting for Agent control readiness${lastError instanceof Error ? `: ${lastError.message}` : ""}`);
  }
  function isControlNotReadyError(error) {
    const code = error?.code;
    return code === "ENOENT" || code === "ECONNREFUSED" || code === "ECONNRESET" || code === "ETIMEDOUT";
  }
  function requireSuccess(value, operation) {
    if (!value || typeof value !== "object" || value.ok !== true || !("result" in value)) {
      throw new Error(`Agent ${operation} control request failed`);
    }
    return value.result;
  }
  async function waitForExit(child, timeoutMs) {
    if (child.exitCode !== null) {
      return;
    }
    await Promise.race([
      new Promise((resolvePromise, rejectPromise) => {
        child.once("exit", (code, signal) => {
          code === 0 ? resolvePromise() : rejectPromise(new Error(`Agent exited with code ${code ?? "none"} signal ${signal ?? "none"}`));
        });
      }),
      delay(timeoutMs).then(() => {
        throw new Error("Timed out waiting for coordinated Agent shutdown");
      })
    ]);
  }
  async function waitForRemoval(path, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        await (0, promises_1.readFile)(path);
      } catch (error) {
        if (error.code === "ENOENT") {
          return;
        }
        throw error;
      }
      await delay(50);
    }
    throw new Error("Agent shutdown left a stale instance record");
  }
  async function terminateExactChild(child) {
    if (child.exitCode !== null || child.pid === undefined) {
      return;
    }
    child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolvePromise) => child.once("exit", () => resolvePromise())),
      delay(2000)
    ]);
    if (child.exitCode === null) {
      child.kill("SIGKILL");
    }
  }
  function delay(milliseconds) {
    return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
  }
});

// ../../packages/agent-release/dist/index.js
var require_dist2 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o3, m3, k4, k22) {
    if (k22 === undefined)
      k22 = k4;
    var desc = Object.getOwnPropertyDescriptor(m3, k4);
    if (!desc || ("get" in desc ? !m3.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m3[k4];
      } };
    }
    Object.defineProperty(o3, k22, desc);
  } : function(o3, m3, k4, k22) {
    if (k22 === undefined)
      k22 = k4;
    o3[k22] = m3[k4];
  });
  var __exportStar = exports && exports.__exportStar || function(m3, exports2) {
    for (var p in m3)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m3, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_activation(), exports);
  __exportStar(require_assembly(), exports);
  __exportStar(require_contracts(), exports);
  __exportStar(require_layout(), exports);
  __exportStar(require_node_runtime(), exports);
  __exportStar(require_publication(), exports);
  __exportStar(require_smoke(), exports);
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
var import_picocolors10 = __toESM(require_picocolors(), 1);

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
var import_picocolors = __toESM(require_picocolors(), 1);
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
var fD2 = Object.defineProperty;
var gD = (e2, u3, F3) => (u3 in e2) ? fD2(e2, u3, { enumerable: true, configurable: true, writable: true, value: F3 }) : e2[u3] = F3;
var K = (e2, u3, F3) => (gD(e2, typeof u3 != "symbol" ? u3 + "" : u3, F3), F3);
var vD = class extends x2 {
  constructor(u3) {
    super(u3, false), K(this, "options"), K(this, "cursor", 0), this.options = u3.options, this.value = [...u3.initialValues ?? []], this.cursor = Math.max(this.options.findIndex(({ value: F3 }) => F3 === u3.cursorAt), 0), this.on("key", (F3) => {
      F3 === "a" && this.toggleAll();
    }), this.on("cursor", (F3) => {
      switch (F3) {
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
    const u3 = this.value.length === this.options.length;
    this.value = u3 ? [] : this.options.map((F3) => F3.value);
  }
  toggleValue() {
    const u3 = this.value.includes(this._value);
    this.value = u3 ? this.value.filter((F3) => F3 !== this._value) : [...this.value, this._value];
  }
};
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
var TD = Object.defineProperty;
var jD2 = (e2, u3, F3) => (u3 in e2) ? TD(e2, u3, { enumerable: true, configurable: true, writable: true, value: F3 }) : e2[u3] = F3;
var MD = (e2, u3, F3) => (jD2(e2, typeof u3 != "symbol" ? u3 + "" : u3, F3), F3);

class PD2 extends x2 {
  constructor(u3) {
    super(u3), MD(this, "valueWithCursor", ""), this.on("finalize", () => {
      this.value || (this.value = u3.defaultValue), this.valueWithCursor = this.value;
    }), this.on("value", () => {
      if (this.cursor >= this.value.length)
        this.valueWithCursor = `${this.value}${import_picocolors.default.inverse(import_picocolors.default.hidden("_"))}`;
      else {
        const F3 = this.value.slice(0, this.cursor), t2 = this.value.slice(this.cursor);
        this.valueWithCursor = `${F3}${import_picocolors.default.inverse(t2[0])}${t2.slice(1)}`;
      }
    });
  }
  get cursor() {
    return this._cursor;
  }
}
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
var import_picocolors2 = __toESM(require_picocolors(), 1);
var import_sisteransi2 = __toESM(require_src(), 1);
import h2 from "node:process";
function K2() {
  return h2.platform !== "win32" ? h2.env.TERM !== "linux" : !!h2.env.CI || !!h2.env.WT_SESSION || !!h2.env.TERMINUS_SUBLIME || h2.env.ConEmuTask === "{cmd::Cmder}" || h2.env.TERM_PROGRAM === "Terminus-Sublime" || h2.env.TERM_PROGRAM === "vscode" || h2.env.TERM === "xterm-256color" || h2.env.TERM === "alacritty" || h2.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var C3 = K2();
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
      return import_picocolors2.default.cyan(Y2);
    case "cancel":
      return import_picocolors2.default.red(P4);
    case "error":
      return import_picocolors2.default.yellow(V3);
    case "submit":
      return import_picocolors2.default.green(M2);
  }
};
var E = (s2) => {
  const { cursor: n2, options: t2, style: i2 } = s2, r4 = s2.maxItems ?? 1 / 0, o3 = Math.max(process.stdout.rows - 4, 0), c4 = Math.min(o3, Math.max(r4, 5));
  let l3 = 0;
  n2 >= l3 + c4 - 3 ? l3 = Math.max(Math.min(n2 - c4 + 3, t2.length - c4), 0) : n2 < l3 + 2 && (l3 = Math.max(n2 - 2, 0));
  const d3 = c4 < t2.length && l3 > 0, p = c4 < t2.length && l3 + c4 < t2.length;
  return t2.slice(l3, l3 + c4).map((S4, f4, x3) => {
    const g4 = f4 === 0 && d3, m3 = f4 === x3.length - 1 && p;
    return g4 || m3 ? import_picocolors2.default.dim("...") : i2(S4, f4 + l3 === n2);
  });
};
var ae = (s2) => new PD2({ validate: s2.validate, placeholder: s2.placeholder, defaultValue: s2.defaultValue, initialValue: s2.initialValue, render() {
  const n2 = `${import_picocolors2.default.gray(a3)}
${y4(this.state)}  ${s2.message}
`, t2 = s2.placeholder ? import_picocolors2.default.inverse(s2.placeholder[0]) + import_picocolors2.default.dim(s2.placeholder.slice(1)) : import_picocolors2.default.inverse(import_picocolors2.default.hidden("_")), i2 = this.value ? this.valueWithCursor : t2;
  switch (this.state) {
    case "error":
      return `${n2.trim()}
${import_picocolors2.default.yellow(a3)}  ${i2}
${import_picocolors2.default.yellow($2)}  ${import_picocolors2.default.yellow(this.error)}
`;
    case "submit":
      return `${n2}${import_picocolors2.default.gray(a3)}  ${import_picocolors2.default.dim(this.value || s2.placeholder)}`;
    case "cancel":
      return `${n2}${import_picocolors2.default.gray(a3)}  ${import_picocolors2.default.strikethrough(import_picocolors2.default.dim(this.value ?? ""))}${this.value?.trim() ? `
` + import_picocolors2.default.gray(a3) : ""}`;
    default:
      return `${n2}${import_picocolors2.default.cyan(a3)}  ${i2}
${import_picocolors2.default.cyan($2)}
`;
  }
} }).prompt();
var ce2 = (s2) => {
  const n2 = s2.active ?? "Yes", t2 = s2.inactive ?? "No";
  return new BD({ active: n2, inactive: t2, initialValue: s2.initialValue ?? true, render() {
    const i2 = `${import_picocolors2.default.gray(a3)}
${y4(this.state)}  ${s2.message}
`, r4 = this.value ? n2 : t2;
    switch (this.state) {
      case "submit":
        return `${i2}${import_picocolors2.default.gray(a3)}  ${import_picocolors2.default.dim(r4)}`;
      case "cancel":
        return `${i2}${import_picocolors2.default.gray(a3)}  ${import_picocolors2.default.strikethrough(import_picocolors2.default.dim(r4))}
${import_picocolors2.default.gray(a3)}`;
      default:
        return `${i2}${import_picocolors2.default.cyan(a3)}  ${this.value ? `${import_picocolors2.default.green(I4)} ${n2}` : `${import_picocolors2.default.dim(T4)} ${import_picocolors2.default.dim(n2)}`} ${import_picocolors2.default.dim("/")} ${this.value ? `${import_picocolors2.default.dim(T4)} ${import_picocolors2.default.dim(t2)}` : `${import_picocolors2.default.green(I4)} ${t2}`}
${import_picocolors2.default.cyan($2)}
`;
    }
  } }).prompt();
};
var le2 = (s2) => {
  const n2 = (t2, i2) => {
    const r4 = t2.label ?? String(t2.value);
    switch (i2) {
      case "selected":
        return `${import_picocolors2.default.dim(r4)}`;
      case "active":
        return `${import_picocolors2.default.green(I4)} ${r4} ${t2.hint ? import_picocolors2.default.dim(`(${t2.hint})`) : ""}`;
      case "cancelled":
        return `${import_picocolors2.default.strikethrough(import_picocolors2.default.dim(r4))}`;
      default:
        return `${import_picocolors2.default.dim(T4)} ${import_picocolors2.default.dim(r4)}`;
    }
  };
  return new $D2({ options: s2.options, initialValue: s2.initialValue, render() {
    const t2 = `${import_picocolors2.default.gray(a3)}
${y4(this.state)}  ${s2.message}
`;
    switch (this.state) {
      case "submit":
        return `${t2}${import_picocolors2.default.gray(a3)}  ${n2(this.options[this.cursor], "selected")}`;
      case "cancel":
        return `${t2}${import_picocolors2.default.gray(a3)}  ${n2(this.options[this.cursor], "cancelled")}
${import_picocolors2.default.gray(a3)}`;
      default:
        return `${t2}${import_picocolors2.default.cyan(a3)}  ${E({ cursor: this.cursor, options: this.options, maxItems: s2.maxItems, style: (i2, r4) => n2(i2, r4 ? "active" : "inactive") }).join(`
${import_picocolors2.default.cyan(a3)}  `)}
${import_picocolors2.default.cyan($2)}
`;
    }
  } }).prompt();
};
var $e = (s2) => {
  const n2 = (t2, i2) => {
    const r4 = t2.label ?? String(t2.value);
    return i2 === "active" ? `${import_picocolors2.default.cyan(j2)} ${r4} ${t2.hint ? import_picocolors2.default.dim(`(${t2.hint})`) : ""}` : i2 === "selected" ? `${import_picocolors2.default.green(b3)} ${import_picocolors2.default.dim(r4)}` : i2 === "cancelled" ? `${import_picocolors2.default.strikethrough(import_picocolors2.default.dim(r4))}` : i2 === "active-selected" ? `${import_picocolors2.default.green(b3)} ${r4} ${t2.hint ? import_picocolors2.default.dim(`(${t2.hint})`) : ""}` : i2 === "submitted" ? `${import_picocolors2.default.dim(r4)}` : `${import_picocolors2.default.dim(B2)} ${import_picocolors2.default.dim(r4)}`;
  };
  return new vD({ options: s2.options, initialValues: s2.initialValues, required: s2.required ?? true, cursorAt: s2.cursorAt, validate(t2) {
    if (this.required && t2.length === 0)
      return `Please select at least one option.
${import_picocolors2.default.reset(import_picocolors2.default.dim(`Press ${import_picocolors2.default.gray(import_picocolors2.default.bgWhite(import_picocolors2.default.inverse(" space ")))} to select, ${import_picocolors2.default.gray(import_picocolors2.default.bgWhite(import_picocolors2.default.inverse(" enter ")))} to submit`))}`;
  }, render() {
    let t2 = `${import_picocolors2.default.gray(a3)}
${y4(this.state)}  ${s2.message}
`;
    const i2 = (r4, o3) => {
      const c4 = this.value.includes(r4.value);
      return o3 && c4 ? n2(r4, "active-selected") : c4 ? n2(r4, "selected") : n2(r4, o3 ? "active" : "inactive");
    };
    switch (this.state) {
      case "submit":
        return `${t2}${import_picocolors2.default.gray(a3)}  ${this.options.filter(({ value: r4 }) => this.value.includes(r4)).map((r4) => n2(r4, "submitted")).join(import_picocolors2.default.dim(", ")) || import_picocolors2.default.dim("none")}`;
      case "cancel": {
        const r4 = this.options.filter(({ value: o3 }) => this.value.includes(o3)).map((o3) => n2(o3, "cancelled")).join(import_picocolors2.default.dim(", "));
        return `${t2}${import_picocolors2.default.gray(a3)}  ${r4.trim() ? `${r4}
${import_picocolors2.default.gray(a3)}` : ""}`;
      }
      case "error": {
        const r4 = this.error.split(`
`).map((o3, c4) => c4 === 0 ? `${import_picocolors2.default.yellow($2)}  ${import_picocolors2.default.yellow(o3)}` : `   ${o3}`).join(`
`);
        return t2 + import_picocolors2.default.yellow(a3) + "  " + E({ options: this.options, cursor: this.cursor, maxItems: s2.maxItems, style: i2 }).join(`
${import_picocolors2.default.yellow(a3)}  `) + `
` + r4 + `
`;
      }
      default:
        return `${t2}${import_picocolors2.default.cyan(a3)}  ${E({ options: this.options, cursor: this.cursor, maxItems: s2.maxItems, style: i2 }).join(`
${import_picocolors2.default.cyan(a3)}  `)}
${import_picocolors2.default.cyan($2)}
`;
    }
  } }).prompt();
};
var pe = (s2 = "") => {
  process.stdout.write(`${import_picocolors2.default.gray(Q3)}  ${s2}
`);
};
var _4 = () => {
  const s2 = C3 ? ["◒", "◐", "◓", "◑"] : ["•", "o", "O", "0"], n2 = C3 ? 80 : 120;
  let t2, i2, r4 = false, o3 = "";
  const c4 = (g4) => {
    const m3 = g4 > 1 ? "Something went wrong" : "Canceled";
    r4 && x3(m3, g4);
  }, l3 = () => c4(2), d3 = () => c4(1), p = () => {
    process.on("uncaughtExceptionMonitor", l3), process.on("unhandledRejection", l3), process.on("SIGINT", d3), process.on("SIGTERM", d3), process.on("exit", c4);
  }, S4 = () => {
    process.removeListener("uncaughtExceptionMonitor", l3), process.removeListener("unhandledRejection", l3), process.removeListener("SIGINT", d3), process.removeListener("SIGTERM", d3), process.removeListener("exit", c4);
  }, f4 = (g4 = "") => {
    r4 = true, t2 = OD(), o3 = g4.replace(/\.+$/, ""), process.stdout.write(`${import_picocolors2.default.gray(a3)}
`);
    let m3 = 0, w3 = 0;
    p(), i2 = setInterval(() => {
      const L4 = import_picocolors2.default.magenta(s2[m3]), O4 = ".".repeat(Math.floor(w3)).slice(0, 3);
      process.stdout.write(import_sisteransi2.cursor.move(-999, 0)), process.stdout.write(import_sisteransi2.erase.down(1)), process.stdout.write(`${L4}  ${o3}${O4}`), m3 = m3 + 1 < s2.length ? m3 + 1 : 0, w3 = w3 < s2.length ? w3 + 0.125 : 0;
    }, n2);
  }, x3 = (g4 = "", m3 = 0) => {
    o3 = g4 ?? o3, r4 = false, clearInterval(i2);
    const w3 = m3 === 0 ? import_picocolors2.default.green(M2) : m3 === 1 ? import_picocolors2.default.red(P4) : import_picocolors2.default.red(V3);
    process.stdout.write(import_sisteransi2.cursor.move(-999, 0)), process.stdout.write(import_sisteransi2.erase.down(1)), process.stdout.write(`${w3}  ${o3}
`), S4(), t2();
  };
  return { start: f4, stop: x3, message: (g4 = "") => {
    o3 = g4 ?? o3;
  } };
};

// src/domain/agent-lifecycle.ts
var AGENT_CLI_RESPONSE_SCHEMA_VERSION = 1;

// src/infra/agent-lifecycle-service.ts
var import_agent_data_migration = __toESM(require_dist(), 1);
var import_agent_release3 = __toESM(require_dist2(), 1);
import { readFile as readFile6, rm as rm3, stat as stat4 } from "node:fs/promises";
import { join as join7 } from "node:path";

// src/domain/self-update-manager.ts
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
    const summary = redactSelfUpdateText(options.summary);
    const causeText = options.cause ? redactSelfUpdateText(options.cause) : undefined;
    const hint = redactSelfUpdateText(options.hint);
    const cause = causeText ? `
Cause: ${causeText}` : "";
    super(`${summary}${cause}
Next: ${hint}`);
    this.name = "SelfUpdateError";
    this.phase = options.phase;
    this.summary = summary;
    this.causeText = causeText;
    this.hint = hint;
    this.result = options.result ? redactCommandResult(options.result) : undefined;
  }
}
function getDefaultSelfUpdateInstallDir(home = homedir()) {
  return join(home, ".cthutool", "source", "CthuTool");
}
function createSelfUpdateDeps(onEvent) {
  return {
    exists: existsSync,
    mkdir: async (path) => {
      await mkdir(path, { recursive: true });
    },
    run: runCommand2,
    env: process.env,
    home: homedir,
    runtimeRoot: findRepoRootFromModule,
    onEvent
  };
}
function getCliVersion() {
  return readPackageVersion(findRepoRootFromModule());
}
async function resolveSelfUpdateSource(options, deps) {
  const runtimeRoot = deps.runtimeRoot();
  const managedRoot = getDefaultSelfUpdateInstallDir(deps.home());
  const envInstallDir = nonEmpty(deps.env.CHC_INSTALL_DIR);
  const explicitInstallDir = options.installDir !== undefined || envInstallDir !== undefined;
  const installDir = options.installDir ?? envInstallDir ?? runtimeRoot;
  const mode = resolve(runtimeRoot) === resolve(managedRoot) ? "remote" : "local";
  const gitRoot = join(installDir, ".git");
  const canInspectCheckout = deps.exists(gitRoot);
  const repoOverride = options.repo ?? nonEmpty(deps.env.CHC_REPO_URL) ?? nonEmpty(deps.env.CHC_REPO);
  const refOverride = options.ref ?? nonEmpty(deps.env.CHC_REF);
  const installedRepo = canInspectCheckout && repoOverride === undefined ? await runOptional(deps, "git", ["remote", "get-url", "origin"], {
    cwd: installDir
  }) : undefined;
  const installedRef = canInspectCheckout && refOverride === undefined ? await readInstalledRef(deps, installDir) : undefined;
  return {
    repo: repoOverride ?? installedRepo ?? defaultSelfUpdateRepo,
    ref: refOverride ?? installedRef ?? defaultSelfUpdateRef,
    installDir,
    runtimeRoot,
    managedRoot,
    mode,
    explicitInstallDir
  };
}
async function readInstalledRef(deps, installDir) {
  const branch = await runOptional(deps, "git", ["symbolic-ref", "--quiet", "--short", "HEAD"], { cwd: installDir });
  if (branch)
    return branch;
  const tags = await runOptional(deps, "git", ["tag", "--points-at", "HEAD", "--sort=refname"], { cwd: installDir });
  const exactTag = tags?.split(/\r?\n/).map((value) => value.trim()).filter(Boolean).sort((left, right) => left.localeCompare(right))[0];
  if (exactTag)
    return exactTag;
  return runOptional(deps, "git", ["rev-parse", "--verify", "HEAD^{commit}"], {
    cwd: installDir
  });
}
function nonEmpty(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
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
    cause: boundedText(redactSelfUpdateText(error instanceof Error ? error.message : String(error))),
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
    stdout: boundedText(redactSelfUpdateText(result.stdout)),
    stderr: boundedText(redactSelfUpdateText(result.stderr))
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
  const resolved = await resolveSelfUpdateSource(options, deps);
  const publicResolved = {
    repo: redactSelfUpdateText(resolved.repo),
    ref: resolved.ref,
    installDir: resolved.installDir
  };
  const phases = [];
  const gitRoot = join(resolved.installDir, ".git");
  if (resolved.mode === "local" && !resolved.explicitInstallDir) {
    phases.push("preflight");
    return finishPlan(deps, {
      status: "blocked",
      ...publicResolved,
      block: {
        kind: "local_linked_source",
        message: `The running chc command is linked to the local checkout at ${resolved.runtimeRoot}.`,
        hint: "Update that checkout and rebuild apps/cli/dist/index.js, or run CHC_INSTALL_MODE=remote scripts/install-chc.sh to switch back to managed mode."
      },
      phases
    });
  }
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
  const targetBundle = await execute(deps, "check_remote", "git", ["cat-file", "-e", `${remote.target.commit}:${committedCliBundlePath}`], { cwd: resolved.installDir, allowFailure: true });
  if (targetBundle.code !== 0) {
    return finishPlan(deps, {
      status: "blocked",
      ...publicResolved,
      before: initial,
      target: remote.target,
      block: {
        kind: "missing_target_bundle",
        message: `The selected target does not contain ${committedCliBundlePath}.`,
        hint: `Select a ref containing ${committedCliBundlePath}.`
      },
      phases
    });
  }
  if (initial.commit === remote.target.commit) {
    return finishPlan(deps, {
      status: "up_to_date",
      ...publicResolved,
      before: initial,
      target: remote.target,
      targetKind: remote.isBranch ? "branch" : "detached",
      relinkRequired: resolve(resolved.installDir) !== resolve(resolved.runtimeRoot),
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
        targetKind: "branch",
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
    targetKind: remote.isBranch ? "branch" : "detached",
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
  const resolved = await resolveSelfUpdateSource(options, deps);
  const plan = await planSelfUpdate(options, deps);
  assertSelfUpdatePlanReady(plan);
  if (plan.status === "up_to_date") {
    if (plan.relinkRequired) {
      await runPhase(deps, "install_global", async () => {
        await execute(deps, "install_global", "npm", [
          "install",
          "-g",
          "--ignore-scripts",
          plan.installDir
        ]);
      });
      return {
        status: "installed",
        repo: plan.repo,
        ref: plan.ref,
        installDir: plan.installDir,
        before: plan.before,
        target: plan.target,
        after: plan.before,
        phases: [...plan.phases, "install_global"],
        steps: ["install-global"]
      };
    }
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
      await deps.mkdir(dirname(plan.installDir));
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
    if (!isInstall && plan.target) {
      if (plan.targetKind === "branch") {
        await execute(deps, "checkout", "git", ["checkout", plan.ref], {
          cwd: plan.installDir
        });
        steps.push("checkout");
        await execute(deps, "checkout", "git", ["merge", "--ff-only", plan.target.commit], { cwd: plan.installDir });
        steps.push("pull");
      } else {
        await execute(deps, "checkout", "git", ["checkout", "--detach", plan.target.commit], { cwd: plan.installDir });
        steps.push("checkout");
      }
      return;
    }
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
  const resolved = await resolveSelfUpdateSource(options, deps);
  const bundlePath = join(resolved.installDir, committedCliBundlePath);
  const gitRoot = join(resolved.installDir, ".git");
  const repo = deps.exists(gitRoot) ? await runOptional(deps, "git", ["remote", "get-url", "origin"], {
    cwd: resolved.installDir
  }) ?? resolved.repo : resolved.repo;
  const ref = deps.exists(gitRoot) ? await readInstalledRef(deps, resolved.installDir) ?? resolved.ref : resolved.ref;
  const commit = deps.exists(gitRoot) ? await runOptional(deps, "git", ["rev-parse", "--short", "HEAD"], {
    cwd: resolved.installDir
  }) : undefined;
  return {
    version: getCliVersion(),
    mode: resolve(resolved.installDir) === resolve(resolved.managedRoot) ? "remote" : "local",
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
  const bundlePath = join(installDir, committedCliBundlePath);
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
  return boundedText(redactSelfUpdateText(`${result.stderr}
${result.stdout}`));
}
function redactArgs(args) {
  return args.map(redactSelfUpdateText);
}
function redactSelfUpdateText(value) {
  return value.replace(/:\/\/[^/\s]+@/g, "://***@");
}
function redactCommandResult(result) {
  return {
    ...result,
    args: redactArgs(result.args),
    stdout: redactSelfUpdateText(result.stdout),
    stderr: redactSelfUpdateText(result.stderr)
  };
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
  let current = dirname(fileURLToPath(import.meta.url));
  while (true) {
    if (isCthuToolRoot(current)) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      throw new Error("Unable to locate CthuTool package root.");
    }
    current = parent;
  }
}
function isCthuToolRoot(path) {
  try {
    const pkg = JSON.parse(readFileSync(join(path, "package.json"), "utf8"));
    return pkg.name === "cthutool";
  } catch {
    return false;
  }
}
function readPackageVersion(root) {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  if (typeof pkg.version !== "string" || pkg.version.trim().length === 0) {
    throw new Error(`Package version is missing: ${join(root, "package.json")}`);
  }
  return pkg.version;
}

// src/infra/agent-control.ts
import { readFile, stat } from "node:fs/promises";
import { createConnection } from "node:net";
import { join as join2 } from "node:path";
async function readAgentInstance(userDataDir) {
  const path = join2(userDataDir, "runtime", "instance.json");
  let value;
  try {
    value = JSON.parse(await readFile(path, "utf8"));
    if (process.platform !== "win32" && ((await stat(path)).mode & 63) !== 0)
      throw new Error("Agent instance record is not user-private");
  } catch (error) {
    if (error.code === "ENOENT")
      return;
    throw error;
  }
  if (!isAgentInstance(value))
    throw new Error("Agent instance record is invalid");
  return value;
}
async function requestAgentHealth(record, timeoutMs) {
  const result = await requestAgent(record, "health", undefined, timeoutMs);
  if (!result || typeof result !== "object" || typeof result.applicationVersion !== "string")
    throw new Error("Agent health response is invalid");
  return result;
}
async function requestAgent(record, operation, environmentId, timeoutMs = 2000) {
  return new Promise((resolve2, reject) => {
    const socket = createConnection(record.controlEndpoint);
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error("Agent control request timed out"));
    }, timeoutMs);
    let payload = "";
    let settled = false;
    const finish = (task) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timer);
      task();
    };
    socket.setEncoding("utf8");
    socket.once("connect", () => socket.write(`${JSON.stringify({ protocolVersion: record.protocolVersion, instanceNonce: record.nonce, operation, ...environmentId ? { environmentId } : {} })}
`));
    socket.on("data", (chunk) => {
      payload += chunk;
      if (Buffer.byteLength(payload) > 64 * 1024) {
        socket.destroy();
        finish(() => reject(new Error("Agent control response is too large")));
        return;
      }
      const newline = payload.indexOf(`
`);
      if (newline < 0)
        return;
      finish(() => {
        try {
          const response = JSON.parse(payload.slice(0, newline));
          if (!response.ok)
            throw new Error(response.error?.message ?? response.error?.code ?? "Agent rejected control request");
          resolve2(response.result);
        } catch (error) {
          reject(error);
        }
      });
      socket.end();
    });
    socket.once("error", (error) => finish(() => reject(error)));
  });
}
function isAgentInstance(value) {
  const item = value;
  return Boolean(item && item.protocolVersion === 1 && Number.isSafeInteger(item.pid) && (item.pid ?? 0) > 0 && typeof item.nonce === "string" && item.nonce.length >= 16 && typeof item.controlEndpoint === "string" && typeof item.executablePath === "string" && typeof item.entryPoint === "string" && typeof item.startedAt === "string");
}

// src/infra/agent-paths.ts
var import_agent_release = __toESM(require_dist2(), 1);
import { spawn as spawn2 } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  chmod,
  mkdir as mkdir2,
  readdir,
  readFile as readFile3,
  rename,
  writeFile
} from "node:fs/promises";
import { homedir as homedir3 } from "node:os";
import { dirname as dirname2, join as join4 } from "node:path";

// src/infra/agent-tray-control.ts
import { readFile as readFile2, stat as stat2 } from "node:fs/promises";
import { createConnection as createConnection2 } from "node:net";
import { homedir as homedir2 } from "node:os";
import { join as join3 } from "node:path";
var TRAY_CONTROL_PROTOCOL_VERSION = 1;
function resolveAgentUserDataDir(input) {
  if (input?.trim()) {
    return input;
  }
  if (process.env.CTHUTOOL_AGENT_DATA_DIR?.trim()) {
    return process.env.CTHUTOOL_AGENT_DATA_DIR;
  }
  if (process.platform === "darwin") {
    return join3(homedir2(), "Library", "Application Support", "CthuTool", "agent");
  }
  if (process.platform === "win32") {
    return join3(process.env.APPDATA ?? join3(homedir2(), "AppData", "Roaming"), "CthuTool", "agent");
  }
  return join3(process.env.XDG_STATE_HOME ?? join3(homedir2(), ".local", "state"), "cthutool", "agent");
}
function resolveTrayInstancePath(userDataDir) {
  return join3(userDataDir, "runtime", "tray-instance.json");
}
async function readTrayInstanceRecord(instancePath) {
  let input;
  try {
    input = JSON.parse(await readFile2(instancePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }
    throw error;
  }
  if (!isRecord(input)) {
    throw new Error("Tray instance record is invalid");
  }
  return input;
}
async function requestTrayShutdown(input) {
  const response = await requestTrayControl({
    endpoint: input.record.controlEndpoint,
    nonce: input.record.nonce,
    operation: "shutdown",
    timeoutMs: input.timeoutMs
  });
  if (!response.ok) {
    throw new Error(response.error?.message ?? response.error?.code ?? "Tray rejected shutdown");
  }
}
async function requestTrayHealth(input) {
  const response = await requestTrayControl({
    endpoint: input.record.controlEndpoint,
    nonce: input.record.nonce,
    operation: "health",
    timeoutMs: input.timeoutMs
  });
  if (!response.ok || !isTraySnapshot(response.result)) {
    throw new Error(response.error?.message ?? response.error?.code ?? "Tray health is invalid");
  }
  return response.result;
}
async function requestTrayOpen(input) {
  await requestAccepted(input, "open");
}
async function requestTrayEnvironmentSwitch(input) {
  const response = await requestTrayControl({
    endpoint: input.record.controlEndpoint,
    nonce: input.record.nonce,
    operation: "environment.switch",
    environmentId: input.environmentId,
    timeoutMs: input.timeoutMs
  });
  if (!response.ok) {
    throw new Error(response.error?.message ?? response.error?.code ?? "Tray rejected environment switch");
  }
}
async function waitForTrayExit(input) {
  const deadline = Date.now() + (input.timeoutMs ?? 1e4);
  while (Date.now() < deadline) {
    const current = await readTrayInstanceRecord(input.instancePath);
    if (!current || !sameInstance(current, input.record)) {
      return;
    }
    await new Promise((resolve2) => setTimeout(resolve2, input.pollMs ?? 50));
  }
  throw new Error("Timed out waiting for tray-owned Agent shutdown");
}
async function stopTrayOwnedAgent(input) {
  const instancePath = resolveTrayInstancePath(resolveAgentUserDataDir(input.userDataDir));
  const record = await readTrayInstanceRecord(instancePath);
  if (!record) {
    return "already-stopped";
  }
  await assertPrivateRecord(instancePath);
  await requestTrayShutdown({ record, timeoutMs: input.timeoutMs });
  await waitForTrayExit({
    instancePath,
    record,
    timeoutMs: input.timeoutMs
  });
  return "stopped";
}
async function requestTrayControl(input) {
  return new Promise((resolve2, reject) => {
    const socket = createConnection2(input.endpoint);
    const timeout = setTimeout(() => {
      socket.destroy();
      reject(new Error("Tray control request timed out"));
    }, input.timeoutMs ?? 2000);
    let payload = "";
    let settled = false;
    const finish = (action) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      action();
    };
    socket.setEncoding("utf8");
    socket.once("connect", () => {
      socket.write(`${JSON.stringify({
        protocolVersion: TRAY_CONTROL_PROTOCOL_VERSION,
        instanceNonce: input.nonce,
        operation: input.operation,
        ...input.environmentId === undefined ? {} : { environmentId: input.environmentId }
      })}
`);
    });
    socket.on("data", (chunk) => {
      payload += chunk;
      if (Buffer.byteLength(payload) > 64 * 1024) {
        finish(() => reject(new Error("Tray control response is too large")));
        socket.destroy();
        return;
      }
      const newline = payload.indexOf(`
`);
      if (newline === -1) {
        return;
      }
      finish(() => {
        try {
          const response = JSON.parse(payload.slice(0, newline));
          if (typeof response.ok !== "boolean" || response.protocolVersion !== TRAY_CONTROL_PROTOCOL_VERSION) {
            throw new Error("Tray control response is invalid");
          }
          resolve2(response);
        } catch (error) {
          reject(error);
        }
      });
      socket.end();
    });
    socket.once("error", (error) => finish(() => reject(error)));
  });
}
async function requestAccepted(input, operation) {
  const response = await requestTrayControl({
    endpoint: input.record.controlEndpoint,
    nonce: input.record.nonce,
    operation,
    timeoutMs: input.timeoutMs
  });
  if (!response.ok) {
    throw new Error(response.error?.message ?? response.error?.code ?? `Tray rejected ${operation}`);
  }
}
async function assertPrivateRecord(instancePath) {
  if (process.platform === "win32") {
    return;
  }
  const metadata = await stat2(instancePath);
  if ((metadata.mode & 63) !== 0) {
    throw new Error("Tray instance record is not user-private");
  }
}
function sameInstance(left, right) {
  return left.pid === right.pid && left.nonce === right.nonce && left.executablePath === right.executablePath && left.processStartedAt === right.processStartedAt;
}
function isRecord(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value;
  return record.protocolVersion === TRAY_CONTROL_PROTOCOL_VERSION && typeof record.pid === "number" && Number.isSafeInteger(record.pid) && record.pid > 0 && typeof record.nonce === "string" && record.nonce.length >= 16 && typeof record.controlEndpoint === "string" && record.controlEndpoint.length > 0 && typeof record.executablePath === "string" && record.executablePath.length > 0 && typeof record.processStartedAt === "number" && record.processStartedAt > 0;
}
function isTraySnapshot(value) {
  return Boolean(value && typeof value === "object" && typeof value.state === "string" && Array.isArray(value.environments));
}

// src/infra/agent-paths.ts
function resolveAgentPaths(input = {}) {
  const userDataDir = resolveAgentUserDataDir(input.userDataDir);
  let installRoot = input.installRoot ?? process.env.CTHUTOOL_AGENT_INSTALL_DIR;
  if (!installRoot) {
    if (process.platform === "darwin") {
      installRoot = join4(homedir3(), "Library", "Application Support", "CthuTool", "agent-install");
    } else if (process.platform === "win32") {
      installRoot = join4(process.env.LOCALAPPDATA ?? join4(homedir3(), "AppData", "Local"), "CthuTool", "Agent");
    } else {
      installRoot = join4(process.env.XDG_DATA_HOME ?? join4(homedir3(), ".local", "share"), "cthutool", "agent");
    }
  }
  return {
    userDataDir,
    installRoot,
    runtimeDir: join4(userDataDir, "runtime"),
    logsDir: join4(userDataDir, "logs")
  };
}
async function readInstalledBundle(paths) {
  const pointer = await import_agent_release.readActiveVersion(paths.installRoot);
  if (!pointer)
    throw new Error("CthuTool Agent is not installed");
  const root = join4(paths.installRoot, "versions", pointer.version);
  const layout = import_agent_release.validateBundleLayout(JSON.parse(await readFile3(join4(root, "layout.json"), "utf8")));
  const catalog = import_agent_release.validateEnvironmentCatalog(JSON.parse(await readFile3(join4(root, ...layout.entryPoints.environmentCatalog.split("/")), "utf8")));
  return { pointer, root, layout, catalog };
}
async function assertInstalledBundleInventory(bundle) {
  import_agent_release.validateBundleInventory(bundle.layout.target, await listRelativeFiles(bundle.root));
}
async function readEnvironmentSelection(paths) {
  try {
    const value = JSON.parse(await readFile3(join4(paths.userDataDir, "environment.json"), "utf8"));
    return typeof value.activeEnvironmentId === "string" ? value.activeEnvironmentId : undefined;
  } catch (error) {
    if (error.code === "ENOENT")
      return;
    throw error;
  }
}
async function writeEnvironmentSelection(paths, environmentId) {
  await atomicPrivateWrite(join4(paths.userDataDir, "environment.json"), `${JSON.stringify({ activeEnvironmentId: environmentId }, null, 2)}
`);
}
async function atomicPrivateWrite(path, value) {
  await mkdir2(dirname2(path), { mode: 448, recursive: true });
  const temporary = `${path}.tmp-${randomUUID()}`;
  await writeFile(temporary, value, { mode: 384 });
  if (process.platform !== "win32")
    await chmod(temporary, 384);
  else
    await protectWindowsFile(temporary);
  await rename(temporary, path);
}
async function protectWindowsFile(path) {
  const username = process.env.USERNAME;
  if (!username) {
    throw new Error("Cannot resolve the Windows user for protected Agent storage");
  }
  const identity = process.env.USERDOMAIN ? `${process.env.USERDOMAIN}\\${username}` : username;
  const exitCode = await new Promise((resolvePromise) => {
    const child = spawn2("icacls.exe", [path, "/inheritance:r", "/grant:r", `${identity}:F`], { stdio: "ignore", windowsHide: true });
    child.once("error", () => resolvePromise(null));
    child.once("exit", resolvePromise);
  });
  if (exitCode !== 0) {
    throw new Error("Unable to protect Agent storage with a user-only ACL");
  }
}
async function listRelativeFiles(root, directory = root) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join4(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...await listRelativeFiles(root, path));
    } else if (entry.isFile()) {
      output.push(path.slice(root.length + 1).replaceAll("\\", "/"));
    }
  }
  return output;
}

// src/infra/agent-platform.ts
import { spawn as spawn3 } from "node:child_process";
import {
  chmod as chmod2,
  mkdir as mkdir3,
  readFile as readFile4,
  realpath,
  rm,
  writeFile as writeFile2
} from "node:fs/promises";
import { homedir as homedir4 } from "node:os";
import { dirname as dirname3, join as join5 } from "node:path";
async function startInstalledAgent(paths, timeoutMs = 20000) {
  const bundle = await readInstalledBundle(paths);
  const executable = join5(bundle.root, ...bundle.layout.entryPoints.tray.split("/"));
  const instancePath = resolveTrayInstancePath(paths.userDataDir);
  const current = await readTrayInstanceRecord(instancePath);
  if (current) {
    let healthy = false;
    try {
      await requestTrayHealth({ record: current, timeoutMs: 500 });
      healthy = true;
    } catch {}
    if (healthy) {
      await assertExactRuntime(paths, bundle, executable, current.executablePath);
      return "already-running";
    }
  }
  if (process.platform !== "win32")
    await chmod2(executable, 493);
  const child = spawn3(executable, ["--user-data-dir", paths.userDataDir], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    env: { ...process.env, CTHUTOOL_AGENT_DATA_DIR: paths.userDataDir }
  });
  child.unref();
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const record = await readTrayInstanceRecord(instancePath).catch(() => {
      return;
    });
    if (record) {
      try {
        await requestTrayHealth({ record, timeoutMs: 500 });
        await assertExactRuntime(paths, bundle, executable, record.executablePath);
        const agent = await readAgentInstance(paths.userDataDir);
        if (!agent)
          throw new Error("Agent instance record is not ready");
        const health = await requestAgentHealth(agent, 1000);
        const expectedNode = join5(bundle.root, ...bundle.layout.entryPoints.node.split("/"));
        const expectedAgent = join5(bundle.root, ...bundle.layout.entryPoints.agent.split("/"));
        if (await realpath(agent.executablePath) !== await realpath(expectedNode) || await realpath(agent.entryPoint) !== await realpath(expectedAgent) || health.applicationVersion !== bundle.pointer.version) {
          throw new Error("Agent process identity does not match the active bundle");
        }
        return "started";
      } catch {}
    }
    await delay(100);
  }
  throw new Error("Timed out waiting for the tray-owned Agent to become ready");
}
async function assertExactRuntime(paths, bundle, expectedTray, actualTray) {
  if (await realpath(actualTray) !== await realpath(expectedTray)) {
    throw new Error("Running tray identity does not match the active bundle");
  }
  const agent = await readAgentInstance(paths.userDataDir);
  if (!agent)
    throw new Error("Running tray has no exact Agent instance");
  const health = await requestAgentHealth(agent, 1000);
  const expectedNode = join5(bundle.root, ...bundle.layout.entryPoints.node.split("/"));
  const expectedAgent = join5(bundle.root, ...bundle.layout.entryPoints.agent.split("/"));
  if (await realpath(agent.executablePath) !== await realpath(expectedNode) || await realpath(agent.entryPoint) !== await realpath(expectedAgent) || health.applicationVersion !== bundle.pointer.version) {
    throw new Error("Running Agent identity does not match the active bundle");
  }
}
async function getAutostartStatus(_paths, options = {}) {
  const platform2 = options.platform ?? process.platform;
  if (platform2 === "darwin") {
    try {
      await readFile4(options.launchAgentPath ?? resolveLaunchAgentPath());
      return { enabled: true, supported: true };
    } catch (error) {
      if (error.code === "ENOENT")
        return { enabled: false, supported: true };
      throw error;
    }
  }
  if (platform2 === "win32") {
    const result = await (options.runProcess ?? runProcess)("reg.exe", [
      "query",
      "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
      "/v",
      "CthuToolAgent"
    ]);
    return { enabled: result === 0, supported: true };
  }
  return { enabled: false, supported: false };
}
async function setAutostart(paths, enabled, options = {}) {
  const platform2 = options.platform ?? process.platform;
  if (platform2 === "darwin") {
    const plist = options.launchAgentPath ?? resolveLaunchAgentPath();
    if (!enabled)
      await rm(plist, { force: true });
    else {
      const executable = await resolveTrayExecutable(paths);
      await mkdir3(dirname3(plist), { mode: 448, recursive: true });
      await writeFile2(plist, createLaunchAgentPlist(executable, paths.userDataDir), { mode: 384 });
    }
    return { enabled, supported: true };
  }
  if (platform2 === "win32") {
    const registry = [
      "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run"
    ];
    const executable = enabled ? await resolveTrayExecutable(paths) : "";
    const args = enabled ? [
      "add",
      ...registry,
      "/v",
      "CthuToolAgent",
      "/t",
      "REG_SZ",
      "/d",
      `"${executable}" --user-data-dir "${paths.userDataDir}"`,
      "/f"
    ] : ["delete", ...registry, "/v", "CthuToolAgent", "/f"];
    const code = await (options.runProcess ?? runProcess)("reg.exe", args);
    if (code !== 0 && enabled)
      throw new Error("Unable to update Windows Agent autostart");
    return { enabled, supported: true };
  }
  return { enabled: false, supported: false };
}
async function resolveTrayExecutable(paths) {
  const bundle = await readInstalledBundle(paths);
  return join5(bundle.root, ...bundle.layout.entryPoints.tray.split("/"));
}
function resolveLaunchAgentPath() {
  return join5(homedir4(), "Library", "LaunchAgents", "dev.cthutool.agent.plist");
}
function createLaunchAgentPlist(executable, userDataDir) {
  const escapeXml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict><key>Label</key><string>dev.cthutool.agent</string><key>ProgramArguments</key><array><string>${escapeXml(executable)}</string><string>--user-data-dir</string><string>${escapeXml(userDataDir)}</string></array><key>RunAtLoad</key><true/></dict></plist>
`;
}
async function runProcess(command, args) {
  return new Promise((resolve2) => {
    const child = spawn3(command, args, { stdio: "ignore", windowsHide: true });
    child.once("error", () => resolve2(null));
    child.once("exit", (code) => resolve2(code));
  });
}
function delay(ms) {
  return new Promise((resolve2) => setTimeout(resolve2, ms));
}

// src/infra/agent-release-installer.ts
var import_agent_release2 = __toESM(require_dist2(), 1);
import {
  chmod as chmod3,
  mkdir as mkdir4,
  readdir as readdir2,
  readFile as readFile5,
  rm as rm2,
  stat as stat3,
  writeFile as writeFile3
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join as join6, resolve as resolve2, sep as sep2 } from "node:path";

// ../../node_modules/.pnpm/fflate@0.8.2/node_modules/fflate/esm/index.mjs
import { createRequire as createRequire2 } from "module";
var require2 = createRequire2("/");
var Worker;
try {
  Worker = require2("worker_threads").Worker;
} catch (e3) {}
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0]);
var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b4 = new u16(31);
  for (var i2 = 0;i2 < 31; ++i2) {
    b4[i2] = start += 1 << eb[i2 - 1];
  }
  var r4 = new i32(b4[30]);
  for (var i2 = 1;i2 < 30; ++i2) {
    for (var j3 = b4[i2];j3 < b4[i2 + 1]; ++j3) {
      r4[j3] = j3 - b4[i2] << 5 | i2;
    }
  }
  return { b: b4, r: r4 };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i2 = 0;i2 < 32768; ++i2) {
  x3 = (i2 & 43690) >> 1 | (i2 & 21845) << 1;
  x3 = (x3 & 52428) >> 2 | (x3 & 13107) << 2;
  x3 = (x3 & 61680) >> 4 | (x3 & 3855) << 4;
  rev[i2] = ((x3 & 65280) >> 8 | (x3 & 255) << 8) >> 1;
}
var x3;
var i2;
var hMap = function(cd, mb, r4) {
  var s2 = cd.length;
  var i3 = 0;
  var l3 = new u16(mb);
  for (;i3 < s2; ++i3) {
    if (cd[i3])
      ++l3[cd[i3] - 1];
  }
  var le3 = new u16(mb);
  for (i3 = 1;i3 < mb; ++i3) {
    le3[i3] = le3[i3 - 1] + l3[i3 - 1] << 1;
  }
  var co;
  if (r4) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i3 = 0;i3 < s2; ++i3) {
      if (cd[i3]) {
        var sv = i3 << 4 | cd[i3];
        var r_1 = mb - cd[i3];
        var v3 = le3[cd[i3] - 1]++ << r_1;
        for (var m3 = v3 | (1 << r_1) - 1;v3 <= m3; ++v3) {
          co[rev[v3] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s2);
    for (i3 = 0;i3 < s2; ++i3) {
      if (cd[i3]) {
        co[i3] = rev[le3[cd[i3] - 1]++] >> 15 - cd[i3];
      }
    }
  }
  return co;
};
var flt = new u8(288);
for (i2 = 0;i2 < 144; ++i2)
  flt[i2] = 8;
var i2;
for (i2 = 144;i2 < 256; ++i2)
  flt[i2] = 9;
var i2;
for (i2 = 256;i2 < 280; ++i2)
  flt[i2] = 7;
var i2;
for (i2 = 280;i2 < 288; ++i2)
  flt[i2] = 8;
var i2;
var fdt = new u8(32);
for (i2 = 0;i2 < 32; ++i2)
  fdt[i2] = 5;
var i2;
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a4) {
  var m3 = a4[0];
  for (var i3 = 1;i3 < a4.length; ++i3) {
    if (a4[i3] > m3)
      m3 = a4[i3];
  }
  return m3;
};
var bits = function(d3, p, m3) {
  var o3 = p / 8 | 0;
  return (d3[o3] | d3[o3 + 1] << 8) >> (p & 7) & m3;
};
var bits16 = function(d3, p) {
  var o3 = p / 8 | 0;
  return (d3[o3] | d3[o3 + 1] << 8 | d3[o3 + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v3, s2, e3) {
  if (s2 == null || s2 < 0)
    s2 = 0;
  if (e3 == null || e3 > v3.length)
    e3 = v3.length;
  return new u8(v3.subarray(s2, e3));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
];
var err = function(ind, msg, nt) {
  var e3 = new Error(msg || ec[ind]);
  e3.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e3, err);
  if (!nt)
    throw e3;
  return e3;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l4) {
    var bl = buf.length;
    if (l4 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l4));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s2 = shft(pos) + 4, l3 = dat[s2 - 4] | dat[s2 - 3] << 8, t2 = s2 + l3;
        if (t2 > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l3);
        buf.set(dat.subarray(s2, t2), bt);
        st.b = bt += l3, st.p = pos = t2 * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i3 = 0;i3 < hcLen; ++i3) {
          clt[clim[i3]] = bits(dat, pos + i3 * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i3 = 0;i3 < tl; ) {
          var r4 = clm[bits(dat, pos, clbmsk)];
          pos += r4 & 15;
          var s2 = r4 >> 4;
          if (s2 < 16) {
            ldt[i3++] = s2;
          } else {
            var c4 = 0, n2 = 0;
            if (s2 == 16)
              n2 = 3 + bits(dat, pos, 3), pos += 2, c4 = ldt[i3 - 1];
            else if (s2 == 17)
              n2 = 3 + bits(dat, pos, 7), pos += 3;
            else if (s2 == 18)
              n2 = 11 + bits(dat, pos, 127), pos += 7;
            while (n2--)
              ldt[i3++] = c4;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (;; lpos = pos) {
      var c4 = lm[bits16(dat, pos) & lms], sym = c4 >> 4;
      pos += c4 & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c4)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i3 = sym - 257, b4 = fleb[i3];
          add = bits(dat, pos, (1 << b4) - 1) + fl[i3];
          pos += b4;
        }
        var d3 = dm[bits16(dat, pos) & dms], dsym = d3 >> 4;
        if (!d3)
          err(3);
        pos += d3 & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b4 = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b4) - 1, pos += b4;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (;bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (;bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var et = /* @__PURE__ */ new u8(0);
var b22 = function(d3, b4) {
  return d3[b4] | d3[b4 + 1] << 8;
};
var b4 = function(d3, b5) {
  return (d3[b5] | d3[b5 + 1] << 8 | d3[b5 + 2] << 16 | d3[b5 + 3] << 24) >>> 0;
};
var b8 = function(d3, b5) {
  return b4(d3, b5) + b4(d3, b5 + 4) * 4294967296;
};
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder;
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e3) {}
var dutf8 = function(d3) {
  for (var r4 = "", i3 = 0;; ) {
    var c4 = d3[i3++];
    var eb = (c4 > 127) + (c4 > 223) + (c4 > 239);
    if (i3 + eb > d3.length)
      return { s: r4, r: slc(d3, i3 - 1) };
    if (!eb)
      r4 += String.fromCharCode(c4);
    else if (eb == 3) {
      c4 = ((c4 & 15) << 18 | (d3[i3++] & 63) << 12 | (d3[i3++] & 63) << 6 | d3[i3++] & 63) - 65536, r4 += String.fromCharCode(55296 | c4 >> 10, 56320 | c4 & 1023);
    } else if (eb & 1)
      r4 += String.fromCharCode((c4 & 31) << 6 | d3[i3++] & 63);
    else
      r4 += String.fromCharCode((c4 & 15) << 12 | (d3[i3++] & 63) << 6 | d3[i3++] & 63);
  }
};
function strFromU8(dat, latin1) {
  if (latin1) {
    var r4 = "";
    for (var i3 = 0;i3 < dat.length; i3 += 16384)
      r4 += String.fromCharCode.apply(null, dat.subarray(i3, i3 + 16384));
    return r4;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s2 = _a2.s, r4 = _a2.r;
    if (r4.length)
      err(8);
    return s2;
  }
}
var slzh = function(d3, b5) {
  return b5 + 30 + b22(d3, b5 + 26) + b22(d3, b5 + 28);
};
var zh = function(d3, b5, z3) {
  var fnl = b22(d3, b5 + 28), fn = strFromU8(d3.subarray(b5 + 46, b5 + 46 + fnl), !(b22(d3, b5 + 8) & 2048)), es = b5 + 46 + fnl, bs = b4(d3, b5 + 20);
  var _a2 = z3 && bs == 4294967295 ? z64e(d3, es) : [bs, b4(d3, b5 + 24), b4(d3, b5 + 42)], sc = _a2[0], su = _a2[1], off = _a2[2];
  return [b22(d3, b5 + 10), sc, su, fn, es + b22(d3, b5 + 30) + b22(d3, b5 + 32), off];
};
var z64e = function(d3, b5) {
  for (;b22(d3, b5) != 1; b5 += 4 + b22(d3, b5 + 2))
    ;
  return [b8(d3, b5 + 12), b8(d3, b5 + 4), b8(d3, b5 + 20)];
};
function unzipSync(data, opts) {
  var files = {};
  var e3 = data.length - 22;
  for (;b4(data, e3) != 101010256; --e3) {
    if (!e3 || data.length - e3 > 65558)
      err(13);
  }
  var c4 = b22(data, e3 + 8);
  if (!c4)
    return {};
  var o3 = b4(data, e3 + 16);
  var z3 = o3 == 4294967295 || c4 == 65535;
  if (z3) {
    var ze = b4(data, e3 - 12);
    z3 = b4(data, ze) == 101075792;
    if (z3) {
      c4 = b4(data, ze + 32);
      o3 = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i3 = 0;i3 < c4; ++i3) {
    var _a2 = zh(data, o3, z3), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b5 = slzh(data, off);
    o3 = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b5, b5 + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b5, b5 + sc), { out: new u8(su) });
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}

// src/infra/agent-release-installer.ts
var REPOSITORY_RELEASES = "https://github.com/mickmetalholic/CthuTool/releases/download";
var MAX_METADATA_BYTES = 2 * 1024 * 1024;
var MAX_ARCHIVE_BYTES = 750 * 1024 * 1024;
var MAX_EXTRACTED_BYTES = 2 * 1024 * 1024 * 1024;
async function installAgentRelease(input) {
  const fetchBytes = input.dependencies.fetchBytes ?? fetchHttpsBytes;
  const key = input.dependencies.publicKeyPem ?? "";
  if (!key?.trim())
    throw new Error("Agent release verification is unavailable because the CLI has no pinned public key");
  const target = import_agent_release2.releaseTargetFromPlatform(input.dependencies.platform ?? process.platform, input.dependencies.architecture ?? process.arch);
  if (!target)
    throw new Error("CthuTool Agent supports macOS arm64/x64 and Windows x64 only");
  const manifest = input.version ? await fetchVerifiedManifest(`${REPOSITORY_RELEASES}/agent-v${assertVersion(input.version)}/manifest.json`, key, fetchBytes) : await resolveChannel(input.channel ?? "stable", key, fetchBytes);
  import_agent_release2.assertCliCompatibility(manifest, input.dependencies.cliVersion);
  assertProtocolCompatibility(manifest);
  const artifact = import_agent_release2.selectReleaseArtifact(manifest, target);
  const catalogUrl = new URL("environments.json", manifestUrlFor(manifest, artifact)).href;
  const [catalogBytes, archiveBytes, archiveSignatureBytes] = await Promise.all([
    fetchBytes(catalogUrl, MAX_METADATA_BYTES),
    fetchBytes(artifact.archiveUrl, Math.min(MAX_ARCHIVE_BYTES, artifact.archiveSize + 1)),
    fetchBytes(artifact.archiveSignatureUrl, MAX_METADATA_BYTES)
  ]);
  import_agent_release2.assertCatalogBinding(manifest, catalogBytes);
  import_agent_release2.assertArchiveBinding(artifact, archiveBytes);
  import_agent_release2.verifyReleaseBlobSignature(archiveBytes, Buffer.from(archiveSignatureBytes).toString("utf8").trim(), key);
  const temporaryRoot = join6(tmpdir(), `cthutool-agent-install-${crypto.randomUUID()}`);
  const extractedRoot = join6(temporaryRoot, "bundle");
  const previous = await import_agent_release2.readActiveVersion(input.paths.installRoot);
  const versionRoot = join6(input.paths.installRoot, "versions", manifest.releaseVersion);
  const versionExisted = await pathExists(versionRoot);
  try {
    await extractVerifiedArchive(archiveBytes, extractedRoot, target);
    const layout = import_agent_release2.validateBundleLayout(JSON.parse(await readFile5(join6(extractedRoot, "layout.json"), "utf8")));
    if (layout.releaseVersion !== manifest.releaseVersion || layout.target !== target)
      throw new Error("Agent archive layout does not match the signed manifest");
    const embeddedCatalog = await readFile5(join6(extractedRoot, ...layout.entryPoints.environmentCatalog.split("/")));
    if (import_agent_release2.sha256(embeddedCatalog) !== import_agent_release2.sha256(catalogBytes))
      throw new Error("Embedded Agent catalog does not match the signed catalog");
    if (versionExisted) {
      await assertDirectoriesMatch(extractedRoot, versionRoot);
    }
    await import_agent_release2.stageVersion({
      installRoot: input.paths.installRoot,
      extractedRoot,
      target,
      version: manifest.releaseVersion
    });
    await import_agent_release2.activateVersion({
      installRoot: input.paths.installRoot,
      version: manifest.releaseVersion,
      smokeCheck: async (root) => {
        await (input.dependencies.smoke ?? import_agent_release2.smokeExtractedAgentBundle)({
          bundleRoot: root,
          userDataDir: join6(temporaryRoot, "smoke-data")
        });
      }
    });
    return {
      version: manifest.releaseVersion,
      previousVersion: previous?.version,
      changed: previous?.version !== manifest.releaseVersion
    };
  } catch (error) {
    if (!versionExisted) {
      await rm2(versionRoot, { force: true, recursive: true });
    }
    throw error;
  } finally {
    await rm2(temporaryRoot, { force: true, recursive: true });
  }
}
async function resolveChannel(channel, key, fetchBytes) {
  const pointerUrl = `${REPOSITORY_RELEASES}/agent-${channel}/channel-${channel}.json`;
  const [bytes, signature] = await Promise.all([
    fetchBytes(pointerUrl, MAX_METADATA_BYTES),
    fetchBytes(`${pointerUrl}.sig`, MAX_METADATA_BYTES)
  ]);
  import_agent_release2.verifyReleaseBlobSignature(bytes, Buffer.from(signature).toString("utf8").trim(), key);
  const pointer = import_agent_release2.validateChannelPointer(JSON.parse(Buffer.from(bytes).toString("utf8")));
  const manifestBytes = await fetchBytes(pointer.manifestUrl, MAX_METADATA_BYTES);
  if (import_agent_release2.sha256(manifestBytes) !== pointer.manifestSha256)
    throw new Error("Channel manifest digest mismatch");
  return fetchVerifiedManifest(pointer.manifestUrl, key, fetchBytes, manifestBytes);
}
async function fetchVerifiedManifest(url, key, fetchBytes, supplied) {
  const [bytes, signature] = await Promise.all([
    supplied ?? fetchBytes(url, MAX_METADATA_BYTES),
    fetchBytes(`${url}.sig`, MAX_METADATA_BYTES)
  ]);
  const manifest = import_agent_release2.validateReleaseManifest(JSON.parse(Buffer.from(bytes).toString("utf8")), { requireProductionMatrix: true });
  if (manifest.provenance.kind !== "production" || !manifest.provenance.signed || import_agent_release2.canonicalJson(manifest) !== Buffer.from(bytes).toString("utf8"))
    throw new Error("Agent release manifest is not canonical production metadata");
  import_agent_release2.verifyManifestSignature(manifest, Buffer.from(signature).toString("utf8").trim(), key);
  return manifest;
}
async function fetchHttpsBytes(url, maximumBytes) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:")
    throw new Error("Agent release downloads require HTTPS");
  const response = await fetch(parsed, {
    redirect: "follow",
    signal: AbortSignal.timeout(60000)
  });
  if (new URL(response.url).protocol !== "https:") {
    throw new Error("Agent release redirect must remain on HTTPS");
  }
  if (!response.ok)
    throw new Error(`Agent release download failed with HTTP ${response.status}`);
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > maximumBytes)
    throw new Error("Agent release download exceeds the size limit");
  if (!response.body)
    return new Uint8Array;
  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const item = await reader.read();
    if (item.done)
      break;
    received += item.value.byteLength;
    if (received > maximumBytes) {
      await reader.cancel();
      throw new Error("Agent release download exceeds the size limit");
    }
    chunks.push(item.value);
  }
  return Buffer.concat(chunks, received);
}
async function extractVerifiedArchive(bytes, destination, target) {
  let declaredExtractedBytes = 0;
  const archive = unzipSync(bytes, {
    filter: (file) => {
      declaredExtractedBytes += file.originalSize;
      if (declaredExtractedBytes > MAX_EXTRACTED_BYTES) {
        throw new Error("Agent archive exceeds the extracted size limit");
      }
      return true;
    }
  });
  const paths = Object.keys(archive).filter((path) => !path.endsWith("/"));
  import_agent_release2.validateBundleInventory(target, paths);
  let extractedBytes = 0;
  await mkdir4(destination, { mode: 448, recursive: true });
  for (const rawPath of paths) {
    const fileBytes = archive[rawPath];
    if (!fileBytes)
      throw new Error(`Agent archive entry is unreadable: ${rawPath}`);
    extractedBytes += fileBytes.byteLength;
    if (extractedBytes > MAX_EXTRACTED_BYTES)
      throw new Error("Agent archive exceeds the extracted size limit");
    const path = resolve2(destination, rawPath.replaceAll("\\", "/"));
    if (path !== destination && !path.startsWith(`${destination}${sep2}`))
      throw new Error(`Unsafe Agent archive path: ${rawPath}`);
    await mkdir4(join6(path, ".."), { mode: 448, recursive: true });
    await writeFile3(path, fileBytes, {
      mode: executableArchivePath(rawPath) ? 493 : 420,
      flag: "wx"
    });
    if (process.platform !== "win32" && executableArchivePath(rawPath))
      await chmod3(path, 493);
  }
}
async function assertDirectoriesMatch(expectedRoot, actualRoot) {
  const [expected, actual] = await Promise.all([
    directoryFingerprint(expectedRoot),
    directoryFingerprint(actualRoot)
  ]);
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error("Installed Agent version content differs from the verified release archive");
  }
}
async function directoryFingerprint(root, directory = root) {
  const output = [];
  for (const entry of await readdir2(directory, { withFileTypes: true })) {
    const path = join6(directory, entry.name);
    if (entry.isDirectory()) {
      output.push(...await directoryFingerprint(root, path));
    } else if (entry.isFile()) {
      const relative = path.slice(root.length + 1).replaceAll("\\", "/");
      output.push(`${relative}:${import_agent_release2.sha256(await readFile5(path))}`);
    } else {
      throw new Error(`Agent version contains unsupported entry: ${entry.name}`);
    }
  }
  return output.sort();
}
async function pathExists(path) {
  try {
    await stat3(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT")
      return false;
    throw error;
  }
}
function executableArchivePath(path) {
  return path === "runtime/node/bin/node" || path.endsWith("/cthutool-agent-tray") || path.endsWith(".exe");
}
function assertProtocolCompatibility(manifest) {
  if (Object.values(manifest.protocols).some((version) => version !== 1))
    throw new Error("Agent release protocol versions are incompatible with this CLI");
}
function assertVersion(version) {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version))
    throw new Error("Agent release version is invalid");
  return version;
}
function manifestUrlFor(_manifest, artifact) {
  return new URL(".", artifact.archiveUrl);
}

// src/infra/agent-lifecycle-service.ts
class FileSystemAgentLifecycleService {
  paths;
  legacyDesktopRoot;
  release;
  platform;
  constructor(options = {}) {
    this.paths = options.paths ?? resolveAgentPaths();
    this.legacyDesktopRoot = options.legacyDesktopRoot ?? import_agent_data_migration.resolveLegacyDesktopDataRoot();
    this.release = { ...options.release };
    this.platform = {
      getAutostartStatus: options.platform?.getAutostartStatus ?? getAutostartStatus,
      setAutostart: options.platform?.setAutostart ?? setAutostart,
      startInstalledAgent: options.platform?.startInstalledAgent ?? startInstalledAgent
    };
  }
  async install(input = {}) {
    if (await this.isRunning()) {
      throw new Error("Stop the running Agent before install, or use chc agent update for coordinated replacement");
    }
    return installAgentRelease({
      paths: this.paths,
      dependencies: {
        ...this.release,
        cliVersion: this.release.cliVersion ?? getCliVersion()
      },
      ...input
    });
  }
  async update(input = {}) {
    const wasRunning = await this.isRunning();
    const current = await this.installedVersion();
    const autostart = await this.platform.getAutostartStatus(this.paths);
    if (wasRunning)
      await this.stop();
    const result = await this.install(input);
    if (autostart.enabled) {
      await this.platform.setAutostart(this.paths, true);
    }
    if (!wasRunning || !result.changed) {
      if (wasRunning)
        await this.start();
      return result;
    }
    try {
      await this.start();
      return result;
    } catch (error) {
      await stopTrayOwnedAgent({ userDataDir: this.paths.userDataDir }).catch(() => {
        return;
      });
      await import_agent_release3.rollbackActiveVersion({
        installRoot: this.paths.installRoot,
        smokeCheck: async (root) => {
          const smokeData = join7(this.paths.installRoot, ".rollback-smoke");
          try {
            await (this.release.smoke ?? import_agent_release3.smokeExtractedAgentBundle)({
              bundleRoot: root,
              userDataDir: smokeData
            });
          } finally {
            await rm3(smokeData, { force: true, recursive: true });
          }
        }
      });
      if (autostart.enabled) {
        await this.platform.setAutostart(this.paths, true);
      }
      await this.start();
      throw new Error(`Agent update to ${result.version} failed readiness and rolled back to ${current ?? "the previous version"}`, { cause: error });
    }
  }
  start() {
    return this.platform.startInstalledAgent(this.paths);
  }
  stop() {
    return stopTrayOwnedAgent({ userDataDir: this.paths.userDataDir });
  }
  async restart() {
    await this.stop();
    await this.start();
    return "restarted";
  }
  async status() {
    const version = await this.installedVersion();
    const environments = version ? await this.listEnvironments() : [];
    const selected = environments.find((environment) => environment.active);
    const autostart = await this.platform.getAutostartStatus(this.paths);
    let trayState = "stopped";
    let trayPid;
    let backend = { status: "offline" };
    let browser = {
      ready: false,
      status: "unavailable"
    };
    const tray = await readTrayInstanceRecord(resolveTrayInstancePath(this.paths.userDataDir)).catch(() => {
      return;
    });
    if (tray) {
      trayPid = tray.pid;
      try {
        trayState = (await requestTrayHealth({ record: tray, timeoutMs: 500 })).state;
      } catch {
        trayState = "unreachable";
      }
    }
    const agent = await readAgentInstance(this.paths.userDataDir).catch(() => {
      return;
    });
    if (agent) {
      try {
        const health = await requestAgentHealth(agent, 750);
        backend = {
          status: health.backend.status,
          ...health.backend.lastError ? { lastError: health.backend.lastError } : {}
        };
        browser = {
          ready: health.browser.ready,
          status: health.browser.status
        };
      } catch {}
    }
    return {
      installed: Boolean(version),
      ...version ? { version } : {},
      tray: { state: trayState, ...trayPid ? { pid: trayPid } : {} },
      ...selected ? { environment: selected } : {},
      backend,
      browser,
      autostart
    };
  }
  async settings() {
    await this.start();
    const record = await this.requireTray();
    await requestTrayOpen({ record });
    return "opened";
  }
  async logs(input = {}) {
    const count = Math.max(1, Math.min(input.lines ?? 200, 1e4));
    try {
      const raw = await readFile6(join7(this.paths.logsDir, "agent.log"), "utf8");
      return raw.split(/\r?\n/).filter(Boolean).slice(-count);
    } catch (error) {
      if (error.code === "ENOENT")
        return [];
      throw error;
    }
  }
  async listEnvironments() {
    const { catalog } = await readInstalledBundle(this.paths);
    const selected = await readEnvironmentSelection(this.paths) ?? catalog.profiles[0]?.environmentId;
    return catalog.profiles.map((environment) => ({
      id: environment.environmentId,
      label: environment.label,
      active: environment.environmentId === selected,
      webOrigin: environment.webOrigin,
      backendHttpUrl: environment.backendHttpUrl
    }));
  }
  async getEnvironment(id) {
    const environments = await this.listEnvironments();
    const environment = id ? environments.find((candidate) => candidate.id === id) : environments.find((candidate) => candidate.active);
    if (!environment)
      throw new Error(id ? `Unknown Agent environment "${id}"` : "No Agent environment is selected");
    return environment;
  }
  async setEnvironment(id) {
    const { catalog } = await readInstalledBundle(this.paths);
    const environment = catalog.profiles.find((candidate) => candidate.environmentId === id);
    if (!environment)
      throw new Error(`Unknown Agent environment "${id}"`);
    const previous = await readEnvironmentSelection(this.paths) ?? catalog.profiles[0]?.environmentId;
    const tray = await readTrayInstanceRecord(resolveTrayInstancePath(this.paths.userDataDir)).catch(() => {
      return;
    });
    if (tray)
      await requestTrayEnvironmentSwitch({ record: tray, environmentId: id });
    else
      await writeEnvironmentSelection(this.paths, id);
    return { id, changed: previous !== id };
  }
  async autostart(action) {
    if (action === "status")
      return this.platform.getAutostartStatus(this.paths);
    return this.platform.setAutostart(this.paths, action === "enable");
  }
  async doctor() {
    const checks = [];
    let installed;
    let profileLockPath = join7(this.paths.userDataDir, "browser-profiles", ".cthutool-agent.lock");
    try {
      installed = await readInstalledBundle(this.paths);
      await assertInstalledBundleInventory(installed);
      checks.push({
        id: "install",
        status: "pass",
        message: `Signed bundle layout and catalog loaded for ${installed.pointer.version}`
      });
    } catch (error) {
      checks.push({
        id: "install",
        status: "fail",
        message: error instanceof Error ? error.message : "Agent installation is invalid"
      });
    }
    if (installed) {
      const environment = await this.getEnvironment().catch(() => {
        return;
      });
      checks.push({
        id: "environment",
        status: environment ? "pass" : "fail",
        message: environment ? environment.label : "No valid active environment"
      });
      if (environment) {
        const profile = installed.catalog.profiles.find((candidate) => candidate.environmentId === environment.id);
        if (profile) {
          profileLockPath = join7(this.paths.userDataDir, "environments", profile.namespace, "browser-profiles", ".cthutool-agent.lock");
        }
        checks.push({
          id: "web-origin",
          status: environment.webOrigin.startsWith("https://") ? "pass" : "fail",
          message: environment.webOrigin
        });
        checks.push({
          id: "backend",
          status: environment.backendHttpUrl.startsWith("https://") ? "pass" : "fail",
          message: environment.backendHttpUrl
        });
      }
      const migration = await import_agent_data_migration.inspectLegacyDesktopMigration({
        agentRootDir: this.paths.userDataDir,
        legacyRootDir: this.legacyDesktopRoot,
        environments: installed.catalog.profiles,
        explicitEnvironmentId: await readEnvironmentSelection(this.paths)
      }).catch((error) => ({
        status: "failed",
        message: error instanceof Error ? error.message : "Legacy Desktop migration inspection failed",
        retryCommand: "chc agent doctor"
      }));
      checks.push({
        id: "legacy-migration",
        status: migration.status === "failed" || migration.status === "selection-required" ? "fail" : migration.status === "locked" || migration.status === "ready" ? "warn" : "pass",
        message: `${migration.message}${migration.retryCommand ? ` Next: ${migration.retryCommand}` : ""}`
      });
    }
    const status = await this.status();
    checks.push({
      id: "autostart",
      status: status.autostart.supported ? "pass" : "warn",
      message: status.autostart.supported ? status.autostart.enabled ? "Enabled" : "Disabled" : "Unsupported platform"
    });
    checks.push({
      id: "local-control",
      status: status.tray.state === "unreachable" ? "fail" : status.tray.state === "stopped" ? "warn" : "pass",
      message: status.tray.state
    });
    checks.push({
      id: "browser",
      status: status.browser.ready ? "pass" : "warn",
      message: status.browser.status
    });
    checks.push({
      id: "profile-locks",
      status: await exists(profileLockPath) ? "warn" : "pass",
      message: "Profile lock ownership checked"
    });
    checks.push({
      id: "logs",
      status: await exists(join7(this.paths.logsDir, "agent.log")) ? "pass" : "warn",
      message: join7(this.paths.logsDir, "agent.log")
    });
    return checks;
  }
  async uninstall(input = {}) {
    if (input.purge && !input.confirmed)
      throw new Error("Purging Agent data requires explicit confirmation");
    await this.stop();
    const autostart = await this.platform.getAutostartStatus(this.paths);
    if (autostart.enabled)
      await this.platform.setAutostart(this.paths, false);
    const installed = await exists(this.paths.installRoot);
    await rm3(this.paths.installRoot, { force: true, recursive: true });
    if (input.purge)
      await rm3(this.paths.userDataDir, { force: true, recursive: true });
    return {
      removed: installed,
      purged: input.purge === true,
      ...input.purge ? {} : { preservedDataDir: this.paths.userDataDir }
    };
  }
  async installedVersion() {
    try {
      return (await readInstalledBundle(this.paths)).pointer.version;
    } catch (error) {
      if (error instanceof Error && error.message === "CthuTool Agent is not installed")
        return;
      throw error;
    }
  }
  async isRunning() {
    const record = await readTrayInstanceRecord(resolveTrayInstancePath(this.paths.userDataDir)).catch(() => {
      return;
    });
    if (!record)
      return false;
    try {
      await requestTrayHealth({ record, timeoutMs: 500 });
      return true;
    } catch {
      return false;
    }
  }
  async requireTray() {
    const record = await readTrayInstanceRecord(resolveTrayInstancePath(this.paths.userDataDir));
    if (!record)
      throw new Error("Agent tray is not running");
    return record;
  }
}
async function exists(path) {
  try {
    await stat4(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT")
      return false;
    throw error;
  }
}

// src/runtime/cli-context.ts
var cliContractArgs = {
  json: {
    type: "boolean",
    description: "Print one machine-readable JSON value to stdout"
  },
  noInteractive: {
    type: "boolean",
    alias: "no-interactive",
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
import { basename, dirname as dirname4, sep as sep3 } from "node:path";
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
    return isPathKey(key) ? summarizePath(value) : truncate(redactUrlUserinfo(value));
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
  const normalized = value.replaceAll("\\", sep3);
  const name = basename(normalized);
  const parent = basename(dirname4(normalized));
  return parent && parent !== "." ? `${parent}${sep3}${name}` : name;
}
function truncate(value) {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_STRING_LENGTH - 3)}...`;
}
function sanitizeDiagnosticMessage(value) {
  return truncate(redactUrlUserinfo(value).replace(/(token|secret|password|passwd|cookie|authorization|credential)=([^&\s]+)/gi, "$1=[redacted]"));
}
function redactUrlUserinfo(value) {
  return value.replace(/:\/\/[^/\s]+@/g, "://***@");
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

// src/command/agent.command.ts
var lifecycleArgs = { ...cliContractArgs };
function createAgentCommand(service) {
  const install = defineCommand({
    meta: {
      name: "install",
      description: "Install a verified local Agent release."
    },
    args: {
      ...lifecycleArgs,
      channel: {
        type: "string",
        description: "Release channel: stable or beta",
        default: "stable"
      },
      version: {
        type: "string",
        description: "Install an immutable release version"
      }
    },
    run: ({ args }) => execute2(args, "install", () => service.install({
      channel: parseChannel(args.channel),
      version: stringValue(args.version)
    }), installationMessage)
  });
  const update = defineCommand({
    meta: {
      name: "update",
      description: "Update only the local Agent and roll back on failed readiness."
    },
    args: {
      ...lifecycleArgs,
      channel: {
        type: "string",
        description: "Release channel: stable or beta",
        default: "stable"
      }
    },
    run: ({ args }) => execute2(args, "update", () => service.update({ channel: parseChannel(args.channel) }), installationMessage)
  });
  const start = simpleCommand("start", "Start the tray-owned local Agent.", service.start.bind(service));
  const stop = simpleCommand("stop", "Stop the tray and its local Agent.", service.stop.bind(service));
  const restart = simpleCommand("restart", "Restart the tray-owned local Agent.", service.restart.bind(service));
  const status = defineCommand({
    meta: {
      name: "status",
      description: "Show install, tray, environment, backend, browser, and autostart status."
    },
    args: lifecycleArgs,
    run: ({ args }) => execute2(args, "status", () => service.status(), (result) => {
      const value = result;
      return value.installed ? `CthuTool Agent ${value.version}: tray ${value.tray.state}; environment ${value.environment?.id ?? "none"}; backend ${value.backend.status}; browser ${value.browser.status}; autostart ${value.autostart.enabled ? "enabled" : "disabled"}.` : "CthuTool Agent is not installed.";
    })
  });
  const settings = simpleCommand("settings", "Start the Agent if needed and open a fresh deployed-Web settings session.", service.settings.bind(service));
  const logs = defineCommand({
    meta: {
      name: "logs",
      description: "Read or follow the redacted Agent-owned log."
    },
    args: {
      ...lifecycleArgs,
      lines: {
        type: "string",
        description: "Number of recent lines",
        default: "200"
      },
      follow: {
        type: "boolean",
        alias: "f",
        description: "Follow new redacted log lines"
      }
    },
    async run({ args }) {
      const lines = parseLineCount(args.lines);
      if (args.follow === true && args.json === true)
        throw createCliError("invalid_option", "--json cannot be combined with --follow");
      await execute2(args, "logs", () => service.logs({ lines }), (result) => result.join(`
`));
      if (args.follow === true)
        await followLogs(service, lines);
    }
  });
  const doctor = defineCommand({
    meta: {
      name: "doctor",
      description: "Run integrity, local-control, environment, browser, and log diagnostics."
    },
    args: lifecycleArgs,
    run: ({ args }) => execute2(args, "doctor", () => service.doctor(), (result) => result.map((check) => `${check.status.toUpperCase()} ${check.id}: ${check.message}`).join(`
`))
  });
  const uninstall = defineCommand({
    meta: {
      name: "uninstall",
      description: "Remove Agent binaries and autostart; preserve data unless --purge is confirmed."
    },
    args: {
      ...lifecycleArgs,
      purge: {
        type: "boolean",
        description: "Also remove environment selection, profiles, and logs"
      },
      yes: {
        type: "boolean",
        alias: "y",
        description: "Confirm destructive purge in non-interactive use"
      }
    },
    async run({ args }) {
      await runWithContext(args, "uninstall", async (context) => {
        let confirmed = args.yes === true;
        if (args.purge === true && !confirmed && context.interactive) {
          const answer = await ce2({
            message: "Permanently delete Agent profiles, selection, and logs?",
            initialValue: false
          });
          confirmed = !lD2(answer) && answer === true;
        }
        if (args.purge === true && !confirmed)
          throw createCliError("agent_purge_confirmation_required", "Purging Agent data requires --yes or interactive confirmation");
        return service.uninstall({ purge: args.purge === true, confirmed });
      }, (result) => {
        const value = result;
        return value.purged ? "CthuTool Agent binaries and mutable data removed." : `CthuTool Agent binaries removed. Mutable data preserved at ${value.preservedDataDir}.`;
      });
    }
  });
  const envList = defineCommand({
    meta: { name: "list", description: "List verified release environments." },
    args: lifecycleArgs,
    run: ({ args }) => execute2(args, "env list", () => service.listEnvironments(), environmentListMessage)
  });
  const envGet = defineCommand({
    meta: {
      name: "get",
      description: "Show the active or named environment."
    },
    args: {
      ...lifecycleArgs,
      id: {
        type: "positional",
        required: false,
        description: "Environment id"
      }
    },
    run: ({ args }) => execute2(args, "env get", () => service.getEnvironment(stringValue(args.id)), environmentMessage)
  });
  const envSet = defineCommand({
    meta: {
      name: "set",
      description: "Select a verified environment for the running or stopped Agent."
    },
    args: {
      ...lifecycleArgs,
      id: { type: "positional", required: true, description: "Environment id" }
    },
    run: ({ args }) => execute2(args, "env set", () => service.setEnvironment(requiredString(args.id, "environment id")), (result) => `Active Agent environment: ${result.id}.`)
  });
  const envRegistrations = [
    registration("list", envList),
    registration("get", envGet),
    registration("set", envSet)
  ];
  const environment = registerCommandGroup(defineCommand({
    meta: {
      name: "env",
      description: "Manage verified Agent environments."
    },
    subCommands: buildRegisteredSubCommands(envRegistrations)
  }), envRegistrations);
  const autostartCommands = ["enable", "disable", "status"].map((action) => ({
    action,
    command: defineCommand({
      meta: {
        name: action,
        description: `${action[0]?.toUpperCase()}${action.slice(1)} per-user Agent autostart.`
      },
      args: lifecycleArgs,
      run: ({ args }) => execute2(args, `autostart ${action}`, () => service.autostart(action), (result) => {
        const value = result;
        return value.supported ? `Agent autostart is ${value.enabled ? "enabled" : "disabled"}.` : "Agent autostart is unsupported on this platform.";
      })
    })
  }));
  const autostartRegistrations = autostartCommands.map(({ action, command }) => registration(action, command));
  const autostart = registerCommandGroup(defineCommand({
    meta: {
      name: "autostart",
      description: "Manage per-user tray autostart."
    },
    subCommands: buildRegisteredSubCommands(autostartRegistrations)
  }), autostartRegistrations);
  const registrations = [
    registration("install", install),
    registration("update", update),
    registration("start", start),
    registration("stop", stop),
    registration("restart", restart),
    registration("status", status),
    registration("settings", settings),
    registration("logs", logs),
    registration("env", environment, "help"),
    registration("autostart", autostart, "help"),
    registration("doctor", doctor),
    registration("uninstall", uninstall)
  ];
  return {
    command: registerCommandGroup(defineCommand({
      meta: {
        name: "agent",
        description: "Install and control the local CthuTool Agent."
      },
      subCommands: buildRegisteredSubCommands(registrations)
    }), registrations),
    registrations
  };
}
var defaultAgentCommand = createAgentCommand(new FileSystemAgentLifecycleService);
var agentCommand = defaultAgentCommand.command;
var agentCommandRegistrations = defaultAgentCommand.registrations;
function simpleCommand(name, description, operation) {
  return defineCommand({
    meta: { name, description },
    args: lifecycleArgs,
    run: ({ args }) => execute2(args, name, operation, (result) => `CthuTool Agent ${String(result).replaceAll("-", " ")}.`)
  });
}
function registration(name, command, bareBehavior = "run") {
  return { name, command, visibility: "public", bareBehavior };
}
async function execute2(args, path, operation, human) {
  await runWithContext(args, path, () => operation(), human);
}
async function runWithContext(args, path, operation, human) {
  await runObservedCliCommand(args, { command: "agent", subcommand: path }, async ({ context, fail }) => {
    try {
      const result = await operation(context);
      if (context.json)
        writeJsonValue(processOutput, {
          schemaVersion: AGENT_CLI_RESPONSE_SCHEMA_VERSION,
          ok: true,
          command: `agent ${path}`,
          result
        });
      else
        writeHumanStatus(context, processOutput, human(result));
      process.exitCode = 0;
    } catch (error) {
      const cliError = error instanceof Error && "code" in error && "exitCode" in error ? error : createCliError(classifyAgentError(error), safeErrorMessage(error));
      fail(cliError);
      if (context.json) {
        writeJsonValue(processOutput, {
          schemaVersion: AGENT_CLI_RESPONSE_SCHEMA_VERSION,
          ok: false,
          command: `agent ${path}`,
          error: { code: cliError.code, message: cliError.message }
        });
      } else {
        writeCommandError(context, processOutput, cliError);
      }
      process.exitCode = cliError.exitCode;
      throw cliError;
    }
  });
}
function classifyAgentError(error) {
  const message = safeErrorMessage(error).toLowerCase();
  if (message.includes("not installed"))
    return "agent_not_installed";
  if (message.includes("pinned public key") || message.includes("signature") || message.includes("untrusted"))
    return "agent_release_untrusted";
  if (message.includes("digest") || message.includes("archive") || message.includes("catalog") || message.includes("layout") || message.includes("canonical"))
    return "agent_integrity_failed";
  if (message.includes("supports macos") || message.includes("incompatible") || message.includes("requires chc"))
    return "agent_incompatible";
  if (message.includes("unknown agent environment") || message.includes("no agent environment"))
    return "agent_environment_invalid";
  if (message.includes("timed out waiting") && message.includes("ready"))
    return "agent_start_failed";
  if (message.includes("purging agent data"))
    return "agent_purge_confirmation_required";
  return "agent_control_failed";
}
function safeErrorMessage(error) {
  return error instanceof Error ? error.message : "Unable to complete Agent command";
}
function parseChannel(value) {
  if (value === undefined || value === "stable")
    return "stable";
  if (value === "beta")
    return "beta";
  throw createCliError("invalid_option", "Agent release channel must be stable or beta");
}
function parseLineCount(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1e4)
    throw createCliError("invalid_option", "--lines must be an integer from 1 to 10000");
  return parsed;
}
function stringValue(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function requiredString(value, label) {
  const result = stringValue(value);
  if (!result)
    throw createCliError("missing_required_argument", `Missing required ${label}`);
  return result;
}
function environmentListMessage(result) {
  return result.map((environment) => `${environment.active ? "*" : " "} ${environment.id}	${environment.label}`).join(`
`);
}
function environmentMessage(result) {
  const environment = result;
  return `${environment.active ? "Active " : ""}${environment.id} (${environment.label})
Web: ${environment.webOrigin}
Backend: ${environment.backendHttpUrl}`;
}
function installationMessage(result) {
  const value = result;
  return `CthuTool Agent ${value.version} ${value.changed ? "activated" : "already installed"}.`;
}
async function followLogs(service, initialLines) {
  let seen = (await service.logs({ lines: 1e4 })).length;
  let stopped = false;
  const stop = () => {
    stopped = true;
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  try {
    while (!stopped) {
      await new Promise((resolve3) => setTimeout(resolve3, 500));
      const lines = await service.logs({ lines: 1e4 });
      if (lines.length < seen)
        seen = 0;
      for (const line of lines.slice(seen))
        processOutput.stdout.write(`${line}
`);
      seen = lines.length;
    }
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  }
}

// src/command/codex.command.ts
import { emitKeypressEvents as emitKeypressEvents2 } from "node:readline";
var import_picocolors3 = __toESM(require_picocolors(), 1);

// src/domain/codex-plugin-install-manager.ts
import { readFile as readFile8 } from "node:fs/promises";
import { basename as basename2, join as join9, resolve as resolve5 } from "node:path";

// src/infra/codex-config-paths.ts
import { existsSync as existsSync2, readFileSync as readFileSync2 } from "node:fs";
import { homedir as homedir5 } from "node:os";
import { dirname as dirname5, isAbsolute, join as join8, relative, resolve as resolve3 } from "node:path";
function createCodexConfigPaths(options = {}) {
  const repoRoot = resolve3(options.repoRoot ?? getDefaultRepoRoot());
  const homeRoot = resolve3(options.homeRoot ?? homedir5());
  const localCodexRoot = resolve3(options.codexHome ?? join8(homeRoot, ".codex"));
  const localOpenCodeRoot = resolve3(options.openCodeHome ?? join8(homeRoot, ".config", "opencode"));
  const openCodeConfigPath = resolve3(options.openCodeConfig ?? getDefaultOpenCodeConfigPath(localOpenCodeRoot));
  return {
    repoRoot,
    repoCodexRoot: resolve3(repoRoot, "codex"),
    homeRoot,
    localCodexRoot,
    localOpenCodeRoot,
    openCodeConfigPath,
    marketplacePath: resolve3(options.marketplace ?? join8(homeRoot, ".agents", "plugins", "marketplace.json")),
    pluginsRoot: resolve3(options.pluginsRoot ?? join8(repoRoot, "codex", "plugins")),
    cacheRoot: resolve3(options.cacheRoot ?? join8(homeRoot, ".codex", "plugins", "cache", "personal"))
  };
}
function getDefaultOpenCodeConfigPath(openCodeRoot) {
  const jsoncPath = join8(openCodeRoot, "opencode.jsonc");
  return existsSync2(jsoncPath) ? jsoncPath : join8(openCodeRoot, "opencode.json");
}
function assertPathInside(parent, child) {
  const parentPath = resolve3(parent);
  const childPath = resolve3(child);
  const childRelative = relative(parentPath, childPath);
  if (childRelative.startsWith("..") || isAbsolute(childRelative)) {
    throw new Error(`Refusing to write outside ${parentPath}: ${childPath}`);
  }
}
function getDefaultRepoRoot() {
  const start = resolve3(process.cwd());
  let current = start;
  while (true) {
    if (isWorkspaceRoot(current)) {
      return current;
    }
    const parent = dirname5(current);
    if (parent === current) {
      return start;
    }
    current = parent;
  }
}
function isWorkspaceRoot(path) {
  if (existsSync2(join8(path, "pnpm-workspace.yaml"))) {
    return true;
  }
  try {
    const pkg = JSON.parse(readFileSync2(join8(path, "package.json"), "utf8"));
    return pkg.name === "cthutool";
  } catch {
    return false;
  }
}

// src/domain/codex-plugin-manager.ts
import { cp, mkdir as mkdir5, readdir as readdir3, readFile as readFile7, rm as rm4, writeFile as writeFile4 } from "node:fs/promises";
import { dirname as dirname6, isAbsolute as isAbsolute2, relative as relative2, resolve as resolve4 } from "node:path";
async function discoverCodexPlugins(pluginsRoot) {
  let entries;
  try {
    entries = await readdir3(pluginsRoot, { withFileTypes: true });
  } catch {
    return [];
  }
  const plugins = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const root = resolve4(pluginsRoot, entry.name);
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
  return plugins.sort((a4, b5) => a4.name.localeCompare(b5.name));
}
async function readMarketplace(marketplacePath) {
  try {
    const raw = await readFile7(marketplacePath, "utf8");
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
  await mkdir5(dirname6(options.marketplacePath), { recursive: true });
  await writeFile4(options.marketplacePath, `${JSON.stringify(marketplace, null, 2)}
`, "utf8");
  await enableCodexPlugins(options.configPath, results.map((result) => `${result.name}@personal`));
  return results;
}
async function syncCodexPluginCache(options) {
  const version = options.bumpPatch ? await bumpPluginPatchVersion(options.plugin.root) : await readPluginVersion(options.plugin.root);
  const cacheRoot = resolve4(options.cacheRoot);
  const pluginCacheRoot = resolve4(cacheRoot, options.plugin.name);
  const versionCacheRoot = resolve4(pluginCacheRoot, version);
  assertPathInside2(cacheRoot, pluginCacheRoot);
  assertPathInside2(pluginCacheRoot, versionCacheRoot);
  await mkdir5(cacheRoot, { recursive: true });
  await rm4(pluginCacheRoot, { recursive: true, force: true });
  await mkdir5(pluginCacheRoot, { recursive: true });
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
  const absolutePluginRoot = resolve4(pluginRoot);
  const absoluteHomeRoot = resolve4(homeRoot);
  const homeRelative = relative2(absoluteHomeRoot, absolutePluginRoot);
  if (!homeRelative.startsWith("..") && !isAbsolute2(homeRelative)) {
    return `./${homeRelative.replaceAll("\\", "/")}`;
  }
  return absolutePluginRoot.replaceAll("\\", "/");
}
async function bumpPluginPatchVersion(pluginRoot) {
  const manifestPath = resolve4(pluginRoot, ".codex-plugin", "plugin.json");
  const manifest = JSON.parse(await readFile7(manifestPath, "utf8"));
  const nextVersion = incrementPatchVersion(typeof manifest.version === "string" ? manifest.version : "0.0.0");
  manifest.version = nextVersion;
  await writeJsonFile(manifestPath, manifest);
  const packageJsonPath = resolve4(pluginRoot, "package.json");
  try {
    const packageJson = JSON.parse(await readFile7(packageJsonPath, "utf8"));
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
  const raw = await readFile7(resolve4(pluginRoot, ".codex-plugin", "plugin.json"), "utf8");
  const parsed = JSON.parse(raw);
  if (typeof parsed.version !== "string" || parsed.version.trim() === "") {
    throw new Error(`Plugin manifest is missing a version: ${pluginRoot}`);
  }
  return parsed.version;
}
async function writeJsonFile(path, value) {
  await writeFile4(path, `${JSON.stringify(value, null, 2)}
`, "utf8");
}
async function enableCodexPlugins(configPath, pluginIds) {
  if (pluginIds.length === 0) {
    return;
  }
  let raw;
  try {
    raw = await readFile7(configPath, "utf8");
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
  await mkdir5(dirname6(configPath), { recursive: true });
  await writeFile4(configPath, `${lines.join(`
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
  const hooksPath = resolve4(runtimePluginRoot, "hooks", "hooks.json");
  let raw;
  try {
    raw = await readFile7(hooksPath, "utf8");
  } catch {
    return;
  }
  const normalizedRoot = resolve4(sourcePluginRoot).replaceAll("\\", "/");
  await writeFile4(hooksPath, raw.replaceAll("<PLUGIN_ROOT>", normalizedRoot), "utf8");
}
async function normalizePluginMcpServers(runtimePluginRoot) {
  const mcpPath = resolve4(runtimePluginRoot, ".mcp.json");
  let raw;
  try {
    raw = await readFile7(mcpPath, "utf8");
  } catch {
    return;
  }
  const parsed = JSON.parse(raw);
  if (!parsed.mcpServers || typeof parsed.mcpServers !== "object") {
    return;
  }
  const normalizedRoot = resolve4(runtimePluginRoot).replaceAll("\\", "/");
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
  const parentPath = resolve4(parent);
  const childPath = resolve4(child);
  const childRelative = relative2(parentPath, childPath);
  if (childRelative.startsWith("..") || isAbsolute2(childRelative)) {
    throw new Error(`Refusing to write outside ${parentPath}: ${childPath}`);
  }
}
async function readPluginManifest(pluginRoot) {
  try {
    const raw = await readFile7(resolve4(pluginRoot, ".codex-plugin", "plugin.json"), "utf8");
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

// src/domain/codex-plugin-install-manager.ts
async function installRepositoryCodexPlugins(paths) {
  const plugins = await discoverEnabledRepositoryCodexPlugins(paths);
  const selectedNames = plugins.map((plugin) => plugin.name);
  const installedPlugins = await installCodexPlugins({
    homeRoot: paths.homeRoot,
    configPath: join9(paths.localCodexRoot, "config.toml"),
    marketplacePath: paths.marketplacePath,
    plugins,
    selectedNames
  });
  const syncedPluginCaches = await Promise.all(plugins.map((plugin) => syncCodexPluginCache({ cacheRoot: paths.cacheRoot, plugin })));
  return { installedPlugins, syncedPluginCaches };
}
async function discoverEnabledRepositoryCodexPlugins(paths) {
  const manifest = await readPluginManifest2(paths.repoCodexRoot);
  const discovered = await discoverCodexPlugins(paths.pluginsRoot);
  const disabledNames = new Set(manifest.plugins.filter((plugin) => plugin.enabled === false).map((plugin) => plugin.name));
  const configured = manifest.plugins.filter((plugin) => plugin.enabled && plugin.source === "repo");
  const configuredNames = new Set(configured.map((plugin) => plugin.name));
  return Promise.all([
    ...configured.map(async (entry) => {
      const root = resolve5(paths.repoRoot, entry.path);
      assertPathInside(paths.repoCodexRoot, root);
      return {
        name: entry.name,
        displayName: await readPluginDisplayName(root),
        root,
        marketplacePath: ""
      };
    }),
    ...discovered.filter((plugin) => !configuredNames.has(plugin.name) && !disabledNames.has(plugin.name))
  ]);
}
async function readPluginManifest2(repoCodexRoot) {
  const path = join9(repoCodexRoot, "plugins.manifest.json");
  try {
    const value = JSON.parse(await readFile8(path, "utf8"));
    if (!isRecord2(value) || value.version !== 1 || !Array.isArray(value.plugins)) {
      throw new Error("expected version 1 and a plugins array");
    }
    return {
      version: 1,
      plugins: value.plugins.map((entry, index) => validatePluginManifestEntry(entry, index))
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return { version: 1, plugins: [] };
    }
    throw new Error(`Invalid Codex plugins manifest: ${path}`, {
      cause: error
    });
  }
}
function validatePluginManifestEntry(value, index) {
  if (!isRecord2(value) || typeof value.name !== "string" || typeof value.source !== "string" || typeof value.path !== "string" || typeof value.enabled !== "boolean") {
    throw new Error(`Invalid Codex plugin manifest entry at index ${index}.`);
  }
  return {
    name: value.name,
    source: value.source,
    path: value.path,
    enabled: value.enabled
  };
}
async function readPluginDisplayName(root) {
  try {
    const value = JSON.parse(await readFile8(join9(root, ".codex-plugin", "plugin.json"), "utf8"));
    return typeof value.interface?.displayName === "string" ? value.interface.displayName : basename2(root);
  } catch {
    return basename2(root);
  }
}
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isMissingFileError(error) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

// src/domain/codex-skills-backend.ts
import { execFile as execFileCallback } from "node:child_process";
import { readFile as readFile9 } from "node:fs/promises";
import { join as join10 } from "node:path";
import { promisify } from "node:util";
var execFile = promisify(execFileCallback);
var pinnedSkillsCliVersion = "1.5.19";

class SkillsBackendError extends Error {
  code;
  constructor(code, message, options) {
    super(message, options);
    this.name = "SkillsBackendError";
    this.code = code;
  }
}
function createNpxSkillsBackend(options) {
  const run = options.run ?? runSkillsProcess;
  const fetchRemoteTree = options.fetchRemoteTree ?? fetch;
  const env2 = {
    ...process.env,
    CODEX_HOME: options.localCodexRoot,
    FORCE_COLOR: "0",
    HOME: options.homeRoot,
    NO_COLOR: "1",
    USERPROFILE: options.homeRoot
  };
  return {
    async listInstalled(listOptions) {
      const lockEntries = await readSkillLock(options.homeRoot);
      if (listOptions?.trackableOnly && ![...lockEntries].some(([name, lock]) => {
        const repository = readGitHubRepository(lock);
        return repository !== undefined && readLocalGitHubCandidate(name, lock, repository) !== undefined;
      })) {
        return [];
      }
      const result = await run(["list", "--global", "--agent", "codex", "--json"], env2);
      const installed = parseInstalledSkills(result.stdout);
      return installed.map((skill) => {
        const lock = lockEntries.get(skill.name);
        const repository = lock ? readGitHubRepository(lock) : undefined;
        const localGitHubCandidate = lock && repository ? readLocalGitHubCandidate(skill.name, lock, repository) : undefined;
        return {
          ...skill,
          managed: repository !== undefined,
          repository,
          localGitHubCandidate
        };
      });
    },
    async discover(repository) {
      const result = await run(["add", repository, "--list"], env2);
      return parseDiscoveredSkills(result.stdout);
    },
    async validate(skill) {
      const result = await run(["add", resolveSkillSource(skill), "--list"], env2);
      const discovered = parseDiscoveredSkills(result.stdout);
      if (!discovered.some((candidate) => candidate.name === skill.selector || candidate.name === skill.name)) {
        throw new SkillsBackendError("contract_mismatch", `Skill ${skill.selector} was not found in ${skill.repository}@${skill.tracking.ref}.`);
      }
    },
    async checkUpdates(skills) {
      if (skills.length === 0) {
        return new Set;
      }
      const lock = await readSkillLock(options.homeRoot);
      return checkGitHubUpdates(skills, lock, fetchRemoteTree, env2);
    },
    async install(skill) {
      await run([
        "add",
        resolveSkillSource(skill),
        "--skill",
        skill.selector,
        "--global",
        "--agent",
        "codex",
        "--yes"
      ], env2);
    },
    async update(skill) {
      await run([
        "add",
        resolveSkillSource(skill),
        "--skill",
        skill.selector,
        "--global",
        "--agent",
        "codex",
        "--yes"
      ], env2);
    },
    async remove(name) {
      await run(["remove", name, "--global", "--agent", "codex", "--yes"], env2);
    }
  };
}
function parseInstalledSkills(value) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throw new SkillsBackendError("contract_mismatch", "Unsupported skills CLI list output: expected JSON.", {
      cause: error
    });
  }
  if (!Array.isArray(parsed)) {
    throw new SkillsBackendError("contract_mismatch", "Unsupported skills CLI list output: expected an array.");
  }
  return parsed.map((entry, index) => {
    if (!isRecord3(entry) || typeof entry.name !== "string" || typeof entry.path !== "string") {
      throw new SkillsBackendError("contract_mismatch", `Unsupported skills CLI list entry at index ${index}.`);
    }
    return {
      name: entry.name,
      path: entry.path,
      managed: false
    };
  });
}
function parseDiscoveredSkills(value) {
  const plain = stripTerminalSequences(value);
  const names = new Set;
  for (const line of plain.split(/\r?\n/u)) {
    const match = line.match(/^\s*│\s{4}([a-z0-9][a-z0-9-]*)\s*$/u);
    if (match?.[1]) {
      names.add(match[1]);
    }
  }
  if (names.size === 0 && !plain.includes("Found 0 skills")) {
    throw new SkillsBackendError("contract_mismatch", "Unsupported skills CLI discovery output; the pinned contract may have changed.");
  }
  return [...names].sort().map((name) => ({ name }));
}
async function runSkillsProcess(args, env2) {
  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  try {
    const result = await execFile(executable, ["--yes", `skills@${pinnedSkillsCliVersion}`, ...args], {
      encoding: "utf8",
      env: env2,
      maxBuffer: 10 * 1024 * 1024
    });
    return { stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const message = error instanceof Error && "stderr" in error ? String(error.stderr ?? error.message) : String(error);
    throw new SkillsBackendError("process_failed", `skills@${pinnedSkillsCliVersion} failed: ${message.trim() || "unknown error"}`, { cause: error });
  }
}
async function readSkillLock(homeRoot) {
  try {
    const parsed = JSON.parse(await readFile9(join10(homeRoot, ".agents", ".skill-lock.json"), "utf8"));
    if (!isRecord3(parsed) || parsed.version !== 3 || !isRecord3(parsed.skills)) {
      throw new Error("expected lock version 3 with a skills object");
    }
    return new Map(Object.entries(parsed.skills).filter((entry) => isRecord3(entry[1])));
  } catch (error) {
    if (isMissingFileError2(error)) {
      return new Map;
    }
    throw new SkillsBackendError("contract_mismatch", "Unsupported skills CLI lock metadata.", { cause: error });
  }
}
function readGitHubRepository(lock) {
  if (lock.sourceType !== "github") {
    return;
  }
  if (typeof lock.source === "string" && /^[^/\s]+\/[^/\s]+$/u.test(lock.source)) {
    return lock.source.replace(/\.git$/u, "");
  }
  if (typeof lock.sourceUrl !== "string") {
    return;
  }
  const match = lock.sourceUrl.match(/^https:\/\/github\.com\/([^/]+\/[^/#]+?)(?:\.git)?(?:[/#]|$)/u);
  return match?.[1];
}
function readLocalGitHubCandidate(name, lock, repository) {
  if (typeof lock.skillPath !== "string") {
    return;
  }
  const skillPath = lock.skillPath.trim().replaceAll("\\", "/");
  const segments = skillPath.split("/");
  if (skillPath.length === 0 || skillPath.startsWith("/") || segments.includes("..") || segments.at(-1)?.toLowerCase() !== "skill.md") {
    return;
  }
  const directoryName = segments.at(-2);
  if (directoryName !== name) {
    return;
  }
  const ref = typeof lock.ref === "string" && lock.ref.trim().length > 0 ? lock.ref.trim() : undefined;
  return {
    repository,
    selector: name,
    skillPath,
    ...ref ? { ref } : {}
  };
}
function resolveSkillSource(skill) {
  return `${skill.repository}#${encodeURIComponent(skill.tracking.ref)}`;
}
async function checkGitHubUpdates(skills, lock, fetchRemoteTree, env2) {
  const updates = new Set;
  const trees = new Map;
  for (const skill of skills) {
    const entry = lock.get(skill.name);
    const repository = entry ? readGitHubRepository(entry) : undefined;
    const skillPath = entry?.skillPath;
    const installedHash = entry?.skillFolderHash;
    if (!entry || !repository || typeof skillPath !== "string" || typeof installedHash !== "string" || installedHash.length === 0) {
      throw new SkillsBackendError("contract_mismatch", `Unsupported skills@${pinnedSkillsCliVersion} lock metadata for ${skill.name}; reinstall it before checking updates.`);
    }
    if (repository !== skill.repository) {
      throw new SkillsBackendError("contract_mismatch", `Installed source mismatch for ${skill.name}: expected ${skill.repository}, found ${repository}.`);
    }
    const treeKey = `${repository}@${skill.tracking.ref}`;
    let tree = trees.get(treeKey);
    if (!tree) {
      tree = fetchGitHubTree(repository, skill.tracking.ref, fetchRemoteTree, env2);
      trees.set(treeKey, tree);
    }
    const remoteHash = findSkillTreeHash(await tree, skillPath);
    if (!remoteHash) {
      throw new SkillsBackendError("contract_mismatch", `The tracked path for ${skill.name} is absent from ${repository}@${skill.tracking.ref}.`);
    }
    if (remoteHash !== installedHash) {
      updates.add(skill.name);
    }
  }
  return updates;
}
async function fetchGitHubTree(repository, ref, fetchRemoteTree, env2) {
  const encodedRef = encodeURIComponent(ref);
  const token = env2.GITHUB_TOKEN ?? env2.GH_TOKEN;
  const response = await fetchRemoteTree(`https://api.github.com/repos/${repository}/git/trees/${encodedRef}?recursive=1`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...token ? { Authorization: `Bearer ${token}` } : {},
      "User-Agent": "CthuTool Codex skills manager"
    }
  });
  if (!response.ok) {
    throw new SkillsBackendError("network_failed", `GitHub update check failed for ${repository}@${ref}: HTTP ${response.status}.`);
  }
  const value = await response.json();
  if (!isRecord3(value) || !Array.isArray(value.tree)) {
    throw new SkillsBackendError("contract_mismatch", `Unsupported GitHub tree response for ${repository}@${ref}.`);
  }
  if (value.truncated === true) {
    throw new SkillsBackendError("contract_mismatch", `GitHub tree response was truncated for ${repository}@${ref}; update state is unknown.`);
  }
  return value.tree.map((entry, index) => {
    if (!isRecord3(entry) || typeof entry.path !== "string" || entry.type !== "blob" && entry.type !== "tree" || typeof entry.sha !== "string") {
      throw new SkillsBackendError("contract_mismatch", `Unsupported GitHub tree entry at index ${index}.`);
    }
    return { path: entry.path, type: entry.type, sha: entry.sha };
  });
}
function findSkillTreeHash(tree, skillPath) {
  let folder = skillPath.replaceAll("\\", "/");
  if (folder.toLowerCase().endsWith("/skill.md")) {
    folder = folder.slice(0, -9);
  } else if (folder.toLowerCase().endsWith("skill.md")) {
    folder = folder.slice(0, -8);
  }
  folder = folder.replace(/\/$/u, "");
  return tree.find((entry) => entry.type === "tree" && entry.path === folder)?.sha;
}
function stripTerminalSequences(value) {
  const escapeCharacter = String.fromCharCode(27);
  const bell = String.fromCharCode(7);
  return value.replace(new RegExp(`${escapeCharacter}\\[[0-9;?]*[ -/]*[@-~]`, "gu"), "").replace(new RegExp(`${escapeCharacter}\\][^${bell}]*(?:${bell}|${escapeCharacter}\\\\)`, "gu"), "").replace(/\r[^\n]*/gu, "");
}
function isRecord3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isMissingFileError2(error) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

// src/domain/codex-skills-manager.ts
import { mkdir as mkdir7, rename as rename3, rm as rm6 } from "node:fs/promises";
import { dirname as dirname8, join as join12 } from "node:path";

// src/domain/codex-skills-manifest.ts
import { mkdir as mkdir6, readFile as readFile10, rename as rename2, rm as rm5, writeFile as writeFile5 } from "node:fs/promises";
import { dirname as dirname7, join as join11, resolve as resolve6 } from "node:path";
var emptyCodexSkillsManifest = () => ({
  version: 2,
  skills: []
});
async function readCodexSkillsManifest(repoCodexRoot) {
  const path = getManifestPath(repoCodexRoot);
  let value;
  try {
    value = JSON.parse(await readFile10(path, "utf8"));
  } catch (error) {
    if (isMissingFileError3(error)) {
      return { manifest: emptyCodexSkillsManifest(), legacyEntries: [] };
    }
    throw new Error(`Invalid Codex skills manifest JSON: ${path}`, {
      cause: error
    });
  }
  if (isRecord4(value) && value.version === 1) {
    const legacyEntries = Array.isArray(value.skills) ? value.skills.map((entry) => isRecord4(entry) && typeof entry.name === "string" ? entry.name : undefined).filter((name) => name !== undefined).sort() : [];
    return { manifest: emptyCodexSkillsManifest(), legacyEntries };
  }
  return {
    manifest: validateCodexSkillsManifest(value),
    legacyEntries: []
  };
}
function validateCodexSkillsManifest(value) {
  if (!isRecord4(value) || value.version !== 2 || !Array.isArray(value.skills)) {
    throw new Error("Codex skills manifest must have version 2 and a skills array.");
  }
  const names = new Set;
  const skills = value.skills.map((entry, index) => {
    const skill = validateManagedSkill(entry, index);
    if (names.has(skill.name)) {
      throw new Error(`Duplicate Codex skill manifest entry: ${skill.name}`);
    }
    names.add(skill.name);
    return skill;
  });
  return {
    version: 2,
    skills: skills.sort((left, right) => left.name.localeCompare(right.name))
  };
}
async function writeCodexSkillsManifest(repoCodexRoot, manifest) {
  const validated = validateCodexSkillsManifest(manifest);
  const path = getManifestPath(repoCodexRoot);
  const temporaryPath = join11(dirname7(path), `.skills.manifest.${process.pid}.${Date.now()}.tmp`);
  assertPathInside(repoCodexRoot, path);
  assertPathInside(repoCodexRoot, temporaryPath);
  await mkdir6(dirname7(path), { recursive: true });
  try {
    await writeFile5(temporaryPath, `${JSON.stringify(validated, null, 2)}
`, "utf8");
    await rename2(temporaryPath, path);
  } finally {
    await rm5(temporaryPath, { force: true });
  }
}
function upsertManagedSkill(manifest, skill) {
  return validateCodexSkillsManifest({
    version: 2,
    skills: [
      ...manifest.skills.filter((entry) => entry.name !== skill.name),
      skill
    ]
  });
}
function removeManagedSkill(manifest, name) {
  return {
    version: 2,
    skills: manifest.skills.filter((skill) => skill.name !== name)
  };
}
function getManifestPath(repoCodexRoot) {
  const path = resolve6(repoCodexRoot, "skills.manifest.json");
  assertPathInside(repoCodexRoot, path);
  return path;
}
function validateManagedSkill(value, index) {
  if (!isRecord4(value)) {
    throw new Error(`Codex skill entry ${index} must be an object.`);
  }
  const name = readNonEmptyString(value.name, `skills[${index}].name`);
  if (!/^[a-z0-9][a-z0-9-]*$/u.test(name)) {
    throw new Error(`Invalid Codex skill name: ${name}`);
  }
  if (value.source !== "github") {
    throw new Error(`Codex skill ${name} must use source "github".`);
  }
  const repository = readNonEmptyString(value.repository, `skills[${index}].repository`);
  if (!/^[^/\s]+\/[^/\s]+$/u.test(repository) || repository.includes("..")) {
    throw new Error(`Invalid GitHub repository for ${name}: ${repository}`);
  }
  const selector = readNonEmptyString(value.selector, `skills[${index}].selector`);
  if (selector.includes("\\") || selector.split("/").includes("..")) {
    throw new Error(`Invalid skill selector for ${name}: ${selector}`);
  }
  if (!isRecord4(value.tracking)) {
    throw new Error(`Codex skill ${name} must declare tracking.`);
  }
  if (value.tracking.type !== "branch" && value.tracking.type !== "pin") {
    throw new Error(`Invalid tracking type for ${name}.`);
  }
  const ref = readNonEmptyString(value.tracking.ref, `skills[${index}].tracking.ref`);
  if (typeof value.enabled !== "boolean") {
    throw new Error(`Codex skill ${name} must declare enabled as a boolean.`);
  }
  return {
    name,
    source: "github",
    repository,
    selector,
    tracking: { type: value.tracking.type, ref },
    enabled: value.enabled
  };
}
function readNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}
function isRecord4(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isMissingFileError3(error) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

// src/domain/codex-skills-manager.ts
async function buildManagedSkillInventory(input) {
  const installed = await input.backend.listInstalled({
    trackableOnly: input.manifest.skills.length === 0
  });
  const installedByName = new Map(installed.map((skill) => [skill.name, skill]));
  const trackedSkills = input.manifest.skills.filter((skill) => {
    const local = installedByName.get(skill.name);
    return skill.enabled && skill.tracking.type === "branch" && local?.managed === true && local.repository === skill.repository;
  });
  const updates = await input.backend.checkUpdates(trackedSkills);
  const rows = input.manifest.skills.map((skill) => classifyManagedSkill(skill, installedByName.get(skill.name), updates));
  const reservedNames = new Set([
    ...input.manifest.skills.map((skill) => skill.name),
    ...input.legacyEntries
  ]);
  for (const local of installed) {
    if (reservedNames.has(local.name) || !local.localGitHubCandidate) {
      continue;
    }
    const candidate = local.localGitHubCandidate;
    rows.push({
      name: local.name,
      source: `${candidate.repository}:${candidate.selector}@${candidate.ref ?? "(choose ref)"}`,
      state: "local_only",
      installedPath: local.path,
      installedManaged: true,
      availableActions: ["none", "track"],
      localGitHubCandidate: candidate
    });
  }
  for (const name of input.legacyEntries) {
    rows.push({
      name,
      source: "legacy manifest entry",
      state: "legacy",
      availableActions: ["none"]
    });
  }
  return rows.sort((left, right) => left.name.localeCompare(right.name));
}
function classifyManagedSkill(skill, installed, updates) {
  const source = `${skill.repository}:${skill.selector}@${skill.tracking.ref}`;
  if (!skill.enabled) {
    return {
      name: skill.name,
      source,
      state: "disabled",
      installedPath: installed?.path,
      installedManaged: installed?.managed === true && installed.repository === skill.repository,
      availableActions: ["none", "enable", "remove"],
      skill
    };
  }
  if (!installed) {
    return {
      name: skill.name,
      source,
      state: "missing",
      availableActions: ["none", "install", "remove"],
      skill
    };
  }
  if (!installed.managed || installed.repository !== skill.repository) {
    return {
      name: skill.name,
      source,
      state: "unmanaged_collision",
      installedPath: installed.path,
      installedManaged: false,
      availableActions: ["none", "replace", "remove"],
      skill
    };
  }
  if (skill.tracking.type === "branch" && updates.has(skill.name)) {
    return {
      name: skill.name,
      source,
      state: "update_available",
      installedPath: installed.path,
      installedManaged: true,
      availableActions: ["none", "update", "remove"],
      skill
    };
  }
  return {
    name: skill.name,
    source,
    state: "installed",
    installedPath: installed.path,
    installedManaged: true,
    availableActions: ["none", "remove"],
    skill
  };
}
async function executeSkillPlan(input) {
  let manifest = input.manifest;
  const completed = [];
  const failed = [];
  for (const item of input.items) {
    if (item.action === "none") {
      continue;
    }
    try {
      if (item.action === "track") {
        if (!item.skill) {
          throw new Error(`Missing tracking metadata for ${item.name}.`);
        }
        manifest = upsertManagedSkill(manifest, item.skill);
      } else if (item.action === "install" || item.action === "add") {
        if (!item.skill) {
          throw new Error(`Missing install metadata for ${item.name}.`);
        }
        await input.backend.install(item.skill);
        manifest = upsertManagedSkill(manifest, item.skill);
      } else if (item.action === "replace") {
        if (!item.skill || !item.installedPath) {
          throw new Error(`Missing replacement metadata for ${item.name}.`);
        }
        await replaceSkillWithRollback(item, input.backend);
        manifest = upsertManagedSkill(manifest, item.skill);
      } else if (item.action === "update") {
        if (!item.skill) {
          throw new Error(`Missing update metadata for ${item.name}.`);
        }
        await input.backend.update(item.skill);
      } else if (item.action === "enable") {
        if (!item.skill) {
          throw new Error(`Missing enable metadata for ${item.name}.`);
        }
        manifest = upsertManagedSkill(manifest, {
          ...item.skill,
          enabled: true
        });
      } else if (item.action === "remove") {
        if (item.installedPath && item.installedManaged === true) {
          await input.backend.remove(item.name);
        }
        manifest = removeManagedSkill(manifest, item.name);
      }
      await writeCodexSkillsManifest(input.repoCodexRoot, manifest);
      completed.push(item);
    } catch (error) {
      failed.push({
        item,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return { manifest, completed, failed };
}
async function replaceSkillWithRollback(item, backend) {
  const skill = item.skill;
  const installedPath = item.installedPath;
  if (!skill || !installedPath) {
    throw new Error(`Missing replacement metadata for ${item.name}.`);
  }
  const backupPath = join12(dirname8(installedPath), `.${item.name}.cthutool-backup-${process.pid}-${Date.now()}`);
  await mkdir7(dirname8(backupPath), { recursive: true });
  await rename3(installedPath, backupPath);
  try {
    await backend.install(skill);
    await rm6(backupPath, { recursive: true, force: true });
  } catch (error) {
    await rm6(installedPath, { recursive: true, force: true });
    await rename3(backupPath, installedPath);
    throw error;
  }
}

// src/command/codex.command.ts
var commonArgs = {
  ...cliContractArgs,
  repoRoot: { type: "string", description: "Override the repository root" },
  home: { type: "string", description: "Override the home directory" },
  codexHome: {
    type: "string",
    description: "Override the local Codex home directory"
  }
};
var installArgs = {
  ...commonArgs,
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
async function runObservedCodexSubcommand(subcommand, args, run) {
  await runObservedCliCommand(args, { command: "codex", subcommand }, run);
}
function failCommand(scope, message) {
  const error = createCliError("invalid_option", message);
  scope.fail(error);
  writeCommandError(scope.context, processOutput, error);
  process.exitCode = error.exitCode;
}
async function runSkills(args, scope, dependencies = {}) {
  if (!scope.context.json && !scope.context.interactive) {
    failCommand(scope, "`chc codex skills` requires an interactive terminal; use --json for a read-only snapshot.");
    return;
  }
  const paths = createPaths(args);
  const manifestResult = await readCodexSkillsManifest(paths.repoCodexRoot);
  const backend = dependencies.createBackend ? dependencies.createBackend(paths) : createNpxSkillsBackend({
    homeRoot: paths.homeRoot,
    localCodexRoot: paths.localCodexRoot
  });
  const inventory = await buildManagedSkillInventory({
    ...manifestResult,
    backend
  });
  if (scope.context.json) {
    writeJsonValue(processOutput, {
      ok: true,
      command: "codex skills",
      result: {
        manifestVersion: manifestResult.manifest.version,
        skills: inventory,
        legacyEntries: manifestResult.legacyEntries
      }
    });
    process.exitCode = 0;
    return;
  }
  if (manifestResult.legacyEntries.length > 0) {
    failCommand(scope, `The version 1 skills manifest contains entries without reinstallable sources (${manifestResult.legacyEntries.join(", ")}). Migrate it explicitly to version 2 before making changes.`);
    return;
  }
  writeInventory(scope, inventory);
  const interaction = dependencies.interaction ?? defaultSkillsInteraction;
  const mode = await interaction.chooseMode();
  if (!mode) {
    return;
  }
  if (mode === "manage" && inventory.length === 0) {
    writeHumanStatus(scope.context, processOutput, import_picocolors3.default.dim("No tracked or trackable GitHub skills were found."));
    writeHumanStatus(scope.context, processOutput, import_picocolors3.default.dim("Choose Add skills from GitHub to install and track one."));
    return;
  }
  const plan = mode === "add" ? await createAddPlan(manifestResult.manifest, backend, interaction) : await createManagePlan(inventory, backend, interaction);
  if (!plan) {
    writeHumanStatus(scope.context, processOutput, import_picocolors3.default.dim("Cancelled."));
    return;
  }
  if (plan.length === 0) {
    writeHumanStatus(scope.context, processOutput, import_picocolors3.default.dim("No changes selected."));
    return;
  }
  writePlan(scope, plan);
  const approved = await interaction.confirmPlan(plan);
  if (approved !== true) {
    writeHumanStatus(scope.context, processOutput, import_picocolors3.default.dim("Cancelled."));
    return;
  }
  const result = await executeSkillPlan({
    repoCodexRoot: paths.repoCodexRoot,
    manifest: manifestResult.manifest,
    items: plan,
    backend
  });
  for (const item of result.completed) {
    writeHumanStatus(scope.context, processOutput, import_picocolors3.default.green(`done  ${item.action} ${item.name}`));
  }
  for (const failure of result.failed) {
    writeHumanStatus(scope.context, processOutput, import_picocolors3.default.red(`failed ${failure.item.action} ${failure.item.name}: ${failure.error}`));
  }
  process.exitCode = result.failed.length === 0 ? 0 : 1;
}
function writeInventory(scope, inventory) {
  writeHumanStatus(scope.context, processOutput, import_picocolors3.default.bold("Codex skills reconciliation"));
  if (inventory.length === 0) {
    writeHumanStatus(scope.context, processOutput, import_picocolors3.default.dim("(none)"));
    return;
  }
  for (const row of inventory) {
    writeHumanStatus(scope.context, processOutput, `${row.name.padEnd(28)} ${row.state.padEnd(20)} ${import_picocolors3.default.dim(row.source)}`);
  }
}
async function createManagePlan(inventory, backend, interaction) {
  const actionable = inventory.filter((row) => row.availableActions.some((action) => action !== "none"));
  if (actionable.length === 0) {
    return [];
  }
  const choices = await interaction.chooseManagedActions(actionable);
  if (!choices) {
    return;
  }
  const plan = [];
  for (const choice of choices) {
    const row = actionable.find((candidate) => candidate.name === choice.name);
    if (!row) {
      continue;
    }
    if (choice.action === "track") {
      const candidate = row.localGitHubCandidate;
      if (!candidate) {
        throw new Error(`Missing local GitHub provenance for ${row.name}.`);
      }
      const trackingType = await interaction.chooseTrackingType(candidate);
      if (!trackingType) {
        return;
      }
      const ref = await interaction.requestTrackingRef(trackingType, candidate.ref);
      if (!ref) {
        return;
      }
      const skill = {
        name: row.name,
        source: "github",
        repository: candidate.repository,
        selector: candidate.selector,
        tracking: { type: trackingType, ref: ref.trim() },
        enabled: true
      };
      await backend.validate(skill);
      plan.push({
        action: "track",
        name: row.name,
        skill,
        installedPath: row.installedPath,
        installedManaged: true
      });
    } else {
      plan.push({
        action: choice.action,
        name: row.name,
        skill: row.skill,
        installedPath: row.installedPath,
        installedManaged: row.installedManaged
      });
    }
  }
  return plan;
}
async function createAddPlan(manifest, backend, interaction) {
  const repositoryAnswer = await interaction.requestRepository();
  if (!repositoryAnswer) {
    return;
  }
  const repository = repositoryAnswer.trim();
  const discovered = await backend.discover(repository);
  const selectedNames = await interaction.chooseDiscoveredNames(discovered);
  if (!selectedNames) {
    return;
  }
  const trackingType = await interaction.chooseTrackingType();
  if (!trackingType) {
    return;
  }
  const refAnswer = await interaction.requestTrackingRef(trackingType);
  if (!refAnswer) {
    return;
  }
  const selectedSkills = selectedNames.map((name) => ({
    name,
    source: "github",
    repository,
    selector: name,
    tracking: { type: trackingType, ref: refAnswer.trim() },
    enabled: true
  }));
  const candidateManifest = {
    version: 2,
    skills: [
      ...manifest.skills.filter((existing) => !selectedNames.includes(existing.name)),
      ...selectedSkills
    ]
  };
  const inventory = await buildManagedSkillInventory({
    manifest: candidateManifest,
    legacyEntries: [],
    backend
  });
  return selectedSkills.map((skill) => {
    const row = inventory.find((candidate) => candidate.name === skill.name);
    if (row?.state === "unmanaged_collision") {
      return {
        action: "replace",
        name: skill.name,
        skill,
        installedPath: row.installedPath
      };
    }
    if (row?.state === "missing") {
      return { action: "add", name: skill.name, skill };
    }
    return { action: "enable", name: skill.name, skill };
  });
}
var defaultSkillsInteraction = {
  async chooseMode() {
    const answer = await le2({
      message: "Codex skills",
      options: [
        { value: "manage", label: "Manage tracked and local skills" },
        { value: "add", label: "Add skills from GitHub" }
      ]
    });
    return lD2(answer) ? undefined : answer;
  },
  async chooseManagedActions(rows) {
    return promptManagedActionTable(rows);
  },
  async requestRepository() {
    const answer = await ae({
      message: "GitHub repository (owner/repo)",
      validate(value) {
        return /^[^/\s]+\/[^/\s]+$/u.test(value.trim()) ? undefined : "Use owner/repo format.";
      }
    });
    return lD2(answer) ? undefined : answer.trim();
  },
  async chooseDiscoveredNames(skills) {
    const answer = await $e({
      message: "Select skills to track (Space toggles)",
      required: true,
      options: skills.map((skill) => ({
        value: skill.name,
        label: skill.name
      }))
    });
    return lD2(answer) ? undefined : answer;
  },
  async chooseTrackingType() {
    const answer = await le2({
      message: "Tracking mode",
      options: [
        { value: "branch", label: "Track a branch" },
        { value: "pin", label: "Pin a commit or tag" }
      ]
    });
    return lD2(answer) ? undefined : answer;
  },
  async requestTrackingRef(type, initialValue) {
    const answer = await ae({
      message: type === "branch" ? "Branch" : "Commit or tag",
      initialValue: initialValue ?? (type === "branch" ? "main" : undefined),
      validate: (value) => value.trim().length > 0 ? undefined : "A ref is required."
    });
    return lD2(answer) ? undefined : answer.trim();
  },
  async confirmPlan() {
    const answer = await ce2({
      message: "Apply this skills plan?",
      initialValue: false
    });
    return lD2(answer) ? undefined : answer;
  }
};
async function promptManagedActionTable(rows) {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    return;
  }
  const indexes = rows.map(() => 0);
  let focused = 0;
  let renderedLines = 0;
  const control = String.fromCharCode(27);
  function render() {
    const lines = [
      import_picocolors3.default.bold("Choose skill actions"),
      import_picocolors3.default.dim("↑/↓ move · Space cycles valid actions · Enter reviews plan"),
      ...rows.map((row, index) => {
        const action = row.availableActions[indexes[index] ?? 0] ?? "none";
        const marker = index === focused ? import_picocolors3.default.cyan("›") : " ";
        const actionLabel = action === "none" ? import_picocolors3.default.dim("none") : import_picocolors3.default.yellow(action);
        return `${marker} ${row.name.padEnd(26)} ${row.state.padEnd(20)} ${actionLabel.padEnd(18)} ${import_picocolors3.default.dim(row.source)}`;
      })
    ];
    if (renderedLines > 0) {
      process.stdout.write(`${control}[${renderedLines}A${control}[0J`);
    }
    process.stdout.write(`${lines.join(`
`)}
`);
    renderedLines = lines.length;
  }
  return await new Promise((resolve7) => {
    const wasRaw = input.isRaw;
    const finish = (cancelled) => {
      input.off("keypress", onKeypress);
      input.setRawMode(wasRaw);
      if (!wasRaw) {
        input.pause();
      }
      process.stdout.write(`${control}[?25h`);
      if (cancelled) {
        resolve7(undefined);
        return;
      }
      resolve7(rows.flatMap((row, index) => {
        const action = row.availableActions[indexes[index] ?? 0] ?? "none";
        return action === "none" ? [] : [{ name: row.name, action }];
      }));
    };
    const onKeypress = (_value, key) => {
      if (key.ctrl && key.name === "c" || key.name === "escape") {
        finish(true);
        return;
      }
      if (key.name === "up") {
        focused = (focused - 1 + rows.length) % rows.length;
      } else if (key.name === "down") {
        focused = (focused + 1) % rows.length;
      } else if (key.name === "space") {
        indexes[focused] = ((indexes[focused] ?? 0) + 1) % rows[focused].availableActions.length;
      } else if (key.name === "return" || key.name === "enter") {
        finish(false);
        return;
      } else {
        return;
      }
      render();
    };
    emitKeypressEvents2(input);
    input.setRawMode(true);
    input.resume();
    input.on("keypress", onKeypress);
    process.stdout.write(`${control}[?25l`);
    render();
  });
}
function writePlan(scope, plan) {
  writeHumanStatus(scope.context, processOutput);
  writeHumanStatus(scope.context, processOutput, import_picocolors3.default.bold("Plan"));
  for (const item of plan) {
    writeHumanStatus(scope.context, processOutput, `${item.action.padEnd(8)} ${item.name} ${import_picocolors3.default.dim(describePlanEffect(item))}`);
  }
}
function describePlanEffect(item) {
  if (item.action === "track" && item.skill) {
    return `(manifest only; ${item.skill.repository}:${item.skill.selector}@${item.skill.tracking.ref} ${item.skill.tracking.type}; keep local installation unchanged)`;
  }
  if (item.action === "add" || item.action === "install") {
    return "(install locally; add/retain manifest entry)";
  }
  if (item.action === "replace") {
    return "(snapshot collision; install locally; add/retain manifest entry)";
  }
  if (item.action === "remove") {
    return item.installedManaged ? "(remove managed installation; remove manifest entry)" : "(leave unmanaged local copy; remove manifest entry)";
  }
  if (item.action === "enable") {
    return "(enable manifest entry)";
  }
  if (item.action === "update") {
    return "(update local installation; preserve manifest source)";
  }
  return "";
}
var codexCommand = defineCommand({
  meta: {
    name: "codex",
    description: "Manage Codex skills and repository plugins."
  },
  subCommands: {
    skills: defineCommand({
      meta: {
        name: "skills",
        description: "Reconcile manifest-tracked and eligible local GitHub skills."
      },
      args: commonArgs,
      async run({ args }) {
        await runObservedCodexSubcommand("skills", args, async (scope) => {
          await runSkills(args, scope);
        });
      }
    }),
    install: defineCommand({
      meta: {
        name: "install",
        description: "Install repository-owned Codex plugins locally."
      },
      args: installArgs,
      async run({ args }) {
        await runObservedCodexSubcommand("install", args, async ({ context }) => {
          const result = await installRepositoryCodexPlugins(createPaths(args));
          if (context.json) {
            writeJsonValue(processOutput, {
              ok: true,
              command: "codex install",
              result
            });
          } else {
            writeHumanStatus(context, processOutput, import_picocolors3.default.cyan("Codex install"));
            writeHumanStatus(context, processOutput, `installed plugins: ${result.installedPlugins.map((plugin) => plugin.name).join(", ") || "(none)"}`);
          }
          process.exitCode = 0;
        });
      }
    })
  }
});

// src/command/completion.command.ts
import { execFile as execFile2 } from "node:child_process";
import { mkdir as mkdir8, readFile as readFile11, writeFile as writeFile6 } from "node:fs/promises";
import { homedir as homedir6, platform as platform2 } from "node:os";
import { dirname as dirname9, join as join13 } from "node:path";
import { promisify as promisify2 } from "node:util";

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
  const publicNames = new Set(getCommandRegistrations(command)?.filter((registration2) => registration2.visibility === "public").map((registration2) => registration2.name));
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
  return [...new Set(candidates)].filter((candidate) => candidate.startsWith(prefix)).sort((a4, b5) => a4.localeCompare(b5));
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
var execFileAsync = promisify2(execFile2);
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
    return await readFile11(path, "utf8");
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
    return join13(process.env.USERPROFILE || homedir6(), "Documents", "PowerShell", "Microsoft.PowerShell_profile.ps1");
  }
  return join13(homedir6(), ".config", "powershell", "Microsoft.PowerShell_profile.ps1");
}
function resolveZshProfilePath() {
  const override = process.env[zshProfileEnv]?.trim();
  if (override) {
    return override;
  }
  const zdotdir = process.env.ZDOTDIR?.trim();
  return join13(zdotdir || homedir6(), ".zshrc");
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
      await writeFile6(profilePath, cleaned2.content);
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
  await mkdir8(dirname9(profilePath), { recursive: true });
  await writeFile6(profilePath, `${prefix}${powershellCompletionBlock}
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
      await writeFile6(profilePath, cleaned2.content);
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
  await mkdir8(dirname9(profilePath), { recursive: true });
  await writeFile6(profilePath, `${prefix}${zshCompletionBlock}
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

// src/command/obsidian.command.ts
import { join as join17 } from "node:path";
var import_picocolors4 = __toESM(require_picocolors(), 1);

// src/domain/obsidian-agents-config.ts
import { randomUUID as randomUUID2 } from "node:crypto";
import { mkdir as mkdir9, readFile as readFile12, rename as rename4, writeFile as writeFile7 } from "node:fs/promises";
import { isAbsolute as isAbsolute3, join as join14, relative as relative3, resolve as resolve7, sep as sep4 } from "node:path";
var OBSIDIAN_AGENTS_CONFIG_VERSION = 2;

class ObsidianAgentsConfigError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "ObsidianAgentsConfigError";
  }
}
function createEmptyObsidianAgentsConfig() {
  return {
    version: OBSIDIAN_AGENTS_CONFIG_VERSION,
    profiles: {}
  };
}
function normalizeObsidianAgentsProfile(input) {
  const id = input.id.trim();
  if (!/^[a-z0-9][a-z0-9_-]*$/u.test(id)) {
    throw new ObsidianAgentsConfigError("Profile id must start with a lowercase letter or number and contain only lowercase letters, numbers, hyphens, or underscores.");
  }
  const vaultPath = normalizeAbsolutePath(input.vaultPath, "vault path");
  const sourcePath = normalizeAbsolutePath(input.sourcePath?.trim() || join14(vaultPath, "Agents"), "visible source path");
  const agentsPath = join14(vaultPath, ".agents");
  const sourceRelative = relative3(vaultPath, sourcePath);
  if (sourceRelative.length === 0 || sourceRelative === ".." || sourceRelative.startsWith(`..${sep4}`) || isAbsolute3(sourceRelative)) {
    throw new ObsidianAgentsConfigError("The visible source path must be a directory inside the Obsidian vault.");
  }
  if (sourceRelative.split(/[\\/]/u).some((part) => part.startsWith("."))) {
    throw new ObsidianAgentsConfigError("The visible source path must not contain hidden dot-prefixed directories.");
  }
  if (sourcePath === agentsPath) {
    throw new ObsidianAgentsConfigError("The visible source path must be different from the vault .agents compatibility path.");
  }
  return { id, vaultPath, sourcePath, agentsPath };
}
async function readObsidianAgentsConfig(paths) {
  let raw;
  try {
    raw = await readFile12(paths.configPath, "utf8");
  } catch (error) {
    if (isMissingFileError4(error))
      return;
    throw new ObsidianAgentsConfigError(`Unable to read Obsidian agents configuration: ${paths.configPath}`, { cause: error });
  }
  try {
    return parseObsidianAgentsConfig(JSON.parse(raw));
  } catch (error) {
    if (error instanceof ObsidianAgentsConfigError)
      throw error;
    throw new ObsidianAgentsConfigError(`Invalid Obsidian agents configuration: ${paths.configPath}`, { cause: error });
  }
}
async function writeObsidianAgentsConfig(paths, config) {
  const normalized = parseObsidianAgentsConfig(config);
  const persisted = {
    version: normalized.version,
    ...normalized.defaultProfile ? { defaultProfile: normalized.defaultProfile } : {},
    profiles: Object.fromEntries(Object.entries(normalized.profiles).map(([id, profile]) => [
      id,
      {
        id: profile.id,
        vaultPath: profile.vaultPath,
        sourcePath: profile.sourcePath
      }
    ]))
  };
  await mkdir9(paths.dataRoot, { recursive: true });
  const temporaryPath = `${paths.configPath}.tmp-${randomUUID2()}`;
  await writeFile7(temporaryPath, `${JSON.stringify(persisted, null, 2)}
`, "utf8");
  await rename4(temporaryPath, paths.configPath);
}
function parseObsidianAgentsConfig(value) {
  if (!isRecord5(value) || value.version !== 1 && value.version !== 2) {
    throw new ObsidianAgentsConfigError("Obsidian agents configuration must use version 1 or 2.");
  }
  if (!isRecord5(value.profiles)) {
    throw new ObsidianAgentsConfigError("Obsidian agents configuration must contain a profiles object.");
  }
  const profiles = {};
  for (const [id, rawProfile] of Object.entries(value.profiles)) {
    if (!isRecord5(rawProfile)) {
      throw new ObsidianAgentsConfigError(`Profile "${id}" is invalid.`);
    }
    profiles[id] = normalizeObsidianAgentsProfile({
      id,
      vaultPath: readString(rawProfile.vaultPath, `Profile "${id}" vaultPath`),
      sourcePath: value.version === 2 ? readString(rawProfile.sourcePath, `Profile "${id}" sourcePath`) : undefined
    });
  }
  const defaultProfile = value.defaultProfile === undefined ? undefined : readString(value.defaultProfile, "defaultProfile");
  if (defaultProfile && !profiles[defaultProfile]) {
    throw new ObsidianAgentsConfigError(`Default profile "${defaultProfile}" does not exist.`);
  }
  return {
    version: OBSIDIAN_AGENTS_CONFIG_VERSION,
    ...defaultProfile ? { defaultProfile } : {},
    profiles
  };
}
function selectObsidianAgentsProfile(config, profileId) {
  const selectedId = profileId?.trim() || config.defaultProfile;
  if (selectedId)
    return config.profiles[selectedId];
  return Object.values(config.profiles)[0];
}
function upsertObsidianAgentsProfile(config, profile) {
  return {
    ...config,
    defaultProfile: profile.id,
    profiles: { ...config.profiles, [profile.id]: profile }
  };
}
function normalizeAbsolutePath(value, label) {
  const trimmed = value.trim();
  if (!trimmed || !isAbsolute3(trimmed)) {
    throw new ObsidianAgentsConfigError(`${label} must be an absolute path.`);
  }
  return resolve7(trimmed);
}
function readString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ObsidianAgentsConfigError(`${label} must be a non-empty string.`);
  }
  return value;
}
function isRecord5(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isMissingFileError4(error) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

// src/domain/obsidian-agents-service.ts
import {
  lstat,
  mkdir as mkdir10,
  readdir as readdir4,
  readlink,
  realpath as realpath2,
  rename as rename5,
  rmdir,
  stat as stat5,
  symlink,
  unlink
} from "node:fs/promises";
import {
  basename as basename3,
  dirname as dirname10,
  isAbsolute as isAbsolute4,
  join as join15,
  normalize,
  relative as relative4,
  resolve as resolve8,
  sep as sep5
} from "node:path";
class ObsidianAgentsServiceError extends Error {
  code;
  exitCode = 1;
  constructor(code, message, options) {
    super(message, options);
    this.name = "ObsidianAgentsServiceError";
    this.code = code;
  }
}
async function createObsidianAgentsSetupPlan(_paths, input, options = {}) {
  const profile = normalizeObsidianAgentsProfile(input);
  const platform3 = options.platform ?? process.platform;
  if (!await isDirectory(profile.vaultPath)) {
    throw new ObsidianAgentsServiceError("invalid_configuration", `Obsidian vault does not exist or is not a directory: ${profile.vaultPath}`);
  }
  if (!await isCanonicalSourceInsideVault(profile)) {
    throw new ObsidianAgentsServiceError("invalid_configuration", `The visible source must resolve to a directory inside the Obsidian vault: ${profile.sourcePath}`);
  }
  const topology = await inspectObsidianAgentsTopology(profile, { platform: platform3 });
  if (topology.source.kind !== "absent" && topology.source.kind !== "directory") {
    throw new ObsidianAgentsServiceError("invalid_configuration", `The visible source path must be a real directory, not ${topology.source.kind}: ${profile.sourcePath}`);
  }
  await assertContentDirectory(profile.sourcePath, "skills");
  await assertContentDirectory(profile.sourcePath, "state");
  let transition;
  const actions = [];
  switch (topology.agents.kind) {
    case "absent":
      transition = topology.source.kind === "absent" ? "create" : "link_existing_source";
      actions.push(topology.source.kind === "absent" ? `create visible source ${profile.sourcePath}` : `preserve visible source ${profile.sourcePath}`, `ensure ${join15(profile.sourcePath, "skills")} and ${join15(profile.sourcePath, "state")}`, `create ${getObsidianAgentsLinkType(platform3)} ${profile.agentsPath} -> ${profile.sourcePath}`);
      break;
    case "directory":
      if (topology.source.kind === "absent" || topology.source.empty === true) {
        transition = "adopt_existing_agents";
        actions.push(`move existing directory ${profile.agentsPath} to ${profile.sourcePath}`, `ensure ${join15(profile.sourcePath, "skills")} and ${join15(profile.sourcePath, "state")}`, `create ${getObsidianAgentsLinkType(platform3)} ${profile.agentsPath} -> ${profile.sourcePath}`);
      } else if (topology.agents.empty === true) {
        transition = "replace_empty_agents";
        actions.push(`remove empty directory ${profile.agentsPath}`, `preserve visible source ${profile.sourcePath}`, `create ${getObsidianAgentsLinkType(platform3)} ${profile.agentsPath} -> ${profile.sourcePath}`);
      } else {
        throw new ObsidianAgentsServiceError("conflict", `Both agents directories contain data. Reconcile them manually before setup: ${profile.agentsPath} and ${profile.sourcePath}`);
      }
      break;
    case "link":
      if (topology.linkStatus === "correct") {
        transition = "reuse";
        actions.push(`validate existing link ${profile.agentsPath}`);
        if (!await isDirectory(join15(profile.sourcePath, "skills"))) {
          actions.push(`create ${join15(profile.sourcePath, "skills")}`);
        }
        if (!await isDirectory(join15(profile.sourcePath, "state"))) {
          actions.push(`create ${join15(profile.sourcePath, "state")}`);
        }
      } else {
        transition = "repair_link";
        actions.push(`replace only link ${profile.agentsPath} (current target: ${topology.agents.resolvedTarget ?? topology.agents.target ?? "unavailable"})`, `preserve the old link target`, `ensure ${profile.sourcePath} with skills/ and state/`, `create ${getObsidianAgentsLinkType(platform3)} ${profile.agentsPath} -> ${profile.sourcePath}`);
      }
      break;
    case "broken_link":
      transition = "repair_link";
      actions.push(`replace broken link ${profile.agentsPath}`, `ensure ${profile.sourcePath} with skills/ and state/`, `create ${getObsidianAgentsLinkType(platform3)} ${profile.agentsPath} -> ${profile.sourcePath}`);
      break;
    case "file":
    case "other":
      throw new ObsidianAgentsServiceError("invalid_configuration", `The compatibility path is an unsupported ${topology.agents.kind}: ${profile.agentsPath}`);
  }
  const requiresConfirmation = transition !== "reuse" || actions.some((action) => action.startsWith("create "));
  return {
    profile,
    platform: platform3,
    transition,
    topology,
    actions,
    requiresConfirmation
  };
}
async function applyObsidianAgentsSetup(paths, plan) {
  const current = await createObsidianAgentsSetupPlan(paths, plan.profile, {
    platform: plan.platform
  });
  if (current.transition !== plan.transition || !sameSetupTopology(current.topology, plan.topology)) {
    throw new ObsidianAgentsServiceError("conflict", `Obsidian agents topology changed after preview. Run setup again before modifying ${plan.profile.vaultPath}.`);
  }
  try {
    switch (plan.transition) {
      case "create":
      case "link_existing_source":
        await ensureSourceDirectories(plan.profile.sourcePath);
        await createObsidianAgentsDirectoryLink(plan.profile.agentsPath, plan.profile.sourcePath, { platform: plan.platform });
        break;
      case "adopt_existing_agents":
        await mkdir10(dirname10(plan.profile.sourcePath), { recursive: true });
        if (current.topology.source.kind === "directory") {
          await rmdir(plan.profile.sourcePath);
        }
        await rename5(plan.profile.agentsPath, plan.profile.sourcePath);
        await ensureSourceDirectories(plan.profile.sourcePath);
        await createObsidianAgentsDirectoryLink(plan.profile.agentsPath, plan.profile.sourcePath, { platform: plan.platform });
        break;
      case "replace_empty_agents":
        await rmdir(plan.profile.agentsPath);
        await ensureSourceDirectories(plan.profile.sourcePath);
        await createObsidianAgentsDirectoryLink(plan.profile.agentsPath, plan.profile.sourcePath, { platform: plan.platform });
        break;
      case "repair_link":
        await ensureSourceDirectories(plan.profile.sourcePath);
        await unlink(plan.profile.agentsPath);
        await createObsidianAgentsDirectoryLink(plan.profile.agentsPath, plan.profile.sourcePath, { platform: plan.platform });
        break;
      case "reuse":
        await ensureSourceDirectories(plan.profile.sourcePath);
        break;
    }
    const topology = await inspectObsidianAgentsTopology(plan.profile, {
      platform: plan.platform
    });
    if (topology.linkStatus !== "correct") {
      throw new Error(`Created compatibility link did not resolve to ${plan.profile.sourcePath}.`);
    }
    const existing = await readObsidianAgentsConfig(paths) ?? createEmptyObsidianAgentsConfig();
    await writeObsidianAgentsConfig(paths, upsertObsidianAgentsProfile(existing, plan.profile));
    return {
      profile: plan.profile,
      transition: plan.transition,
      actions: plan.actions,
      link: {
        status: topology.linkStatus,
        type: topology.agents.linkType,
        target: topology.agents.target,
        resolvedTarget: topology.agents.resolvedTarget
      }
    };
  } catch (error) {
    if (error instanceof ObsidianAgentsServiceError)
      throw error;
    const state = await describeCurrentState(plan.profile, plan.platform);
    throw new ObsidianAgentsServiceError("filesystem_failed", `Unable to apply Obsidian agents topology. ${state}`, { cause: error });
  }
}
async function inspectObsidianAgentsStatus(options) {
  const platform3 = options.platform ?? process.platform;
  const config = await readObsidianAgentsConfig(options.paths);
  const profile = config ? selectObsidianAgentsProfile(config, options.profileId) : undefined;
  if (!profile)
    return createMissingStatus();
  const topology = await inspectObsidianAgentsTopology(profile, { platform: platform3 });
  const vaultExists = await isDirectory(profile.vaultPath);
  const sourceInsideVault = vaultExists && await isCanonicalSourceInsideVault(profile);
  const sourceExists = topology.source.kind === "directory";
  const skillsExists = sourceExists ? await isDirectory(join15(profile.sourcePath, "skills")) : false;
  const stateExists = sourceExists ? await isDirectory(join15(profile.sourcePath, "state")) : false;
  const gitMetadata = sourceExists ? await pathExists2(join15(profile.sourcePath, ".git")) : false;
  const warnings = [];
  if (!vaultExists)
    warnings.push("The configured Obsidian vault is missing.");
  if (!sourceExists)
    warnings.push("The visible Agents source is missing.");
  if (vaultExists && !sourceInsideVault) {
    warnings.push("The visible Agents source resolves outside the configured Obsidian vault.");
  }
  if (topology.linkStatus !== "correct") {
    warnings.push(`The .agents compatibility link is ${topology.linkStatus}; run chc obsidian agents setup to repair it.`);
  }
  if (!skillsExists)
    warnings.push("The visible source is missing skills/.");
  if (!stateExists)
    warnings.push("The visible source is missing state/.");
  if (gitMetadata) {
    warnings.push("Legacy .git metadata is preserved in the visible source and is not managed by this feature.");
  }
  warnings.push("Obsidian Sync is eventually consistent; avoid concurrent writes to one non-Markdown state file.");
  return {
    configured: true,
    healthy: vaultExists && sourceExists && sourceInsideVault && topology.linkStatus === "correct" && skillsExists && stateExists,
    profile,
    paths: {
      vaultExists,
      sourceExists,
      sourceInsideVault,
      agentsExists: topology.agents.kind !== "absent",
      skillsExists,
      stateExists
    },
    source: topology.source,
    link: {
      status: topology.linkStatus,
      kind: topology.agents.kind,
      type: topology.agents.linkType,
      target: topology.agents.target,
      resolvedTarget: topology.agents.resolvedTarget,
      expectedTarget: topology.expectedTarget
    },
    legacy: { gitMetadata },
    consistency: { provider: "obsidian_sync", model: "eventual" },
    warnings
  };
}
async function inspectObsidianAgentsTopology(profile, options = {}) {
  const platform3 = options.platform ?? process.platform;
  const [source, agents] = await Promise.all([
    inspectObsidianAgentsPath(profile.sourcePath, platform3),
    inspectObsidianAgentsPath(profile.agentsPath, platform3)
  ]);
  let linkStatus;
  if (agents.kind === "absent") {
    linkStatus = "missing";
  } else if (agents.kind === "broken_link") {
    linkStatus = "broken";
  } else if (agents.kind === "link") {
    linkStatus = source.kind === "directory" && agents.resolvedTarget !== undefined && await sameCanonicalPath(agents.resolvedTarget, profile.sourcePath, platform3) ? "correct" : "mismatched";
  } else if (agents.kind === "directory") {
    linkStatus = "not_link";
  } else {
    linkStatus = "unsupported";
  }
  return {
    source,
    agents,
    linkStatus,
    expectedTarget: profile.sourcePath
  };
}
async function inspectObsidianAgentsPath(path, platform3 = process.platform) {
  let details;
  try {
    details = await lstat(path);
  } catch (error) {
    if (isMissingFileError5(error))
      return { path, kind: "absent" };
    throw error;
  }
  if (details.isSymbolicLink()) {
    const rawTarget = await readlink(path);
    const target = resolve8(dirname10(path), rawTarget);
    try {
      const resolvedTarget = await realpath2(path);
      return {
        path,
        kind: "link",
        linkType: getObsidianAgentsLinkType(platform3),
        target,
        resolvedTarget
      };
    } catch (error) {
      if (isMissingFileError5(error)) {
        return {
          path,
          kind: "broken_link",
          linkType: getObsidianAgentsLinkType(platform3),
          target
        };
      }
      throw error;
    }
  }
  if (details.isDirectory()) {
    return {
      path,
      kind: "directory",
      empty: (await readdir4(path)).length === 0
    };
  }
  if (details.isFile())
    return { path, kind: "file" };
  return { path, kind: "other" };
}
function getObsidianAgentsLinkType(platform3 = process.platform) {
  return platform3 === "win32" ? "junction" : "symbolic_link";
}
async function createObsidianAgentsDirectoryLink(linkPath, sourcePath, options = {}) {
  const platform3 = options.platform ?? process.platform;
  if (!await isDirectory(sourcePath)) {
    throw new ObsidianAgentsServiceError("invalid_configuration", `Cannot create the .agents link because its source is not a directory: ${sourcePath}`);
  }
  await symlink(sourcePath, linkPath, platform3 === "win32" ? "junction" : "dir");
  const state = await inspectObsidianAgentsPath(linkPath, platform3);
  if (state.kind !== "link" || !state.resolvedTarget || !await sameCanonicalPath(state.resolvedTarget, sourcePath, platform3)) {
    throw new ObsidianAgentsServiceError("filesystem_failed", `The .agents link does not resolve to its configured source: ${linkPath}`);
  }
}
async function sameCanonicalPath(left, right, platform3 = process.platform) {
  const [leftCanonical, rightCanonical] = await Promise.all([
    canonicalPath(left),
    canonicalPath(right)
  ]);
  return normalizeComparablePath(leftCanonical, platform3) === normalizeComparablePath(rightCanonical, platform3);
}
function createMissingStatus() {
  const source = { path: "", kind: "absent" };
  return {
    configured: false,
    healthy: false,
    paths: {
      vaultExists: false,
      sourceExists: false,
      sourceInsideVault: false,
      agentsExists: false,
      skillsExists: false,
      stateExists: false
    },
    source,
    link: { status: "missing", kind: "absent" },
    legacy: { gitMetadata: false },
    consistency: { provider: "obsidian_sync", model: "eventual" },
    warnings: [
      "Obsidian agents is not configured. Run chc obsidian agents setup."
    ]
  };
}
async function ensureSourceDirectories(sourcePath) {
  await mkdir10(join15(sourcePath, "skills"), { recursive: true });
  await mkdir10(join15(sourcePath, "state"), { recursive: true });
}
async function assertContentDirectory(sourcePath, name) {
  const state = await inspectObsidianAgentsPath(join15(sourcePath, name));
  if (state.kind !== "absent" && state.kind !== "directory") {
    throw new ObsidianAgentsServiceError("invalid_configuration", `The visible source ${name}/ path is not a real directory: ${state.path}`);
  }
}
async function describeCurrentState(profile, platform3) {
  try {
    const topology = await inspectObsidianAgentsTopology(profile, { platform: platform3 });
    return `Current state: source=${topology.source.kind} at ${profile.sourcePath}; .agents=${topology.agents.kind} at ${profile.agentsPath}.`;
  } catch {
    return `Inspect ${profile.sourcePath} and ${profile.agentsPath} before retrying setup.`;
  }
}
async function canonicalPath(path) {
  try {
    return await realpath2(path);
  } catch (error) {
    if (isMissingFileError5(error))
      return resolve8(path);
    throw error;
  }
}
async function canonicalDestinationPath(path) {
  const missingSegments = [];
  let current = resolve8(path);
  while (true) {
    try {
      const existing = await realpath2(current);
      return resolve8(existing, ...missingSegments.reverse());
    } catch (error) {
      if (!isMissingFileError5(error))
        throw error;
      const parent = dirname10(current);
      if (parent === current)
        return resolve8(path);
      missingSegments.push(basename3(current));
      current = parent;
    }
  }
}
async function isCanonicalSourceInsideVault(profile) {
  const [vaultCanonical, sourceCanonical] = await Promise.all([
    canonicalPath(profile.vaultPath),
    canonicalDestinationPath(profile.sourcePath)
  ]);
  const sourceRelative = relative4(vaultCanonical, sourceCanonical);
  return sourceRelative.length > 0 && sourceRelative !== ".." && !sourceRelative.startsWith(`..${sep5}`) && !isAbsolute4(sourceRelative);
}
function sameSetupTopology(left, right) {
  return left.linkStatus === right.linkStatus && samePathState(left.source, right.source) && samePathState(left.agents, right.agents);
}
function samePathState(left, right) {
  return left.path === right.path && left.kind === right.kind && left.empty === right.empty && left.linkType === right.linkType && left.target === right.target && left.resolvedTarget === right.resolvedTarget;
}
function normalizeComparablePath(value, platform3) {
  let comparable = value;
  if (platform3 === "win32") {
    if (comparable.startsWith("\\\\?\\UNC\\")) {
      comparable = `\\\\${comparable.slice(8)}`;
    } else if (comparable.startsWith("\\\\?\\")) {
      comparable = comparable.slice(4);
    }
  }
  comparable = normalize(comparable).replace(/[\\/]+$/u, "");
  return platform3 === "win32" ? comparable.toLowerCase() : comparable;
}
async function pathExists2(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (isMissingFileError5(error))
      return false;
    throw error;
  }
}
async function isDirectory(path) {
  try {
    return (await stat5(path)).isDirectory();
  } catch (error) {
    if (isMissingFileError5(error))
      return false;
    throw error;
  }
}
function isMissingFileError5(error) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

// src/infra/obsidian-agents-paths.ts
import { homedir as homedir7 } from "node:os";
import { join as join16, resolve as resolve9 } from "node:path";
function resolveCthuToolChcDataRoot(options = {}) {
  const env2 = options.env ?? process.env;
  const explicit = options.dataRoot?.trim() || env2.CTHUTOOL_CHC_DATA_DIR;
  if (explicit?.trim())
    return resolve9(explicit);
  const homeRoot = options.homeRoot ?? homedir7();
  const platform3 = options.platform ?? process.platform;
  if (platform3 === "win32") {
    return resolve9(join16(env2.APPDATA ?? join16(homeRoot, "AppData", "Roaming"), "CthuTool", "chc"));
  }
  if (platform3 === "darwin") {
    return resolve9(join16(homeRoot, "Library", "Application Support", "CthuTool", "chc"));
  }
  return resolve9(join16(env2.XDG_STATE_HOME ?? join16(homeRoot, ".local", "state"), "cthutool", "chc"));
}
function createObsidianAgentsDataPaths(options = {}) {
  const dataRoot = resolveCthuToolChcDataRoot(options);
  return {
    dataRoot,
    configPath: join16(dataRoot, "obsidian-agents.json")
  };
}

// src/command/obsidian.command.ts
var commonArgs2 = {
  ...cliContractArgs,
  profile: {
    type: "string",
    description: "Obsidian agents profile id"
  },
  vault: {
    type: "string",
    description: "Obsidian vault path"
  },
  sourcePath: {
    type: "string",
    description: "Visible Agents source directory inside the vault"
  },
  dataRoot: {
    type: "string",
    description: "Override the local CthuTool chc data directory"
  },
  home: {
    type: "string",
    description: "Override the user home directory"
  },
  yes: {
    type: "boolean",
    description: "Confirm setup mutations without prompting"
  }
};
function getStringArg2(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
function createDataPaths(args) {
  return createObsidianAgentsDataPaths({
    dataRoot: getStringArg2(args.dataRoot),
    homeRoot: getStringArg2(args.home)
  });
}
async function runObservedObsidianSubcommand(subcommand, args, run) {
  await runObservedCliCommand(args, { command: "obsidian agents", subcommand }, async (scope) => {
    try {
      await run(scope);
    } catch (error) {
      const cliError = toObsidianCliError(error);
      scope.fail(cliError);
      if (scope.context.json) {
        writeJsonValue(processOutput, {
          ok: false,
          command: `obsidian agents ${subcommand}`,
          error: { code: cliError.code, message: cliError.message }
        });
      } else {
        writeCommandError(scope.context, processOutput, cliError);
      }
      process.exitCode = cliError.exitCode;
      throw cliError;
    }
  });
}
async function runSetup(args, scope) {
  const paths = createDataPaths(args);
  const config = await readObsidianAgentsConfig(paths);
  const current = config ? selectObsidianAgentsProfile(config, getStringArg2(args.profile)) : undefined;
  const interactive = scope.context.interactive && !scope.context.json;
  const input = await collectSetupInput(args, current, interactive);
  if (!input) {
    writeSetupResult(scope.context, { status: "cancelled" });
    process.exitCode = 0;
    return;
  }
  const plan = await createObsidianAgentsSetupPlan(paths, input);
  if (!scope.context.json && !scope.context.quiet) {
    writeHumanStatus(scope.context, processOutput, import_picocolors4.default.cyan("Obsidian agents setup"));
    writeHumanStatus(scope.context, processOutput, `profile: ${plan.profile.id}`);
    writeHumanStatus(scope.context, processOutput, `vault: ${plan.profile.vaultPath}`);
    writeHumanStatus(scope.context, processOutput, `source: ${plan.profile.sourcePath}`);
    writeHumanStatus(scope.context, processOutput, `.agents: ${plan.profile.agentsPath}`);
    writeHumanStatus(scope.context, processOutput, "scope: vault-local");
    writeHumanStatus(scope.context, processOutput, "consistency: Obsidian Sync (eventual)");
    for (const action of plan.actions) {
      writeHumanStatus(scope.context, processOutput, `- ${action}`);
    }
  }
  if (plan.requiresConfirmation && args.yes !== true) {
    if (!interactive) {
      throw createCliError("invalid_option", "Setup would change the vault topology. Use --yes in non-interactive mode.");
    }
    const answer = await ce2({
      message: "Apply this Obsidian agents setup?",
      initialValue: false
    });
    if (lD2(answer) || answer !== true) {
      writeSetupResult(scope.context, { status: "cancelled" });
      process.exitCode = 0;
      return;
    }
  }
  const result = await applyObsidianAgentsSetup(paths, plan);
  writeSetupResult(scope.context, { status: "configured", ...result });
  process.exitCode = 0;
}
async function runStatus(args, scope) {
  const result = await inspectObsidianAgentsStatus({
    paths: createDataPaths(args),
    profileId: getStringArg2(args.profile)
  });
  if (scope.context.json) {
    writeJsonValue(processOutput, {
      ok: true,
      command: "obsidian agents status",
      result
    });
  } else {
    writeStatusHuman(scope.context, result);
  }
  process.exitCode = 0;
}
async function collectSetupInput(args, current, interactive) {
  const suppliedProfile = getStringArg2(args.profile);
  const suppliedVault = getStringArg2(args.vault);
  const suppliedSource = getStringArg2(args.sourcePath);
  if (!interactive) {
    const vaultPath2 = suppliedVault ?? current?.vaultPath;
    if (!vaultPath2) {
      throw createCliError("missing_required_argument", "Setup requires --vault in non-interactive mode when no profile exists.");
    }
    return {
      id: suppliedProfile ?? current?.id ?? "obsidian-main",
      vaultPath: vaultPath2,
      sourcePath: suppliedSource ?? current?.sourcePath ?? join17(vaultPath2, "Agents")
    };
  }
  if (current) {
    const choice = await le2({
      message: `Existing profile "${current.id}" found.`,
      options: [
        { value: "keep", label: "Keep current configuration" },
        { value: "edit", label: "Edit configuration" }
      ],
      initialValue: "keep"
    });
    if (lD2(choice))
      return;
    if (choice === "keep" && !suppliedVault && !suppliedSource && !suppliedProfile) {
      return current;
    }
  }
  const id = suppliedProfile ?? current?.id ?? await promptString("Profile id", "obsidian-main", (value) => /^[a-z0-9][a-z0-9_-]*$/u.test(value.trim()) ? undefined : "Use lowercase letters, numbers, hyphens, or underscores.");
  if (!id)
    return;
  const vaultPath = suppliedVault ?? await promptString("Obsidian vault path", current?.vaultPath, (value) => value.trim() ? undefined : "A vault path is required.");
  if (!vaultPath)
    return;
  const sourcePath = suppliedSource ?? await promptString("Visible Agents source path", current?.sourcePath ?? join17(vaultPath, "Agents"), (value) => value.trim() ? undefined : "A source path is required.");
  if (!sourcePath)
    return;
  return { id, vaultPath, sourcePath };
}
async function promptString(message, initialValue, validate2) {
  const answer = await ae({ message, initialValue, validate: validate2 });
  return lD2(answer) ? undefined : answer.trim();
}
function writeSetupResult(context, result) {
  if (context.json) {
    writeJsonValue(processOutput, {
      ok: true,
      command: "obsidian agents setup",
      result
    });
    return;
  }
  if (result.status === "cancelled") {
    writeHumanStatus(context, processOutput, "Setup cancelled.");
    return;
  }
  writeHumanStatus(context, processOutput, import_picocolors4.default.green("Obsidian agents configured."));
  const profile = result.profile;
  if (profile) {
    writeHumanStatus(context, processOutput, `source: ${profile.sourcePath}`);
    writeHumanStatus(context, processOutput, `.agents: ${profile.agentsPath}`);
  }
}
function writeStatusHuman(context, result) {
  writeHumanStatus(context, processOutput, import_picocolors4.default.cyan("Obsidian agents status"));
  if (!result.configured) {
    writeHumanStatus(context, processOutput, "configuration: missing");
    writeHumanStatus(context, processOutput, "run: chc obsidian agents setup");
    return;
  }
  writeHumanStatus(context, processOutput, `profile: ${result.profile?.id ?? "unknown"}`);
  writeHumanStatus(context, processOutput, `vault: ${check(result.paths.vaultExists)} ${result.profile?.vaultPath ?? ""}`);
  writeHumanStatus(context, processOutput, `source: ${check(result.paths.sourceExists && result.paths.sourceInsideVault)} ${result.profile?.sourcePath ?? ""}`);
  writeHumanStatus(context, processOutput, `.agents: ${check(result.link.status === "correct")} ${result.link.status}`);
  writeHumanStatus(context, processOutput, `link type: ${result.link.type ?? "none"}`);
  writeHumanStatus(context, processOutput, `resolved target: ${result.link.resolvedTarget ?? "unavailable"}`);
  writeHumanStatus(context, processOutput, `skills: ${check(result.paths.skillsExists)}; state: ${check(result.paths.stateExists)}`);
  writeHumanStatus(context, processOutput, `legacy Git metadata: ${result.legacy.gitMetadata ? "present" : "absent"}`);
  writeHumanStatus(context, processOutput, `consistency: ${result.consistency.provider} (${result.consistency.model})`);
  for (const warning of result.warnings) {
    writeHumanStatus(context, processOutput, `warning: ${warning}`);
  }
}
function check(value) {
  return value ? import_picocolors4.default.green("OK") : import_picocolors4.default.red("FAIL");
}
function toObsidianCliError(error) {
  if (error instanceof ObsidianAgentsServiceError) {
    return createCliError(mapServiceError(error.code), error.message, error.exitCode);
  }
  if (error instanceof ObsidianAgentsConfigError) {
    return createCliError("obsidian_agents_invalid_configuration", error.message);
  }
  if (error instanceof Error && "code" in error && "exitCode" in error) {
    return error;
  }
  return createCliError("obsidian_agents_link_failed", error instanceof Error ? error.message : String(error));
}
function mapServiceError(code) {
  switch (code) {
    case "not_configured":
      return "obsidian_agents_not_configured";
    case "invalid_configuration":
      return "obsidian_agents_invalid_configuration";
    case "setup_required":
      return "obsidian_agents_setup_required";
    case "conflict":
      return "obsidian_agents_conflict";
    case "filesystem_failed":
      return "obsidian_agents_link_failed";
  }
}
var obsidianCommand = defineCommand({
  meta: {
    name: "obsidian",
    description: "Manage Obsidian-synchronized vault Skills and state."
  },
  subCommands: {
    agents: defineCommand({
      meta: {
        name: "agents",
        description: "Manage the vault Agents source and .agents link."
      },
      subCommands: {
        setup: defineCommand({
          meta: {
            name: "setup",
            description: "Configure or repair the vault-local .agents link."
          },
          args: commonArgs2,
          async run({ args }) {
            const typedArgs = args;
            await runObservedObsidianSubcommand("setup", typedArgs, async (scope) => {
              await runSetup(typedArgs, scope);
            });
          }
        }),
        status: defineCommand({
          meta: {
            name: "status",
            description: "Show local Agents source and .agents link health."
          },
          args: commonArgs2,
          async run({ args }) {
            const typedArgs = args;
            await runObservedObsidianSubcommand("status", typedArgs, async (scope) => {
              await runStatus(typedArgs, scope);
            });
          }
        })
      }
    })
  }
});

// src/command/opencode.command.ts
var import_picocolors5 = __toESM(require_picocolors(), 1);

// src/domain/opencode-config-manager.ts
import { mkdir as mkdir11, readFile as readFile13, rename as rename6, rm as rm7, writeFile as writeFile8 } from "node:fs/promises";
import { dirname as dirname11, isAbsolute as isAbsolute5, resolve as resolve10 } from "node:path";
async function syncOpenCodeSkillPaths(input) {
  const plugins = [];
  const paths = [];
  for (const plugin of input.plugins) {
    const pluginPaths = await readPluginSkillPaths(plugin);
    if (pluginPaths.length === 0) {
      continue;
    }
    plugins.push({ name: plugin.name, paths: pluginPaths });
    paths.push(...pluginPaths);
  }
  const config = await readOpenCodeConfig(input.configPath);
  const currentSkills = readOptionalRecord(config.skills, "skills");
  const currentPaths = readOptionalStringArray(currentSkills?.paths, "skills.paths");
  const nextPaths = uniqueStrings([...currentPaths, ...paths]);
  const changed = !sameStringArray(currentPaths, nextPaths);
  if (changed) {
    config.skills = { ...currentSkills ?? {}, paths: nextPaths };
    await writeOpenCodeConfig(input.configPath, config);
  }
  return {
    configPath: input.configPath,
    paths: nextPaths,
    plugins,
    changed
  };
}
async function syncOpenCodeMcpServers(input) {
  const servers = new Map;
  for (const plugin of input.plugins) {
    const pluginServers = await readPluginMcpServers(plugin);
    for (const [name, value] of Object.entries(pluginServers)) {
      const previous = servers.get(name);
      if (previous && JSON.stringify(previous.value) !== JSON.stringify(value)) {
        throw new Error(`MCP server name collision for "${name}" between ${previous.plugin} and ${plugin.name}.`);
      }
      servers.set(name, { plugin: plugin.name, value });
    }
  }
  const config = await readOpenCodeConfig(input.configPath);
  const currentMcp = readOptionalRecord(config.mcp, "mcp");
  const nextMcp = { ...currentMcp ?? {} };
  let changed = false;
  const resultServers = [];
  for (const [name, entry] of servers) {
    resultServers.push({ name, plugin: entry.plugin });
    if (JSON.stringify(nextMcp[name]) !== JSON.stringify(entry.value)) {
      nextMcp[name] = entry.value;
      changed = true;
    }
  }
  if (changed) {
    config.mcp = nextMcp;
    await writeOpenCodeConfig(input.configPath, config);
  }
  return {
    configPath: input.configPath,
    servers: resultServers,
    changed
  };
}
async function readOpenCodeConfig(configPath) {
  let raw;
  try {
    raw = await readFile13(configPath, "utf8");
  } catch (error) {
    if (isMissingFileError6(error)) {
      return {};
    }
    throw error;
  }
  try {
    const value = JSON.parse(parseJsonc(raw));
    if (!isRecord6(value)) {
      throw new Error("expected a JSON object");
    }
    return value;
  } catch (error) {
    throw new Error(`Invalid OpenCode config JSON: ${configPath}`, {
      cause: error
    });
  }
}
async function writeOpenCodeConfig(configPath, config) {
  const path = resolve10(configPath);
  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  await mkdir11(dirname11(path), { recursive: true });
  try {
    await writeFile8(temporaryPath, `${JSON.stringify(config, null, 2)}
`, "utf8");
    await rename6(temporaryPath, path);
  } finally {
    await rm7(temporaryPath, { force: true });
  }
}
async function readPluginSkillPaths(plugin) {
  const manifest = await readPluginJson(plugin);
  const declared = manifest.skills;
  const candidates = typeof declared === "string" ? [declared] : Array.isArray(declared) ? declared.filter((value) => typeof value === "string") : [];
  return candidates.map((candidate) => {
    const path = resolve10(plugin.root, candidate);
    assertPathInside(plugin.root, path);
    return path;
  });
}
async function readPluginMcpServers(plugin) {
  const path = resolve10(plugin.root, ".mcp.json");
  let parsed;
  try {
    parsed = JSON.parse(await readFile13(path, "utf8"));
  } catch (error) {
    if (isMissingFileError6(error)) {
      return {};
    }
    throw new Error(`Invalid plugin MCP config JSON: ${path}`, {
      cause: error
    });
  }
  if (!isRecord6(parsed) || parsed.mcpServers === undefined) {
    return {};
  }
  const sourceServers = readRecord(parsed.mcpServers, "mcpServers");
  return Object.fromEntries(Object.entries(sourceServers).map(([name, value]) => [
    name,
    renderOpenCodeMcpServer(plugin, name, readRecord(value, `mcpServers.${name}`))
  ]));
}
function renderOpenCodeMcpServer(plugin, name, source) {
  if (typeof source.url === "string" && source.url.trim().length > 0) {
    return {
      type: "remote",
      url: source.url,
      ...isRecord6(source.headers) ? { headers: source.headers } : {},
      enabled: source.enabled !== false
    };
  }
  const command = readCommand(source.command, name).map((entry) => entry.replaceAll("<PLUGIN_ROOT>", plugin.root));
  const args = (source.args === undefined ? [] : readStringArray(source.args, `mcpServers.${name}.args`)).map((entry) => entry.replaceAll("<PLUGIN_ROOT>", plugin.root));
  const environment = readEnvironment(source.env, name);
  const cwd = resolveMcpCwd(plugin, source.cwd);
  const timeout = readTimeout(source.tool_timeout_sec, name);
  return {
    type: "local",
    command: [...command, ...args],
    ...environment ? { environment } : {},
    ...cwd ? { cwd } : {},
    ...timeout ? { timeout } : {},
    enabled: source.enabled !== false
  };
}
function readCommand(value, name) {
  if (typeof value === "string" && value.trim().length > 0) {
    return [value];
  }
  if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) {
    if (value.length > 0) {
      return value;
    }
  }
  throw new Error(`MCP server ${name} must declare a command or URL.`);
}
function readEnvironment(value, name) {
  if (value === undefined) {
    return;
  }
  const source = readRecord(value, `mcpServers.${name}.env`);
  return Object.fromEntries(Object.entries(source).map(([key, entry]) => {
    if (typeof entry !== "string" && typeof entry !== "number" && typeof entry !== "boolean") {
      throw new Error(`MCP environment value must be scalar: mcpServers.${name}.env.${key}`);
    }
    return [key, String(entry)];
  }));
}
function readTimeout(value, name) {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid MCP timeout for ${name}.`);
  }
  return Math.round(value * 1000);
}
function resolveMcpCwd(plugin, value) {
  if (value === undefined) {
    return plugin.root;
  }
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid MCP cwd for ${plugin.name}.`);
  }
  const replaced = value.replaceAll("<PLUGIN_ROOT>", plugin.root);
  return isAbsolute5(replaced) ? resolve10(replaced) : resolve10(plugin.root, replaced);
}
async function readPluginJson(plugin) {
  const path = resolve10(plugin.root, ".codex-plugin", "plugin.json");
  try {
    const value = JSON.parse(await readFile13(path, "utf8"));
    if (!isRecord6(value)) {
      throw new Error("expected a JSON object");
    }
    return value;
  } catch (error) {
    throw new Error(`Invalid plugin manifest JSON: ${path}`, { cause: error });
  }
}
function readOptionalRecord(value, label) {
  if (value === undefined) {
    return;
  }
  return readRecord(value, label);
}
function readRecord(value, label) {
  if (!isRecord6(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}
function readOptionalStringArray(value, label) {
  if (value === undefined) {
    return [];
  }
  return readStringArray(value, label);
}
function readStringArray(value, label) {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    throw new Error(`${label} must be an array of strings.`);
  }
  return [...value];
}
function uniqueStrings(values) {
  return [...new Set(values)];
}
function sameStringArray(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
function parseJsonc(value) {
  const withoutComments = stripJsonComments(value);
  return stripTrailingCommas(withoutComments);
}
function stripJsonComments(value) {
  let output = "";
  let inString = false;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = 0;index < value.length; index += 1) {
    const current = value[index] ?? "";
    const next = value[index + 1] ?? "";
    if (lineComment) {
      if (current === `
` || current === "\r") {
        lineComment = false;
        output += current;
      } else {
        output += " ";
      }
      continue;
    }
    if (blockComment) {
      if (current === "*" && next === "/") {
        blockComment = false;
        output += "  ";
        index += 1;
      } else {
        output += current === `
` || current === "\r" ? current : " ";
      }
      continue;
    }
    if (inString) {
      output += current;
      if (escaped) {
        escaped = false;
      } else if (current === "\\") {
        escaped = true;
      } else if (current === '"') {
        inString = false;
      }
      continue;
    }
    if (current === '"') {
      inString = true;
      output += current;
    } else if (current === "/" && next === "/") {
      lineComment = true;
      output += "  ";
      index += 1;
    } else if (current === "/" && next === "*") {
      blockComment = true;
      output += "  ";
      index += 1;
    } else {
      output += current;
    }
  }
  return output;
}
function stripTrailingCommas(value) {
  let output = "";
  let inString = false;
  let escaped = false;
  for (let index = 0;index < value.length; index += 1) {
    const current = value[index] ?? "";
    if (inString) {
      output += current;
      if (escaped) {
        escaped = false;
      } else if (current === "\\") {
        escaped = true;
      } else if (current === '"') {
        inString = false;
      }
      continue;
    }
    if (current === '"') {
      inString = true;
      output += current;
      continue;
    }
    if (current === ",") {
      let lookahead = index + 1;
      while (/\s/u.test(value[lookahead] ?? "")) {
        lookahead += 1;
      }
      if (value[lookahead] === "}" || value[lookahead] === "]") {
        continue;
      }
    }
    output += current;
  }
  return output;
}
function isRecord6(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isMissingFileError6(error) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

// src/command/opencode.command.ts
var commonArgs3 = {
  ...cliContractArgs,
  repoRoot: { type: "string", description: "Override the repository root" },
  home: { type: "string", description: "Override the home directory" },
  pluginsRoot: {
    type: "string",
    description: "Override the repository-managed codex/plugins directory"
  },
  openCodeHome: {
    type: "string",
    description: "Override the OpenCode configuration directory"
  },
  openCodeConfig: {
    type: "string",
    description: "Override the OpenCode JSON or JSONC config path"
  }
};
function getStringArg3(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
function createPaths2(args) {
  return createCodexConfigPaths({
    repoRoot: getStringArg3(args.repoRoot),
    homeRoot: getStringArg3(args.home),
    pluginsRoot: getStringArg3(args.pluginsRoot),
    openCodeHome: getStringArg3(args.openCodeHome),
    openCodeConfig: getStringArg3(args.openCodeConfig)
  });
}
async function runObservedOpenCodeSubcommand(subcommand, args, run) {
  await runObservedCliCommand(args, { command: "opencode", subcommand }, run);
}
async function runSkills2(args, scope) {
  const paths = createPaths2(args);
  const plugins = await discoverEnabledRepositoryCodexPlugins(paths);
  const result = await syncOpenCodeSkillPaths({
    configPath: paths.openCodeConfigPath,
    plugins
  });
  if (scope.context.json) {
    writeJsonValue(processOutput, {
      ok: true,
      command: "opencode skills",
      result
    });
  } else {
    writeHumanStatus(scope.context, processOutput, import_picocolors5.default.cyan("OpenCode skills"));
    writeHumanStatus(scope.context, processOutput, `${result.changed ? "updated" : "unchanged"} ${result.configPath}`);
    for (const plugin of result.plugins) {
      writeHumanStatus(scope.context, processOutput, `${plugin.name}: ${plugin.paths.join(", ")}`);
    }
    if (result.plugins.length === 0) {
      writeHumanStatus(scope.context, processOutput, import_picocolors5.default.dim("(no plugin skills)"));
    }
  }
  process.exitCode = 0;
}
async function runMcp(args, scope) {
  const paths = createPaths2(args);
  const plugins = await discoverEnabledRepositoryCodexPlugins(paths);
  const result = await syncOpenCodeMcpServers({
    configPath: paths.openCodeConfigPath,
    plugins
  });
  if (scope.context.json) {
    writeJsonValue(processOutput, {
      ok: true,
      command: "opencode mcp",
      result
    });
  } else {
    writeHumanStatus(scope.context, processOutput, import_picocolors5.default.cyan("OpenCode MCP"));
    writeHumanStatus(scope.context, processOutput, `${result.changed ? "updated" : "unchanged"} ${result.configPath}`);
    for (const server of result.servers) {
      writeHumanStatus(scope.context, processOutput, `${server.name} <- ${server.plugin}`);
    }
    if (result.servers.length === 0) {
      writeHumanStatus(scope.context, processOutput, import_picocolors5.default.dim("(no plugin MCP servers)"));
    }
  }
  process.exitCode = 0;
}
var opencodeCommand = defineCommand({
  meta: {
    name: "opencode",
    description: "Sync shared CthuCodex skills and MCP servers to OpenCode."
  },
  subCommands: {
    skills: defineCommand({
      meta: {
        name: "skills",
        description: "Expose repository plugin skills to OpenCode."
      },
      args: commonArgs3,
      async run({ args }) {
        await runObservedOpenCodeSubcommand("skills", args, async (scope) => {
          await runSkills2(args, scope);
        });
      }
    }),
    mcp: defineCommand({
      meta: {
        name: "mcp",
        description: "Sync repository plugin MCP servers to OpenCode."
      },
      args: commonArgs3,
      async run({ args }) {
        await runObservedOpenCodeSubcommand("mcp", args, async (scope) => {
          await runMcp(args, scope);
        });
      }
    })
  }
});

// src/command/run-scripts.command.ts
var import_picocolors7 = __toESM(require_picocolors(), 1);

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
    return value instanceof P5 ? value : new P5(function(resolve11) {
      resolve11(value);
    });
  }
  return new (P5 || (P5 = Promise))(function(resolve11, reject) {
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
      result.done ? resolve11(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __values(o3) {
  var s2 = typeof Symbol === "function" && Symbol.iterator, m3 = s2 && o3[s2], i3 = 0;
  if (m3)
    return m3.call(o3);
  if (o3 && typeof o3.length === "number")
    return {
      next: function() {
        if (o3 && i3 >= o3.length)
          o3 = undefined;
        return { value: o3 && o3[i3++], done: !o3 };
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
  var g4 = generator.apply(thisArg, _arguments || []), i3, q3 = [];
  return i3 = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i3[Symbol.asyncIterator] = function() {
    return this;
  }, i3;
  function awaitReturn(f4) {
    return function(v3) {
      return Promise.resolve(v3).then(f4, reject);
    };
  }
  function verb(n2, f4) {
    if (g4[n2]) {
      i3[n2] = function(v3) {
        return new Promise(function(a4, b5) {
          q3.push([n2, v3, a4, b5]) > 1 || resume(n2, v3);
        });
      };
      if (f4)
        i3[n2] = f4(i3[n2]);
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
  var i3, p;
  return i3 = {}, verb("next"), verb("throw", function(e3) {
    throw e3;
  }), verb("return"), i3[Symbol.iterator] = function() {
    return this;
  }, i3;
  function verb(n2, f4) {
    i3[n2] = o3[n2] ? function(v3) {
      return (p = !p) ? { value: __await(o3[n2](v3)), done: false } : f4 ? f4(v3) : v3;
    } : f4;
  }
}
function __asyncValues(o3) {
  if (!Symbol.asyncIterator)
    throw new TypeError("Symbol.asyncIterator is not defined.");
  var m3 = o3[Symbol.asyncIterator], i3;
  return m3 ? m3.call(o3) : (o3 = typeof __values === "function" ? __values(o3) : o3[Symbol.iterator](), i3 = {}, verb("next"), verb("throw"), verb("return"), i3[Symbol.asyncIterator] = function() {
    return this;
  }, i3);
  function verb(n2) {
    i3[n2] = o3[n2] && function(v3) {
      return new Promise(function(resolve11, reject) {
        v3 = o3[n2](v3), settle(resolve11, reject, v3.done, v3.value);
      });
    };
  }
  function settle(resolve11, reject, d3, v3) {
    Promise.resolve(v3).then(function(v4) {
      resolve11({ value: v4, done: d3 });
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
    return __asyncGenerator(this, arguments, function* _a2() {
      const result = yield __await(this._promise);
      if (result.isErr()) {
        yield yield __await(errAsync(result.error));
      }
      return yield __await(result.value);
    });
  }
}
function errAsync(err2) {
  return new ResultAsync(Promise.resolve(new Err(err2)));
}
var fromPromise = ResultAsync.fromPromise;
var fromSafePromise = ResultAsync.fromSafePromise;
var fromAsyncThrowable = ResultAsync.fromThrowable;
var combineResultList = (resultList) => {
  let acc = ok([]);
  for (const result of resultList) {
    if (result.isErr()) {
      acc = err2(result.error);
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
      acc = err2([result.error]);
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
        return err2(errorFn ? errorFn(e3) : e3);
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
function err2(err3) {
  return new Err(err3);
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
    return err2(this.error);
  }
  mapErr(f4) {
    return err2(f4(this.error));
  }
  andThrough(_f) {
    return err2(this.error);
  }
  andTee(_f) {
    return err2(this.error);
  }
  orTee(f4) {
    try {
      f4(this.error);
    } catch (e3) {}
    return err2(this.error);
  }
  andThen(_f) {
    return err2(this.error);
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
  match(_ok, err3) {
    return err3(this.error);
  }
  safeUnwrap() {
    const error = this.error;
    return function* () {
      yield err2(error);
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
var $err = err2;
var $errAsync = errAsync;
var $ok = ok;

// src/domain/script-catalog.ts
var ENTRY_FILE = "index.ts";
var PACKAGED_ENTRY_FILE = "index.js";
var ENTRY_FILES = [PACKAGED_ENTRY_FILE, ENTRY_FILE];
var listSelectable = (catalog) => [...catalog.packages].sort((a4, b5) => a4.id.localeCompare(b5.id)).map((p) => ({
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
import { join as join18 } from "node:path";
import { pathToFileURL } from "node:url";
function runBundledScript(pkg, args, context) {
  const entryPath = join18(pkg.rootPath, pkg.entryRelative);
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
var import_picocolors6 = __toESM(require_picocolors(), 1);

// src/infra/bundled-scripts-root.ts
import { existsSync as existsSync3 } from "node:fs";
import { dirname as dirname12, join as join19 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
function getBundledScriptsRoot() {
  const moduleDir = dirname12(fileURLToPath2(import.meta.url));
  const candidates = [
    join19(moduleDir, "scripts"),
    join19(moduleDir, "../scripts"),
    join19(moduleDir, "../src/scripts")
  ];
  return candidates.find((candidate) => existsSync3(candidate)) ?? candidates[0];
}

// src/infra/discover-scripts.ts
import { readdir as readdir5, readFile as readFile14, stat as stat6 } from "node:fs/promises";
import { join as join20 } from "node:path";

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
    const message = result.issues.map((i3) => i3.message).join("; ");
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
    entries = await readdir5(scriptsRoot, { withFileTypes: true });
  } catch (e3) {
    const msg = e3 instanceof Error ? e3.message : String(e3);
    throw new Error(`cannot read bundled scripts directory (${scriptsRoot}): ${msg}`);
  }
  const names = entries.filter((e3) => e3.isDirectory()).map((e3) => e3.name).sort((a4, b5) => a4.localeCompare(b5));
  for (const name of names) {
    const dirPath = join20(scriptsRoot, name);
    const dirIdResult = validateScriptId(name);
    if (dirIdResult.isErr()) {
      pushWarning(warnings, dirPath, `skip non-kebab-case script folder: ${dirIdResult.error.message}`);
      continue;
    }
    const manifestPath = join20(dirPath, MANIFEST_FILE);
    let entryRelative;
    let entryStat;
    for (const candidate of ENTRY_FILES) {
      try {
        const candidateStat = await stat6(join20(dirPath, candidate));
        if (candidateStat.isFile()) {
          entryRelative = candidate;
          entryStat = candidateStat;
          break;
        }
      } catch {}
    }
    let manifestStat;
    try {
      manifestStat = await stat6(manifestPath);
    } catch {
      pushWarning(warnings, dirPath, `missing ${MANIFEST_FILE} or ${ENTRY_FILES.join("/")} under script package`);
      continue;
    }
    if (!manifestStat.isFile() || !entryRelative || !entryStat?.isFile()) {
      pushWarning(warnings, dirPath, `${MANIFEST_FILE} and one of ${ENTRY_FILES.join("/")} must be files`);
      continue;
    }
    let rawJson;
    try {
      rawJson = await readFile14(manifestPath, "utf8");
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
      entryRelative
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
      lines.push(`  ${import_picocolors6.default.cyan(row.id.padEnd(width + 2))}${detail}`);
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
    pe(import_picocolors7.default.cyan("▶ Script Selection"));
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
    writeWarning(processOutput, import_picocolors7.default.yellow(`${warning.path}: ${warning.message}`));
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
var import_picocolors9 = __toESM(require_picocolors(), 1);

// src/command/self-update-output.ts
var import_picocolors8 = __toESM(require_picocolors(), 1);
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
  const colors2 = import_picocolors8.default.createColors(interactiveOutput);
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
      if (plan.status === "up_to_date" && plan.relinkRequired && plan.target) {
        deps.output.stdout.write(`${colors2.yellow("Global relink required")} · run chc update · ${identity(plan.target)}
`);
      } else if (plan.status === "up_to_date" && plan.target) {
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
function getStringArg4(value) {
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
        const repo = getStringArg4(args.repo);
        const ref = getStringArg4(args.ref);
        const installDir = getStringArg4(args["install-dir"]);
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
              repo: repo ? redactSelfUpdateText(repo) : undefined,
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
          repo: getStringArg4(args.repo),
          ref: getStringArg4(args.ref),
          installDir: getStringArg4(args["install-dir"])
        });
        if (context.json) {
          writeJsonValue(processOutput, {
            ok: true,
            command: "status",
            status
          });
        } else {
          writeHumanStatus(context, processOutput, import_picocolors9.default.cyan("CthuTool status"));
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
    name: "agent",
    command: agentCommand,
    visibility: "public",
    bareBehavior: "help"
  },
  {
    name: "codex",
    command: codexCommand,
    visibility: "public",
    bareBehavior: "help"
  },
  {
    name: "opencode",
    command: opencodeCommand,
    visibility: "public",
    bareBehavior: "help"
  },
  {
    name: "obsidian",
    command: obsidianCommand,
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
      normalized.push(`  ${import_picocolors10.default.bold(import_picocolors10.default.cyan(row.name.padEnd(width + 2)))}${row.description}`);
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
  const hiddenCommands = new Set(getCommandRegistrations(command)?.filter((registration2) => registration2.visibility !== "public").map((registration2) => registration2.name) ?? []);
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
  const registration2 = getCommandRegistration(rootCommand, name);
  return registration2?.bareBehavior === "help" ? registration2.command : undefined;
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
