/**
 * Plain language privacy notice. Describes what the site does today; update
 * it in the same commit as any feature that stores or reads something new.
 */
export const privacy = {
  title: "Privacy",
  intro:
    "This site does not track, scan or identify visitors. This page says what it keeps today and why.",
  updatedLabel: "Last updated",
  updated: "2026-10-21",
  sections: [
    {
      heading: "What the site stores",
      items: [
        "Nothing about you. There are no accounts, no cookies, no local storage and no analytics.",
        "The mission state (where your ship is, what you have docked with) lives only in the open tab and is gone when you close it.",
      ],
    },
    {
      heading: "What reaches the server",
      items: [
        "Your browser asks for pages, scripts, textures and the star catalogue, plus the weather and space weather for the mission.",
        "For the weather, the site reads the city your hosting provider already attached to the request (from your IP address), rounds its coordinates to about 11 km, and asks Open-Meteo for the weather there. Nothing about this is stored, and your IP address is never sent on.",
        "The hosting provider keeps its own short request logs, as every web host does. The site does not read them for anything about visitors.",
        "The site does not ask for your location, camera or microphone, and its security headers tell the browser to refuse them.",
      ],
    },
    {
      heading: "Data used to draw the sky",
      items: [
        "Planet, Moon and Sun positions are computed in your browser from published orbital elements and the current time. Nothing about you goes into them.",
        "Space weather comes from NOAA's Space Weather Prediction Center and NASA's DONKI, fetched by the server and cached. The local time on the mission clock comes from your browser's own time zone setting and never leaves it.",
        "Satellite positions (CelesTrak) and hazard feeds (GDACS, NOAA) are worldwide lists fetched by the server. Your browser compares them with the city from the weather lookup to decide whether an advisory applies; nothing about that is sent back.",
        "Time on the page, for the rare sightings, is counted in your browser only while the tab is visible, and is forgotten when you close it.",
      ],
    },
    {
      heading: "When this changes",
      items: [
        "Planned features such as visitor messages, a crew log and a threat board will store small amounts of data: an anonymous random id, the text you choose to send, and salted hashes of IP addresses kept for 7 days to stop abuse. This page will list each one, and why, before it ships.",
      ],
    },
  ],
} as const;
