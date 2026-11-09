# Heorhii Shersheriia — CV & Portfolio

Сайт-резюме с портфолио для рекрутёров. Статичный (HTML + CSS + JS, без сборки), хостится на GitHub Pages.
Два языка: EN и UA (переключатель в шапке).

## Структура

```
index.html            разметка и английские тексты
i18n.js               украинские переводы (ключи совпадают с data-i18n в index.html)
styles.css            дизайн; цвета в начале файла (--accent, --bg …)
script.js             язык, портфолио, полноэкранный просмотр, копирование контактов
data/works.json       список работ (EN + UA)
assets/works/web/     сжатые видео и обложки, которые показывает сайт
assets/works/Creo_*   оригиналы (в git не попадают, см. .gitignore)
assets/photo.jpg      фото для сайта
assets/og-image.jpg   превью ссылки для Telegram/LinkedIn
assets/Heorhii_Shersheriia_CV_EN_2026.pdf   резюме для скачивания
```

## Как поменять текст

- **Английский** правится прямо в `index.html`.
- **Украинский** правится в `i18n.js` по тому же ключу (например, `hero.lead`).
- Ссылка `?lang=uk` или `?lang=en` открывает сайт сразу на нужном языке. Без параметра язык выбирается по языку браузера.

## Как добавить или заменить работу

1. Сожми видео для веба (нужен ffmpeg). Пример для 10-й работы:

```bash
ffmpeg -i "assets/works/Creo_10.mp4" -c:v libx264 -preset slow -crf 23 -maxrate 5M -bufsize 10M -pix_fmt yuv420p -vf "scale=1080:-2" -r 30 -c:a aac -b:a 128k -movflags +faststart assets/works/web/creo-10.mp4
```

```bash
ffmpeg -ss 0.5 -i assets/works/web/creo-10.mp4 -frames:v 1 -vf "scale=720:-2" -q:v 4 assets/works/web/creo-10.jpg
```

2. Добавь запись в `data/works.json`:

```json
{
  "src": "assets/works/web/creo-10.mp4",
  "poster": "assets/works/web/creo-10.jpg",
  "title": { "en": "Title", "uk": "Назва" },
  "category": { "en": "Mobile app · Video ad", "uk": "Мобільний застосунок · Відеореклама" },
  "description": { "en": "One or two sentences.", "uk": "Одне-два речення." }
}
```

Порядок в файле = порядок на сайте.

## Как посмотреть локально

Двойной клик по `index.html` не сработает (браузер не даёт читать JSON с диска). Запусти сервер в папке проекта и открой http://localhost:5173

```bash
npx http-server . -p 5173 -c-1
```

## Деплой на GitHub Pages

1. Создай на GitHub **публичный** репозиторий. Если назвать его `USERNAME.github.io`, адрес будет короче: `https://USERNAME.github.io/`.
2. В папке проекта:

```bash
git init
git add .
git commit -m "CV and portfolio site"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

3. На GitHub: **Settings → Pages → Source: Deploy from a branch**, ветка `main`, папка `/ (root)`, **Save**.
4. Через 1–2 минуты сайт откроется по адресу `https://USERNAME.github.io/REPO/`.
5. После деплоя в `index.html` замени `og:image` на полный адрес, например `https://USERNAME.github.io/REPO/assets/og-image.jpg`, иначе Telegram и LinkedIn не покажут превью.

Чтобы обновить сайт: `git add .`, `git commit -m "..."`, `git push`.
