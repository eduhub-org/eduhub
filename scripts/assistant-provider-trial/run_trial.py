#!/usr/bin/env python3
"""Run the Assistant provider trial (issue #2191) against OpenAI-compatible APIs.

Standard library only. See README.md in this directory.
"""

import argparse
import copy
import csv
import datetime as dt
import json
import os
import re
import statistics
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
MAX_ROUNDS = 4  # model turns per case (tool call -> result -> ... -> answer)
TODAY = "2026-11-22"


# ---------------------------------------------------------------- validation


def validate(value, schema, path="$"):
    """Minimal JSON-schema check (type, required, enum, properties, items,
    additionalProperties). Returns a list of error strings."""
    errors = []
    expected = schema.get("type")
    types = {
        "object": dict,
        "array": list,
        "string": str,
        "boolean": bool,
    }
    if expected == "integer":
        ok = isinstance(value, int) and not isinstance(value, bool)
    elif expected == "number":
        ok = isinstance(value, (int, float)) and not isinstance(value, bool)
    elif expected in types:
        ok = isinstance(value, types[expected])
    else:
        ok = True
    if not ok:
        return [f"{path}: expected {expected}, got {type(value).__name__}"]
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: {value!r} not in {schema['enum']}")
    if expected == "object":
        props = schema.get("properties", {})
        for key in schema.get("required", []):
            if key not in value:
                errors.append(f"{path}: missing required '{key}'")
        for key, sub in value.items():
            if key in props:
                errors += validate(sub, props[key], f"{path}.{key}")
            elif schema.get("additionalProperties") is False:
                errors.append(f"{path}: unknown property '{key}'")
    if expected == "array" and "items" in schema:
        for i, item in enumerate(value):
            errors += validate(item, schema["items"], f"{path}[{i}]")
    return errors


def args_match(actual, expected):
    """Strings: case-insensitive substring. Dicts: every expected key matches.
    Everything else: equality."""
    if isinstance(expected, dict):
        return isinstance(actual, dict) and all(
            k in actual and args_match(actual[k], v) for k, v in expected.items()
        )
    if isinstance(expected, str):
        return isinstance(actual, str) and expected.lower() in actual.lower()
    return actual == expected


# ---------------------------------------------------------------- language


THINK_RE = re.compile(r"<think>.*?</think>", re.S)
FORMAL_RE = re.compile(r"(?<![.!?:\n]\s)(?<!^)\b(Sie|Ihnen|Ihre[mnrs]?|Ihr)\b")
FORMAL_ANY_RE = re.compile(r"\b(Ihnen|Ihre[mnrs]?)\b")
INFORMAL_RE = re.compile(r"\b(du|dich|dir|dein(e[mnrs]?)?|euch|euer)\b", re.I)
DE_WORDS = {"der", "die", "das", "und", "ist", "nicht", "du", "ich", "mit", "für", "auf", "dein", "kurs", "eine", "wird"}
EN_WORDS = {"the", "and", "is", "not", "you", "your", "with", "for", "on", "a", "course", "will", "can", "to"}


def clean_answer(text):
    return THINK_RE.sub("", text or "").strip()


def detect_language(text):
    words = re.findall(r"[a-zäöüß]+", text.lower())
    de = sum(w in DE_WORDS for w in words)
    en = sum(w in EN_WORDS for w in words)
    if de == en:
        return "?"
    return "de" if de > en else "en"


def address_form(text):
    """'du', 'sie', 'mixed' or 'none' for a German answer. Heuristic: a
    capitalized Sie/Ihr mid-sentence or any Ihnen/Ihre counts as formal."""
    formal = bool(FORMAL_RE.search(text) or FORMAL_ANY_RE.search(text))
    informal = bool(INFORMAL_RE.search(text))
    if formal and informal:
        return "mixed"
    if formal:
        return "sie"
    if informal:
        return "du"
    return "none"


# ---------------------------------------------------------------- API


class ApiError(Exception):
    pass


def post_stream(target, body, rate_limit_hits):
    """POST a streaming chat completion; return the assembled message and
    timings. Retries on 429/5xx with backoff."""
    url = target["base_url"].rstrip("/") + "/chat/completions"
    key = os.environ.get(target.get("api_key_env", ""), "")
    data = json.dumps(body).encode()
    headers = {"Content-Type": "application/json", "Accept": "text/event-stream"}
    if key:
        headers["Authorization"] = f"Bearer {key}"

    for attempt in range(4):
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        start = time.monotonic()
        try:
            resp = urllib.request.urlopen(req, timeout=target.get("timeout", 120))
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:300]
            if e.code == 429 or e.code >= 500:
                if e.code == 429:
                    rate_limit_hits.append(1)
                time.sleep(2 ** attempt * 2)
                continue
            raise ApiError(f"HTTP {e.code}: {detail}")
        except urllib.error.URLError as e:
            raise ApiError(f"connection: {e.reason}")
        return read_stream(resp, start)
    raise ApiError("gave up after repeated 429/5xx")


