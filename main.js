import OBR from "https://unpkg.com/@owlbear-rodeo/sdk@latest/dist/index.mjs";

let savedSelection = [];

OBR.onReady(() => {

  // сохраняем выделение
  OBR.player.onChange((player) => {
    savedSelection = player.selection || [];
    console.log("Selection:", savedSelection);
  });

  const button = document.getElementById("gather");

  button.addEventListener("click", async () => {

    if (savedSelection.length === 0) {
      console.log("No selection");
      return;
    }

    // получаем выбранные items
    const items = await OBR.scene.items.getItems(
      item => savedSelection.includes(item.id)
    );

    if (items.length === 0) {
      console.log("No items found");
      return;
    }

    // случайный токен = база
    const center =
      items[Math.floor(Math.random() * items.length)];

    const baseX = center.position.x;
    const baseY = center.position.y;

    // ВАЖНО:
    // updateItems(items, ...)
    // а не updateItems(ids, ...)
    await OBR.scene.items.updateItems(
      items,
      (drafts) => {

        let offset = 0;

        for (const item of drafts) {

          item.position.x = baseX;
          item.position.y = baseY - offset;

          offset += 20;
        }

      }
    );

    console.log("Moved!");

  });

});
