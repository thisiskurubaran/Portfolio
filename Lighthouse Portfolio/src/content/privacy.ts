// Plain language privacy notice for /privacy. Keep it short and keep it true:
// update it whenever a feature starts storing or sending something new.
export const privacy = {
  title: "Privacy",
  updatedLabel: "Last updated",
  updated: "2026-10-20",
  intro:
    "This site is a portfolio. It does not track you, scan your device or try to work out who you are. This page lists everything it does keep, and why.",
  sections: [
    {
      heading: "What is stored",
      items: [
        "A random id in your browser's local storage. It remembers your best vessel and how many times you have visited. It is not linked to your name, email or device, and you can clear it by clearing site data.",
        "Messages in bottles and ship's log notes, only if you write one. They are stored with the date, the vessel you reached and the weather at the time, and other visitors can read them.",
        "For blocked attack attempts only: the time, the path, the reason and a salted hash of the IP address, kept for 7 days so repeat offenders can be slowed down. Raw IP addresses are never stored.",
      ],
    },
    {
      heading: "Location and weather",
      items: [
        "The hosting platform adds your approximate city to each request. The site uses it to show your local weather, time and tide, then forgets it. It never asks for GPS.",
        "Weather, tide and storm data come from Open-Meteo, GDACS and NOAA. The server fetches them using rounded coordinates, so your address and IP are not sent to them by this site.",
      ],
    },
    {
      heading: "What the site does not do",
      items: [
        "No analytics cookies, no third party trackers and no ads.",
        "No fingerprinting, no scanning or probing of your device, and no attempt to identify who you are.",
        "The security features only refuse service, slow down clients that send too many requests and count blocked attempts. They never reach back toward a visitor.",
      ],
    },
    {
      heading: "Hosting",
      items: [
        "The site runs on Vercel, which handles requests the way any web host does. Its own handling of request logs is covered by Vercel's privacy policy.",
      ],
    },
    {
      heading: "Removing something",
      items: [
        "If you wrote a bottle or a log note and want it removed, get in touch through the contact details on the plain version of the site.",
      ],
    },
  ],
};