def read_stream(resp, start):
    content, reasoning = [], []
    calls = {}
    usage = None
    first_token = first_content = None
    chunks = 0
    with resp:
        for raw in resp:
            line = raw.decode("utf-8", errors="replace").strip()
            if not line.startswith("data:"):
                continue
            payload = line[5:].strip()
            if payload == "[DONE]":
                break
            chunk = json.loads(payload)
            if chunk.get("usage"):
                usage = chunk["usage"]
            for choice in chunk.get("choices", []):
                delta = choice.get("delta") or {}
                now = time.monotonic() - start
                got = False
                if delta.get("content"):
                    content.append(delta["content"])
                    first_content = first_content or now
                    got = True
                for k in ("reasoning_content", "reasoning"):
                    if delta.get(k):
                        reasoning.append(delta[k])
                        got = True
                for tc in delta.get("tool_calls") or []:
                    slot = calls.setdefault(tc.get("index", 0), {"id": None, "name": "", "arguments": ""})
                    slot["id"] = tc.get("id") or slot["id"]
                    fn = tc.get("function") or {}
                    slot["name"] += fn.get("name") or ""
                    slot["arguments"] += fn.get("arguments") or ""
                    first_content = first_content or now
                    got = True
                if got:
                    chunks += 1
                    first_token = first_token or now
    return {
        "content": "".join(content),
        "reasoning": "".join(reasoning),
        "tool_calls": [calls[i] for i in sorted(calls)],
        "usage": usage,
        "ttft": first_token,
        "ttfc": first_content,
        "total": time.monotonic() - start,
        "chunks": chunks,
    }


