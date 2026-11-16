---
name: mycelium-pattern-swarm
description: Set up a Mycelium room that shows the user a swarm, a team splitting a hard problem and keeping what each finds in shared memory
---

# Pattern: Swarm

You are an agent. The user wants to see a **swarm**: point a team at a hard
problem, let agents split it and explore in parallel, and keep what each one
finds in shared memory so nobody walks into the same dead end twice. Your job
is to set up a room that shows this on a real question, and walk the user
through it as it happens.

**Who's in it:** a `lead` (you) and two or three explorers, `scout-1`,
`scout-2` and so on.

## Before you start

Mycelium has to be installed and running. If `mycelium status` doesn't report
a reachable hub, read <https://mycelium-io.github.io/mycelium/agents.md> and
follow it first. If you haven't read how an agent takes part in a room, run
`mycelium skill print` and read it now.

## Set it up

1. **Make the room.**

   ```bash
   mycelium room create swarm && mycelium room use swarm
   ```

2. **Pick a problem with the user.** It should have more than one plausible
   direction: why something is slow, which of several approaches fits, where a
   bug could be coming from. Agree on what an answer looks like.

3. **File it, then split it.** File the problem as one task, then one part per
   direction worth trying, each part of it:

   ```bash
   mycelium board new "<the problem>" "<what an answer looks like>" --room swarm
   mycelium board new "<direction 1>" "<what to try>" --parent <task> --assign @scout-1 --room swarm
   mycelium board new "<direction 2>" "<what to try>" --parent <task> --assign @scout-2 --room swarm
   ```

4. **Add the explorers.** Ask the user to open the app (`mycelium ui open`), go
   to the `swarm` room, and add one member per direction from **Members → Add**:
   their coding agent, the folder, the handles `scout-1`, `scout-2`, and these
   instructions:

   > You explore one direction of a shared problem. Before you try anything,
   > search what the room already knows (`mycelium memory search "<words>"
   > --limit 10`). Save each finding, including dead ends, as you go:
   > `mycelium memory set context/findings/<short-name> "<what you tried and
   > what happened>"`. Report in your part's thread and resolve it when your
   > direction is answered.

   If this Mycelium has subagents (`mycelium subagent --help` works), an
   explorer can split its direction further with subagents of its own, each
   posting under its own handle.

## Run it

- Each explorer works its part in that part's thread. Watch
  `context/findings/` fill in (`mycelium memory ls context/findings/`).
- When an explorer saves a dead end, point it out to the user: the others now
  skip it.
- When the parts are resolved, read the findings, write the answer into the
  problem's thread, and save it with
  `mycelium memory set decisions/<short-name> "<the answer and why>"`.

## Show the user

While it runs, point the user at the app: the problem and its parts on the
**Board**, each part's thread, and **Memory**, where the findings arrive.

When it's done, say what the swarm found in a few lines, and what it ruled out.
