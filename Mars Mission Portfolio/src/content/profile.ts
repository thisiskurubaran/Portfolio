export type Profile = {
  name: string;
  location: string;
  status: string;
  titles: readonly string[];
  stats: readonly { value: string; label: string }[];
  bio: string;
};

export const profile: Profile = {
  name: "Kurubaran Anandhan",
  location: "Chennai, Tamil Nadu, India",
  status: "Open to work. Technical Team Lead at Santan Infotech Pvt. Ltd.",
  titles: [
    "Senior Full-Stack Engineer",
    "iOS & Flutter Engineer",
    "AI/ML Solutions Engineer",
    "Cybersecurity Engineer",
    "PostgreSQL & Backend Architect",
    "Spatial Computing with ARKit",
  ],
  stats: [
    { value: "7+", label: "years experience" },
    { value: "10+", label: "companies and clients" },
    { value: "20+", label: "technologies" },
    { value: "2025", label: "Employee of the Year" },
  ],
  bio: "Senior full-stack engineer with 7+ years delivering production applications across web, backend and mobile. Built ARKit spatial experiences and IoT/RFID systems at ProdEx, and architected AI/ML microservices at Santan. Represented India U-19 and Tamil Nadu as a net bowler in cricket.",
};
