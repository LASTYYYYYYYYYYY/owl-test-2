// Используем официальную и самую надежную ссылку на ESM модуль
import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3.1.0/+esm";

console.log("Gather Extension: Script Loaded");

OBR.onReady(async () => {
    console.log("Gather Extension: OBR Ready");

    const button = document.getElementById("gather");
    if (!button) {
        console.error("Button not found!");
        return;
    }

    button.addEventListener("click", async () => {
        try {
            console.log("Button clicked");

            // 1. Получаем ID выбора
            const selection = await OBR.player.getSelection();
            if (!selection || selection.length === 0) {
                console.log("No selection");
                return;
            }

            // 2. Получаем предметы
            const items = await OBR.scene.items.getItems(selection);
            
            // Фильтруем только те, что можно двигать
            const movableItems = items.filter(i => i.position);
            if (movableItems.length === 0) return;

            // 3. Берем позицию первого предмета как базу
            const targetX = movableItems[0].position.x;
            const targetY = movableItems[0].position.y;

            // 4. Обновляем
            let offset = 0;
            await OBR.scene.items.updateItems(selection, (drafts) => {
                for (const item of drafts) {
                    if (item.position) {
                        item.position.x = targetX;
                        item.position.y = targetY + offset;
                        offset += 60; // Расстояние между токенами
                    }
                }
            });

            console.log("Success: Items gathered");
        } catch (error) {
            console.error("Gather Error:", error);
        }
    });
});
