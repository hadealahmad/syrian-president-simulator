"""Build src/lib/spatial3d/syria-region-context.ts from Natural Earth 50m admin-0.

Same equirectangular frame as the Syria 2D map: the Natural Earth Syria
bbox is affine-fit to the SVG bbox of the stylized governorate paths, so
shared borders meet and neighbors render seamlessly underneath Syria.

Neighbors are decoration today (pointer-events: none) but emitted as
structured features (id / Arabic + English names / path / label anchor)
so later UI interactions can target them directly.

Usage:
    python3 scripts/generate-region-context.py /tmp/ne50.geojson
"""
import json
import re
import sys
from pathlib import Path
from shapely.geometry import shape, box
from shapely.ops import unary_union

SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/tmp/ne50.geojson')
REPO = Path(__file__).resolve().parent.parent
OUT = REPO / 'src/lib/spatial3d/syria-region-context.ts'
PATHS_TS = REPO / 'src/lib/spatial3d/syria-2d-paths.ts'

# Stylized Syria frame in SVG units (measured from syria-2d-paths.ts)
SVG_X0, SVG_Y0, SVG_X1, SVG_Y1 = 58.0, 40.0, 942.0, 840.0

# Region window (lon/lat) — generous so wide screens get filled context,
# reaching the Gulf states and Iran in the east, Arabia + Yemen in the south.
CLIP = box(28.0, 12.0, 63.5, 42.0)

WANT = [
    ('Turkey', 'turkiye', 'تركيا', 'Turkey'),
    ('Iraq', 'iraq', 'العراق', 'Iraq'),
    ('Jordan', 'jordan', 'الأردن', 'Jordan'),
    ('Lebanon', 'lebanon', 'لبنان', 'Lebanon'),
    ('Cyprus', 'cyprus', 'قبرص', 'Cyprus'),
    ('Saudi Arabia', 'saudi', 'السعودية', 'Saudi Arabia'),
    ('Egypt', 'egypt', 'مصر', 'Egypt'),
    ('Iran', 'iran', 'إيران', 'Iran'),
    ('Kuwait', 'kuwait', 'الكويت', 'Kuwait'),
    ('Bahrain', 'bahrain', 'البحرين', 'Bahrain'),
    ('Qatar', 'qatar', 'قطر', 'Qatar'),
    ('United Arab Emirates', 'uae', 'الإمارات', 'UAE'),
    ('Oman', 'oman', 'عُمان', 'Oman'),
    ('Yemen', 'yemen', 'اليمن', 'Yemen'),
]
# Israel + Palestine are drawn unified as occupied Palestine.
MERGED = [('Israel', 'Palestine', 'occupied-palestine', 'فلسطين المحتلة', 'Occupied Palestine')]


