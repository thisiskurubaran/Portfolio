# Credits

Every external texture, dataset and audio clip used by the site, with its source and licence.

## Textures

| File | Source | Licence |
|---|---|---|
| `public/textures/earth/day.jpg` | NASA Blue Marble, via the `three-globe` example images (`earth-blue-marble.jpg`) | NASA imagery, public domain |
| `public/textures/earth/night.jpg` | NASA Earth at Night (Black Marble), via `three-globe` (`earth-night.jpg`) | NASA imagery, public domain |
| `public/textures/earth/topology.jpg` | Elevation map derived from NASA data, via `three-globe` (`earth-topology.png`) | NASA data, public domain |
| `public/textures/earth/water.jpg` | Water mask derived from NASA data, via `three-globe` (`earth-water.png`) | NASA data, public domain |
| `public/textures/earth/clouds.jpg` | Cloud cover derived from NASA Blue Marble clouds, via `three-globe` (`clouds.png`, alpha channel) | NASA imagery, public domain |

The `three-globe` package (MIT, Vasco Asturiano) redistributes these images; they were resized and re-encoded as JPEG for this site.

## Data

| File | Source | Licence |
|---|---|---|
| `public/data/stars.json` | Hipparcos catalogue stars to magnitude 6, from `d3-celestial` (`data/stars.6.json`) by Olaf Frohn | Catalogue data: ESA Hipparcos, free for use. Package: BSD 3-Clause |

Planet positions use JPL's approximate Keplerian elements (Standish, Table 1, valid 1800 to 2050), https://ssd.jpl.nasa.gov/planets/approx_pos.html. Planet GM values are from JPL DE440. Planet facts are from the NASA planetary fact sheets. Sidereal time uses the IAU 1982 expression. The Astronomical Almanac low precision Sun formula is used as an independent check in the tests. The Lambert solver follows the universal variable algorithm in H. D. Curtis, Orbital Mechanics for Engineering Students (algorithm 5.2), and is tested against that book's example 5.2.

## Audio

None yet.
