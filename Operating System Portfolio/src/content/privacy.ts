// Plain language privacy copy, shown at /privacy and in Settings > Privacy.
export const privacy = {
  title: "Privacy",
  intro:
    "This site does not track, scan or identify visitors. There are no analytics cookies and no third party trackers. Here is everything it stores and why.",
  stored: [
    {
      what: "Your settings",
      where: "Your browser (localStorage)",
      why: "Theme, accent colour, wallpaper, reduced motion, sound, the shell you picked and window positions, so they are the same next time. Nothing leaves your device.",
    },
    {
      what: "An anonymous visitor id",
      where: "Your browser, and the presence server while you are connected",
      why: "A random id with no link to you, used for the online count and cursors on folioDesk. Only the id and your pointer position are shared, and nothing is kept after you leave.",
    },
    {
      what: "Guestbook entries and sticky notes",
      where: "The site's database",
      why: "What you write, and a name only if you give one. Notes are checked for length, links and abuse before they are shown, and the owner can delete them.",
    },
    {
      what: "A salted hash of your IP address",
      where: "The site's database, for 7 days",
      why: "Only to rate limit posts and to log blocked intrusion attempts. The raw IP is never stored, and the hash cannot be turned back into it.",
    },
  ],
  location:
    "The weather widget uses the city that your connection appears to come from, as reported by the hosting provider. The site never asks for your precise location and never calls the browser's location API.",
  security:
    "The security features only refuse service, slow down repeated requests and keep counts of blocked attempts. They never scan, probe or reach back toward anyone's device.",
  contact: "Questions about this page can go through any of the contact links on the site.",
} as const;
