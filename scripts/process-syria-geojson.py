import json
import matplotlib.pyplot as plt
from shapely.geometry import shape, mapping, box, Polygon, MultiPolygon
from shapely.ops import unary_union

with open('/tmp/syria_raw.geojson') as f:
    raw = json.load(f)

# Map raw province_name to our governorate IDs
NAME_TO_ID = {
    'Damascus': 'damascus',
    'Rif Dimashq': 'rif_dimashq',
    'Aleppo': 'aleppo',
    'Homs': 'homs',
    'Hamah': 'hama',
    'Lattakia': 'latakia',
    'Tartus': 'tartus',
    'Idlib': 'idlib',
    'Dayr Az Zawr': 'deir_ez_zor',
    'Ar Raqqah': 'ar_raqqa',
    'Al Ḥasakah': 'al_hasakah',
    'Dar`a': 'daraa',
    'As Suwayda': 'as_suwayda',
    'Quneitra': 'quneitra',
}

features_by_id = {}
for feat in raw['features']:
    pname = feat['properties']['province_name']
    gov_id = NAME_TO_ID.get(pname)
    if gov_id:
        features_by_id[gov_id] = shape(feat['geometry'])

# 1. Unify Golan with Quneitra
q_geom = features_by_id['quneitra']
if q_geom.geom_type == 'MultiPolygon':
    q_unified = unary_union(list(q_geom.geoms))
else:
    q_unified = q_geom
features_by_id['quneitra'] = q_unified

# 2. Combine Damascus and Rif Dimashq, then cut vertically in half
d_geom = features_by_id['damascus']
rd_geom = features_by_id['rif_dimashq']
combined_dam = unary_union([d_geom, rd_geom])

minx, miny, maxx, maxy = combined_dam.bounds
x_mid = (minx + maxx) / 2.0

box_left = box(minx - 0.2, miny - 0.2, x_mid, maxy + 0.2)
box_right = box(x_mid, miny - 0.2, maxx + 0.2, maxy + 0.2)

left_damascus = combined_dam.intersection(box_left)
right_rif_dimashq = combined_dam.intersection(box_right)

features_by_id['damascus'] = left_damascus
features_by_id['rif_dimashq'] = right_rif_dimashq

# Output processed GeoJSON
final_geojson = {
    'type': 'FeatureCollection',
    'features': []
}

fig, ax = plt.subplots(figsize=(12, 10))

colors = [
    '#5a7d65', '#8c7b5b', '#607d8b', '#795548', '#8d6e63',
    '#4e6e5d', '#3e5246', '#546e7a', '#78909c', '#6d4c41',
    '#5d4037', '#455a64', '#37474f', '#263238'
]

centroids = {}

for idx, (gov_id, geom) in enumerate(features_by_id.items()):
    feat = {
        'type': 'Feature',
        'id': gov_id,
        'properties': {
            'id': gov_id,
            'name': gov_id
        },
        'geometry': mapping(geom)
    }
    final_geojson['features'].append(feat)

    c = geom.centroid
    centroids[gov_id] = {'x': round(c.x, 4), 'y': round(c.y, 4)}

    col = colors[idx % len(colors)]
    if geom.geom_type == 'Polygon':
        x, y = geom.exterior.xy
        ax.fill(x, y, alpha=0.6, color=col, edgecolor='#1a241e', linewidth=1.5)
        ax.text(c.x, c.y, gov_id, fontsize=9, ha='center', va='center', fontweight='bold', color='white')
    elif geom.geom_type == 'MultiPolygon':
        for poly in geom.geoms:
            x, y = poly.exterior.xy
            ax.fill(x, y, alpha=0.6, color=col, edgecolor='#1a241e', linewidth=1.5)
        ax.text(c.x, c.y, gov_id, fontsize=9, ha='center', va='center', fontweight='bold', color='white')

with open('src/lib/spatial3d/syria-governorates.json', 'w') as f:
    json.dump(final_geojson, f, indent=2)

with open('src/lib/spatial3d/syria-centroids.json', 'w') as f:
    json.dump(centroids, f, indent=2)

ax.set_aspect('equal')
plt.title('Syrian Republic Governorates (Unified Golan, Bisected Damascus/Rif Dimashq)', fontsize=14)
plt.savefig('/home/hadi/.gemini/antigravity-acp/brain/ab070556-fee9-4891-9387-d5159a5e82b2/syria_geojson_plot.png', dpi=150)
print('Successfully saved syria-governorates.json and syria_geojson_plot.png!')
print('Governorate centroids:', json.dumps(centroids, indent=2))
