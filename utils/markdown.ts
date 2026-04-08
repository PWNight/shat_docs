import { compileMDX } from "next-mdx-remote/rsc";
import path from "path";
import { promises as fs } from "fs";
import matter from "gray-matter";
import remarkGfm from "remark-gfm";
import rehypePrism from "rehype-prism-plus";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeCodeTitles from "rehype-code-titles";
import { page_routes } from "./routes-config";
import { visit } from "unist-util-visit";
import { Node } from "unist";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import Pre from "@/components/markdown/pre";
import Note from "@/components/markdown/note";
import Link from "@/components/markdown/link";
import Outlet from "@/components/markdown/outlet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import {ROUTES} from "@/contents/routes";

// Компоненты MDX
const components = {
    Tabs, TabsContent, TabsList, TabsTrigger,
    pre: Pre, Note, a: Link, Outlet,
    Table, TableHeader, TableHead, TableRow, TableBody, TableCell,
};

// Тип для элемента Node
interface ElementNode extends Node {
    tagName?: string;
    children?: Node[];
    properties?: Record<string, unknown>;
    raw?: string;
}

// Тип для элемента TextNode
interface TextNode extends Node {
    type: "text";
    value: string;
}

// Функция для парсинга MDX
async function parseMdx<Frontmatter>(rawMdx: string) {
    // Возвращаем результат парсинга MDX
    return await compileMDX<Frontmatter>({
        // Исходный текст MDX
        source: rawMdx,
        options: {
            parseFrontmatter: true,
            mdxOptions: {
                rehypePlugins: [
                    preProcess,
                    rehypeCodeTitles,
                    rehypePrism,
                    rehypeSlug,
                    rehypeAutolinkHeadings,
                    postProcess,
                ],
                remarkPlugins: [remarkGfm],
            },
        },
        components,
    });
}

// Тип для frontmatter MDX
export type BaseMdxFrontmatter = {
    title: string;
    description: string;
    update_date: string;
};

// Функция для получения контента для конкретного slug
export async function getWikiForSlug(slug: string) {
    try {
        // Получаем путь к контенту
        const contentPath = getWikiContentPath(slug);
        // Читаем контент
        const rawMdx = await fs.readFile(contentPath, "utf-8");
        // Возвращаем результат парсинга MDX
        return await parseMdx<BaseMdxFrontmatter>(rawMdx);
    } catch (err) {
        // Логируем ошибку
        console.log(err);
    }
}

// Функция для получения точек доступа для конкретного slug
export async function getWikiTocs(slug: string) {
    // Получаем путь к контенту
    const contentPath = getWikiContentPath(slug);
    // Читаем контент
    const rawMdx = await fs.readFile(contentPath, "utf-8");

    // Создаем регулярное выражение для извлечения заголовков
    const headingsRegex = /^(#{2,4})\s(.+)$/gm;
    let match;
    // Создаем массив для извлеченных заголовков
    const extractedHeadings = [];
    // Проходим по всем заголовкам
    while ((match = headingsRegex.exec(rawMdx)) !== null) {
        // Получаем уровень заголовка
        const headingLevel = match[1].length;
        // Получаем текст заголовка
        const headingText = match[2].trim();
        // Создаем slug для заголовка
        const slug = sluggify(headingText);
        // Добавляем заголовок в массив
        extractedHeadings.push({
            // Уровень заголовка
            level: headingLevel,
            // Текст заголовка
            text: headingText,
            // Ссылка на заголовок
            href: `#${slug}`,
        });
    }
    return extractedHeadings;
}

// Функция для получения предыдущего и следующего slug
export function getPreviousNext(path: string) {
    // Получаем индекс текущего slug
    const index = page_routes.findIndex(({ href }) => href == `/${path}`);
    // Возвращаем предыдущий и следующий slug
    return {
        // Предыдущий slug
        prev: page_routes[index - 1],
        // Следующий slug
        next: page_routes[index + 1],
    };
}

// Функция для создания slug
function sluggify(text: string) {
    // Создаем slug
    const slug = text.trim().toLowerCase().replace(/\s+/g, "-");
    // Возвращаем slug
    return slug.replace(/[^a-zа-яё0-9-]/g, "");
}

// Функция для получения пути к контенту для конкретного slug
function getWikiContentPath(slug: string) {
    // Возвращаем путь к контенту
    return path.join(process.cwd(), "/contents/wiki/", `${slug}/index.mdx`);
}

// Функция для получения frontmatter из MDX
function justGetFrontmatterFromMD<Frontmatter>(rawMd: string): Frontmatter {
    // Возвращаем frontmatter
    return matter(rawMd).data as Frontmatter;
}

// Функция для получения всех дочерних slug для конкретного slug
export async function getAllChilds(pathString: string) {
    // Разбиваем путь на массив slug
    const items = pathString.split("/").filter((it) => it != "");
    // Создаем копию массива страниц
    let page_routes_copy = ROUTES;

    // Предыдущий href
    let prevHref = "";
    // Проходим по всем slug
    for (const it of items) {
        // Ищем slug в массиве страниц
        const found = page_routes_copy.find((innerIt) => innerIt.href == `/${it}`);
        // Если slug не найден, то выходим из цикла
        if (!found) break;
        // Добавляем href в предыдущий href
        prevHref += found.href;
        // Создаем копию массива страниц
        page_routes_copy = found.items ?? [];
    }
    // Если предыдущий href пустой, то возвращаем пустой массив
    if (!prevHref) return [];
    // Возвращаем массив всех дочерних slug

    // Возвращаем массив всех дочерних slug
    return await Promise.all(
        // Проходим по всем slug
        page_routes_copy.map(async (it) => {
            // Создаем путь к контенту
            const totalPath = path.join(
                process.cwd(),
                "/contents/wiki/",
                prevHref,
                it.href,
                "index.mdx",
            );
            // Читаем контент
            const raw = await fs.readFile(totalPath, "utf-8");
            // Возвращаем frontmatter и href
            return {
                ...justGetFrontmatterFromMD<BaseMdxFrontmatter>(raw),
                href: `/wiki${prevHref}${it.href}`,
            };
        }),
    );
}

// Функция для предварительной обработки дерева
const preProcess = () => (tree: Node) => {
    // Проходим по всем элементам дерева
    visit(tree, (node: ElementNode) => {
        // Если элемент является элементом и имеет тег "pre"
        if (node?.type === "element" && node?.tagName === "pre") {
            const codeEl = node.children?.[0] as ElementNode | undefined;
            // Если элемент не является элементом или имеет тег не "code"
            if (!codeEl || codeEl.tagName !== "code") return;
            // Получаем текст элемента

            const textNode = codeEl.children?.[0] as TextNode | undefined;
            // Если текст элемента не пустой
            if (textNode && textNode.value) {
                // Устанавливаем текст элемента
                node.raw = textNode.value;
            }
        }
    });
};

// Функция для послеовательной обработки дерева
const postProcess = () => (tree: Node) => {
    // Проходим по всем элементам дерева
    visit(tree, "element", (node: ElementNode) => {
        // Если элемент является элементом и имеет тег "pre"
        if (node?.type === "element" && node?.tagName === "pre") {
            // Если свойства элемента не пустые
            if (node.properties) {
                // Устанавливаем свойство "raw"
                node.properties["raw"] = node.raw;
            }
        }
    });
};