export type Education = {
  degree: string;
  field: string;
  school: string;
  start: string;
  end: string;
  location: string;
  coursework: readonly string[];
};

export const education: readonly Education[] = [
  {
    degree: "B.Tech",
    field: "Information Technology",
    school: "Sri Venkateswara College of Engineering",
    start: "2015",
    end: "2019",
    location: "Kancheepuram, Tamil Nadu",
    coursework: [
      "Data Structures",
      "Algorithms",
      "Database Systems",
      "Operating Systems",
      "Computer Networks",
      "Software Engineering",
      "Mobile Development",
      "Web Technologies",
    ],
  },
];
