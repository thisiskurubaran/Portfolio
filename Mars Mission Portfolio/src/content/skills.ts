export type SkillGroup = {
  id: string;
  name: string;
  skills: readonly string[];
};

export const skillGroups: readonly SkillGroup[] = [
  {
    id: "ai-ml",
    name: "AI and ML",
    skills: ["Artificial Intelligence", "Machine Learning", "Computer Vision", "Spatial Computing", "Supervised Learning"],
  },
  {
    id: "mobile",
    name: "iOS and Mobile",
    skills: [
      "iOS",
      "Swift",
      "SwiftUI",
      "Objective-C",
      "ARKit",
      "Flutter",
      "Dart",
      "Android",
      "iOS Development",
      "Mobile Application Development",
    ],
  },
  {
    id: "frontend",
    name: "Frontend",
    skills: ["React.js", "Next.js", "AngularJS", "JavaScript", "TypeScript", "HTML", "CSS", "Web Applications"],
  },
  {
    id: "backend",
    name: "Backend",
    skills: ["Node.js", "Express.js", "GraphQL", "Microservices", "REST APIs", "Python"],
  },
  {
    id: "databases",
    name: "Databases",
    skills: ["PostgreSQL", "MongoDB", "SQL", "SQLite", "Firebase", "Cloud Firestore", "Neo4j"],
  },
  {
    id: "geo-iot",
    name: "Geospatial and IoT",
    skills: ["GIS", "Quantum GIS", "GeoServer", "OpenLayers", "GPS", "Kalman filtering", "RFID", "IoT"],
  },
  {
    id: "security-devops",
    name: "Security and DevOps",
    skills: ["Cybersecurity", "DevOps", "Azure DevOps", "Git", "SaaS"],
  },
  {
    id: "cs",
    name: "CS fundamentals",
    skills: ["Data Structures", "Algorithms", "System Design", "Python"],
  },
];
