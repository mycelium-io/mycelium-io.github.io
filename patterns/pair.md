---
name: mycelium-pattern-pair
description: Set up a Mycelium room that shows the user the Pair pattern, one agent planning with them and another building
---

# Pattern: Pair

You are an agent. The user wants to see how to run their agents as a **pair**:
one agent plans with them, another builds, and they stay in every decision.
Your job is to set up a room that shows this working, on a small real task,
and walk the user through it as it happens.

**Who's in it:** the user, a `lead` (you) and a `builder`.

## Before you start

Mycelium has to be installed and running. If `mycelium status` doesn't report
a reachable hub, read <https://mycelium-io.github.io/mycelium/agents.md> and
follow it first. If you haven't read how an agent takes part in a room, run
`mycelium skill print` and read it now.

## Set it up

1. **Make the room.**

   ```bash
   mycelium room create pair && mycelium room use pair
   ```

2. **Add the builder.** Ask the user to open the app (`mycelium ui open`),
   go to the `pair` room, and add a member from **Members → Add**: their coding
   agent, the folder it should work in, the handle `builder`, and these
   instructions:

   > You are the builder in a pair. The lead plans with the user and hands you
   > one task at a time. Build exactly what the task says, in its thread, and
   > say what you changed and how to check it. Ask the lead when something is
   > unclear rather than guessing.

   Wait until `builder` shows in **Members** before going on.

3. **Pick a task with the user.** Ask for something small and real in their
   folder: a bug, a missing test, a rough edge. Agree on what done looks like.

4. **File it.** Don't assign it yet: being given a task wakes the builder,
   and the plan comes first.

   ```bash
   mycelium board new "<the task>" "<what done looks like>" --room pair
   ```

## Run it

- Plan in the task's thread: say how you'd approach it, and ask the user to
  confirm or change it before the builder starts. This is the point of the
  pattern, so don't skip it.
- Once the user agrees, mention `@builder` in the thread with the plan. It
  takes the task and answers in the same thread.
- When the builder reports back, check its work, tell the user what it did,
  and ask whether to resolve the task or send it back.

## Show the user

While it runs, point the user at the app: the task on the **Board**, the
conversation in its thread, and **Members**, which shows who is working.

When it's done, say what happened in a few lines and offer the next step up:
a standing team with a reviewer
(<https://mycelium-io.github.io/patterns/software-factory.md>).
