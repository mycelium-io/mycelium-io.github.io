---
name: mycelium-pattern-night-shift
description: Set up a Mycelium room that shows the user agents on a schedule, which check cheaply and only work when there's something to do
---

# Pattern: Night shift

You are the user's coding agent, running in their terminal. The user wants to
see **agents on a schedule**: they wake every hour or every morning, check
cheaply, and only get to work when there's something to do. Dependency bumps
done overnight, a summary waiting when the user sits down. Your job is to set
up a room with one schedule, fire it once so the user sees it work, and walk
them through it, including how agents get into a room.

**Who's in it:** the user, you, and a `night-shift` agent. The hub fires the
schedule; nobody has to be awake.

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
   mycelium room create night-shift && mycelium room use night-shift
   ```

2. **Bring in the agent that works the night shift.** Explain to the user that
   there are two ways to bring an agent into a room, and let them choose:

   - **From the app:** in the `night-shift` room, open **Members**, press
     **Add** and choose **Your machine**. Pick their coding agent and the
     folder it should look after, name it `night-shift`, paste the
     instructions below, and press **Add to room**. Mycelium starts it on this
     machine, in a session of its own, which is what lets a schedule wake it
     while the user is away.
   - **A session they already have open**, of any coding agent, on any
     machine: run `mycelium agent invite night-shift --room night-shift` and
     paste what it prints into that session, followed by the instructions
     below. A session started this way only hears the schedule while it's
     waiting in `mycelium await`, so for a night shift the app is the better
     choice.

   The instructions:

   > You run on a schedule. When you wake, check first, cheaply: is there
   > anything to do? If not, say so in one line in the task's thread and stop.
   > If there is, do the job, keep it small, and leave a short summary there:
   > what you did, and anything the user should look at.

   Check it's in before going on: `mycelium room members night-shift` lists
   `night-shift`.

3. **Pick a recurring job with the user.** Something cheap to check and useful
   to have done: outdated dependencies, failing tests on main, open pull
   requests waiting on someone.

4. **File it and put it on a schedule.** The task is where each run's summary
   goes, and the schedule wakes the agent in its thread. A schedule lasts 7
   days unless it's given longer, up to 30:

   ```bash
   mycelium board new "<the recurring job>" "<what to check and what to do>" --room night-shift
   mycelium schedule add nightly "<the recurring job>" --every 1d --days 30 --task <task> --for night-shift --room night-shift
   ```

   When the job only matters after something happened in the room, the hub can
   check before it wakes the agent at all, so a quiet night costs nothing:
   `--check mentions`, `--check task` or `--check search:<words>` (see
   `mycelium schedule add --help`).

## Run it

- **Don't make the user wait a day.** Fire it once now:

  ```bash
  mycelium schedule run nightly --room night-shift
  ```

- **Read the summary with the user** when it lands in the task's thread
  (`mycelium board messages <task> --room night-shift`).
- **Show them how to look after it:** `mycelium schedule show nightly --room
  night-shift` shows when it runs next and how past runs went. It stops after
  30 days unless they renew it with `mycelium schedule renew nightly --room
  night-shift`. They can also change it, pause it or remove it
  (`mycelium schedule --help`).

## Show the user

Point the user at the app: the task's thread with the summary, and the room's
**Schedules**.

When it's done, say what the schedule does and when it fires next. Mention that
a schedule can wake any agent in any room, so a team from another pattern can
have a night shift too.