def list_models(target):
    url = target["base_url"].rstrip("/") + "/models"
    req = urllib.request.Request(url)
    key = os.environ.get(target.get("api_key_env", ""), "")
    if key:
        req.add_header("Authorization", f"Bearer {key}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return [m["id"] for m in json.load(resp).get("data", [])]


# ---------------------------------------------------------------- one case


def run_case(target, case, tools, system_prompt):
    role = case["role"]
    offered = [t for t in tools if role in t["roles"]]
    schemas = {t["definition"]["name"]: t["definition"]["parameters"] for t in offered}
    mocks = {t["definition"]["name"]: t["mock_result"] for t in offered}
    mocks.update(case.get("mock", {}))

    page = json.dumps(case.get("page", {}), ensure_ascii=False)
    system = system_prompt.format(today=TODAY, page=page, role=role)
    messages = [{"role": "system", "content": system}] + copy.deepcopy(case["messages"])
    tool_defs = [{"type": "function", "function": t["definition"]} for t in offered]

    rec = {
        "case": case["id"], "lang": case["lang"], "category": case["category"],
        "rounds": 0, "calls": [], "invalid_calls": [], "retry_used": False,
        "leaked_tool_markup": False, "prompt_tokens": 0, "completion_tokens": 0,
        "usage_reported": True, "ttft": None, "ttfc": None, "total": 0.0,
        "chunks": 0, "answer": "", "error": None, "rate_limit_hits": 0,
    }
    hits = []
    try:
        for _ in range(MAX_ROUNDS):
            body = {
                "model": target["model"],
                "messages": messages,
                "tools": tool_defs,
                "tool_choice": "auto",
                "temperature": target.get("temperature", 0.2),
                "stream": True,
                "stream_options": {"include_usage": True},
                **target.get("extra_body", {}),
            }
            out = post_stream(target, body, hits)
            rec["rounds"] += 1
            rec["total"] += out["total"]
            rec["chunks"] += out["chunks"]
            if rec["ttft"] is None:
                rec["ttft"], rec["ttfc"] = out["ttft"], out["ttfc"]
            if out["usage"]:
                rec["prompt_tokens"] += out["usage"].get("prompt_tokens", 0)
                rec["completion_tokens"] += out["usage"].get("completion_tokens", 0)
            else:
                rec["usage_reported"] = False
            if "<tool_call>" in out["content"]:
                rec["leaked_tool_markup"] = True

            if not out["tool_calls"]:
                rec["answer"] = clean_answer(out["content"])
                break

            messages.append({
                "role": "assistant",
                "content": out["content"] or None,
                "tool_calls": [
                    {"id": c["id"] or f"call_{i}", "type": "function",
                     "function": {"name": c["name"], "arguments": c["arguments"]}}
                    for i, c in enumerate(out["tool_calls"])
                ],
            })
            for i, c in enumerate(out["tool_calls"]):
                call_id = c["id"] or f"call_{i}"
                problems = []
                args = None
                if c["name"] not in schemas:
                    problems.append(f"unknown tool '{c['name']}'")
                else:
                    try:
                        args = json.loads(c["arguments"] or "{}")
                        problems = validate(args, schemas[c["name"]])
                    except json.JSONDecodeError as e:
                        problems.append(f"arguments are not valid JSON: {e}")
                if problems:
                    rec["invalid_calls"].append({"name": c["name"], "arguments": c["arguments"], "problems": problems})
                    if rec["retry_used"]:
                        raise ApiError("tool call invalid after retry")
                    rec["retry_used"] = True
                    result = {"error": "INVALID_ARGUMENTS", "problems": problems,
                              "hint": "Call the tool again with arguments that match its schema."}
                else:
                    rec["calls"].append({"name": c["name"], "args": args})
                    result = mocks.get(c["name"], {})
                messages.append({"role": "tool", "tool_call_id": call_id,
                                 "content": json.dumps(result, ensure_ascii=False)})
        else:
            rec["error"] = f"no final answer after {MAX_ROUNDS} rounds"
    except ApiError as e:
        rec["error"] = str(e)
    rec["rate_limit_hits"] = len(hits)
    score(rec, case)
    return rec


def score(rec, case):
    exp = case["expect"]
    names = [c["name"] for c in rec["calls"]]
    forbidden = set(case.get("forbid", []))
    if exp["tool"] is None:
        allowed = set(exp.get("allow", []))
        forbidden |= {n for n in names if n not in allowed}
        tool_ok = True
    else:
        tool_ok = any(
            c["name"] == exp["tool"] and args_match(c["args"], exp.get("args", {}))
            for c in rec["calls"]
        )
    ok = tool_ok and not (forbidden & set(names)) and not rec["error"] and not rec["leaked_tool_markup"]
    rec["ok_with_retry"] = ok
    rec["ok_first_try"] = ok and not rec["retry_used"]
    rec["answer_lang"] = detect_language(rec["answer"]) if rec["answer"] else None
    rec["address"] = address_form(rec["answer"]) if rec["lang"] == "de" and rec["answer"] else None


# ---------------------------------------------------------------- reports


def pct(xs):
    return f"{100 * sum(xs) / len(xs):.0f}%" if xs else "–"


def quantile(xs, q):
    xs = sorted(x for x in xs if x is not None)
    if not xs:
        return None
    return xs[min(len(xs) - 1, int(round(q * (len(xs) - 1))))]


def fmt_s(x):
    return "–" if x is None else f"{x:.2f}s"


def summarize(target, recs):
    price = target.get("price_eur_per_mtok") or {}
    pin, pout = price.get("input"), price.get("output")
    costs = None
    if pin is not None and pout is not None:
        costs = [(r["prompt_tokens"] * pin + r["completion_tokens"] * pout) / 1e6 for r in recs]
    de = [r for r in recs if r["lang"] == "de" and r["address"]]
    answered = [r for r in recs if r["answer"]]
    return {
        "target": target["name"],
        "model": target["model"],
        "cases": len(recs),
        "tool_ok_first": pct([r["ok_first_try"] for r in recs]),
        "tool_ok_retry": pct([r["ok_with_retry"] for r in recs]),
        "invalid_calls": sum(len(r["invalid_calls"]) for r in recs),
        "leaked_markup": sum(r["leaked_tool_markup"] for r in recs),
        "errors": sum(bool(r["error"]) for r in recs),
        "rate_limited": sum(r["rate_limit_hits"] for r in recs),
        "du": pct([r["address"] == "du" for r in de]),
        "sie_or_mixed": sum(r["address"] in ("sie", "mixed") for r in de),
        "lang_match": pct([r["answer_lang"] == r["lang"] for r in answered]),
        "ttft_p50": fmt_s(quantile([r["ttft"] for r in recs], 0.5)),
        "ttft_p95": fmt_s(quantile([r["ttft"] for r in recs], 0.95)),
        "total_p50": fmt_s(quantile([r["total"] for r in recs], 0.5)),
        "tokens_avg": round(statistics.mean(r["prompt_tokens"] + r["completion_tokens"] for r in recs)) if recs else 0,
        "usage_missing": sum(not r["usage_reported"] for r in recs),
        "cost_avg_eur": "–" if costs is None else f"{statistics.mean(costs):.5f}",
    }


COLUMNS = [
    ("target", "Target"), ("model", "Model"), ("cases", "Runs"),
    ("tool_ok_first", "Tools OK (1st try)"), ("tool_ok_retry", "Tools OK (with retry)"),
    ("invalid_calls", "Invalid calls"), ("leaked_markup", "Tool markup in text"),
    ("errors", "Errors"), ("rate_limited", "429s"),
    ("du", "German \"du\""), ("sie_or_mixed", "\"Sie\"/mixed"), ("lang_match", "Language match"),
    ("ttft_p50", "TTFT p50"), ("ttft_p95", "TTFT p95"), ("total_p50", "Total p50"),
    ("tokens_avg", "Tokens/conv."), ("usage_missing", "Usage missing"), ("cost_avg_eur", "€/conv."),
]


def write_reports(outdir, summaries, all_recs, cases):
    lines = [f"# Assistant provider trial — {dt.datetime.now():%Y-%m-%d %H:%M}", ""]
    lines.append("| " + " | ".join(h for _, h in COLUMNS) + " |")
    lines.append("|" + "---|" * len(COLUMNS))
    for s in summaries:
        lines.append("| " + " | ".join(str(s[k]) for k, _ in COLUMNS) + " |")
    lines += ["", "## Failed cases", ""]
    for r in all_recs:
        if not r["ok_with_retry"] or r["address"] in ("sie", "mixed"):
            why = r["error"] or ("used \"Sie\"" if r["ok_with_retry"] else "wrong or missing tool")
            called = ", ".join(c["name"] for c in r["calls"]) or "none"
            lines.append(f"- `{r['target']}` `{r['case']}` (run {r['run']}): {why}; called: {called}")
    lines += ["", "Answer quality is rated by hand in `answers.csv` (column `rating`, 1–5).", ""]
    (outdir / "summary.md").write_text("\n".join(lines))

    questions = {c["id"]: c["messages"][-1]["content"] for c in cases}
    with open(outdir / "answers.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["case", "run", "target", "lang", "question", "tools", "address", "answer", "rating", "note"])
        for r in sorted(all_recs, key=lambda r: (r["case"], r["run"], r["target"])):
            w.writerow([r["case"], r["run"], r["target"], r["lang"], questions[r["case"]],
                        " ".join(c["name"] for c in r["calls"]), r["address"] or "",
                        r["answer"] or r["error"] or "", "", ""])


# ---------------------------------------------------------------- main


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--config", default=HERE / "providers.json", type=Path)
    ap.add_argument("--cases", default=HERE / "cases.json", type=Path)
    ap.add_argument("--targets", help="comma-separated target names (default: all)")
    ap.add_argument("--only", help="comma-separated case ids")
    ap.add_argument("--repeat", type=int, default=1, help="runs per case, to see variance")
    ap.add_argument("--out", type=Path, default=HERE / "results")
    ap.add_argument("--list-models", action="store_true", help="print each target's model ids and exit")
    a = ap.parse_args()

    config = json.loads(a.config.read_text())
    targets = config["targets"]
    if a.targets:
        wanted = set(a.targets.split(","))
        targets = [t for t in targets if t["name"] in wanted]
    if a.list_models:
        for t in targets:
            try:
                print(t["name"], *list_models(t), sep="\n  ")
            except Exception as e:  # noqa: BLE001 - report and continue
                print(t["name"], f"  error: {e}", sep="\n")
        return

    tools = json.loads((HERE / "tools.json").read_text())["tools"]
    system_prompt = (HERE / "system_prompt.md").read_text()
    cases = json.loads(a.cases.read_text())["cases"]
    if a.only:
        ids = set(a.only.split(","))
        cases = [c for c in cases if c["id"] in ids]

    outdir = a.out / dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    outdir.mkdir(parents=True)
    summaries, all_recs = [], []
    with open(outdir / "raw.jsonl", "w") as raw:
        for t in targets:
            recs = []
            for run in range(1, a.repeat + 1):
                for c in cases:
                    r = run_case(t, c, tools, system_prompt)
                    r["target"], r["run"] = t["name"], run
                    raw.write(json.dumps(r, ensure_ascii=False) + "\n")
                    raw.flush()
                    mark = "ok " if r["ok_with_retry"] else "ERR" if r["error"] else "no "
                    print(f"[{t['name']}] {mark} {c['id']} run {run}"
                          f" ttft={fmt_s(r['ttft'])} tools={[x['name'] for x in r['calls']]}"
                          + (f" error={r['error']}" if r["error"] else ""), flush=True)
                    recs.append(r)
            summaries.append(summarize(t, recs))
            all_recs += recs
    write_reports(outdir, summaries, all_recs, cases)
    print(f"\nWrote {outdir}/summary.md, answers.csv, raw.jsonl")


if __name__ == "__main__":
    sys.exit(main())
