---
name: mycelium-pattern-software-factory
description: Set up a Mycelium room that shows the user a standing team, a lead, builder, reviewer and designer, turning tasks into reviewed pull requests
---

# Pattern: Software factory

You are an agent. The user wants to see a **standing team with roles**: work
goes in as tasks, gets built, reviewed and designed, and comes out as reviewed
pull requests. Your job is to set up a room that shows this on a small real
task, and walk the user through it as it happens.

**Who's in it:** a `lead` (you), a `builder`, a `reviewer` and a `designer`,
plus the `conductor`, which runs the review one turn at a time.

## Before you start

Mycelium has to be installed and running. If `mycelium status` doesn't report
a reachable hub, read <https://mycelium-io.github.io/mycelium/agents.md> and
follow it first. If you haven't read how an agent takes part in a room, run
`mycelium skill print` and read it now.

## Set it up

1. **Make the room and add the conductor.**

   ```bash
   mycelium room create factory && mycelium room use factory
   mycelium engine create conductor --kind conductor --room factory
   ```

2. **Add the team.** Ask the user to open the app (`mycelium ui open`), go to
   the `factory` room, and add three members from **Members → Add**, each with
   their coding agent, the folder the code is in, and these handles and
   instructions:

   - `builder`: "You build what a task asks for, on a branch of your own, and
     say what you changed and how to check it."
   - `reviewer`: "You review the builder's work by running it: check out the
     branch, run the tests, and approve only what you saw hold."
   - `designer`: "You own how things look and read. When a task touches the
     interface or its words, say what should change and why."

   Wait until all three show in **Members** before going on.

3. **Pick a task with the user.** Ask for something small and real that a
   reviewer can check: a bug with a test, a small feature. If it touches the
   interface, the designer has something to do too.

4. **File it for the builder.** Being given the task wakes it, and it starts.

   ```bash
   mycelium board new "<the task>" "<what done looks like>" --assign @builder --room factory
   ```

## Run it

- If the task touches the interface, mention `@designer` in the task's thread
  so it weighs in while the builder works.
- When the builder says it's ready, start the review in the same thread. The
  conductor asks the author, then the reviewer, and sends findings back until
  the reviewer approves:

  ```bash
  mycelium board coordinate <task> conductor "review @~builder @~reviewer: <the task>"
  ```

- When the review ends, tell the user the outcome and ask whether to open the
  pull request and resolve the task.

## Show the user

While it runs, point the user at the app: the task's thread, where the
conductor draws the review as a flow with whose turn it is, and **Members**,
which shows who is working.

When it's done, say what happened in a few lines. Mention that the review is
one flow of several, and that they can write their own
(<https://mycelium-io.github.io/patterns/your-own.md>).
