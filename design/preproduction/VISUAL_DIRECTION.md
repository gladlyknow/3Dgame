# Episode 01 — Visual Direction Gate

Status: **Stage 1 review required**

Branch: `redesign/episode-01`
Production code may not begin until this gate is approved.

## Direction

The target is a warm, premium **3D animated storybook** rather than a procedural low-poly game. The design preserves the readable silhouettes, bright palette, friendly faces, and low-stimulation tone of *Tire Town School*, while adding production-quality volume, materials, lighting, animation range, and camera composition.

## Review assets

1. `01-eddy-lookdev.png`
   - Rounded blue dump-truck silhouette.
   - Functional dump bed, suspension, modeled rubber tires, readable face.
   - Front, side, rear three-quarter, hero angle, and six expression studies.
2. `02-campus-color-key.png`
   - Arrival road, active parking lot, and quiet tire corner in one readable campus.
   - Warm morning light, reduced-saturation background, Eddy-led focal hierarchy.
3. `03-gameplay-ui-keyframe.png`
   - Low third-person chase camera.
   - Minimal HUD, bottom subtitle ribbon, touch controls kept out of the play route.
4. `04-episode01-storyboard.png`
   - Six beats: arrival, school reveal, yield, fast-car surprise, emotional pause, Poppy greeting.
   - No Episode 2 balloon event is introduced early.

## Locked art rules

- Eddy is blue and must remain immediately recognizable across all shots.
- Soft rounded panels and generous bevels; no cubes, voxels, or primitive-box vehicles.
- Matte paint, rubber, painted stucco, clean asphalt, restrained glass highlights.
- Characters carry the strongest saturation. Environment colors stay slightly softer.
- Morning light is warm and optimistic; the emotional pause is cooler but never gloomy.
- Environment guidance comes from roads, curbs, arrows, landmarks, and character gaze.
- No floating mission rings, giant panels, emoji icons, star currency, or speedometer.
- Gameplay camera stays stable, low, centered, and child-friendly.

## Palette

| Role | Color |
|---|---|
| Eddy blue | `#32A9E0` |
| Sky | `#A8E4F4` |
| Grass | `#9BCD70` |
| School cream | `#FFE5AC` |
| Coral accent | `#F87973` |
| Road blue-gray | `#58727B` |
| UI ink | `#173E50` |

## UI decisions

- One compact objective capsule at top-left.
- Sound and pause only at top-right.
- One subtitle ribbon at bottom-center.
- Touch steering at bottom-left and pedals at bottom-right.
- HUD occupies less than 15% of the frame and never covers the character or hazard path.
- The generated pedal symbols are composition placeholders; production will use a consistent original vector icon set.
- Chinese and English fonts will be bundled locally and rendered by the application, not baked into scene art.

## Story beats represented

1. Eddy approaches school, freshly prepared and excited.
2. He sees Tire Town School for the first time.
3. A long vehicle crosses; Eddy yields safely.
4. A fast race car passes; Eddy is startled.
5. Eddy pauses near the tires and feels slow and out of place.
6. Poppy greets him, changing the emotional tone from uncertainty to welcome.

## Review checklist

- [ ] Eddy silhouette, face, proportions, and blue palette approved.
- [ ] Campus architecture and landscaping approved.
- [ ] Camera height and Eddy screen size approved.
- [ ] HUD density and placement approved.
- [ ] Poppy's provisional coral-and-teal direction approved for later character development.
- [ ] Six-beat story flow approved.
- [ ] Permission to begin Stage 2 graybox implementation.

## Production note

These images are visual-development targets, not final in-game textures or meshes. Final character geometry, UI vectors, typography, and animation will be recreated as optimized production assets. Official IP assets and brand guidelines should replace provisional interpretation when supplied.
