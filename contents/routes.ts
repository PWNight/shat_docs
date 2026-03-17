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
];