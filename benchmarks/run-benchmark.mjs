#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const WEIGHTS = {
  format: 50,
  constraints: 25,
  brevity: 15,
  language: 10,
};

function parseArgs(argv) {
  const args = { cases: 'benchmarks/cases.json', results: null };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--cases') {
      args.cases = argv[++i];
    } else if (token === '--results') {
      args.results = argv[++i];
    } else if (token === '--help' || token === '-h') {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  return args;
}

function normalize(text) {
  return String(text ?? '').replace(/\r\n/g, '\n').trim();
}

function wordCount(text) {
  return normalize(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

function hangulRatio(text) {
  const letters = (text.match(/[A-Za-z가-힣]/g) || []).length;
  if (letters === 0) return 0;
  const hangul = (text.match(/[가-힣]/g) || []).length;
  return hangul / letters;
}

function latinRatio(text) {
  const letters = (text.match(/[A-Za-z가-힣]/g) || []).length;
  if (letters === 0) return 0;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return latin / letters;
}

function includesAny(text, needles = []) {
  const lower = text.toLowerCase();
  return needles.some((needle) => lower.includes(String(needle).toLowerCase()));
}

function escapeCell(value) {
  return String(value)
    .replace(/\|/g, '\\|')
    .replace(/\n/g, '<br>');
}

function evaluateFormat(testCase, text) {
  const cues = testCase.must_include_any ?? [];
  if (cues.length === 0) {
    return { score: 100, pass: true, note: 'no explicit format cue' };
  }

  const pass = includesAny(text, cues);
  return {
    score: pass ? 100 : 0,
    pass,
    note: pass ? 'format cue present' : `missing any of: ${cues.join(', ')}`,
  };
}

function evaluateConstraints(testCase, text) {
  const notes = [];
  const failures = [];
  let satisfied = 0;
  let total = 0;

  const required = testCase.must_include_all ?? [];
  for (const phrase of required) {
    total += 1;
    if (text.toLowerCase().includes(String(phrase).toLowerCase())) {
      satisfied += 1;
    } else {
      failures.push(`missing required marker: ${phrase}`);
    }
  }

  const forbidden = testCase.must_not_include_any ?? [];
  for (const phrase of forbidden) {
    total += 1;
    if (!text.toLowerCase().includes(String(phrase).toLowerCase())) {
      satisfied += 1;
    } else {
      failures.push(`contains forbidden marker: ${phrase}`);
    }
  }

  const score = total === 0 ? 100 : Math.round((satisfied / total) * 100);
  if (required.length > 0) {
    notes.push(`${satisfied}/${total} constraint checks satisfied`);
  } else if (forbidden.length > 0) {
    notes.push(`${satisfied}/${total} forbidden checks satisfied`);
  } else {
    notes.push('no extra constraints');
  }

  return {
    score,
    pass: failures.length === 0,
    note: [...notes, ...failures].join('; '),
  };
}

function evaluateBrevity(testCase, text) {
  if (typeof testCase.max_words !== 'number') {
    return { score: 100, pass: true, note: 'no length cap' };
  }

  const count = wordCount(text);
  if (count <= testCase.max_words) {
    return {
      score: 100,
      pass: true,
      note: `length ok (${count}/${testCase.max_words} words)`,
    };
  }

  const over = count - testCase.max_words;
  const score = Math.max(0, Math.round(100 - (over / testCase.max_words) * 100));
  return {
    score,
    pass: false,
    note: `too long (${count}/${testCase.max_words} words)`,
  };
}

function evaluateLanguage(testCase, text) {
  if (testCase.locale === 'ko') {
    const ratio = hangulRatio(text);
    const pass = ratio >= 0.18;
    return {
      score: pass ? 100 : 0,
      pass,
      note: `Korean ratio ${ratio.toFixed(2)}`,
    };
  }

  if (testCase.locale === 'en') {
    const ratio = latinRatio(text);
    const pass = ratio >= 0.55;
    return {
      score: pass ? 100 : 0,
      pass,
      note: `English ratio ${ratio.toFixed(2)}`,
    };
  }

  return { score: 100, pass: true, note: 'no locale check' };
}

function scoreCase(testCase, output) {
  const text = normalize(output);
  const format = evaluateFormat(testCase, text);
  const constraints = evaluateConstraints(testCase, text);
  const brevity = evaluateBrevity(testCase, text);
  const language = evaluateLanguage(testCase, text);

  const totalScore = Math.round(
    (format.score * WEIGHTS.format
      + constraints.score * WEIGHTS.constraints
      + brevity.score * WEIGHTS.brevity
      + language.score * WEIGHTS.language) / 100,
  );

  const hardPass = format.pass && constraints.pass && brevity.pass && language.pass;
  const pass = hardPass && totalScore >= 80;

  return {
    id: testCase.id,
    mode: testCase.mode,
    score: totalScore,
    pass,
    format: format.note,
    constraints: constraints.note,
    brevity: brevity.note,
    language: language.note,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log('Usage: node benchmarks/run-benchmark.mjs --results results.json [--cases benchmarks/cases.json]');
    process.exit(0);
  }

  if (!args.results) {
    throw new Error('Missing required --results file');
  }

  const casesPath = path.resolve(args.cases);
  const resultsPath = path.resolve(args.results);
  const cases = JSON.parse(await fs.readFile(casesPath, 'utf8'));
  const results = JSON.parse(await fs.readFile(resultsPath, 'utf8'));

  const resultsById = new Map(results.map((result) => [result.id, result.output ?? '']));
  const rows = [];

  for (const testCase of cases) {
    const output = resultsById.get(testCase.id);
    if (typeof output !== 'string') {
      rows.push({
        id: testCase.id,
        mode: testCase.mode,
        score: 0,
        pass: false,
        format: 'missing output',
        constraints: 'missing output',
        brevity: 'missing output',
        language: 'missing output',
      });
      continue;
    }

    rows.push(scoreCase(testCase, output));
  }

  const passed = rows.filter((row) => row.pass).length;
  const total = rows.length;
  const averageScore = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length)
    : 0;

  console.log(`Clarify First benchmark: ${passed}/${total} passed, average score ${averageScore}/100`);
  console.log('| id | mode | score | pass | format | constraints | brevity | language |');
  console.log('| --- | --- | ---: | :---: | --- | --- | --- | --- |');
  for (const row of rows) {
    console.log(
      `| ${escapeCell(row.id)} | ${escapeCell(row.mode)} | ${row.score} | ${row.pass ? 'PASS' : 'FAIL'} | ${escapeCell(row.format)} | ${escapeCell(row.constraints)} | ${escapeCell(row.brevity)} | ${escapeCell(row.language)} |`,
    );
  }

  process.exit(passed === total ? 0 : 1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
