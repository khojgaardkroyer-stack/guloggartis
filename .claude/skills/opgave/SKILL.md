---
name: opgave
description:
  Work with the tasks (opgaver) in SPEC.md. With a task number, solves that
  task from start to pull request - marks it in progress, grills the user on
  every open implementation decision, writes a plan, runs a fresh implementer
  subagent, then a review pass and a verify pass, loops until the user
  approves, marks it done and opens a PR. With a feature description instead,
  even a vague one, interviews the user and adds it to SPEC.md as a new task
  in the spec's format. Use when the user types /opgave, asks to work on a
  task from the spec, or asks to add a task to it.
argument-hint: <task number, eg. 3> | <description of a new task>
---

# /opgave: solve a task from SPEC.md, or add one

Talk to the user in the language they write in. Text visitors see on the
site, and SPEC.md itself, are always Danish.

Pick the mode from the arguments:

- **A number** (`3`, `opgave 3`) → **Solve a task**, below.
- **Anything else** (`ny: dark mode`, `a leaderboard for the game`) → **Add a
  task**, further down.
- **Empty** → ask (AskUserQuestion): solve an existing task, or add a new
  one. For a new one, ask what the feature is.

# Solve a task

You are the orchestrator. You own the git state, the conversation with the
user and the approval gates. Implementation and review run in fresh
subagents with the plan file as the only handoff. Never write or review the
task's code in this session yourself.

## Status in SPEC.md

Every task in `SPEC.md` has a status line right under its heading:

```
**Status:** Ikke startet
```

The values are `Ikke startet`, `I gang` and `Færdig`. `I gang` is pushed to
`main` when work starts, so everyone sees it. `Færdig` is committed on the
task branch, so it reaches `main` when the PR merges. A task counts as done
only when `main` says `Færdig`.

## Phase 0: Pick the task and start it

1. `git fetch origin main`. The working tree must be clean; if it isn't, say
   what is uncommitted and stop.
2. The user chose to solve a task but named none → read `SPEC.md` on
   `origin/main`, list each task with its status, and ask which one
   (AskUserQuestion, the ones marked `Ikke startet` first).
3. Read the task's whole section in `SPEC.md` and the ground rules.
4. **Resume.** If branch `opgave-<n>` exists locally or on `origin`, check it
   out and continue from its state: no plan file → Phase 1; a plan but no
   commits after it → Phase 2; implementation commits → Phase 3.
5. **Blockers.** If the task has a `**Kræver:**` line, check that every task
   it names is `Færdig` on `origin/main`. If one isn't, tell the user which
   and ask whether to start anyway (AskUserQuestion). Only `Kræver` lines
   block; the suggested order in SPEC.md never does.
6. If the status on `origin/main` is already `I gang` and there is no branch,
   someone else may be on it: ask before you continue.
7. **Mark it in progress.** Check out `main`, `git pull --ff-only`, set the
   task's status line to `**Status:** I gang`, commit it alone as
   `Start opgave <n>`, and push `main`. If the push is rejected, pull and try
   once more; if it still fails, tell the user and continue without it.
8. Create and check out branch `opgave-<n>` from `main`.

## Phase 1: Grill the user, then write the plan

Interview the user until no implementation decision is left open. This is
the "grill me" step: be thorough, not polite. A plan with "either is fine" or
"TBD" in it is not done.

- **Read first.** Read the code the task touches before you ask anything. A
  question the code answers is research, not a decision.
- **What to ask about:** everything under **Op til dig**, and every place
  where two reasonable implementations of **Besluttet** differ: component
  boundaries, file layout, state shape, which library, edge cases, empty and
  error states, mobile layout, copy, and how each **Færdig når** item will be
  checked.
- **What not to ask about:** anything under **Besluttet**. It is settled. If
  the user wants to change it, tell them it needs the product owner's OK
  and note it in the plan as an open point.
- **How to ask:** one question at a time with AskUserQuestion. Put all
  context in the question itself (2 sentences at most), with one concrete
  example. Put your recommended option first, marked "(Recommended)", and the
  trade-off in each option's description. Use `preview` for options that
  differ visually or in code shape.
- Follow up on answers that open new questions. Stop when you could hand the
  plan to someone who has never seen this conversation.

Then write `.claude/plans/opgave-<n>.md`:

