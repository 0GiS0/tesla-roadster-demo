# MEME mode — review evidence

Issue: [#5](https://github.com/0GiS0/tesla-roadster-demo/issues/5). Branch: `codex/5-meme-mode`.

## Delivered behavior

The Spanish “Modo MEME” toggle opens a registry-driven catalog headed “Deja volar la imaginación”. Desktop uses scene cards; narrow viewports use a native selector. The first scene, “Bache volador”, lasts 12 seconds and uses a locally generated daylight street, a real opening in the asphalt and sunken water. The source and sharing controls sit outside the canvas. The original dark 28-second presentation remains the default.

`#meme/bache-volador` selects the scene directly. Back/forward, unknown fragments, switching during playback, reset and replay preserve the intended paused starting state. The existing Roadster GLB and the pure `Scenario` interface are unchanged. Runtime assets remain local under the Pages prefix.

## Validation — 18 October 2026

The coordinator independently ran the required checks after implementation:

- `npm run typecheck`: passed.
- `npm test`: 10 tests passed, including original ramp contact/continuity, deterministic meme motion, clearance and stopped airborne wheels, 12/28-second playback boundaries, route resolution and URL construction, and clipboard success/rejection/unavailability.
- `python3 model/validate_glb.py`: passed; unchanged GLB, 971,184 bytes, 29,692 triangles and 68 meshes.
- `npm run build`: passed. Vite still reports the large-chunk warning; this delivery does not split the existing Three.js bundle.
- `git diff --check`: passed.

Type checking, tests and build were repeated after the review fixes; the final camera, title and layout adjustments were built successfully and independently reviewed.

The coordinator inspected the actual production preview in Edge on macOS at desktop 1280×720, portrait 390×844 and short landscape 844×390. These are browser viewport emulations, not physical mobile devices. Checks covered direct and unknown routes, history navigation, mode changes while playing, six repeated mode switches, seeking to takeoff/crossing/landing, automatic stop and “Repetir” at 12 seconds, keyboard orbit/zoom and Tab exit, camera reset after dragging, copy confirmation, framing and controls. The final short-landscape canvas measures approximately 172.5 pixels high, with the reference toolbar outside it. The original dark presentation was checked after returning from MEME mode.

The production HTML and GLB returned HTTP 200 under `/tesla-roadster-demo/`; the GLB response was `model/gltf-binary` with the expected byte length. No warnings or errors appeared in the captured browser console. One `?debug=1` desktop sample at DPR 1 measured 257 frames over 5.0145 seconds: 51.25 FPS and 41.7 ms p95 frame time. This brief sample is below 60 FPS and is not a mobile performance claim.

Limitations: physical phone gestures/performance, an actual no-WebGL browser and a fault-injected model-load failure were not tested in this delivery. Clipboard rejection/unavailability is covered by unit tests and review; the selectable fallback was not forced through a real browser permission denial. Repeated switching and disposal were checked, but no extended GPU-memory profile was recorded. No deployment has been performed.

## Independent review

Implementation was delegated to `gpt-6-luna` with `medium` effort, with no model escalation. A separate `gpt-6.1-sol` agent at `medium` effort reviewed the actual diff for correctness, regressions, scope and repository requirements.

Findings resolved and verified by the reviewer:

- Explicitly release manually allocated street/roof geometries and recreate them safely during StrictMode effect setup.
- Provide the native compact mobile selector requested by the plan.
- Correct share-status contrast in every MEME layout.

The coordinator also caught foreground scenery obscuring the car and insufficient canvas space in short landscape. Camera fitting and the compact layout were corrected, inspected in the rendered app and included in the final affected-diff review. The reviewer reported no outstanding actionable findings, including for the final title and contrast adjustment.

## Visual evidence

These are actual application captures, not reference images or Blender renders. The initial screenshot was taken before implementation. All images were uploaded with `gh issue edit --attach`; their successful rendering was verified in the authenticated GitHub issue.

| Before | Original mode after the change |
| --- | --- |
| ![Original presentation before](https://github.com/user-attachments/assets/9fa1824f-0128-4d4b-be4e-92e05829d881) | ![Original presentation after](https://github.com/user-attachments/assets/6141e865-90fb-4754-95d1-d511a7caa914) |

![MEME desktop — crossing](https://github.com/user-attachments/assets/1ad81a10-0778-48aa-92e7-1d223ffe3525)

![MEME portrait — selector and copy confirmation](https://github.com/user-attachments/assets/b0afa71a-2f36-452a-84f5-4dfab25655dd)

![MEME short landscape](https://github.com/user-attachments/assets/00000562-8420-4c16-8ebe-90ef8501d03d)

| Takeoff at 4 seconds | Landing at 9 seconds |
| --- | --- |
| ![Takeoff](https://github.com/user-attachments/assets/b3092aa1-b0e5-49a5-90f6-f108955e9799) | ![Landing](https://github.com/user-attachments/assets/b4ab457c-2349-4c13-a348-909abf4d5260) |

## Pre-PR gate

Implementation, validation and independent review are complete. On 18 October 2026, the user explicitly approved PR creation after receiving the final review package, satisfying the `AGENTS.md` pre-PR gate. Merge and deployment are outside this delivery.
