# PSEUD – klikací prototyp

Veřejná databáze ztracených a odcizených věcí. Statický prototyp bez serveru: HTML, CSS a JavaScript, ukázková data v `data.js`, vše, co uživatel přidá, se ukládá jen do jeho prohlížeče (localStorage).

## Co jde proklikat
- Hledání a detail záznamu, automaticky posuvná řada naposledy nahlášených věcí
- Nahlášení ztráty nebo krádeže ve 3 krocích (fotka, co, kde a kdy, e-mail)
- Ověření před koupí – sériové číslo (zkuste `WTU0458812`), fotka, odkaz; ověřovací výpis k tisku
- Trestní oznámení na neznámého pachatele s živým náhledem dokumentu a tiskem do PDF
- Zpráva majiteli od nálezce, Zprávy, Účet
- Pro firmy: ceník, kontrola u pultu v bazaru, kontrola aukčního katalogu, konzole pro policii
- PWA: manifest, service worker (offline), instalace na plochu, testovací upozornění

## Spuštění lokálně
```
python3 -m http.server 8000
```
a otevřít http://localhost:8000

## GitHub Pages
Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
