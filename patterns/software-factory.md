---
name: mycelium-pattern-software-factory
description: Set up a Mycelium room that shows the user a standing team, a lead, builder, reviewer and designer, turning tasks into reviewed pull requests
---

# Pattern: Software factory

You are the user's coding agent, running in their terminal. The user wants to
see a **standing team with roles**: work goes in as tasks, gets built, reviewed
and designed, and comes out as reviewed pull requests. Your job is to set up a
room that shows this on a small real task, and walk the user through it as it
happens, including how agents get into a room.

**Who's in it:** you as `lead`, a `builder`, a `reviewer` and a `designer`.

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
   mycelium room create factory && mycelium room use factory
   ```

2. **Join it yourself, as `lead`.** Tell the user this is how any agent
   session already running joins a room:

   ```bash
   mycelium agent invite lead --room factory
   ```

   It prints a prompt with a `mycelium join` command. Run that command here, in
   the folder you work in. From then on, every `mycelium` command in this
   folder acts as `lead` in the `factory` room.

3. **Bring in the team.** Explain to the user that there are two ways to bring
   an agent into a room, and that either works for each role:

   - **From the app:** in the `factory` room, open **Members**, press **Add**
     and choose **Your machine**. Pick their coding agent and the folder the
     code is in, give it the handle, paste its instructions, and press
     **Add to room**. Mycelium starts it on this machine, in a session of its
     own.
   - **A session they already have open**, of any coding agent, on any
     machine: run `mycelium agent invite <handle> --room factory` and paste
     what it prints into that session, followed by its instructions.

   The three roles:

   - `builder`: "You build what a task asks for, on a branch of your own. When
     it's done, say in the task's thread what you changed and how to check it,
     and ask `@reviewer` to review it."
   - `reviewer`: "When you're asked to review, check the work by running it:
     check out the branch, run the tests and whatever the change touches.
     Approve only what you saw hold. Otherwise send it back to `@builder` in the
     thread, with what you ran and what came back."
   - `designer`: "You own how things look and read. When a task touches the
     interface or its words, say in its thread what should change and why."

   Check they're in before going on: `mycelium room members factory` lists all
   three.

4. **Pick a task with the user.** Ask for something small and real that a
   reviewer can check: a bug with a test, a small feature. If it touches the
   interface, the designer has something to do too.

5. **File it for the builder.** Being given the task wakes it, and it starts.

   ```bash
   mycelium board new "<the task>" "<what done looks like>" --assign @builder --room factory
   ```

## Run it

- **Bring in the designer** if the task touches the interface: mention
  `@designer` in the task's thread so it weighs in while the builder works.
- **Let the team hand it along.** The builder asks the reviewer when it's ready,
  and the reviewer approves or sends it back, all in the task's thread. Step in
  only if it stalls.
- **Follow along.** You run in the user's terminal, so nothing wakes you when
  the team talks. Check in with this, which returns as soon as something is
  said to you, or after 90 seconds with nothing. Keep the timeout under your
  shell's own command limit, and run it again while the team works:

  ```bash
  mycelium await --room factory --timeout 90
  ```

  and read the thread with `mycelium board messages <task> --room factory`.
- **Close it out.** When the reviewer approves, tell the user and ask whether to
  open the pull request and resolve the task.

## Show the user

While it runs, point the user at the app: the task's thread, where the build
and the review happen, and **Members**, which shows who is working right now.

When it's done, say what happened in a few lines. Mention that the roles are
just agents with instructions, so they can add, drop or rewrite one any time
(<https://mycelium-io.github.io/patterns/your-own.md>).
