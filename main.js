import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3.1.0/+esm";

console.log("Gather & Shuffle Extension: Loaded");

// Функция для случайного перемешивания массива (Алгоритм Фишера-Йетса)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

OBR.onReady(async () => {
    console.log("Gather & Shuffle Ready");

    const button = document.getElementById("gather");

    button.addEventListener("click", async () => {
        try {
            // 1. Получаем ID всех выбранных токенов
            const selection = await OBR.player.getSelection();
            if (!selection || selection.length === 0) return;

            // 2. Получаем сами предметы, чтобы найти координаты "якоря"
            const items = await OBR.scene.items.getItems(selection);
            const movableItems = items.filter(i => i.position);
            if (movableItems.length === 0) return;

            // Точка, куда собираем "колоду" (позиция первого выбранного токена)
            const targetX = movableItems[0].position.x;
            const targetY = movableItems[0].position.y;

            // 3. ПЕРЕМЕШИВАЕМ список ID перед обновлением
            const shuffledSelection = shuffleArray([...selection]);

            console.log("Shuffling and gathering...");

            // 4. Обновляем позиции токенов в случайном порядке
            let currentOffset = 0;
            await OBR.scene.items.updateItems(shuffledSelection, (drafts) => {
                // Теперь drafts будут обрабатываться в том случайном порядке, 
                // который мы создали в shuffledSelection
                for (const item of drafts) {
                    if (item.position) {
                        item.position = {
                            x: targetX,
                            y: targetY + currentOffset
                        };
                        // Твой зазор в 4 пикселя
                        currentOffset += 4; 
                    }
                }
            });

            console.log("Done! Deck shuffled.");
        } catch (error) {
            console.error("Error:", error);
        }
    });
});
