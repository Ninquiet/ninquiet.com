---
title: "TinyAgentOffice"
date: 2026-09-14
category: agents
tags: ["electron", "react", "typescript", "sqlite", "multi-agent"]
summary: "A tiny office where AI agents coordinate their work, with roles, reviews, and a dashboard to watch it all."
version: "v0.1.1"
license: "source-available (PolyForm Noncommercial)"
featured: true
links:
  - label: "GitHub"
    url: "https://github.com/Ninquiet/TinyAgentOffice"
---

TinyAgentOffice started from a practical need while building a personal game: too much time went into re-explaining context, assigning tasks by hand, and supervising agents one by one.

Instead of one long model session that loses focus, it organizes several agents with defined roles, responsibilities, and escalation paths, so AI collaboration feels less like isolated prompting and more like a coordinated team.

## Two sides

- A **visual dashboard** for me, to track what is happening across the system.
- A **CLI layer** for the agents, where they request tasks, report progress, ask for help, and signal completion.

## The loop

Execution agents do the work, a senior reviewer role checks it before it reaches me, and if I reject a result the task goes back into the system for reassignment. Work is not just marked as done; it is reviewed, validated, and iterated.
