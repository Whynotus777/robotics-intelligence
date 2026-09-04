import "server-only";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";

/**
 * The Atlas map is drawn, not tiled: a 110m world outline projected once on the
 * server into a single SVG path. No tile provider, no key, no network at run
 * time — and because the projection is plain equirectangular, a mark's position
 * is arithmetic the client can repeat without a projection library.
 */

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 500;

export function project(lng: number, lat: number): { x: number; y: number } {
  return { x: ((lng + 180) / 360) * MAP_WIDTH, y: ((90 - lat) / 180) * MAP_HEIGHT };
}

let cached: string | undefined;

/** The world as one path, rounded to whole units — precision a 1000px-wide map cannot show. */
export function worldPath(): string {
  if (cached) return cached;
  const topology = world as unknown as Topology;
  const countries = feature(topology, topology.objects.countries!);
  const projection = geoEquirectangular()
    .scale(MAP_WIDTH / (2 * Math.PI))
    .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
  cached = geoPath(projection).digits(1)(countries) ?? "";
  return cached;
}
