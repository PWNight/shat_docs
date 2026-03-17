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

// Импорты компонентов MDX
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import Pre from "@/components/markdown/pre";
import Note from "@/components/markdown/note";
import Link from "@/components/markdown/link";
import Outlet from "@/components/markdown/outlet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import {ROUTES} from "@/contents/routes";

const components = {
    Tabs, TabsContent, TabsList, TabsTrigger,
    pre: Pre, Note, a: Link, Outlet,
    Table, TableHeader, TableHead, TableRow, TableBody, TableCell,
};

// can be used for other pages like blogs, Guides etc
async function parseMdx<Frontmatter>(rawMdx: string) {
    return await compileMDX<Frontmatter>({
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

// logic for wiki

export type BaseMdxFrontmatter = {
    title: string;
    description: string;
    update_date: string;
};

export async function getWikiForSlug(slug: string) {
    try {
        const contentPath = getWikiContentPath(slug);
        const rawMdx = await fs.readFile(contentPath, "utf-8");
        return await parseMdx<BaseMdxFrontmatter>(rawMdx);
    } catch (err) {
        console.log(err);
    }
}

export async function getOtherForSlug(slug: string){
    try{
        const contentPath = path.join(process.cwd(), "/contents/", `${slug}/index.mdx`);
        const rawMdx = await fs.readFile(contentPath, "utf-8");
        return await parseMdx<BaseMdxFrontmatter>(rawMdx);
    } catch (err) {
        console.log(err);
    }
}

export async function getWikiTocs(slug: string) {
    const contentPath = getWikiContentPath(slug);
    const rawMdx = await fs.readFile(contentPath, "utf-8");
    // captures between ## - #### can modify accordingly
    const headingsRegex = /^(#{2,4})\s(.+)$/gm;
    let match;
    const extractedHeadings = [];
    while ((match = headingsRegex.exec(rawMdx)) !== null) {
        const headingLevel = match[1].length;
        const headingText = match[2].trim();
        const slug = sluggify(headingText);
        extractedHeadings.push({
            level: headingLevel,
            text: headingText,
            href: `#${slug}`,
        });
    }
    return extractedHeadings;
}

export function getPreviousNext(path: string) {
    const index = page_routes.findIndex(({ href }) => href == `/${path}`);
    return {
        prev: page_routes[index - 1],
        next: page_routes[index + 1],
    };
}

function sluggify(text: string) {
    const slug = text.toLowerCase().replace(/\s+/g, "-");
    return slug.replace(/[^а-я0-9-]/g, "");
}

function getWikiContentPath(slug: string) {
    return path.join(process.cwd(), "/contents/wiki/", `${slug}/index.mdx`);
}

function justGetFrontmatterFromMD<Frontmatter>(rawMd: string): Frontmatter {
    return matter(rawMd).data as Frontmatter;
}

export async function getAllChilds(pathString: string) {
    const items = pathString.split("/").filter((it) => it != "");
    let page_routes_copy = ROUTES;

    let prevHref = "";
    for (const it of items) {
        const found = page_routes_copy.find((innerIt) => innerIt.href == `/${it}`);
        if (!found) break;
        prevHref += found.href;
        page_routes_copy = found.items ?? [];
    }
    if (!prevHref) return [];

    return await Promise.all(
        page_routes_copy.map(async (it) => {
            const totalPath = path.join(
                process.cwd(),
                "/contents/wiki/",
                prevHref,
                it.href,
                "index.mdx",
            );
            const raw = await fs.readFile(totalPath, "utf-8");
            return {
                ...justGetFrontmatterFromMD<BaseMdxFrontmatter>(raw),
                href: `/wiki${prevHref}${it.href}`,
            };
        }),
    );
}

// for copying the code in pre
const preProcess = () => (tree: any) => {
    visit(tree, (node) => {
        if (node?.type === "element" && node?.tagName === "pre") {
            const [codeEl] = node.children;
            if (codeEl.tagName !== "code") return;
            node.raw = codeEl.children?.[0].value;
        }
    });
};

const postProcess = () => (tree: any) => {
    visit(tree, "element", (node) => {
        if (node?.type === "element" && node?.tagName === "pre") {
            node.properties["raw"] = node.raw;
        }
    });
};
