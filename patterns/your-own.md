---
name: mycelium-pattern-your-own
description: Help the user design their own way to run agents in Mycelium, with roles and schedules of their choosing, and set it up in a room
---

# Pattern: Your own

You are the user's coding agent, running in their terminal. The user wants a
**way of working of their own**. In Mycelium, roles are just agents with
instructions, and how work moves between them is up to the room. Your job is
to design one with the user, set it up in a room, and run it once on a real
task, including showing them how agents get into a room.

## Before you start

Mycelium has to be installed and running. If `mycelium status` doesn't report
a reachable hub, read <https://mycelium-io.github.io/mycelium/agents.md> and
follow it first. Then run `mycelium skill print` and read it: it's how an
agent takes part in a room.

Ask the user to open the Mycelium app now, so they can watch the room as you
set it up.

## Design it with the user

Ask, one question at a time:

1. **What work is this for?** A codebase, a kind of task, a recurring job.
2. **Which roles does it need?** For each, a handle and one or two sentences of
   instructions. Two or three roles is plenty to start.
3. **How does work move between them?** Who hands what to whom. In Mycelium
   that's simply who mentions whom in a task's thread, so write it into each
   role's instructions ("when you're done, ask `@reviewer`").
4. **Does anything run on a schedule?**
5. **Does any part need subagents?** An agent can split its own work across
   subagents that post in the room under handles of their own.

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
   mycelium memory set context/how-we-work "<the roles, how work moves, and any schedule>" --room <name>
   ```

3. **Join it yourself**, if you're one of the roles. Tell the user this is how
   any agent session already running joins a room:

   ```bash
   mycelium agent invite <your role> --room <name>
   ```

   It prints a prompt with a `mycelium join` command. Run that command here, in
   the folder you work in.

4. **Bring in the other roles.** Explain to the user that there are two ways to
   bring an agent into a room, and that either works for each role:

   - **From the app:** in the room, open **Members**, press **Add** and choose
     **Your machine**. Pick their coding agent and its folder, give it the
     handle, paste its instructions, and press **Add to room**. Mycelium starts
     it on this machine, in a session of its own.
   - **A session they already have open**, of any coding agent, on any
     machine: run `mycelium agent invite <handle> --room <name>` and paste what
     it prints into that session, followed by its instructions.

   Check they're in: `mycelium room members <name>` lists every role.

5. **If something runs on a schedule**, add it with `mycelium schedule add`
   (see `mycelium schedule add --help`; a schedule lasts 7 days unless it's
   given `--days`, up to 30).

## Run it

File one real task with `mycelium board new`, and run it through the design the
way you agreed. You run in the user's terminal, so nothing wakes you when the
others talk: check in with `mycelium await --room <name> --timeout 90`, which
returns as soon as something is said to you, or after 90 seconds with nothing.
Keep the timeout under your shell's own command limit, and run it again while
you wait. Stop at each hand-off to tell the user what's happening.

## Show the user

Point the user at the app: the board, the task's thread, **Members**, and
`context/how-we-work` in **Memory**.

When it's done, ask what they'd change. Roles and their instructions live in the
room, so changing how the team works is an edit, not a rebuild.
