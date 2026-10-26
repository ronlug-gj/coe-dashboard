# COE Monitor

An initial design for the COE (Center of Excellence) dashboard: a web prototype for tracking the clinics working toward Center of Excellence status at ศูนย์การแพทย์กาญจนาภิเษก (Golden Jubilee Medical Center).

## Overview

COE Monitor shows where each clinic stands on the COE tier ladder and what it still needs to move up:

| Tier | Name |
| --- | --- |
| AOI | Area of Interest |
| dGJCOE | Developing GJCOE |
| GJCOE | GJCOE |
| iGJCOE | International GJCOE |

The prototype has these views:

- **Project overview** (`#overview`): project KPIs, growth charts that compare new COEs with the yearly target, and a heatmap of audit results by clinic and criterion.
- **All clinics** (`#clinics`): every clinic with its current tier, entry year and how many criteria it has passed, has not yet met, or is waiting on data. You can filter, search and sort the list.
- **Clinic detail** (`#clinic/<id>`): the clinic's evaluation history and its results on each criterion.
- **Clinic works** (`#clinic/<id>/<evaluation>/works`): the clinic's CQI, R2R/research and innovation works.

The data covers Thai fiscal years 2568–2569. A Thai fiscal year runs from ต.ค. (October) to ก.ย. (September). Pick the year with the selector in the top bar.

This is a design prototype, not a production system. It is built with React and Vite. It has no backend: all data is in static JS files.

## Project structure

```
index.html                  HTML shell; React mounts into #root
vite.config.js              Vite configuration
src/
  main.jsx                  Entry point
  dataset.js                Single data entry point for the app (real or demo data)
  App.jsx                   Layout (sidebar, top bar), hash routing, fiscal-year and drawer state
  lib.js                    Shared calculations (criteria summaries, tier status, URLs)
  data.js                   Tiers, audit criteria, clinics, facts and evaluations
  works.js                  Works register (CQI, research, innovations) per clinic
  styles.css                All styles
  logo.svg                  Medical center logo
  components/
    common.jsx              Tier badge, pill, icons, criteria bar
    Evaluation.jsx          Evaluation selectors and evaluation detail, shared by drawer and clinic page
    Drawer.jsx              Clinic quick-view drawer
  demo/
    data.js                 Dummy พ.ค. 2573 dataset (see "Demo data")
    works.js                Dummy works register matching the demo clinics
  views/
    Overview.jsx            Project overview: KPI cards, charts, heatmap
    Clinics.jsx             Clinic list with filters and sorting
    ClinicPage.jsx          Clinic detail page and works tab
```

To update the dashboard's content, edit `src/data.js` and `src/works.js`.

Routing uses the URL hash, with no router library. `#clinics/<id>` (or `#overview/<id>`) opens the clinic drawer on top of that view.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19+ or 22.12+
- [pnpm](https://pnpm.io/installation)

### Setup

```sh
git clone <repository-url>
cd coe-dashboard
pnpm install
```

### Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server with hot reload (http://localhost:5173) |
| `pnpm build` | Build the production site into `dist/` |
| `pnpm preview` | Serve the built `dist/` locally to check it |
| `pnpm dev:demo` | Start the dev server with the dummy demo data (see below) |
| `pnpm build:demo` | Build the site with the dummy demo data into `dist/` |

### Demo data (พ.ค. 2573)

`src/demo/` holds **dummy data** that shows the dashboard as it might look in พ.ค. 2573 (fiscal year 2573, month 8): 13 clinics, fiscal years 2568–2573, several dated evaluations per clinic, tier promotions, KPI history and a works register. It is invented for demos and is not real evaluation data. In demo mode the top bar shows a "ข้อมูลจำลอง" badge.

Demo mode is chosen at build time (`--mode demo`). `vite.config.js` points the `@data` and `@works` imports at either the real files or `src/demo/`, so each build contains only one dataset. In `src/demo/data.js` you only write each evaluation's statuses, facts and metrics; the criteria texts, tier history and KPI history are derived from them.

## Deployment

Run `pnpm build` and upload the contents of `dist/` to any static web host. The build uses relative asset paths, so it also works when served from a subfolder.

Opening `index.html` directly from disk does not work, because browsers block module scripts loaded from `file://`. Use `pnpm dev` or `pnpm preview` instead.
