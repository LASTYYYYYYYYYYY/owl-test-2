import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@latest/dist/index.mjs";

OBR.onReady(() => {
  const button = document.getElementById("gather");

  button.addEventListener("click", async () => {
    // 1. Получаем ID выбранных предметов
    const selection = await OBR.player.getSelection();

    if (!selection || selection.length === 0) {
      console.log("No items selected");
      return;
    }

    // 2. Получаем полные данные выбранных предметов
    const items = await OBR.scene.items.getItems(selection);

    if (items.length === 0) return;

    // 3. Выбираем случайный предмет как точку сбора
    const centerItem = items[Math.floor(Math.random() * items.length)];
    const targetX = centerItem.position.x;
    const targetY = centerItem.position.y;

    let offset = 0;

    // 4. Обновляем предметы в сцене
    // Передаем массив selection (ID), чтобы SDK знало, что именно менять
    await OBR.scene.items.updateItems(selection, (drafts) => {
      for (const item of drafts) {
        item.position.x = targetX;
        item.position.y = targetY + offset;
        
        // Увеличиваем смещение для следующего токена (например, на 50 пикселей)
        offset += 50; 
      }
    });

    console.log("Tokens gathered!");
  });
});
