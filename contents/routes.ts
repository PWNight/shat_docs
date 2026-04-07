export type EachRoute = {
  title: string;
  href: string;
  noLink?: true;
  items?: EachRoute[];
};

export const ROUTES : EachRoute[] = [
  {
    title: "Оглавление",
    href: "/",
  },
  {
    title: "Быстрый старт",
    href: "/quick-start",
  },
  {
    title: "Руководство по приложению",
    href: "/app-guide",
  },
  {
    title: "API v1 vs v2",
    href: "/api-v1-v2",
  },
  {
    title: "Версии v0.X vs v1.X",
    href: "/versions-v0-v1",
  },
];