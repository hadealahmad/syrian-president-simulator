import json
from shapely.geometry import shape

with open('src/lib/spatial3d/syria-governorates.json') as f:
    gj = json.load(f)

LON_CENTER = 38.9940
LAT_CENTER = 34.8153
SCALE_X = 5.2
SCALE_Z = 6.333

ARABIC_NAMES = {
    'damascus': 'دمشق',
    'rif_dimashq': 'ريف دمشق',
    'aleppo': 'حلب',
    'homs': 'حمص',
    'hama': 'حماة',
    'latakia': 'اللاذقية',
    'tartus': 'طرطوس',
    'idlib': 'إدلب',
    'deir_ez_zor': 'دير الزور',
    'ar_raqqa': 'الرقة',
    'al_hasakah': 'الحسكة',
    'daraa': 'درعا',
    'as_suwayda': 'السويداء',
    'quneitra': 'القنيطرة',
}

provinces = []

for feat in gj['features']:
    gid = feat['id']
    geom = shape(feat['geometry'])
    if geom.geom_type == 'MultiPolygon':
        geom = max(geom.geoms, key=lambda g: g.area)
    
    # Clean and simplify with small tolerance
    geom = geom.simplify(0.0035, preserve_topology=True)

    # Convert exterior coords to 3D world (X, Z)
    exterior_pts = []
    for lon, lat in geom.exterior.coords:
        x = round((lon - LON_CENTER) * SCALE_X, 3)
        z = round(-(lat - LAT_CENTER) * SCALE_Z, 3)
        exterior_pts.append([x, z])
    
    # Handle interior holes if any
    holes_pts = []
    for hole in geom.interiors:
        h_pts = []
        for lon, lat in hole.coords:
            x = round((lon - LON_CENTER) * SCALE_X, 3)
            z = round(-(lat - LAT_CENTER) * SCALE_Z, 3)
            h_pts.append([x, z])
        if len(h_pts) >= 3:
            holes_pts.append(h_pts)

    c = geom.centroid
    cx = round((c.x - LON_CENTER) * SCALE_X, 3)
    cz = round(-(c.y - LAT_CENTER) * SCALE_Z, 3)

    provinces.append({
        'id': gid,
        'nameAr': ARABIC_NAMES.get(gid, gid),
        'center': {'x': cx, 'z': cz},
        'polygon': exterior_pts,
        'holes': holes_pts,
    })

ts_content = f"""/**
 * Precomputed 3D spatial boundary polygons for all 14 Syrian Republic Governorates.
 * Generated from official boundary data with:
 * - Unified Golan Heights into Quneitra
 * - Damascus & Rif Dimashq unified into one block and bisected vertically in half (Left: Damascus, Right: Rif Dimashq)
 * - Mercator projection centered at (0, 0) with true Syrian latitude aspect ratio
 */

export interface ProvinceGeoData {{
  id: string;
  nameAr: string;
  center: {{ x: number; z: number }};
  polygon: [number, number][];
  holes: [number, number][][];
}}

export const SYRIA_PROVINCES_GEO: ProvinceGeoData[] = {json.dumps(provinces, indent=2)};
"""

with open('src/lib/spatial3d/syria-map-data.ts', 'w') as f:
    f.write(ts_content)

print(f'Generated syria-map-data.ts successfully with {len(provinces)} provinces!')
