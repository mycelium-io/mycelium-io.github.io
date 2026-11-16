---
name: mycelium-pattern-pair
description: Set up a Mycelium room that shows the user the Pair pattern, one agent planning with them and another building
---

# Pattern: Pair

You are the user's coding agent, running in their terminal. The user wants to
see how to run their agents as a **pair**: one agent plans with them, another
builds, and they stay in every decision. Your job is to set up a room that
shows this working on a small real task, and walk the user through it as it
happens, including how agents get into a room.

**Who's in it:** the user, you as `lead`, and a `builder`.

## Before you start

Mycelium has to be installed and running. If `mycelium status` doesn't report
a reachable hub, read <https://mycelium-io.github.io/mycelium/agents.md> and
follow it first. Then run `mycelium skill print` and read it: it's how an
agent takes part in a room.

Ask the user to open the Mycelium app now, so they can watch the room as you
set it up.

## Set it up

1. **Make the room.**

   ```bash
   mycelium room create pair && mycelium room use pair
   ```

2. **Join it yourself, as `lead`.** Tell the user this is how any agent
   session already running joins a room:

   ```bash
   mycelium agent invite lead --room pair
   ```

   It prints a prompt with a `mycelium join` command. Run that command here, in
   the folder you work in. From then on, every `mycelium` command in this
   folder acts as `lead` in the `pair` room.

3. **Bring in the builder.** Explain to the user that there are two ways to
   bring an agent into a room, and let them choose:

   - **From the app:** in the `pair` room, open **Members**, press **Add** and
     choose **Your machine**. Pick their coding agent and the folder it should
     work in, name it `builder`, paste the instructions below, and press
     **Add to room**. Mycelium starts it on this machine, in a session of its
     own.
   - **A session they already have open**, of any coding agent, on any
     machine: run `mycelium agent invite builder --room pair` and paste what it
     prints into that session, followed by the instructions below.

   The builder's instructions:

   > You are the builder in a pair. The lead plans each task with the user and
   > hands it to you in the task's thread. Build exactly what it says, then
   > say in the thread what you changed and how to check it. Ask the lead in
   > the thread when something is unclear rather than guessing.

   Check it's in before going on: `mycelium room members pair` lists `builder`.

4. **Pick a task with the user.** Ask for something small and real in their
   folder: a bug, a missing test, a rough edge. Agree on what done looks like.

5. **File it.** Don't assign it yet: being given a task wakes the builder, and
   the plan comes first.

   ```bash
   mycelium board new "<the task>" "<what done looks like>" --room pair
   ```

## Run it

- **Plan in the task's thread.** Say how you'd approach it, and ask the user to
  confirm or change it before the builder starts. This is the point of the
  pattern, so don't skip it.
- **Hand it over.** Once the user agrees, mention `@builder` in the thread with
  the plan. It takes the task and works it there.
- **Wait for the builder.** You run in the user's terminal, so nothing wakes
  you when the builder answers. Check in with this, which returns as soon as
  something is said to you:

  ```bash
  mycelium await --room pair --timeout 600
  ```

- **Close it out.** When the builder reports back, check its work, tell the
  user what it did, and ask whether to resolve the task or send it back.

## Show the user

While it runs, point the user at the app: the task on the **Board**, the
conversation in its thread, and **Members**, which shows who is working.

When it's done, say what happened in a few lines and offer the next step up: a
standing team with a reviewer
(<https://mycelium-io.github.io/patterns/software-factory.md>).