```
# Opgave <n>: <title>

## Goal
<the task's Mål, one paragraph>

## Decisions
<every decision from the interview, one bullet each, with the reason>

## Steps
<numbered implementation steps, in order, with file paths>

## Tests
<what to test and where; only real logic, not markup>

## Done when
<the task's Færdig når list, each with how it will be checked>

## Out of scope
<what this task does not do>
```

Show the user a short summary and gate (AskUserQuestion): **Approve the
plan** or **Change something**. Loop until approved. Then commit the plan
alone as `Plan opgave <n>`.

## Phase 2: Implement (fresh subagent)

Spawn a `general-purpose` subagent with this work order:

> Implement opgave <n> in this repo, on the current branch `opgave-<n>`. Read
> `.claude/plans/opgave-<n>.md` fully, then the opgave's section and the
> Grundregler in `SPEC.md`. The plan's decisions are final; don't reopen
> them and don't add anything from Out of scope. Follow the steps in order.
> Write the tests the plan names. Before you finish, run `npm run lint`,
> `npm run build` and, if the script exists, `npm run test`; all must pass.
> Commit in one or more logical commits with English messages. Don't push
> and don't open a PR. Your final message lists: files changed, the
> lint/build/test output verbatim (the last lines are enough when it
> passes), and anything from the plan you could not do and why.

On a rerun after the Phase 3 gate, add to the work order: the user's
feedback verbatim and the confirmed review findings, and tell it to fix
those on top of the existing commits, not to start over.

Relay the report to the user in a few lines and go straight to Phase 3; no
gate between implementing and reviewing.

## Phase 3: Review (fresh subagents)

1. Spawn the `opgave-review` agent with: the repo's absolute path, the range
   `main...HEAD`, the plan path, and the opgave number.
2. If it returns blockers, spawn the `opgave-verify` agent with the same
   path, range and plan path, and the blockers numbered. A reviewer asked to
   find problems always finds some; verification throws out the wrong ones.
   No blockers → no verification.
3. Present to the user in one message:
   - what was implemented,
   - the confirmed blockers (CONFIRMED and UNDECIDED),
   - the minor findings,
   - one line per refuted blocker under "Refuted by verification", so the
     user can overrule it,
   - the **Færdig når** items no agent can check (screenshots, a run on a
     real phone, Lighthouse), as a checklist for the user,
   - how to try it: `npm run dev` and the URL to open.
4. Gate (AskUserQuestion):
   - **Approve** → Phase 4.
   - **Fix the review findings** → Phase 2 with the confirmed blockers and
     the minor findings.
   - **Change something** (the user's own notes) → Phase 2 with the notes.
     If a note contradicts the plan, update the plan file first and commit
     it, so the plan stays the source of truth.

Loop Phase 2 → Phase 3 as often as needed, with fresh subagents each round.

## Phase 4: Done and PR

Phase 4 asks nothing; the Phase 3 approval covers it.

1. Set the task's status line in `SPEC.md` to `**Status:** Færdig` on the
   branch, and commit it alone as `Finish opgave <n>`.
2. `git push -u origin opgave-<n>`.
3. Open the PR against `main`. With `gh` available:
   `gh pr create --base main --title "Opgave <n>: <English title>" --body ...`.
   Without it, give the user the compare URL
   (`https://github.com/<owner>/<repo>/compare/main...opgave-<n>`) and the
   body to paste. The body has:
   - **What:** a few lines on what changed.
   - **Decisions:** the main ones from the plan, with a link to the plan file.
   - **Checked:** the lint/build/test result, and each **Færdig når** item
     ticked or marked as left to the user.
   - Whatever the task's **Færdig når** asks to have in the PR (eg. before
     and after sizes, or the workflow note in Opgave 2). Ask the user for the
     parts only they can give, such as screenshots.
4. Report: the PR URL, how many implement/review rounds it took, and the
   checklist items still left to the user.

## Rules for solving

- Never skip a gate: plan approval (Phase 1) and implementation approval
  (Phase 3).
- The plan file is the only handoff between phases. Subagents get its path,
  not a summary of it.
- You commit only the status changes and the plan. Code commits come from
  the implementer.
- Never push to `main` except the `I gang` status commit in Phase 0.
- If a subagent fails or returns something unusable, tell the user and
  retry with a corrected work order; never quietly fill the gap yourself.

# Add a task

You turn a feature idea, often vague, into a new task in `SPEC.md` that
reads like the ones already there. The reader is whoever solves it later,
with `/opgave <n>` or by hand. **Besluttet** holds only what the user
actually decides here; everything else goes to **Op til dig**, where the
solve flow's interview picks it up. You write no code and create no branch.

