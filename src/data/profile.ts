export const PROFILE = {
  name: 'Jesús David Angarita',
  shortName: 'jesús angarita',
  handle: 'ninquiet',
  role: 'agentic software engineer',
  focus: ['unity', 'xr', 'shaders', 'ai agents'],
  location: 'bogotá, co',
  company: 'somnium space',
  years: 6,
  email: 'jesus.ninquiet@gmail.com',
  github: 'https://github.com/Ninquiet',
  gitlab: 'https://gitlab.com/Ninquiet',
  linkedin: 'https://www.linkedin.com/in/ninquiet',
  cv: '/files/jesus-angarita-cv.pdf',
  cvFileName: 'Jesus Angarita CV.pdf',
  description:
    'Agentic Software Engineer specialized in Unity and XR. 6 years building virtual worlds, tools for AI agents, and the occasional pixel that should not exist.',
};

export interface CareerCommit {
  hash: string;
  type: 'feat' | 'teach' | 'init';
  message: string;
  when: string;
  head?: string;
  branch?: boolean;
}

export const CAREER: CareerCommit[] = [
  { hash: 'a3f9e1c', type: 'feat', message: 'agentic software engineer, unity & xr @ somnium space', when: '2026', head: 'HEAD -> somnium' },
  { hash: '7c21b04', type: 'feat', message: 'software engineer, unity & xr @ somnium space', when: '2022–2026' },
  { hash: '51de0a2', type: 'teach', message: 'university professor @ universidad de ibagué', when: '2024–2025', branch: true },
  { hash: '9d4f2b8', type: 'feat', message: 'web software developer @ fundación mapa', when: '2022', branch: true },
  { hash: 'e3a90f7', type: 'feat', message: 'web developer @ e3 group', when: '2020–2022' },
  { hash: '0b1d4e3', type: 'init', message: 'mobile game developer @ ruta ibagué', when: '2019–2020' },
];
