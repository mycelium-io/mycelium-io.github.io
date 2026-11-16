---
name: mycelium-pattern-your-own
description: Help the user design their own way to run agents in Mycelium, with roles, a flow and schedules of their choosing, and set it up in a room
---

# Pattern: Your own

You are an agent. The user wants a **way of working of their own**. In
Mycelium, roles are just agents with instructions, and flows, schedules and the
steps to reach agreement are defined per room. Your job is to design one with
the user, set it up in a room, and run it once on a real task.

## Before you start

Mycelium has to be installed and running. If `mycelium status` doesn't report
a reachable hub, read <https://mycelium-io.github.io/mycelium/agents.md> and
follow it first. If you haven't read how an agent takes part in a room, run
`mycelium skill print` and read it now.

## Design it with the user

Ask, one question at a time:

1. **What work is this for?** A codebase, a kind of task, a recurring job.
2. **Which roles does it need?** For each, a handle and one or two sentences of
   instructions. Two or three roles is plenty to start.
3. **How does work move between them?** Who hands what to whom, and whether
   some step needs a decision: a review that can send work back, an approval,
   agents agreeing on one answer.
4. **Does anything run on a schedule?**

The other patterns are good starting points to borrow from:
[Pair](https://mycelium-io.github.io/patterns/pair.md),
[Software factory](https://mycelium-io.github.io/patterns/software-factory.md),
[Swarm](https://mycelium-io.github.io/patterns/swarm.md),
[Night shift](https://mycelium-io.github.io/patterns/night-shift.md).

Write the design back to the user in a few lines and get a yes before setting
anything up.

## Set it up

1. **Make the room.** Name it after the work.

   ```bash
   mycelium room create <name> && mycelium room use <name>
   ```

2. **Save the design** so every agent in the room can read it:

   ```bash
   mycelium memory set context/how-we-work "<the roles, how work moves, and any schedule>"
   ```

3. **Add the roles.** Ask the user to open the app (`mycelium ui open`), go to
   the room, and add one member per role from **Members → Add**, with their
   coding agent, the folder, the handle and the instructions you agreed.

4. **If a step needs a decision**, add the conductor, which walks agents
   through a flow one turn at a time. It ships with flows such as `review`
   (an author and a reviewer, until the reviewer approves), `gated` (a
   proposal and an approval) and `concord` (agents settling on one answer):

   ```bash
   mycelium engine create conductor --kind conductor
   ```

   A flow of the room's own is saved as a `protocols/<name>` memory. To start
   from a built-in one, ask the conductor for it as YAML in any task's thread
   (`mycelium board coordinate <task> conductor "show review"`), change it, and
   save it with `mycelium memory set protocols/<name> --file <file>`.

5. **If something runs on a schedule**, add it with `mycelium schedule add`
   (see `mycelium schedule add --help`).

## Run it

File one real task with `mycelium board new`, and run it through the design
the way you agreed. Stop at each hand-off to tell the user what's happening.

## Show the user

Point the user at the app: the board, the task's thread, **Members**, and
`context/how-we-work` in **Memory**.

When it's done, ask what they'd change. Roles, instructions and flows are all
memories in the room, so changing how the team works is an edit, not a rebuild.
