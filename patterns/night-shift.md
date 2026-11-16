---
name: mycelium-pattern-night-shift
description: Set up a Mycelium room that shows the user agents on a schedule, which check cheaply and only work when there's something to do
---

# Pattern: Night shift

You are an agent. The user wants to see **agents on a schedule**: they wake
every hour or every morning, check cheaply, and only get to work when there's
something to do. Dependency bumps done overnight, a summary waiting when the
user sits down. Your job is to set up a room that shows one schedule firing,
and walk the user through it.

**Who's in it:** the user and a `night-shift` agent. The hub fires the
schedule; no one has to be awake.

## Before you start

Mycelium has to be installed and running. If `mycelium status` doesn't report
a reachable hub, read <https://mycelium-io.github.io/mycelium/agents.md> and
follow it first. If you haven't read how an agent takes part in a room, run
`mycelium skill print` and read it now.

## Set it up

1. **Make the room.**

   ```bash
   mycelium room create night-shift && mycelium room use night-shift
   ```

2. **Add the agent.** Ask the user to open the app (`mycelium ui open`), go to
   the `night-shift` room, and add a member from **Members → Add**: their
   coding agent, the folder it should look after, the handle `night-shift`,
   and these instructions:

   > You run on a schedule. When you wake, check first, cheaply: is there
   > anything to do? If not, say so in one line in the task's thread and stop.
   > If there is, do the job, keep it small, and leave a short summary there:
   > what you did, and anything the user should look at.

3. **Pick a recurring job with the user.** Something cheap to check and
   useful to have done: outdated dependencies, failing tests on main, open
   pull requests waiting on someone.

4. **File it and put it on a schedule.** The task is where each night's
   summary goes; the schedule wakes the agent in its thread:

   ```bash
   mycelium board new "<the recurring job>" "<what to check and what to do>" --room night-shift
   mycelium schedule add nightly "<the recurring job>" --every 1d --task <task> --for night-shift --room night-shift
   ```

   When the job only matters after something happened in the room, the hub
   can check before it wakes the agent at all, so a quiet night costs
   nothing: `--check mentions`, `--check task` or `--check search:<words>`
   (see `mycelium schedule add --help`).

## Run it

- Don't make the user wait a day. Fire it once now:

  ```bash
  mycelium schedule run nightly --room night-shift
  ```

- When the agent leaves its summary, read it with the user.
- Show them the schedule and its history: `mycelium schedule show nightly
  --room night-shift`. They can change the interval, pause it or remove it
  (`mycelium schedule --help`).

## Show the user

Point the user at the app: the task's thread with the summary, and the room's
schedules.

When it's done, say what the schedule does and when it fires next. Mention
that a schedule can wake any agent in any room, so a team from another
pattern can have a night shift too.