## 1. Read

- `git fetch origin main` and read `SPEC.md` on `origin/main`: the intro,
  the Grundregler, every task and the Ekstraopgaver. The new task follows
  their format, tone and level of detail.
- Read the code the idea touches, enough to know what exists today. A
  question the code answers is research, not a decision.
- If the idea names an external library, API or browser feature, look up its
  current docs and status with WebSearch/WebFetch before you ask about it.
- **Overlap.** If an existing task or stretch bullet already covers the idea,
  or most of it, show which and ask (AskUserQuestion): extend that task, add
  a new task anyway, or drop it. If the overlapping task is `I gang` or
  `Færdig`, say so; a change to it then needs a new task.

## 2. Grill the user

Interview until you could write the task without guessing. Ask one question
at a time with AskUserQuestion, all context in the question itself
(2 sentences at most) with one concrete example, recommended option first
and marked "(Recommended)".

Every question also gets the option **"Op til den, der løser den"**. Take
it seriously: a spec that decides everything leaves nothing to learn. Steer
toward deciding what the product owner must own (scope, behaviour visitors
see, real numbers and rules, what is out of scope, constraints such as
performance or no backend) and toward leaving taste and code structure open.

Cover, in roughly this order:

1. **Goal:** what the visitor gets, in one sentence. Ask first if the idea is
   too vague to say this.
2. **Scope:** what is in, and what is explicitly out.
3. **Behaviour:** the main flow and its edge cases, with real examples.
4. **Placement:** where it lives in the SPA (a section on the front page, its
   own route, a component that can be both).
5. **Constraints:** facts it must use, data it may or may not touch,
   performance, accessibility.
6. **Blockers:** whether it needs another task done first. Only a true
   technical dependency becomes a `**Kræver:**` line; a preferred order is
   not one.
7. **Done when:** how a reviewer checks it is finished. Each criterion must
   be checkable by looking at the result, not by trusting the author.

Follow up on answers that open new questions. Stop when nothing a reviewer
would argue about is left implicit.

## 3. Size

If the answers describe more than one PR's worth of work, propose splitting
it into several tasks with a `**Kræver:**` line where one needs the other.
If it is small and optional, offer to add it as an Ekstraopgaver bullet
instead of a full task. Ask (AskUserQuestion).

## 4. Draft and confirm

Write the task in Danish, in exactly this format, with the next free number:

```
## Opgave <n>: <titel>

**Status:** Ikke startet

**Mål:** <one or two sentences>

**Kræver:** Opgave <m>.          (only for a real blocker)

**Besluttet**

- <one decision per bullet, concrete, with real values>

**Op til dig:** <what the solver decides, in one sentence or a short list>

**Færdig når**

- <one checkable criterion per bullet>
```

- Same voice as the other tasks: "du", short sentences, no buzzwords.
- File paths and names only where they point the way; no line numbers, no
  code beyond a short identifier.
- Wrap lines at 120 characters, indent bullet continuations by two spaces.
- Unknown facts the product owner will supply (a link, a price) go in as
  `_følger_`, and you name them in your report.

Show the draft in full, plus the other changes to SPEC.md it needs:

- a `**Kræver:**` line → update the intro's sentence about fixed
  dependencies;
- tests in the task → add its number to the Grundregler line listing the
  tasks with tests;
- a stretch bullet it replaces, or a task it extends.

Gate (AskUserQuestion): **Add it** or **Change something**. Loop until
approved.

## 5. Write and publish

1. Check out `main` and `git pull --ff-only`. The working tree must be clean;
   if it isn't, say what is uncommitted and stop.
2. Insert the task after the last `## Opgave` section, before
   `## Ekstraopgaver`, with a `---` line on each side like the others. Apply
   the other approved changes.
3. Commit `SPEC.md` alone as `Add opgave <n>: <English title>` and push
   `main`. If the push is rejected, pull and try once more; if it still
   fails, tell the user and leave the commit local.
4. Report: the task number and title, what else in SPEC.md changed, any
   `_følger_` placeholders still to fill, and that `/opgave <n>` starts it.
   Then stop; don't start solving it.

## Rules for adding

- Never write to `SPEC.md` before the user approves the draft.
- Never change another task's **Besluttet** or **Færdig når** unless the user
  chose to extend that task.
- Never renumber existing tasks; branches and statuses refer to the numbers.
