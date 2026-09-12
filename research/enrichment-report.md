# Robotics enrichment report — 2026-09-11

417 organizations added to the baseline of 71; 488 organizations now in the seed. All 64 must-include names resolve by canonical name or explicit alias. Tesla Optimus resolves to the robot, with Tesla represented separately as its organization. Every must-include organization also has a sourced founding-year claim, with business-origin and incorporation distinctions qualified where needed.

All 140 HIGH rows are seeded. Across the four rosters, 400 rows resolve to 381 distinct organizations; 93 rows remain pending, 45 LOW rows were skipped, and Uber was dropped. Parent organizations added to support sourced ownership edges are counted separately from roster coverage.

| Roster | Seeded rows | Pending | Skipped LOW | Dropped |
|---|---:|---:|---:|---:|
| infrastructure-data-sim-ops.csv | 64 | 12 | 16 | 0 |
| oems-integrators-operators.csv | 122 | 22 | 3 | 1 |
| platforms-investors-labs.csv | 125 | 22 | 3 | 0 |
| suppliers-chips-manufacturing.csv | 89 | 37 | 23 | 0 |

## Organizations by role

Roles overlap; a company can contribute to several counts. “Added” counts organizations introduced in this enrichment, not existing organizations whose metadata or roles were expanded.

| HAS_ROLE | Added organizations | Total organizations |
|---|---:|---:|
| CHIPMAKER | 15 | 19 |
| COMPONENT_SUPPLIER | 79 | 89 |
| CONTRACT_MANUFACTURER | 7 | 7 |
| DATA_SIMULATION_PROVIDER | 43 | 43 |
| INTEGRATOR | 18 | 21 |
| INVESTOR | 48 | 57 |
| MODEL_DEVELOPER | 31 | 41 |
| OEM | 126 | 172 |
| OPERATOR | 21 | 36 |
| PLATFORM | 28 | 36 |
| RESEARCH_LAB | 46 | 53 |
| TOOLING_OPS_PROVIDER | 45 | 45 |

## Atlas layers

Counts are the actual generated API layer counts, not estimates from role totals. They require a qualifying role and a mapped place. Provisional headquarters are included and remain labeled in claim evidence. DEPLOYED counts documented deployments, not operator headquarters.

| Layer | Count | Map places |
|---|---:|---:|
| BUILT | 170 | 108 |
| SUPPLIED | 89 | 67 |
| MANUFACTURED | 7 | 5 |
| DEPLOYED | 1 | 1 |
| TRAINED | 110 | 60 |
| FUNDED | 53 | 32 |
| PLATFORMS | 64 | 47 |

## Evidence and metadata limits

