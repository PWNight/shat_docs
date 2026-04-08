import {EachRoute, ROUTES} from "@/contents/routes";

// Тип для страницы
type Page = { title: string; href: string };

// Функция для получения всех ссылок  
function getRecursiveAllLinks(node: EachRoute) {
  // Создаем массив для хранения ссылок
  const ans: Page[] = [];
  // Если страница не имеет ссылки
  if (!node.noLink) {
    ans.push({ title: node.title, href: node.href });
  }
  // Проходим по всем подстраницам
  node.items?.forEach((subNode) => {
    // Создаем временную ссылку
    const temp = { ...subNode, href: `${node.href}${subNode.href}` };
    // Добавляем временную ссылку в массив
    ans.push(...getRecursiveAllLinks(temp));
  });
  return ans;
}

// Создаем массив всех ссылок
export const page_routes = ROUTES.map((it) => getRecursiveAllLinks(it)).flat();