def main() -> None:
    data = json.loads(SRC.read_text(encoding='utf-8'))
    geoms = {}
    for feat in data['features']:
        name = feat['properties'].get('ADMIN')
        if name in {w[0] for w in WANT} | {'Syria', 'Israel', 'Palestine'}:
            geoms[name] = shape(feat['geometry'])
    # Israel + Palestine drawn unified as occupied Palestine.
    geoms['occupied-palestine'] = unary_union(
        [geoms.pop('Israel'), geoms.pop('Palestine')])

    # --- Georeferencing: the stylized map is authoritative, but its outer
    # border is real-data-derived EXCEPT the Golan section (unified into
    # Quneitra, min-x 58). A naive bbox fit anchors x=58 to the real coast
    # (lon 35.76) instead of the Golan edge (~35.55) — a ~27px systematic
    # eastward shift of the whole region layer. So each axis is fit only on
    # sides the stylization never touched: N/S/E extremes + the coast band.
    shp = __import__('shapely').geometry.Polygon
    raw_styl = PATHS_TS.read_text(encoding='utf-8')
    styl_by_id: dict[str, object] = {}
    for m in re.finditer(
            r'"id":\s*"([^"]+)"[^}]*?"path":\s*"([^"]+)"', raw_styl):
        gid, d = m.group(1), m.group(2)
        nums = [float(x) for x in re.findall(r'-?\d+(?:\.\d+)?', d)]
        styl_by_id[gid] = shp(list(zip(nums[0::2], nums[1::2])))

    real = geoms['Syria']
    rminlon, rminlat, rmaxlon, rmaxlat = real.bounds

    # Y axis: Turkish border (north) and Jordanian border (south), both clean.
    sy = (SVG_Y1 - SVG_Y0) / (rmaxlat - rminlat)
    y0 = SVG_Y0 + rmaxlat * sy

    def y_of(lat: float) -> float:
        return y0 - lat * sy

    # X axis: Iraqi border (east, clean) + coast band average (clean).
    from shapely.geometry import LineString
    coast_lons, coast_xs = [], []
    latakia = styl_by_id['latakia']
    for i in range(15):
        lat = 35.2 + i * 0.05
        rl = real.intersection(LineString([(34.0, lat), (38.0, lat)]))
        if rl.is_empty:
            continue
        rlon = rl.bounds[0]
        yy = y_of(lat)
        sl = latakia.intersection(LineString([(0.0, yy), (400.0, yy)]))
        if sl.is_empty:
            continue
        coast_lons.append(rlon)
        coast_xs.append(sl.bounds[0])
    coast_lon = sum(coast_lons) / len(coast_lons)
    coast_x = sum(coast_xs) / len(coast_xs)
    sx = (SVG_X1 - coast_x) / (rmaxlon - coast_lon)
    x0 = SVG_X1 - rmaxlon * sx
    print(f'fit: coast lon {coast_lon:.3f} -> x {coast_x:.1f}; '
          f'east {rmaxlon:.2f} -> {SVG_X1:.0f}; sx={sx:.2f} sy={sy:.2f}')

    def proj(lon: float, lat: float) -> tuple[float, float]:
        return (x0 + lon * sx, y0 - lat * sy)

    # Diagnostic: the Golan west edge (lives in the Israel feature) must land
    # on the stylized Quneitra edge (~58). If it does, the shift is gone.
    gol = geoms['occupied-palestine'].intersection(box(35.4, 32.9, 36.2, 33.42))
    print(f'golan-check: west edge lon {gol.bounds[0]:.3f} -> '
          f'x {proj(gol.bounds[0], 33.0)[0]:.1f} (expect ~58)')

    def ring_path(coords) -> str:
        pts = [proj(lon, lat) for lon, lat in coords]
        return 'M ' + ' L '.join(f'{x:.1f} {y:.1f}' for x, y in pts) + ' Z'

    def geom_path(geom) -> str:
        polys = geom.geoms if geom.geom_type == 'MultiPolygon' else [geom]
        parts = []
        for poly in polys:
            parts.append(ring_path(poly.exterior.coords))
            for hole in poly.interiors:
                parts.append(ring_path(hole.coords))
        return ' '.join(parts)

    def svg_ring_path(coords) -> str:
        # Integers, like syria-2d-paths.ts — same low-poly hand feel.
        return 'M ' + ' L '.join(f'{x:.0f} {y:.0f}' for x, y in coords) + ' Z'

    def svg_geom_path(geom) -> str:
        """Emit path for geometry already in SVG units (no projection)."""
        polys = geom.geoms if geom.geom_type == 'MultiPolygon' else [geom]
        parts = []
        for poly in polys:
            parts.append(svg_ring_path(poly.exterior.coords))
            for hole in poly.interiors:
                parts.append(svg_ring_path(hole.coords))
        return ' '.join(parts)

    # Real Syria outline as the land base: any gap between the stylized
    # governorate edge and the true border shows Syrian land, never sea —
    # so Lebanon / occupied Palestine always read as adjacent, never adrift.
    syria_base_d = geom_path(
        geoms['Syria'].intersection(CLIP).simplify(0.02, preserve_topology=True))
    print(f'syria-base: {len(syria_base_d)//1024}KB')

    # Stylized Syria union in SVG space — the game map is canonical. Region
    # geometry is differenced against it (plus a hairline margin) so neighbor
    # fills and strokes can never cross into Syria; borders hug the real edge.
    STYL = unary_union(list(styl_by_id.values()))
    STYL_MARGIN = STYL.buffer(2.5, join_style=2)

    def to_svg_space(geom):
        polys = geom.geoms if geom.geom_type == 'MultiPolygon' else [geom]
        out = []
        for poly in polys:
            ext = [proj(lon, lat) for lon, lat in poly.exterior.coords]
            holes = [
                [proj(lon, lat) for lon, lat in hole.coords]
                for hole in poly.interiors
            ]
            p = shp(ext, holes)
            if p.is_valid and not p.is_empty:
                out.append(p)
        return unary_union(out) if out else None

    # Near layer (filtered, bent): border states + label anchors near Syria.
    # Far layer (unfiltered, static): everything distant — the tube field
    # reads neutral gray out there, so bent == unbent and the filter cost
    # is skipped entirely. Features crossing the split line are divided in
    # neutral-field territory, so no seam can show.
    NEAR_IDS = {'turkiye', 'iraq', 'jordan', 'lebanon', 'cyprus',
                'occupied-palestine'}
    from shapely.geometry import box as _box
    NEAR_SPLIT = {
        'turkiye': _box(-538.0, -200.0, 1e5, 1e5),
        'iraq': _box(-1e5, -1e5, 1350.0, 1e5),
        'jordan': _box(-1e5, -1e5, 1e5, 1300.0),
    }
    near, far, far_labels = [], [], []
    rows = list(WANT) + [('occupied-palestine', 'occupied-palestine',
                          'فلسطين المحتلة', 'Occupied Palestine')]
    for admin, fid, name_ar, name_en in rows:
        g = geoms[admin].intersection(CLIP)
        if g.is_empty:
            continue
        g = g.simplify(0.02, preserve_topology=True)
        # Drop map-dust islands, but always keep Cyprus
        polys = [p for p in (g.geoms if g.geom_type == 'MultiPolygon' else [g])]
        polys = [
            p for p in polys
            if fid == 'cyprus' or p.area * sx * sy > 200.0
        ]
        if not polys:
            continue
        g_svg = to_svg_space(unary_union(polys))
        if g_svg is None or g_svg.is_empty:
            continue
        # Chunky low-poly density like the governorate paths (~50px segments):
        # simplify in screen units BEFORE the difference, so the 2.5px
        # Syria margin stays exact and no vertex can wander inside.
        g_svg = g_svg.simplify(7.0, preserve_topology=True)
        if g_svg.is_empty:
            continue
        # Defer to the stylized map: nothing regional inside Syria's edge.
        g_svg = g_svg.difference(STYL_MARGIN)
        if g_svg.is_empty:
            continue
        # Label anchor: the closest point to Syria, pushed outward for
        # breathing room — labels hug the border instead of sitting at
        # far-off centroids. Falls back toward the edge if the push would
        # leave the territory. Small western neighbors keep their old
        # centroid anchors (explicitly pinned).
        from shapely.ops import nearest_points
        from shapely.geometry import Point
        import math
        anchor = None
        if fid in ('lebanon', 'occupied-palestine', 'cyprus'):
            biggest = max(
                g_svg.geoms if g_svg.geom_type == 'MultiPolygon' else [g_svg],
                key=lambda p: p.area,
            )
            anchor = biggest.representative_point()
        else:
            p_styl, p_edge = nearest_points(STYL, g_svg)
            dx, dy = p_edge.x - p_styl.x, p_edge.y - p_styl.y
            leng = math.hypot(dx, dy) or 1.0
            anchor = p_edge
            for off in (44, 34, 24, 14, 0):
                cand = Point(p_edge.x + dx / leng * off,
                             p_edge.y + dy / leng * off)
                if off == 0 or g_svg.contains(cand):
                    anchor = cand
                    break
        label = [round(anchor.x, 1), round(anchor.y, 1)]
        if fid in NEAR_IDS:
            near_geom, far_geom = g_svg, None
            if fid in NEAR_SPLIT:
                near_geom = g_svg.intersection(NEAR_SPLIT[fid])
                far_geom = g_svg.difference(NEAR_SPLIT[fid])
            if not near_geom.is_empty:
                near.append({
                    'id': fid, 'nameAr': name_ar, 'nameEn': name_en,
                    'path': svg_geom_path(near_geom), 'labelAt': label,
                })
            if far_geom is not None and not far_geom.is_empty:
                far.append({'id': fid + '-far',
                            'path': svg_geom_path(far_geom)})
            print(f'{fid}: near label=({anchor.x:.0f},{anchor.y:.0f})')
        else:
            far.append({'id': fid, 'path': svg_geom_path(g_svg)})
            far_labels.append({'id': fid, 'nameAr': name_ar,
                               'labelAt': label})
            print(f'{fid}: far label=({anchor.x:.0f},{anchor.y:.0f})')

    # Gasket: union of the real stylized governorate paths, dilated a few px,
    # drawn in land color under everything so stylization seams can never gap.
    raw = PATHS_TS.read_text(encoding='utf-8')
    gov_polys = []
    for m in re.finditer(r'"path": "([^"]+)"', raw):
        nums = [float(x) for x in re.findall(r'-?\d+(?:\.\d+)?', m.group(1))]
        gov_polys.append(
            __import__('shapely').geometry.Polygon(
                list(zip(nums[0::2], nums[1::2])))
        )
    gasket = unary_union(gov_polys).buffer(6.0, join_style=2)
    gasket_d = geom_path(gasket)
    print(f'gasket: {len(gasket_d)//1024}KB')

    lines = [
        '// Regional context for the Syria 2D map — generated from Natural Earth',
        '// 50m admin-0 (real borders, same frame as the governorate paths).',
        '// DO NOT hand-edit: regenerate with scripts/generate-region-context.py.',
        '// Neighbors are decoration today (pointer-events: none) but structured',
        '// with stable ids for future UI interactions.',
        '',
        'export interface RegionFeature {',
        '  id: string;',
        '  nameAr: string;',
        '  nameEn: string;',
        '  path: string;',
        '  labelAt: [number, number];',
        '}',
        '',
        'export interface FarFeature { id: string; path: string; }',
        'export interface FarLabel {',
        '  id: string;',
        '  nameAr: string;',
        '  labelAt: [number, number];',
        '}',
        '',
        '// Sea backdrop rect (SVG units — deliberately huge; the map canvas clips it).',
        "export const REGION_SEA = 'M -5000 -5000 L 5000 -5000 L 5000 5000 L -5000 5000 Z';",
        '',
        '// Dilated Syria union in land color — hides any stylization seam.',
        f"export const SYRIA_UNDERLAY = '{gasket_d}';",
        '',
        '// True Syria outline in land color — neighbors always meet land, never sea.',
        f"export const SYRIA_BASE = '{syria_base_d}';",
        '',
        'export const REGION_NEAR: RegionFeature[] = [',
    ]
    for feat in near:
        lines.append('  {')
        lines.append(f"    id: '{feat['id']}',")
        lines.append(f"    nameAr: '{feat['nameAr']}',")
        lines.append(f"    nameEn: '{feat['nameEn']}',")
        lines.append(f"    path: '{feat['path']}',")
        lines.append(
            f"    labelAt: [{feat['labelAt'][0]}, {feat['labelAt'][1]}],")
        lines.append('  },')
    lines += [
        '];',
        '',
        'export const REGION_FAR: FarFeature[] = [',
    ]
    for feat in far:
        lines.append('  {')
        lines.append(f"    id: '{feat['id']}',")
        lines.append(f"    path: '{feat['path']}',")
        lines.append('  },')
    lines += [
        '];',
        '',
        'export const REGION_FAR_LABELS: FarLabel[] = [',
    ]
    for feat in far_labels:
        lines.append('  {')
        lines.append(f"    id: '{feat['id']}',")
        lines.append(f"    nameAr: '{feat['nameAr']}',")
        lines.append(
            f"    labelAt: [{feat['labelAt'][0]}, {feat['labelAt'][1]}],")
        lines.append('  },')
    lines += [
        '];',
        '',
    ]
    OUT.write_text('\n'.join(lines), encoding='utf-8')
    print(f'wrote {OUT} ({OUT.stat().st_size//1024}KB)')


if __name__ == '__main__':
    main()
