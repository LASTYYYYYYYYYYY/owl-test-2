// Поменяли ссылку на jsdelivr - он стабильнее работает с CORS на Vercel
import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3.1.0/dist/index.mjs";

console.log("Скрипт main.js загружен!"); // Если видишь это в консоли - победа

OBR.onReady(async () => {
    console.log("Библиотека OBR готова!");

    const button = document.getElementById("gather");

    button.addEventListener("click", async () => {
        try {
            const selection = await OBR.player.getSelection();

            if (!selection || selection.length === 0) {
                console.log("Ничего не выбрано");
                return;
            }

            const items = await OBR.scene.items.getItems(selection);
            const tokens = items.filter(item => item.position);

            if (tokens.length === 0) return;

            // Точка сбора - координаты первого токена
            const targetX = tokens[0].position.x;
            const targetY = tokens[0].position.y;

            let offset = 0;
            await OBR.scene.items.updateItems(selection, (drafts) => {
                for (const item of drafts) {
                    if (item.position) {
                        item.position = {
                            x: targetX,
                            y: targetY + offset
                        };
                        // Делаем шаг в 50 пикселей для каждого следующего
                        offset += 50; 
                    }
                }
            });

            console.log("Токены собраны!");
        } catch (e) {
            console.error("Ошибка при клике:", e);
        }
    });
});
