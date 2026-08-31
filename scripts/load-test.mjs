#!/usr/bin/env node

import { performance } from "node:perf_hooks";

const defaultRoutes = [
  "ar/",
  "ar/topics/?track=flutter",
  "ar/questions/?track=flutter",
  "ar/questions/final-vs-const-in-dart/?track=flutter",
  "ar/interview/?track=flutter",
  "en/questions/?track=flutter",
];

function help() {
  console.log(`Usage: npm run load:test -- [options]

Options:
  --url <url>             Base URL (default: http://127.0.0.1:3000/)
  --users <list>          Concurrent virtual-user stages (default: 10,25,50)
  --duration <seconds>    Steady duration per stage (default: 10)
  --ramp <seconds>        Ramp-up time per stage (default: 2)
  --think <milliseconds>  Pause between requests per user (default: 100)
  --timeout <milliseconds> Request timeout (default: 5000)
  --p95 <milliseconds>    Passing p95 threshold (default: 1000)
  --errors <percent>      Passing error-rate threshold (default: 1)
  --routes <csv>          Relative routes to visit in sequence
  --help                  Show this help

Example:
  npm run load:test -- --url https://tech-interview-prep-1ux.pages.dev/ --users 10,25,50,100 --duration 15
`);
}

function positiveNumber(value, name, { allowZero = false } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || (allowZero ? parsed < 0 : parsed <= 0)) throw new Error(`${name} must be ${allowZero ? "zero or " : ""}greater than zero`);
  return parsed;
}

function parseOptions(argv) {
  const options = {
    url: "http://127.0.0.1:3000/",
    users: [10, 25, 50],
    duration: 10,
    ramp: 2,
    think: 100,
    timeout: 5000,
    p95: 1000,
    errors: 1,
    routes: defaultRoutes,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--help") return { help: true };
    const value = argv[++index];
    if (value == null) throw new Error(`${flag} requires a value`);
    if (flag === "--url") options.url = value;
    else if (flag === "--users") options.users = value.split(",").map((item) => positiveNumber(item.trim(), "users"));
    else if (flag === "--duration") options.duration = positiveNumber(value, "duration");
    else if (flag === "--ramp") options.ramp = positiveNumber(value, "ramp", { allowZero: true });
    else if (flag === "--think") options.think = positiveNumber(value, "think", { allowZero: true });
    else if (flag === "--timeout") options.timeout = positiveNumber(value, "timeout");
    else if (flag === "--p95") options.p95 = positiveNumber(value, "p95");
    else if (flag === "--errors") options.errors = positiveNumber(value, "errors", { allowZero: true });
    else if (flag === "--routes") options.routes = value.split(",").map((item) => item.trim().replace(/^\/+/, "")).filter(Boolean);
    else throw new Error(`Unknown option: ${flag}`);
  }

  options.url = new URL(options.url.endsWith("/") ? options.url : `${options.url}/`).toString();
  options.users = [...new Set(options.users.map((value) => Math.floor(value)))].sort((a, b) => a - b);
  if (!options.users.length || !options.routes.length) throw new Error("users and routes cannot be empty");
  return options;
}

function percentile(sorted, fraction) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function routeUrl(baseUrl, route) {
  return new URL(route.replace(/^\/+/, ""), baseUrl).toString();
}

async function runStage(options, users) {
  const startedAt = performance.now();
  const deadline = startedAt + (options.ramp + options.duration) * 1000;
  const latencies = [];
  const statusCounts = new Map();
  const routeCounts = new Map();
  let requests = 0;
  let failures = 0;
  let bytes = 0;

  async function virtualUser(userIndex) {
    if (options.ramp) await sleep((userIndex / users) * options.ramp * 1000);
    let routeIndex = userIndex % options.routes.length;
    while (performance.now() < deadline) {
      const route = options.routes[routeIndex];
      const requestStartedAt = performance.now();
      try {
        const response = await fetch(routeUrl(options.url, route), {
          headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "tech-interview-prep-load-test/1.0" },
          redirect: "follow",
          signal: AbortSignal.timeout(options.timeout),
        });
        const body = await response.arrayBuffer();
        bytes += body.byteLength;
        statusCounts.set(response.status, (statusCounts.get(response.status) ?? 0) + 1);
        if (!response.ok) failures += 1;
      } catch (error) {
        failures += 1;
        const name = error instanceof Error ? error.name : "RequestError";
        statusCounts.set(name, (statusCounts.get(name) ?? 0) + 1);
      }
      requests += 1;
      routeCounts.set(route, (routeCounts.get(route) ?? 0) + 1);
      latencies.push(performance.now() - requestStartedAt);
      routeIndex = (routeIndex + 1) % options.routes.length;
      if (options.think) await sleep(options.think);
    }
  }

  await Promise.all(Array.from({ length: users }, (_, index) => virtualUser(index)));
  const elapsedSeconds = (performance.now() - startedAt) / 1000;
  const sorted = latencies.sort((a, b) => a - b);
  const errorRate = requests ? (failures / requests) * 100 : 100;
  const result = {
    users,
    requests,
    failures,
    errorRate,
    requestsPerSecond: requests / elapsedSeconds,
    megabytesPerSecond: bytes / 1024 / 1024 / elapsedSeconds,
    average: sorted.length ? sorted.reduce((sum, value) => sum + value, 0) / sorted.length : 0,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    max: sorted.at(-1) ?? 0,
    statusCounts: Object.fromEntries([...statusCounts].sort(([a], [b]) => String(a).localeCompare(String(b)))),
    routeCounts: Object.fromEntries(routeCounts),
  };
  return { ...result, passed: result.p95 <= options.p95 && result.errorRate <= options.errors };
}

function fixed(value, digits = 1) {
  return Number(value).toFixed(digits);
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) return help();

  console.log(`Target: ${options.url}`);
  console.log(`Journey: ${options.routes.join(" -> ")}`);
  console.log(`SLO: p95 <= ${options.p95}ms, errors <= ${options.errors}%`);

  const results = [];
  for (const users of options.users) {
    console.log(`\nRunning ${users} virtual users...`);
    const result = await runStage(options, users);
    results.push(result);
    console.table([{
      users: result.users,
      requests: result.requests,
      "req/s": fixed(result.requestsPerSecond),
      "errors %": fixed(result.errorRate, 2),
      "avg ms": fixed(result.average),
      "p50 ms": fixed(result.p50),
      "p95 ms": fixed(result.p95),
      "p99 ms": fixed(result.p99),
      "max ms": fixed(result.max),
      result: result.passed ? "PASS" : "FAIL",
    }]);
    console.log("Responses:", result.statusCounts);
  }

  const highestPassing = results.filter((result) => result.passed).at(-1);
  const firstFailing = results.find((result) => !result.passed);
  if (highestPassing) console.log(`\nObserved capacity under this SLO: at least ${highestPassing.users} concurrent virtual users.`);
  if (firstFailing) console.log(`First failing stage: ${firstFailing.users} concurrent virtual users.`);
  if (results.some((result) => !result.passed)) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
