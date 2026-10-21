export type Certification = {
  name: string;
  issuer: string;
  date: string;
  tag: string;
  credentialId?: string;
  url?: string;
};

/** All three are verified. */
export const certifications: readonly Certification[] = [
  { name: "AWS Lambda Foundations", issuer: "AWS Training and Certification", date: "Jun 2025", tag: "Cloud" },
  {
    name: "JavaScript",
    issuer: "TestDome",
    date: "Jun 2023",
    tag: "Programming",
    credentialId: "c80d4980eb0b4991a5f26258b8fae9a3",
    url: "https://www.testdome.com/certificates/c80d4980eb0b4991a5f26258b8fae9a3",
  },
  {
    name: "React.js: From the Beginning with Redux and React Router",
    issuer: "Udemy",
    date: "Aug 2021",
    tag: "Frontend",
    credentialId: "UC-799ba9f3-b732-481c-b3ca-31e2b7dcfce6",
    url: "https://ude.my/UC-799ba9f3-b732-481c-b3ca-31e2b7dcfce6",
  },
];
