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
| `public/textures/mars/day.jpg` | Mars colour map, 2048 x 1024, redistributed in the `gravityexp` npm package (MIT) as a NASA surface texture. It appears to be the Solar System Scope 2k Mars map, which is made from NASA elevation and imagery data | Solar System Scope textures: CC BY 4.0, https://www.solarsystemscope.com/textures/ |

The `three-globe` package (MIT, Vasco Asturiano) redistributes these images; they were resized and re-encoded as JPEG for this site.

## Data

| File | Source | Licence |
|---|---|---|
| `public/data/stars.json` | Hipparcos catalogue stars to magnitude 6, from `d3-celestial` (`data/stars.6.json`) by Olaf Frohn | Catalogue data: ESA Hipparcos, free for use. Package: BSD 3-Clause |

Planet positions use JPL's approximate Keplerian elements (Standish, Table 1, valid 1800 to 2050), https://ssd.jpl.nasa.gov/planets/approx_pos.html. Planet GM values are from JPL DE440. Planet facts are from the NASA planetary fact sheets. Sidereal time uses the IAU 1982 expression. The Astronomical Almanac low precision Sun formula is used as an independent check in the tests. Mars orientation (pole and prime meridian) is from the IAU WGCCRE 2009 report. Landing site coordinates are the published landing points of Perseverance, Curiosity and Zhurong. The Moon's position uses the main terms of J. Meeus, Astronomical Algorithms, chapter 47, tested against the 8 April 2024 total solar eclipse. The Lambert solver follows the universal variable algorithm in H. D. Curtis, Orbital Mechanics for Engineering Students (algorithm 5.2), and is tested against that book's example 5.2.

## Live data

| Feed | Used for | Terms |
|---|---|---|
| Open-Meteo forecast API | Weather at the pad and the visitor's city (F02) | Free for non-commercial use, CC BY 4.0, https://open-meteo.com/ |
| NOAA Space Weather Prediction Center JSON feeds | Kp index, GOES X-ray flares, proton flux (F05) | US Government work, public domain |
| NASA DONKI (CCMC) | Coronal mass ejections (F05) | NASA open data |
| CelesTrak general perturbations element sets (OMM JSON) | ISS and Starlink positions (F12) | Free public data, T. S. Kelso, https://celestrak.org/ |
| GDACS event lists | Earthquakes and tropical cyclones (F34) | European Commission JRC and UN OCHA, free use with attribution |
| NOAA National Hurricane Center current storms | Atlantic and East Pacific cyclones (F34) | US Government work, public domain |

Comet 2P/Encke's orbital elements are from JPL's Small-Body Database (2023 apparition). Voyager directions and distances are rounded from NASA JPL's Voyager mission status. Meteor shower dates, rates, radiants and speeds are from the International Meteor Organization's annual shower calendar. Mars's solar longitude follows Allison and McEwen (2000), the algorithm behind NASA's Mars24. Launch weather rules are a short version of the lightning and ground wind launch commit criteria used at US ranges.

## Libraries with physics data

Rover physics uses Rapier (`@dimforge/rapier3d-compat`, Apache 2.0, Dimforge). Mars surface gravity (3.72 m/s²) and the rover's size class follow NASA's crewed Mars surface studies. The surface terrain is generated in code; no elevation data is used yet.

## Audio

No recorded clips. Every sound is synthesised in the browser with the Web Audio API from noise and oscillators, so there is nothing to license: engine roar and crackle, hull rumble, fans and pump hum, relay clicks, suit breathing, a heartbeat, the rover motors, beacon pings and the cruise music. The Quindar tones (2525 Hz on, 2475 Hz off) follow the frequencies NASA used on Apollo ground transmitters. Mission control's messages are text; no voice is recorded or cloned.
