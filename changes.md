# Changes

Changes since commit `7646507` ("Add dummy data to 2573, Add Demo build"). They apply to both the real build (`pnpm build`) and the demo build (`pnpm build:demo`) unless marked **Demo only**.

## New status: กำลังจัดระดับ (enrolled, no tier yet)

- A clinic can now be in the program before it has a tier. Its `tier` is `null`, and it shows as **กำลังจัดระดับ** ("เข้าร่วมโครงการแล้ว อยู่ระหว่างการประเมินเพื่อจัดระดับ") in light grey (`#D5D9DF`). The badge has a dashed outline so it doesn't look like AOI.
- It is defined as `ENROLLED` in `src/data.js`. It is not part of `TIERS`, so it has no requirements and no step on the tier ladder.
- `src/lib.js` has two new helpers, `tierInfo(id)` and `tierClass(id)`, which map `null` to `ENROLLED`. The tier badge, ladder and clinic page use them.
- **Demo only:** two new clinics, Dermatology (joined ก.ค. 2572) and Psychiatry (joined มี.ค. 2573), are still กำลังจัดระดับ. Each has a single undated placeholder record with no tier. The Pain clinic now joins in ส.ค. 2572 and is first assessed in เม.ย. 2573, to show a clinic that enrolls in one year and gets its tier in the next.
- **Demo only:** tier history now starts at the first assessment that gives a tier, not at the join date. The 13 existing clinics end up with the same history as before.

## Overview page

### จำนวนศูนย์ในโครงการรายเดือน (monthly area chart)

- Each month shows the tier every clinic held in that month, not its current tier. A promotion moves the clinic into the higher band from that month on, and the lower band shrinks. The subtitle now reads "จำแนกตามระดับ ณ แต่ละเดือน".
- Clinics count as กำลังจัดระดับ (bottom band) from the month they join until their first tier is assigned.
- The tier for any month comes from the new `tierAt(c, fy, month)` in `src/lib.js`. Undated evaluations, which is all of the real data, count from the join month.
- **Drill-down**, as in Power BI:
  - Click a month or a "ปีงบ" label (or press Enter on the label) to show only that fiscal year, with every month labelled and the y-axis rescaled.
  - "↑ ทุกปีงบ" goes back to all years, and ‹ › step between years.
  - Hovering a month shows the total and the count per tier.
  - Picking an earlier year in the top-bar selector than the drilled year returns the chart to all years.
- The y-axis maximum is now always a multiple of 4, so ticks are whole numbers. The last x-axis label is right-aligned so it isn't cut off.

### จำนวน COE จัดตั้งใหม่รายปีงบประมาณ (yearly bar chart)

- Removed the target (เป้าหมาย) dashed lines, their labels, the legend entry and the "เส้นประ = เป้าหมาย" note. The y-axis now scales to the bars only.
- Bars now count clinics by the fiscal year they **first received a tier**, coloured by that first tier. Before, they counted by join year and coloured by current tier. A clinic that enrolled last year and was assessed this year counts in this year.
- กำลังจัดระดับ clinics are not counted, and their colour is not in this chart's legend.
- New subtitle: "ศูนย์ที่ได้รับการจัดระดับครั้งแรกในแต่ละปีงบ · จำแนกตามระดับที่ได้รับ".

### ผลการตรวจประเมินตามเกณฑ์ COE (heatmap)

- Cells show the status colour only. Hover a cell to see the clinic, the criterion, the result text and the status.
- Every status cell is the same size (72px wide):
  - the table takes only the width it needs
  - long clinic names are cut off with "…", and the full name shows on hover
  - criterion labels and rate cells no longer wrap
- **อัตราผ่านเกณฑ์** is now a single column instead of one per tier (dGJCOE / GJCOE / iGJCOE):
  - each row shows the share of the selected clinics whose result for that criterion is ผ่าน
  - the footer row shows all passes ÷ (15 criteria × clinics)
- **Frozen columns:** เกณฑ์ (280px) and การประเมิน (120px) stay on the left and อัตราผ่านเกณฑ์ stays on the right. Only the clinic columns scroll sideways.
- กำลังจัดระดับ clinics are left out of the heatmap and its clinic dropdown.

## Criterion statuses

- **รอข้อมูล is no longer used for assessed clinics.** Criteria that were waiting for data or in progress now show as **ผ่านบางส่วน**, and keep their original note (for example "อยู่ระหว่างติดตามข้อมูล"). In the real data this affects 15 criteria.
- **รอข้อมูล is kept only for กำลังจัดระดับ clinics.** All their criteria are รอข้อมูล with the note "รอการประเมินเพื่อจัดระดับ". The heatmap legend doesn't list รอข้อมูล, because those clinics aren't in the heatmap.
- The KPI cards' own รอข้อมูล status (whether outcome data exists for a target) is unchanged.

## ศูนย์ทั้งหมด (clinic list)

- Removed the รอข้อมูล column. The criteria-filter help text now reads "รวมไม่ผ่านและผ่านบางส่วน".
- กำลังจัดระดับ clinics show "รอการประเมินเพื่อจัดระดับ" in the ยังไม่ผ่าน column.

## Clinic page and drawer

- **New card order on the clinic page:** ความก้าวหน้าตามการประเมิน, then รายละเอียดการประเมิน, then ประวัติผลรายเกณฑ์. ประวัติผลรายเกณฑ์ is now its own card.
- รายละเอียดการประเมิน on the clinic page no longer shows the ผลการตรวจตามเกณฑ์ list, since ประวัติผลรายเกณฑ์ already covers it. The drawer still shows the list.
- The criteria summary has three boxes: ผ่านเกณฑ์, ผ่านบางส่วน and ไม่ผ่าน. A fourth box, รอข้อมูล, appears only for กำลังจัดระดับ clinics.
- **The page no longer scrolls to the top when you choose another evaluation** with an evaluation card, the coloured squares or the การประเมิน dropdown. Changing tab, changing clinic or leaving the page still scrolls to the top.

## Other

- `README.md`: the overview description mentions drill-down instead of the yearly target, and the clinic list description no longer mentions waiting-for-data counts.
- No longer used, but kept: `tierStatus` in `src/lib.js` and `TIER_REQ` / `TIER_MIN` in the data files. They supported the per-tier pass-rate columns that the heatmap no longer has.
