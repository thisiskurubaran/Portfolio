export type Role = {
  title: string;
  /** Longer form of the title, where the owner gave one. */
  fullTitle?: string;
  company: string;
  type: "Full-time" | "Freelance" | "Internship";
  start: string;
  /** Omitted for the current role. */
  end?: string;
  location: string;
  badge?: string;
  summary?: string;
  highlights?: readonly string[];
  skills: readonly string[];
};

/** Newest first. The first entry is the current role. */
export const experience: readonly Role[] = [
  {
    title: "Technical Team Lead",
    fullTitle: "Senior Software Engineer and Team Lead",
    company: "Santan Infotech Pvt. Ltd.",
    type: "Full-time",
    start: "Sep 2025",
    location: "Bengaluru (Hybrid)",
    badge: "Employee of the Year 2025",
    summary:
      "Leads a cross-functional team, architects AI-powered microservices and graph database solutions across ML and cybersecurity.",
    highlights: [
      "Mentors 5+ engineers",
      "Designed GraphQL APIs for real-time ML inference",
      "Built Neo4j knowledge graphs",
      "Led PostgreSQL security hardening",
    ],
    skills: [
      "Team Leadership",
      "AI",
      "Cybersecurity",
      "GraphQL",
      "Machine Learning",
      "Microservices",
      "Neo4j",
      "Next.js",
      "PostgreSQL",
      "Python",
    ],
  },
  {
    title: "Software Engineer III",
    company: "ProdEx Technologies",
    type: "Full-time",
    start: "Sep 2024",
    end: "Sep 2025",
    location: "Chennai (On-site)",
    summary: "Led iOS R&D for enterprise inventory, combining on-device ML with RFID readers.",
    highlights: [
      "Built a supervised learning model at 97%+ accuracy for RFID cross-read detection",
      "ARKit warehouse visualization",
      "Cut false-positive scans by 80% with a computer vision pipeline",
    ],
    skills: ["ARKit", "Computer Vision", "Spatial Computing", "SwiftUI", "IoT", "RFID", "Objective-C", "SQL", "SQLite"],
  },
  {
    title: "Software Engineer II",
    company: "ProdEx Technologies",
    type: "Full-time",
    start: "Aug 2023",
    end: "Aug 2024",
    location: "Chennai (On-site)",
    summary: "Built offline-first location solutions.",
    highlights: [
      "Kalman filtering for sub-meter GPS in GPS-denied environments",
      "GeoServer + OpenLayers GIS",
      "Cross-platform offline-first apps",
    ],
    skills: ["iOS", "Swift", "GPS", "Kalman filtering", "GIS", "Quantum GIS", "GeoServer", "OpenLayers", "SQL", "SQLite"],
  },
  {
    title: "Senior Software Developer",
    company: "MOTS Software Solutions",
    type: "Full-time",
    start: "Mar 2023",
    end: "Aug 2023",
    location: "Chennai (Remote)",
    summary: "High-scale web and mobile.",
    highlights: [
      "Flutter apps for 10K+ daily users",
      "Real-time Firebase sync with conflict resolution",
      "Azure DevOps CI/CD cutting deploy time 60%",
    ],
    skills: [
      "Flutter",
      "React.js",
      "Firebase",
      "Cloud Firestore",
      "Azure DevOps",
      "iOS Development",
      "Express.js",
      "MongoDB",
    ],
  },
  {
    title: "Software Developer",
    company: "MOTS Software Solutions",
    type: "Full-time",
    start: "Feb 2022",
    end: "Mar 2023",
    location: "Chennai (Remote)",
    summary: "Cross-platform SaaS with real-time sync and geolocation.",
    highlights: ["Node.js REST APIs serving 50K+ monthly requests", "Background tracking and geofencing"],
    skills: ["Web Applications", "SaaS", "Node.js", "JavaScript", "Git", "Databases"],
  },
  {
    title: "Software Developer",
    company: "Cavintek",
    type: "Full-time",
    start: "Aug 2021",
    end: "Dec 2021",
    location: "Chennai (On-site)",
    summary: "Internal business automation tools.",
    skills: ["SaaS", "MongoDB", "DevOps", "Express.js", "JavaScript"],
  },
  {
    title: "Mobile Application Developer",
    company: "Freelance",
    type: "Freelance",
    start: "Jan 2021",
    end: "Jul 2021",
    location: "Remote",
    summary: "iOS apps for independent clients through App Store submission.",
    skills: ["iOS Development", "Databases", "Mobile Application Development"],
  },
  {
    title: "Junior Software Developer",
    company: "BigFday.com",
    type: "Full-time",
    start: "Jun 2019",
    end: "Aug 2019",
    location: "Chennai",
    skills: ["Web Applications", "Databases", "JavaScript"],
  },
  {
    title: "Junior Software Developer",
    company: "Jenesys Technologies",
    type: "Internship",
    start: "Jan 2019",
    end: "Apr 2019",
    location: "Bengaluru",
    skills: ["Web Applications", "JavaScript"],
  },
  {
    title: "Android Developer",
    company: "Mocero Health Solutions",
    type: "Internship",
    start: "Aug 2018",
    end: "Dec 2018",
    location: "Chennai",
    skills: ["Android", "Mobile Applications"],
  },
];
