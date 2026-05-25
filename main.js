import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@latest/dist/index.mjs";

OBR.onReady(async () => {
    console.log("Extension Ready");

    const button = document.getElementById("gather");

    button.addEventListener("click", async () => {
        // 1. Получаем ID текущего выделения
        const selection = await OBR.player.getSelection();

        if (!selection || selection.length === 0) {
            alert("Сначала выдели токен(ы) на карте!");
            return;
        }

        // 2. Получаем объекты токенов по их ID
        const items = await OBR.scene.items.getItems(selection);
        
        // Фильтруем только те предметы, которые имеют позицию (токены)
        const tokens = items.filter(item => item.position);

        if (tokens.length === 0) return;

        // 3. Берем координаты ПЕРВОГО выделенного токена как точку сбора
        const targetX = tokens[0].position.x;
        const targetY = tokens[0].position.y;

        console.log(`Собираем ${tokens.length} токенов в точке:`, targetX, targetY);

        // 4. Запускаем обновление
        let offset = 0;
        await OBR.scene.items.updateItems(selection, (drafts) => {
            for (const item of drafts) {
                // Игнорируем фоновые рисунки, если они попали в выделение
                if (item.position) {
                    // Устанавливаем новую позицию
                    item.position = {
                        x: targetX,
                        y: targetY + offset
                    };
                    
                    // Если токен "заблокирован", мы всё равно его двигаем этим кодом
                    // Шаг смещения (например, 50 пикселей вниз для каждого следующего)
                    offset += 70; 
                }
            }
        });

        console.log("Готово!");
    });
});