The seed contains 80 dated PART_OF edges and 52 INVESTED_IN edges. Ownership and investment evidence is restricted to PRIMARY or credible THIRD_PARTY sources with URLs. Supplier relationships use the product graph; the Kollmorgen/KUKA actuator example is supported by [Kollmorgen’s published case study](https://www.kollmorgen.com/sites/default/files/2025-02/Kuka%20and%20Kollmorgen%20Collaboratively%20Engineer%20Optimized%20Motors_SU_KM_SS_RevB_English.pdf). No trade-blog supplier rumor was promoted into an OEM supply edge.

191 organizations have non-provisional headquarters claims, 258 have provisional roster headquarters, and 39 have no HQ place. 205 have a founding-year claim; 283 still lack one. 54 have a current sourced ticker. A missing ticker does not imply that an organization is private. Year-only dates are explicitly qualified and approximate. The totals include inherited seed claims and parent-context organizations.

356 organizations require metadata follow-up in [metadata-review.csv](metadata-review.csv). 28 roster rows still have a pending parent review; this can overlap with pending organization rows. A confirmed robotics role does not automatically validate the roster’s parent or location.

Original role, parent and headquarters values are retained alongside normalized values in each roster. [primary-source-review.csv](primary-source-review.csv) records primary URLs, retrieval outcomes and decisions. Failed retrievals are disclosed; HIGH entries remain seeded as requested. MEDIUM entries without a confirmed robotics role remain pending.

Notable ownership corrections include [Rainbow Robotics → Samsung Electronics](https://images.samsung.com/is/content/samsung/assets/global/ir/docs/2025_con_quarter02_all.pdf) (completed 2025-03-12), [Ansys → Synopsys](https://investor.synopsys.com/news/news-details/2025/Synopsys-Completes-Acquisition-of-Ansys/default.aspx) (completed 2025-07-17), [idealworks → Agile Robots](https://www.agile-robots.com/media/files/New_website/Solutions/Thor_series/AR-ThorSeries-Productflyer-SCREEN-en-20260130.pdf), and [Shaip → Ubiquity Global Services](https://www.shaip.com/about/). SoftBank’s investment in Agile Robots was not treated as parent control. [Kongsberg Maritime’s post-spin-off status](https://www.kongsbergmaritime.com/news-and-events/news-archive/2026/kongsberg-maritime-begins-trading-on-oslo-stock-exchange/) replaces the old parent assertion. Hyundai Motor Group is modeled separately from the listed Hyundai Motor Company. Each seeded edge carries its own source and date qualification.

## Rows left pending

Full URLs and row-specific reasons are in [pending-rows.csv](pending-rows.csv). These are unresolved role reviews, distinct from the metadata queue above.

**infrastructure-data-sim-ops.csv (12)**

Labelbox; XDOF; Rendered.ai; dSPACE; Vector Informatik; Altair Engineering; Cognicept Systems; Freedom Robotics; Rapyuta Robotics; Airbotics; Deeplite; drag&bot.

**oems-integrators-operators.csv (22)**

Kepler Robotics; Robot Era; DENSO Robotics; Staubli Robotics; Amazon Prime Air; UPS Flight Forward; Helsing; MARTAC; Leidos; QinetiQ; Rheinmetall; Monarch Tractor; Burro; Stryker; Johnson & Johnson MedTech; CMR Surgical; Vicarious Surgical; PROCEPT BioRobotics; Canvas; SafeAI; Ocean Infinity; Palladyne AI.

**platforms-investors-labs.csv (22)**

Samsung NEXT; SK Telecom; Mirae Asset; Xiaomi; XPeng; XPeng Robotics (Pengyan Technology); Alibaba Group; Huawei; Meituan; CATL; Hillhouse Investment; IDG Capital; Flexion Robotics; WP Global Partners; Thrive Capital; Index Ventures; Accel; Kleiner Perkins; KAIST Humanoid Robot Research Center; Beijing Academy of Artificial Intelligence (BAAI); Humanoid Robot (Shanghai) Co.; Tsinghua University Institute for Embodied Intelligence and Robotics.

**suppliers-chips-manufacturing.csv (37)**

Laifual Drive; Nidec-Shimpo; Guomao Group; Allient (Allied Motion Technologies); Moog; Sanhua Intelligent Controls; Tuopu Group; T-Motor (Nanchang Sanrui); Elmo Motion Control; Broadcom; THK; SKF; CATL; EVE Energy; LG Energy Solution; Samsung SDI; SK On; Panasonic Energy; Molicel (E-One Moli Energy); Sunwoda; Murata; Innoviz Technologies; SICK AG; Leica Geosystems; Cognex; Keyence; Datalogic; Pilz; Robotous; Kistler; Touchence; Analog Devices; Horizon Robotics; Sony Semiconductor Solutions; Quanta Computer; Luxshare Precision; Hexagon.

## Validation and delivery

Each enrichment batch was validated with `pnpm db:reset && pnpm db:migrate && pnpm seed && pnpm fixtures && pnpm check`, committed, rebased on main and pushed without force. Fixtures were generated, never hand-edited. Final validation includes the must-include coverage gate, ownership/investment evidence tests, provisional-HQ safeguards and HTTP checks for the new atlas role mappings.

Final validation: all 111 tests passed across 11 test files after a fresh database reset, migration, seed and fixture generation. Canonical-name, row-state, EMS-role and pending-review audits also passed.
