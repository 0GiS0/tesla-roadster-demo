# Plantilla de prompt y ejemplos aprobados

Seguridad: sin secretos ni permisos nuevos; al servicio de imágenes solo van el prompt y la captura pública de la web.

## Publicación

Siempre que se cree el Issue de la propuesta, la imagen se adjunta. Nota obligatoria en el cuerpo: «Imagen orientativa generada con IA, no es el meme original.»

- Issue nuevo: pon la nota y `![Concepto de la escena <nombre>](./concepto-<slug>.png)` en el cuerpo y usa `gh issue create -R 0GiS0/tesla-roadster-demo --title '🖼️ Añadir escena MEME: <nombre>' --label '🖼️ meme' --label '🔍 needs-triage' --body-file cuerpo.md --attach './concepto-<slug>.png#Concepto de la escena <nombre>'` (título y etiquetas de `meme-proposal.yml`, que `--title` omite).
- Issue existente: `gh issue view <n> --json body -q .body > cuerpo.md`, añade al final la nota y la imagen, y ejecuta `gh issue edit <n> --body-file cuerpo.md --attach './concepto-<slug>.png#Concepto de la escena <nombre>'`. Nunca sustituyas el cuerpo original.

Comprueba después que la imagen se ve en el Issue.

## Plantilla de prompt

```text
Concept frame for a 3D web animation scene called "<scene_name>" (<short description>).
Match EXACTLY the visual style of the reference image: stylized low-poly 3D render, flat muted
earthy palette, soft light, simple soft shadows, elevated three-quarter diagonal camera.
Same sleek silver-grey low-poly electric roadster as in the reference.
Scene: <environment + key moment of the choreography>.
Humorous, clear storytelling without text.
No UI, no text, no logos, no brand marks, no license plates, no people visible.
```

Reglas: usa monumentos o lugares **genéricos** (por ejemplo «a GENERIC low-poly suspension bridge… not a copy of any real landmark»); mantén siempre el Roadster gris plata y la línea final de restricciones.

## Resultados aprobados (5-nov-2026)

Las imágenes que encajaron con el resultado deseado están en `../examples/`, junto a su prompt:

- `../examples/concepto-robo-de-plaza.png`
- `../examples/concepto-cables.png`
- `../examples/concepto-puente-test-54.png`

Son material de apoyo para los agentes (referencia visual del acabado esperado), no activos de la web: viven fuera de `public/` y no se cargan en la aplicación, por lo que la regla de «sin activos externos» se mantiene.

### Robo de plaza

```text
Concept frame for a 3D web animation scene called "Robo de plaza" (parking spot theft). Match EXACTLY the visual style of the reference image: stylized low-poly 3D render, flat muted earthy palette (olive-grey asphalt, beige sidewalks, terracotta, sage-green round low-poly trees), soft afternoon light, simple soft shadows, elevated three-quarter diagonal camera. Same sleek silver-grey low-poly electric roadster as in the reference. Scene: a ground-level parking lot almost full of simple boxy generic cars in muted colors, white painted parking lines, simple street lamps, hedges at the back. One single empty spot in the middle. A plain grey generic boxy car in the aisle has started turning into the spot with its turn signal on, but the silver roadster is descending vertically from above right into the spot, with white vapor jets beneath it spreading onto the asphalt; the grey car is braking suddenly. Humorous, clear storytelling without text. No UI, no text, no logos, no brand marks, no license plates, no people visible.
```

### Cables

```text
Concept frame for a 3D web animation scene called "Cables". Match EXACTLY the visual style of the reference image: stylized low-poly 3D render, flat muted earthy palette, soft afternoon light, simple soft shadows, elevated three-quarter diagonal camera. Same sleek silver-grey low-poly electric roadster as in the reference. Scene: a congested urban crossroads with a traffic jam of simple boxy generic cars, tall wooden utility poles with a chaotic dense tangle of sagging black power cables crisscrossing over the street. The silver roadster has taken off upward with white vapor jets beneath it and is caught and tangled in the mess of cables a few meters above the jam, tilted, with a few small yellow sparks around it. Humorous, clear storytelling without text. No UI, no text, no logos, no brand marks, no license plates, no people visible.
```

### Test #54: salto del puente

```text
Concept frame for a 3D web animation scene (bridge jump test). Match EXACTLY the visual style of the reference image: stylized low-poly 3D render, flat muted earthy palette, soft hazy light, simple soft shadows, side elevated camera. Same sleek silver-grey low-poly electric roadster as in the reference. Scene: a GENERIC low-poly suspension bridge (two simple rust-orange towers, suspension cables, a flat deck; not a copy of any real landmark) over a calm low-poly teal-grey sea with a small rocky island in the misty background. A big launch ramp is installed on the bridge deck. The silver roadster has jumped off the ramp and is diving nose-down toward the water, and at the last moment bright white vapor jets fire beneath it, pulling it back up just above the waves, with spray on the water surface. Dramatic yet humorous. No UI, no text, no logos, no brand marks, no license plates, no people visible.
```
