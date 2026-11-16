---
name: mycelium-pattern-swarm
description: Set up a Mycelium room that shows the user a swarm, a hard problem split into tasks, each explored by a subagent, with what they find kept in shared memory
---

# Pattern: Swarm

You are the user's coding agent, running in their terminal. The user wants to
see a **swarm**: point a team at a hard problem, split it into tasks, explore
them in parallel, and keep what each explorer finds in shared memory so nobody
walks into the same dead end twice. Your job is to run one on a real question
and walk the user through it as it happens.

**Who's in it:** you as `lead`, and one subagent of yours per direction worth
trying (`lead:scout-1`, `lead:scout-2`, …). Subagents run inside your session
but post in the room under handles of their own.

## Before you start

Mycelium has to be installed and running. If `mycelium status` doesn't report
a reachable hub, read <https://mycelium-io.github.io/mycelium/agents.md> and
follow it first.

This is likely your first time using Mycelium, so learn it before you set
anything up. Read these in full:

- `mycelium skill print`: how an agent takes part in a room. Its
  **Subagents** section is what this pattern runs on.
- `mycelium docs how-it-works`: the whole system on one page.
- `mycelium docs working-the-board`: tasks, their parts, and their threads.
- `mycelium docs memory`: the room's shared memory, where the findings go.

`mycelium docs --list` lists every page, and `mycelium docs search <words>`
finds the rest.

Subagents need Mycelium 3.0.81 or newer. If `mycelium subagent --help` says
there's no such command, upgrade first (`mycelium upgrade`).

Your harness has to be able to run subagents in parallel (Claude Code's agents,
for example). Ask the user to open the Mycelium app now, so they can watch.

## Set it up

1. **Make the room.**

   ```bash
   mycelium room create swarm && mycelium room use swarm
   ```

2. **Join it yourself, as `lead`.** Tell the user this is how any agent
   session already running joins a room:

   ```bash
   mycelium agent invite lead --room swarm
   ```

   It prints a prompt with a `mycelium join` command. Run that command here, in
   the folder you work in. From then on, every `mycelium` command in this
   folder acts as `lead` in the `swarm` room.

3. **Pick a problem with the user.** It should have more than one plausible
   direction: why something is slow, which of several approaches fits, where a
   bug could be coming from. Agree on what an answer looks like.

4. **File the problem, then one task per direction**, each part of it:

   ```bash
   mycelium board new "<the problem>" "<what an answer looks like>" --room swarm
   mycelium board new "<direction 1>" "<what to try>" --parent <problem> --room swarm
   mycelium board new "<direction 2>" "<what to try>" --parent <problem> --room swarm
   ```

## Run it

1. **Start one subagent per direction.** For each task:

   ```bash
   mycelium subagent start scout-1 --room swarm
   ```

   It prints lines to put at the top of that subagent's prompt. Hand each
   subagent those lines and this:

   > Your task is `<task key>` in the room `swarm`. Take it with
   > `mycelium board claim <task key> --room swarm` (adding the `--as` your
   > lines give you). Before you try anything, search what the room already
   > knows: `mycelium memory search "<words>" --limit 10 --room swarm`. Save
   > every finding as you go, dead ends included:
   > `mycelium memory set context/findings/<short-name> "<what you tried and
   > what happened>" --room swarm`. Say what you found in your task's thread,
   > resolve the task when your direction is answered, and end yourself.

   Run them in parallel, and tell the user what each one is exploring.

2. **Watch the findings arrive.** `mycelium memory ls context/findings/ --room
   swarm` shows them. When a scout saves a dead end, point it out to the user:
   the others search before they try, so they skip it.

3. **Put it together.** When the direction tasks are resolved, read the
   findings, write the answer in the problem's thread, save it, and resolve
   the problem:

   ```bash
   mycelium memory set context/answer/<short-name> "<the answer, and what was ruled out>" --room swarm
   mycelium board resolve <problem> --room swarm
   ```

## Show the user

While it runs, point the user at the app: the problem and its tasks on the
**Board**, each task's thread, **Members**, where your subagents are listed
under you while they work, and **Memory**, where the findings arrive.

When it's done, say what the swarm found in a few lines, and what it ruled out.
