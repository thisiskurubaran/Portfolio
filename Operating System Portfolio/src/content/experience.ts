export type EmploymentType = "Full-time" | "Internship" | "Freelance";

export interface Role {
  id: string;
  title: string;
  company: string;
  type: EmploymentType;
  start: string;
  end: string | "Present";
  location: string;
  summary: string;
  badge?: string;
  skills: string[];
}

// Newest first. The first entry is the current role.
export const experience: Role[] = [
  {
    id: "santan-lead",
    title: "Technical Team Lead (Senior Software Engineer and Team Lead)",
    company: "Santan Infotech Pvt. Ltd.",
    type: "Full-time",
    start: "Sep 2025",
    end: "Present",
    location: "Bengaluru (Hybrid)",
    badge: "Employee of the Year 2025",
    summary:
      "Leads a cross-functional team, architects AI-powered microservices and graph database solutions across ML and cybersecurity. Mentors 5+ engineers, designed GraphQL APIs for real-time ML inference, built Neo4j knowledge graphs, led PostgreSQL security hardening.",
    skills: ["Team Leadership", "AI", "Cybersecurity", "GraphQL", "Machine Learning", "Microservices", "Neo4j", "Next.js", "PostgreSQL", "Python"],
  },
  {
    id: "prodex-3",
    title: "Software Engineer III",
    company: "ProdEx Technologies",
    type: "Full-time",
    start: "Sep 2024",
    end: "Sep 2025",
    location: "Chennai (On-site)",
    summary:
      "Led iOS R&D for enterprise inventory, combining on-device ML with RFID readers. Built a supervised learning model at 97%+ accuracy for RFID cross-read detection, ARKit warehouse visualization, cut false-positive scans by 80% with a computer vision pipeline.",
    skills: ["ARKit", "Computer Vision", "Spatial Computing", "SwiftUI", "IoT", "RFID", "Objective-C", "SQL", "SQLite"],
  },
  {
    id: "prodex-2",
    title: "Software Engineer II",
    company: "ProdEx Technologies",
    type: "Full-time",
    start: "Aug 2023",
    end: "Aug 2024",
    location: "Chennai (On-site)",
    summary:
      "Built offline-first location solutions. Kalman filtering for sub-meter GPS in GPS-denied environments, GeoServer + OpenLayers GIS, cross-platform offline-first apps.",
    skills: ["iOS", "Swift", "GPS", "Kalman filtering", "GIS", "Quantum GIS", "GeoServer", "OpenLayers", "SQL", "SQLite"],
  },
  {
    id: "mots-senior",
    title: "Senior Software Developer",
    company: "MOTS Software Solutions",
    type: "Full-time",
    start: "Mar 2023",
    end: "Aug 2023",
    location: "Chennai (Remote)",
    summary:
      "High-scale web and mobile. Flutter apps for 10K+ daily users, real-time Firebase sync with conflict resolution, Azure DevOps CI/CD cutting deploy time 60%.",
    skills: ["Flutter", "React.js", "Firebase", "Cloud Firestore", "Azure DevOps", "iOS Development", "Express.js", "MongoDB"],
  },
  {
    id: "mots-dev",
    title: "Software Developer",
    company: "MOTS Software Solutions",
    type: "Full-time",
    start: "Feb 2022",
    end: "Mar 2023",
    location: "Chennai (Remote)",
    summary:
      "Cross-platform SaaS with real-time sync and geolocation. Node.js REST APIs serving 50K+ monthly requests, background tracking and geofencing.",
    skills: ["Web Applications", "SaaS", "Node.js", "JavaScript", "Git", "Databases"],
  },
  {
    id: "cavintek",
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
    id: "freelance-ios",
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
    id: "bigfday",
    title: "Junior Software Developer",
    company: "BigFday.com",
    type: "Full-time",
    start: "Jun 2019",
    end: "Aug 2019",
    location: "Chennai",
    summary: "",
    skills: ["Web Applications", "Databases", "JavaScript"],
  },
  {
    id: "jenesys",
    title: "Junior Software Developer",
    company: "Jenesys Technologies",
    type: "Internship",
    start: "Jan 2019",
    end: "Apr 2019",
    location: "Bengaluru",
    summary: "",
    skills: ["Web Applications", "JavaScript"],
  },
  {
    id: "mocero",
    title: "Android Developer",
    company: "Mocero Health Solutions",
    type: "Internship",
    start: "Aug 2018",
    end: "Dec 2018",
    location: "Chennai",
    summary: "",
    skills: ["Android", "Mobile Applications"],
  },
];
